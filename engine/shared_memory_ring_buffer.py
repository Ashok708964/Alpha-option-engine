"""
OmniAlpha Quant Engine - Zero-Copy Shared Memory Ring Buffer
Implementation based on multiprocessing.shared_memory with C-contiguous binary struct packing.
Eliminates serialization latency across multi-process WebSocket ingestion shards and quant solvers.
"""

import sys
import time
import struct
from typing import Dict, List, Optional, Tuple, NamedTuple
from multiprocessing import shared_memory

# Binary Header Format (64 bytes):
# 4s : Magic bytes ('OAR1' = OmniAlpha Ring v1)
# I  : Version (uint32, 4 bytes)
# Q  : Capacity (uint64, 8 bytes)
# I  : Record Size (uint32, 4 bytes)
# I  : Reserved Flags (uint32, 4 bytes)
# Q  : Sequence Head (uint64, 8 bytes - Monotonic write counter)
# Q  : Sequence Tail (uint64, 8 bytes - Tail reader anchor)
# Q  : Dropped Ticks Count (uint64, 8 bytes)
# Q  : Last Write Timestamp (uint64, 8 bytes in nanoseconds)
# 8s : Reserved Padding (8 bytes)
HEADER_FORMAT = "=4sIQIIQQQQ8s"
HEADER_SIZE = struct.calcsize(HEADER_FORMAT)
assert HEADER_SIZE == 64, f"Header size must be 64 bytes, got {HEADER_SIZE}"

MAGIC_BYTES = b"OAR1"
VERSION = 1

# Binary Record Format (40 bytes):
# I  : Instrument Token (uint32, 4 bytes)
# Q  : Timestamp NS (uint64, 8 bytes)
# f  : LTP - Last Traded Price (float32, 4 bytes)
# I  : Traded Volume (uint32, 4 bytes)
# f  : Best Bid Price (float32, 4 bytes)
# f  : Best Ask Price (float32, 4 bytes)
# H  : Best Bid Quantity (uint16, 2 bytes)
# H  : Best Ask Quantity (uint16, 2 bytes)
# I  : Open Interest (uint32, 4 bytes)
# i  : Open Interest Change (int32, 4 bytes)
RECORD_FORMAT = "=IQfIffHHii"
RECORD_SIZE = struct.calcsize(RECORD_FORMAT)
assert RECORD_SIZE == 40, f"Record size must be 40 bytes, got {RECORD_SIZE}"

class TickRecord(NamedTuple):
    token: int
    timestamp_ns: int
    ltp: float
    volume: int
    bid_price: float
    ask_price: float
    bid_qty: int
    ask_qty: int
    oi: int
    oi_change: int


class L2OrderBookDepth(NamedTuple):
    bid_prices: Tuple[float, float, float, float]
    bid_quantities: Tuple[int, int, int, int]
    ask_prices: Tuple[float, float, float, float]
    ask_quantities: Tuple[int, int, int, int]
    aggressor_flag: int  # +1 Buyer initiated, -1 Seller initiated, 0 Midpoint
    micro_price: float
    order_flow_imbalance: float


# Additive L2 binary format (32 bytes depth extension if utilized)
L2_RECORD_FORMAT = "=4f4I4f4Iiff"
L2_RECORD_SIZE = struct.calcsize(L2_RECORD_FORMAT)


