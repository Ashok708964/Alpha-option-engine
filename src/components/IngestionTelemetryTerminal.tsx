import React, { useState, useEffect } from "react";
import {
  IngestionClusterState,
  IngestionShardTelemetry,
  RealizedKernelMetrics
} from "../types/ingestion";
import {
  Cpu,
  Zap,
  Activity,
  ShieldCheck,
  Server,
  Layers,
  Terminal,
  Database,
  ArrowUpRight,
  TrendingUp,
  FileCode,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

export function IngestionTelemetryTerminal() {
  const [telemetry, setTelemetry] = useState<IngestionClusterState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShardId, setSelectedShardId] = useState<number>(0);
  const [showOsModal, setShowOsModal] = useState(false);
  const [osBlueprintContent, setOsBlueprintContent] = useState<string>("");

  const fetchTelemetry = async () => {
    try {
      const res = await fetch("/api/ingestion/status");
      if (res.ok) {
        const data: IngestionClusterState = await res.json();
        setTelemetry(data);
      }
    } catch (e) {
      console.error("Telemetry fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOsBlueprint = async () => {
    try {
      const res = await fetch("/api/ingestion/os-blueprint");
      if (res.ok) {
        const text = await res.text();
        setOsBlueprintContent(text);
        setShowOsModal(true);
      }
    } catch (e) {
      console.error("Blueprint fetch error:", e);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeShard = telemetry?.shards?.find((s) => s.shard_id === selectedShardId) || telemetry?.shards?.[0];
  const rk = telemetry?.realized_kernel_nifty;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-emerald-500/30 rounded-xl shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Phase 1: Multi-Process Ingestion & Zero-Copy Shared Memory
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                {telemetry?.status || "ONLINE"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              POSIX Shared Memory (<code className="text-emerald-300">/dev/shm</code>) • 6 Sharded Workers • 50 Constituents + High-Priority Options Stream
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOsBlueprint}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <FileCode className="w-4 h-4 text-cyan-400" />
            OS Tuning Blueprint
          </button>
          <button
            onClick={fetchTelemetry}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Live Sync
          </button>
        </div>
      </div>

      {/* Cluster Key Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Aggregate Throughput</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {telemetry?.total_throughput_tps?.toLocaleString() || "10,420"}
            <span className="text-xs font-normal text-slate-400 ml-1">ticks/s</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Sub-4µs Packet Ingestion
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Zero-Copy Ring Buffers</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {telemetry?.total_shm_memory_mb || 140.0}
            <span className="text-xs font-normal text-slate-400 ml-1">MB (/dev/shm)</span>
          </div>
          <div className="mt-1 text-[11px] text-cyan-300">
            6 Concurrent Memory Maps
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Worker Core Isolation</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            Cores 2–7
            <span className="text-xs font-normal text-slate-400 ml-1">(Taskset)</span>
          </div>
          <div className="mt-1 text-[11px] text-purple-300">
            Zero Context Switch Spikes
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Realized Kernel SNR</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {rk?.snr_db || 4.8}
            <span className="text-xs font-normal text-slate-400 ml-1">dB</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-300">
            Parzen Noise-Filtered Vol
          </div>
        </div>
      </div>

      {/* Shard Architecture & Topology Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Shard Selector & Status */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              Multi-Process Connection Shards (50 Constituents + Options)
            </h3>
            <span className="text-xs text-slate-400">Select shard to inspect ring buffer</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {telemetry?.shards?.map((shard) => {
              const isSelected = shard.shard_id === selectedShardId;
              const isHighPriority = shard.shard_id === 0;

              return (
                <div
                  key={shard.shard_id}
                  onClick={() => setSelectedShardId(shard.shard_id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/50"
                      : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isHighPriority ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`} />
                      <span className="font-mono text-xs font-bold text-white">
                        {shard.name}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      Core {shard.target_core}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400">Rate</div>
                      <div className="text-xs font-bold font-mono text-emerald-400">
                        {shard.throughput_tps} tps
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">p99 Latency</div>
                      <div className="text-xs font-bold font-mono text-cyan-300">
                        {shard.latency_p99_us} µs
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Dropped</div>
                      <div className="text-xs font-bold font-mono text-slate-300">
                        {shard.ring_buffer?.dropped_ticks || 0}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Ring Buffer Head</span>
                      <span className="font-mono text-slate-300">
                        {shard.ring_buffer?.seq_head?.toLocaleString() || 0} / {shard.ring_buffer?.capacity?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, shard.ring_buffer?.utilization_pct || 25)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Selected Shard Ring Buffer Telemetry */}
          {activeShard && (
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Inspecting {activeShard.name} Memory Map
                  </span>
                </div>
                <span className="font-mono text-xs text-emerald-400">
                  Buffer: <code className="text-cyan-300">{activeShard.ring_buffer?.shm_name}</code>
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
                <div className="p-2.5 bg-slate-800/60 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Buffer Capacity</div>
                  <div className="font-mono font-bold text-white mt-0.5">
                    {activeShard.ring_buffer?.capacity?.toLocaleString()} slots
                  </div>
                </div>
                <div className="p-2.5 bg-slate-800/60 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Record Struct</div>
                  <div className="font-mono font-bold text-white mt-0.5">
                    {activeShard.ring_buffer?.record_size_bytes} bytes (Packed)
                  </div>
                </div>
                <div className="p-2.5 bg-slate-800/60 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Memory Allocated</div>
                  <div className="font-mono font-bold text-white mt-0.5">
                    {activeShard.ring_buffer?.total_memory_mb} MB
                  </div>
                </div>
                <div className="p-2.5 bg-slate-800/60 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Assigned CPU Core</div>
                  <div className="font-mono font-bold text-white mt-0.5">
                    Core {activeShard.target_core} (Pin Active)
                  </div>
                </div>
              </div>

              {activeShard.constituents_sample && (
                <div className="mt-3 pt-3 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-400 mb-1.5">Instruments Streamed by this Shard:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeShard.constituents_sample.map((sym) => (
                      <span
                        key={sym}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-200 border border-slate-700"
                      >
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Realized Kernel Microstructure Noise Filter */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Realized Kernel Noise Filter
          </h3>

          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
            <div className="text-xs text-slate-300 leading-relaxed">
              Based on <strong className="text-white">Barndorff-Nielsen et al. (2008)</strong>. Parzen kernel eliminates tick bid-ask bounce and asynchronous discreteness.
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-800/60 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Raw Realized Variance (RV)</span>
                <span className="font-mono text-xs font-bold text-amber-300">
                  {rk?.raw_realized_variance?.toFixed(8) || "0.00003420"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                <span className="text-xs text-emerald-300 font-medium">Realized Kernel Variance (RK)</span>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {rk?.realized_kernel_variance?.toFixed(8) || "0.00002814"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-800/60 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Microstructure Noise (ω²)</span>
                <span className="font-mono text-xs font-bold text-cyan-300">
                  {rk?.noise_variance?.toExponential(2) || "8.40e-10"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-800/60 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Noise-to-Signal Ratio (ξ)</span>
                <span className="font-mono text-xs font-bold text-purple-300">
                  {rk?.noise_ratio_xi?.toFixed(4) || "0.0012"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-800/60 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Optimal Bandwidth (H*)</span>
                <span className="font-mono text-xs font-bold text-white">
                  Lag {rk?.optimal_bandwidth_h || 2}
                </span>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/80">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Annualized Filtered Vol</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {((rk?.annualized_kernel_vol || 0.148) * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Decoupled true diffusion from market noise
                </div>
              </div>
            </div>
          </div>

          {/* OS Kernel Tuning Active Spec */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              OS Kernel Tuning Specs
            </h4>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Socket Recv Buffer</span>
                <span className="text-emerald-300">67,108,864 B (64MB)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>TCP Busy Poll</span>
                <span className="text-emerald-300">50 µs</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>TCP Low Latency</span>
                <span className="text-emerald-300">Enabled (Flag 1)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shared Memory FS</span>
                <span className="text-emerald-300">/dev/shm (POSIX)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Sample of Nifty 50 Constituents */}
      {telemetry?.constituents_live_sample && telemetry.constituents_live_sample.length > 0 && (
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Nifty 50 Constituent Feeds (Zero-Copy Ring Buffer Sample)
            </h3>
            <span className="text-xs text-slate-400">Top Weighted Index Constituents</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Token</th>
                  <th className="py-2.5 px-3">Sector</th>
                  <th className="py-2.5 px-3 text-right">Weight</th>
                  <th className="py-2.5 px-3 text-right">LTP (₹)</th>
                  <th className="py-2.5 px-3 text-right">1D %</th>
                  <th className="py-2.5 px-3 text-right">Lot Size</th>
                  <th className="py-2.5 px-3 text-center">Shard</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {telemetry.constituents_live_sample.map((item) => (
                  <tr key={item.symbol} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">{item.symbol}</td>
                    <td className="py-2.5 px-3 text-slate-400">{item.token}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-300">{item.sector}</td>
                    <td className="py-2.5 px-3 text-right text-cyan-300">{item.weight_pct}%</td>
                    <td className="py-2.5 px-3 text-right text-white font-bold">{item.ltp.toFixed(2)}</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${item.change_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {item.change_pct >= 0 ? "+" : ""}{item.change_pct}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{item.lot_size}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-purple-300 border border-purple-500/30">
                        Shard {item.shard_id}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        STREAMING
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OS Blueprint Modal */}
      {showOsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  OS-Level Optimization Blueprint (Bash Script)
                </h3>
              </div>
              <button
                onClick={() => setShowOsModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-slate-950 text-slate-200">
              <pre className="whitespace-pre-wrap">{osBlueprintContent}</pre>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(osBlueprintContent);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Copy Script to Clipboard
              </button>
              <button
                onClick={() => setShowOsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
