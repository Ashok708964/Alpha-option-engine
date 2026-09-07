import React, { useMemo, useState } from "react";
import { IndexInfo } from "../types";
import { evaluateNexusOrchestrator, computeAlmgrenChrissTrajectory } from "../utils/nexusOrchestratorEngine";
import { Cpu, Zap, Layers, Target, Activity, ShieldCheck, ArrowUpRight, ArrowDownRight, RefreshCw, BarChart2 } from "lucide-react";

interface Props {
  index: IndexInfo;
  hftDelta: number;
}

export const NexusOrchestratorDashboard: React.FC<Props> = ({ index, hftDelta }) => {
  const [activeCategory, setActiveCategory] = useState<"ALL" | "CSV_LAYER_1" | "STOCHASTIC_LAYER_2" | "META_LEARNER">("ALL");
  const [showTcaModal, setShowTcaModal] = useState(false);

  const state = useMemo(() => {
    return evaluateNexusOrchestrator(index.symbol, index.currentPrice, hftDelta, index.baseIV, 0);
  }, [index.symbol, index.currentPrice, hftDelta, index.baseIV]);

  const tcaAttribution = useMemo(() => {
    return computeAlmgrenChrissTrajectory(1800, 300);
  }, []);

  const filteredSubsystems = useMemo(() => {
    if (activeCategory === "ALL") return state.subsystems;
    return state.subsystems.filter(s => s.category === activeCategory);
  }, [state.subsystems, activeCategory]);

  return (
    <div id="nexus-orchestrator-dashboard" className="bg-slate-900 border border-slate-800 rounded p-4 sm:p-5 shadow-2xl space-y-5">
      {/* Top Banner: Master Fusion & Verdict */}
      <div className="bg-slate-950 border border-slate-800 rounded p-4 flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded bg-slate-900 border border-slate-700 flex flex-col items-center justify-center relative shadow-[0_0_15px_rgba(79,70,229,0.3)]">
            <span className={`text-xl font-bold font-mono ${state.ensembleAlpha >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {state.ensembleAlpha >= 0 ? "+" : ""}{state.ensembleAlpha}
            </span>
            <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold">α ENSEMBLE</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">17-SUBSYSTEM FUSION (S^-1/2 LÖWDIN)</span>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-mono px-2 py-0.5 rounded font-bold">
                {state.detectedRegime}
              </span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                ⚡ {state.orchestratorLatencyUs} µs Latency
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400"/>
              <span>Verdict: <strong className={state.ensembleAlpha >= 0 ? "text-emerald-400" : "text-rose-400"}>{state.executionVerdict}</strong></span>
              <span className="text-xs font-mono font-normal text-slate-400">(Conviction: {(state.ensembleConfidence * 100).toFixed(1)}%)</span>
            </h2>
          </div>
        </div>

        {/* HJB Quoting Boundaries */}
        <div className="flex items-center gap-3 flex-wrap font-mono text-xs">
          <div className="grid grid-cols-3 gap-3 bg-slate-900 p-2.5 rounded border border-slate-800">
            <div>
              <span className="text-[9px] text-slate-500 uppercase block">OPTIMAL BID (p_b*)</span>
              <span className="text-emerald-400 font-bold">₹{state.optimalBidQuote.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 uppercase block">RESERVATION (r)</span>
              <span className="text-cyan-300 font-bold">₹{state.reservationPrice.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 uppercase block">OPTIMAL ASK (p_a*)</span>
              <span className="text-rose-400 font-bold">₹{state.optimalAskQuote.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => setShowTcaModal(!showTcaModal)}
            className="px-3 py-2 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Almgren-Chriss TCA</span>
          </button>
        </div>
      </div>

      {/* Almgren-Chriss TCA Trajectory Panel (Collapsible/Interactive) */}
      {showTcaModal && (
        <div className="bg-slate-950 border border-indigo-500/30 rounded p-4 space-y-3 font-mono text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-white uppercase">Almgren-Chriss IS Execution Trajectory ({tcaAttribution.parentOrderId})</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-slate-400">IS Shortfall: <strong className="text-emerald-400">{tcaAttribution.implementationShortfallBps} bps</strong></span>
              <span className="text-slate-400">VWAP Slippage: <strong className="text-cyan-300">{tcaAttribution.vwapSlippageBps} bps</strong></span>
              <span className="text-slate-400">Urgency κ: <strong className="text-indigo-300">{tcaAttribution.urgencyParameterKappa}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-11 gap-1 text-center text-[10px]">
            {tcaAttribution.optimalTrajectory.map((pt) => (
              <div key={pt.step} className="bg-slate-900 p-1.5 rounded border border-slate-800">
                <span className="text-slate-500 block">T+{pt.step * 30}s</span>
                <span className="text-indigo-300 font-bold block">{pt.executedShares}</span>
                <span className="text-[8px] text-slate-500">{((pt.executedShares / tcaAttribution.totalQty) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 font-mono text-xs overflow-x-auto">
        <span className="text-slate-500 text-[10px] uppercase mr-1">Layer:</span>
        {(["ALL", "CSV_LAYER_1", "STOCHASTIC_LAYER_2", "META_LEARNER"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all ${
              activeCategory === cat
                ? "bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            {cat === "ALL" ? "All 17 Subsystems" : cat.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* 17-Subsystem Signal Matrix Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
        {filteredSubsystems.map((sub) => {
          const isPos = sub.orthogonalSignal >= 0;
          return (
            <div
              key={sub.name}
              className={`bg-slate-950 p-3 rounded border border-slate-800 border-l-4 ${
                sub.category === "CSV_LAYER_1"
                  ? "border-l-indigo-500"
                  : sub.category === "STOCHASTIC_LAYER_2"
                  ? "border-l-cyan-500"
                  : "border-l-purple-500"
              } space-y-2 hover:border-slate-700 transition-all`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans font-bold uppercase">
                <span className="truncate">{sub.name.replace("GROUP_", "").replace("ALPHA_", "")}</span>
                <span className="text-[9px] px-1 rounded bg-slate-900 border border-slate-800 text-slate-500">
                  {sub.category === "CSV_LAYER_1" ? "L1" : sub.category === "STOCHASTIC_LAYER_2" ? "L2" : "META"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Orthogonal α:</span>
                <span className={`font-bold text-sm ${isPos ? "text-emerald-400" : "text-rose-400"} flex items-center`}>
                  {isPos ? <ArrowUpRight className="w-3.5 h-3.5 inline mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 inline mr-0.5" />}
                  {isPos ? "+" : ""}{sub.orthogonalSignal}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-900 pt-1.5">
                <span>Weight: <strong className="text-slate-300">{sub.weight.toFixed(2)}</strong></span>
                <span>Conf: <strong className="text-indigo-300">{(sub.confidence * 100).toFixed(0)}%</strong></span>
                <span>⚡ <strong className="text-emerald-400">{sub.latencyUs}µs</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
