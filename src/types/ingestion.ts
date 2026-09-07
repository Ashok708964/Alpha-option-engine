/**
 * OmniAlpha Phase 1 Ingestion & Shared Memory Telemetry Types
 */

export interface ShardRingBufferStats {
  shm_name: string;
  capacity: number;
  record_size_bytes: number;
  total_memory_mb: number;
  seq_head: number;
  utilization_pct: number;
  dropped_ticks: number;
  last_write_ns: number;
  active: boolean;
}

export interface RealizedKernelMetrics {
  raw_realized_variance: number;
  realized_kernel_variance: number;
  annualized_kernel_vol: number;
  noise_variance: number;
  noise_ratio_xi: number;
  snr_db: number;
  optimal_bandwidth_h: number;
  tick_count: number;
}

export interface IngestionShardTelemetry {
  shard_id: number;
  name: string;
  target_core: number;
  active: boolean;
  throughput_tps: number;
  latency_p99_us: number;
  ring_buffer: ShardRingBufferStats;
  constituents_count: number;
  constituents_sample: string[];
}

export interface LiveConstituentSample {
  symbol: string;
  token: number;
  name: string;
  sector: string;
  weight_pct: number;
  lot_size: number;
  shard_id: number;
  ltp: number;
  change_pct: number;
  volume_lots: number;
  bid_ask_spread_ticks: number;
  oi: number;
}

export interface IngestionClusterState {
  status: "OPERATIONAL" | "INITIALIZING" | "DEGRADED";
  cluster_mode: string;
  protocol: string;
  timestamp: string;
  total_throughput_tps: number;
  total_shm_memory_mb: number;
  total_constituents: number;
  shards: IngestionShardTelemetry[];
  realized_kernel_nifty: RealizedKernelMetrics;
  constituents_live_sample?: LiveConstituentSample[];
  os_tuning: {
    kernel_busy_poll: string;
    socket_rmem_max: string;
    cpu_pinning: string;
    shm_path: string;
    sub_microsecond_read: boolean;
  };
}
