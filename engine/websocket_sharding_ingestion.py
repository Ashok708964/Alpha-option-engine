"""
OmniAlpha Quant Engine - Multi-Process WebSocket Ingestion & Connection Sharding
Distributes the 50 Nifty constituents across 5 dedicated Python workers,
isolating the NIFTY 50 Options & Index stream on a dedicated high-priority process.
Writes directly into POSIX Shared Memory Ring Buffers with zero serialization latency.
"""

import os
import sys
import time
import json
import random
import signal
import multiprocessing as mp
from typing import Dict, List, Optional
from datetime import datetime

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.constants_nifty50 import (
    NIFTY_50_CONSTITUENTS,
    INDEX_DERIVATIVES_SHARD_0,
    get_shard_constituents,
)
from engine.shared_memory_ring_buffer import SharedMemoryRingBuffer
from engine.realized_kernels import RealizedKernelEstimator

# Shard Configuration
SHARD_CONFIG = {
    0: {"name": "NIFTY50_OPTIONS_HIGH_PRIORITY", "core": 2, "buffer_name": "omni_ring_shard_0", "capacity": 1_048_576},
    1: {"name": "SHARD_1_TOP_FINANCIALS_TECH",  "core": 3, "buffer_name": "omni_ring_shard_1", "capacity": 524_288},
    2: {"name": "SHARD_2_AUTO_CONSUMER_POWER",  "core": 4, "buffer_name": "omni_ring_shard_2", "capacity": 524_288},
    3: {"name": "SHARD_3_METALS_COMMODITIES",   "core": 5, "buffer_name": "omni_ring_shard_3", "capacity": 524_288},
    4: {"name": "SHARD_4_PHARMA_IT_INDUSTRIALS","core": 6, "buffer_name": "omni_ring_shard_4", "capacity": 524_288},
    5: {"name": "SHARD_5_RETAIL_EMERGING",      "core": 7, "buffer_name": "omni_ring_shard_5", "capacity": 524_288},
}

def set_cpu_affinity(core_id: int):
    """Sets CPU core affinity for the calling process if supported on Linux."""
    try:
        if hasattr(os, "sched_setaffinity"):
            os.sched_setaffinity(0, {core_id})
    except Exception:
        pass


def run_shard_worker(
    shard_id: int,
    telemetry_queue: mp.Queue,
    stop_event: mp.Event,
    simulation_mode: bool = True
):
    """
    Dedicated worker process for a specific shard.
    Binds to assigned CPU core and streams ticks into zero-copy shared memory.
    """
    config = SHARD_CONFIG[shard_id]
    set_cpu_affinity(config["core"])

    # Initialize or attach to POSIX Shared Memory Ring Buffer
    ring_buffer = SharedMemoryRingBuffer(
        shm_name=config["buffer_name"],
        capacity=config["capacity"],
        create=True
    )

    kernel_estimator = RealizedKernelEstimator(kernel_type="parzen")

    # Determine instruments handled by this shard
    if shard_id == 0:
        instruments = [{
            "symbol": "NIFTY50_SPOT",
            "token": 26000,
            "ltp": 24850.50,
            "lot_size": 25,
            "oi": 12500000,
            "tick_size": 0.05
        }]
        # Generate Nifty strike ladder (+/- 10 strikes around ATM)
        atm = 24850.0
        for offset in range(-10, 11):
            strike = int(atm + offset * 50)
            instruments.append({
                "symbol": f"NIFTY_{strike}_CE",
                "token": 40000 + strike,
                "ltp": max(0.5, 24850.50 - strike + 180.0 if strike < 24850 else 180.0 - (strike - 24850) * 0.4),
                "lot_size": 25,
                "oi": random.randint(500000, 4500000),
                "tick_size": 0.05
            })
            instruments.append({
                "symbol": f"NIFTY_{strike}_PE",
                "token": 50000 + strike,
                "ltp": max(0.5, strike - 24850.50 + 175.0 if strike > 24850 else 175.0 - (24850 - strike) * 0.4),
                "lot_size": 25,
                "oi": random.randint(500000, 4500000),
                "tick_size": 0.05
            })
    else:
        constituents = get_shard_constituents(shard_id)
        instruments = []
        base_prices = {
            "HDFCBANK": 1640.0, "RELIANCE": 2980.0, "ICICIBANK": 1180.0, "INFY": 1820.0, "ITC": 490.0,
            "TCS": 4450.0, "LT": 3650.0, "AXISBANK": 1220.0, "KOTAKBANK": 1780.0, "BHARTIARTL": 1540.0,
            "SBIN": 820.0, "BAJFINANCE": 7150.0, "HINDUNILVR": 2680.0, "M&M": 2850.0, "MARUTI": 12400.0,
            "SUNPHARMA": 1720.0, "TATAMOTORS": 1050.0, "NTPC": 395.0, "POWERGRID": 325.0, "TITAN": 3600.0,
            "TATASTEEL": 155.0, "BAJAJFINSV": 1850.0, "ONGC": 310.0, "COALINDIA": 485.0, "ADANIENT": 3120.0,
            "ADANIPORTS": 1420.0, "HCLTECH": 1720.0, "ASIANPAINT": 3150.0, "ULTRACEMCO": 11200.0, "JSWSTEEL": 940.0,
            "GRASIM": 2550.0, "CIPLA": 1580.0, "TECHM": 1520.0, "WIPRO": 520.0, "HINDALCO": 680.0,
            "DRREDDY": 6750.0, "EICHERMOT": 4750.0, "NESTLEIND": 2450.0, "SBILIFE": 1720.0, "BRITANNIA": 5850.0,
            "BEL": 295.0, "TRENT": 6850.0, "SHRIRAMFIN": 3150.0, "APOLLOHOSP": 6850.0, "HDFCLIFE": 710.0,
            "TATACONSUM": 1180.0, "DIVISLAB": 4950.0, "BPCL": 340.0, "HEROMOTOCO": 5650.0, "INDUSINDBK": 1420.0
        }
        for c in constituents:
            sym = c["symbol"]
            instruments.append({
                "symbol": sym,
                "token": c["token"],
                "ltp": base_prices.get(sym, 1500.0),
                "lot_size": c["lot_size"],
                "oi": random.randint(100000, 2500000),
                "tick_size": 0.05
            })

    # High frequency ingestion loop
    ticks_processed = 0
    t_start = time.time()
    recent_prices: Dict[int, List[float]] = {inst["token"]: [inst["ltp"]] for inst in instruments}

    while not stop_event.is_set():
        batch_size = random.randint(15, 45) if shard_id == 0 else random.randint(8, 20)

        for _ in range(batch_size):
            inst = random.choice(instruments)
            now_ns = time.time_ns()

            # Generate realistic microstructure tick
            delta_p = (random.gauss(0, 0.08) if shard_id == 0 else random.gauss(0, 0.15)) * inst["tick_size"]
            new_ltp = round(max(0.5, inst["ltp"] + delta_p), 2)
            inst["ltp"] = new_ltp

            spread = inst["tick_size"]
            bid_p = round(new_ltp - spread / 2.0, 2)
            ask_p = round(new_ltp + spread / 2.0, 2)
            bid_q = random.randint(25, 500)
            ask_q = random.randint(25, 500)
            vol = random.randint(25, 250)
            oi_change = random.randint(-50, 150)
            inst["oi"] = max(1000, inst["oi"] + oi_change)

            # Push tick to Shared Memory Ring Buffer
            ring_buffer.push_tick(
                token=inst["token"],
                timestamp_ns=now_ns,
                ltp=new_ltp,
                volume=vol,
                bid_price=bid_p,
                ask_price=ask_p,
                bid_qty=bid_q,
                ask_qty=ask_q,
                oi=inst["oi"],
                oi_change=oi_change
            )
            ticks_processed += 1

            # Append price for Realized Kernel
            price_hist = recent_prices[inst["token"]]
            price_hist.append(new_ltp)
            if len(price_hist) > 100:
                price_hist.pop(0)

        # Periodic telemetry emission (every 100ms)
        elapsed = time.time() - t_start
        if elapsed >= 0.1:
            tps = int(ticks_processed / max(elapsed, 0.001))
            stats = ring_buffer.get_stats()
            
            # Compute Realized Kernel on primary instrument of this shard
            primary_token = instruments[0]["token"]
            rk_metrics = kernel_estimator.calculate(recent_prices[primary_token])

            telemetry = {
                "shard_id": shard_id,
                "name": config["name"],
                "target_core": config["core"],
                "tps": tps,
                "ticks_total": ticks_processed,
                "ring_buffer": stats,
                "realized_kernel": rk_metrics,
                "instruments_count": len(instruments),
                "timestamp": datetime.now().isoformat()
            }
            try:
                telemetry_queue.put_nowait(telemetry)
            except Exception:
                pass

            ticks_processed = 0
            t_start = time.time()

        # Ultra short sleep to match 10-20ms packet dispatch frequency
        time.sleep(0.01)

    ring_buffer.close()