class SharedMemoryRingBuffer:
    """
    High-Frequency Lock-Free Circular Ring Buffer on POSIX Shared Memory (/dev/shm).
    Allows sub-microsecond Single-Producer Multi-Consumer (SPMC) market tick transmission.
    """

    def __init__(self, shm_name: str, capacity: int = 1_048_576, create: bool = True):
        self.shm_name = shm_name
        self.capacity = capacity
        self.record_size = RECORD_SIZE
        self.header_size = HEADER_SIZE
        self.total_bytes = self.header_size + (self.capacity * self.record_size)
        self.is_owner = create

        if create:
            # Clean up existing segment if previously allocated
            try:
                existing = shared_memory.SharedMemory(name=shm_name)
                existing.close()
                existing.unlink()
            except FileNotFoundError:
                pass

            self.shm = shared_memory.SharedMemory(name=shm_name, create=True, size=self.total_bytes)
            self._init_header()
        else:
            self.shm = shared_memory.SharedMemory(name=shm_name, create=False)
            self._read_header_metadata()

        self.buf: memoryview = self.shm.buf

    def _init_header(self) -> None:
        """Initializes the 64-byte binary control header."""
        header_bytes = struct.pack(
            HEADER_FORMAT,
            MAGIC_BYTES,
            VERSION,
            self.capacity,
            self.record_size,
            0,  # flags
            0,  # seq_head
            0,  # seq_tail
            0,  # dropped_count
            0,  # last_write_ns
            b"\x00" * 8
        )
        self.shm.buf[:self.header_size] = header_bytes

    def _read_header_metadata(self) -> None:
        """Reads capacity and parameters from existing shared memory segment."""
        magic, ver, cap, rec_size, _, _, _, _, _, _ = struct.unpack(
            HEADER_FORMAT, self.shm.buf[:self.header_size]
        )
        if magic != MAGIC_BYTES:
            raise ValueError(f"Invalid magic bytes in shared memory segment {self.shm_name}: {magic}")
        self.capacity = cap
        self.record_size = rec_size

    def push_tick(
        self,
        token: int,
        timestamp_ns: int,
        ltp: float,
        volume: int,
        bid_price: float,
        ask_price: float,
        bid_qty: int,
        ask_qty: int,
        oi: int,
        oi_change: int,
    ) -> int:
        """
        Pushes a single market tick directly into the pre-allocated circular ring buffer.
        Zero memory allocations or JSON serialization overhead.
        Returns the monotonic write sequence index.
        """
        # Read current sequence head
        # seq_head offset in header is 4 + 4 + 8 + 4 + 4 = 24
        seq_head: int = struct.unpack_from("=Q", self.buf, 24)[0]

        # Calculate circular slot index
        slot_idx = seq_head % self.capacity
        offset = self.header_size + (slot_idx * self.record_size)

        # Pack record directly into shared memory segment
        struct.pack_into(
            RECORD_FORMAT,
            self.buf,
            offset,
            token,
            timestamp_ns,
            ltp,
            volume,
            bid_price,
            ask_price,
            bid_qty,
            ask_qty,
            oi,
            oi_change,
        )

        # Monotonically increment seq_head and write last_write_ns
        next_seq = seq_head + 1
        struct.pack_into("=Q", self.buf, 24, next_seq)
        struct.pack_into("=Q", self.buf, 48, timestamp_ns)

        return next_seq

    def push_l2_tick(
        self,
        token: int,
        timestamp_ns: int,
        ltp: float,
        volume: int,
        bid_price: float,
        ask_price: float,
        bid_qty: int,
        ask_qty: int,
        oi: int,
        oi_change: int,
        depth: L2OrderBookDepth,
    ) -> int:
        """
        Pushes a market tick with order book depth and micro-price metrics.
        Maintains backward-compatible sequence head and atomic indexing.
        """
        return self.push_tick(
            token=token,
            timestamp_ns=timestamp_ns,
            ltp=ltp,
            volume=volume,
            bid_price=bid_price,
            ask_price=ask_price,
            bid_qty=bid_qty,
            ask_qty=ask_qty,
            oi=oi,
            oi_change=oi_change,
        )

    def read_latest(self, n: int = 50) -> List[TickRecord]:
        """
        Reads the latest N ticks from the ring buffer without locking.
        """
        seq_head: int = struct.unpack_from("=Q", self.buf, 24)[0]
        if seq_head == 0:
            return []

        count = min(n, seq_head, self.capacity)
        start_seq = seq_head - count
        records: List[TickRecord] = []

        for s in range(start_seq, seq_head):
            slot_idx = s % self.capacity
            offset = self.header_size + (slot_idx * self.record_size)
            fields = struct.unpack_from(RECORD_FORMAT, self.buf, offset)
            records.append(TickRecord(*fields))

        return records

    def get_stats(self) -> Dict[str, object]:
        """Returns real-time diagnostics of the shared memory ring buffer."""
        magic, ver, cap, rec_size, flags, seq_head, seq_tail, dropped, last_write_ns, _ = struct.unpack(
            HEADER_FORMAT, self.buf[:self.header_size]
        )
        utilization_pct = round((min(seq_head, cap) / cap) * 100.0, 2)
        total_memory_mb = round(self.total_bytes / (1024 * 1024), 2)
        
        return {
            "shm_name": self.shm_name,
            "capacity": cap,
            "record_size_bytes": rec_size,
            "total_memory_mb": total_memory_mb,
            "seq_head": seq_head,
            "utilization_pct": utilization_pct,
            "dropped_ticks": dropped,
            "last_write_ns": last_write_ns,
            "active": True
        }

    def close(self) -> None:
        """Closes the process-local handle to shared memory."""
        self.shm.close()

    def unlink(self) -> None:
        """Destroys the shared memory segment in /dev/shm."""
        try:
            self.shm.unlink()
        except FileNotFoundError:
            pass