class WebSocketShardingDaemon:
    """
    Master daemon orchestrating the 6 worker processes.
    Manages process lifecycles, CPU pinning, shared memory segments, and telemetry.
    """

    def __init__(self, simulation_mode: bool = True):
        self.simulation_mode = simulation_mode
        self.workers: List[mp.Process] = []
        self.telemetry_queue = mp.Queue(maxsize=100)
        self.stop_event = mp.Event()
        self.latest_telemetry: Dict[int, Dict] = {}

    def start(self):
        """Spawns 6 worker processes."""
        for shard_id in range(6):
            p = mp.Process(
                target=run_shard_worker,
                args=(shard_id, self.telemetry_queue, self.stop_event, self.simulation_mode),
                name=f"OmniAlpha-Shard-{shard_id}",
                daemon=True
            )
            p.start()
            self.workers.append(p)

    def stop(self):
        """Gracefully halts all shard workers."""
        self.stop_event.set()
        for p in self.workers:
            p.join(timeout=1.0)
            if p.is_alive():
                p.terminate()

    def get_aggregated_status(self) -> Dict[str, object]:
        """Polls telemetry queue and returns unified cluster telemetry."""
        while not self.telemetry_queue.empty():
            try:
                item = self.telemetry_queue.get_nowait()
                self.latest_telemetry[item["shard_id"]] = item
            except Exception:
                break

        total_tps = sum(t.get("tps", 0) for t in self.latest_telemetry.values())
        total_memory_mb = sum(t.get("ring_buffer", {}).get("total_memory_mb", 0) for t in self.latest_telemetry.values())

        return {
            "cluster_status": "ONLINE_ACTIVE",
            "shards_count": len(self.latest_telemetry),
            "total_throughput_tps": total_tps,
            "total_shm_memory_mb": round(total_memory_mb, 2),
            "shards": self.latest_telemetry,
            "timestamp": datetime.now().isoformat()
        }


if __name__ == "__main__":
    daemon = WebSocketShardingDaemon(simulation_mode=True)
    daemon.start()
    try:
        for _ in range(5):
            time.sleep(0.5)
            status = daemon.get_aggregated_status()
            print(f"[OmniAlpha Daemon] Active Shards: {status['shards_count']} | Aggregate TPS: {status['total_throughput_tps']}")
    finally:
        daemon.stop()
