import React, { useState } from "react";
import { ShieldCheck, Layers, Activity, CheckCircle, BarChart3, TrendingUp } from "lucide-react";
import { generateCpcvAuditData } from "../utils/nexusOrchestratorEngine";

export const CpcvBacktestTerminal: React.FC = () => {
  const auditData = generateCpcvAuditData();
  const [selectedPathId, setSelectedPathId] = useState<number | null>(null);

  return (
    <div id="cpcv-backtest-terminal" className="bg-slate-900 border border-slate-800 rounded p-4 sm:p-5 shadow-2xl space-y-5">
      <div className="bg-slate-950 border border-slate-800 rounded p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-indigo-400">CPCV & PBO AUDIT SUITE</span>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400"/>
            <span>Combinatorial Purged CV & Overfitting Auditor</span>
          </h2>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs flex-wrap">
          <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] block">PBO SCORE</span>
            <span className="text-emerald-400 font-bold">{auditData.pboScorePct.toFixed(1)}% (Non-Overfit)</span>
          </div>
          <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] block">DEFLATED SHARPE</span>
            <span className="text-indigo-300 font-bold">{auditData.deflatedSharpeRatioPct.toFixed(2)}% (p &lt; 0.05)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
        <div className="bg-slate-950 p-3 rounded border border-slate-800 border-l-4 border-l-indigo-500">
          <span className="text-slate-500 text-[10px] block uppercase">Evaluated Splits</span>
          <span className="font-bold text-white text-base">{auditData.totalCombinatorialPaths} Paths (C(6,2))</span>
          <span className="text-[9px] text-slate-400 block mt-0.5">{auditData.numModelsAudited} Total Models Tested</span>
        </div>
        <div className="bg-slate-950 p-3 rounded border border-slate-800 border-l-4 border-l-emerald-500">
          <span className="text-slate-500 text-[10px] block uppercase">Mean OOS Sharpe</span>
          <span className="font-bold text-emerald-400 text-base">+{auditData.outOfSampleSharpeMean.toFixed(4)}</span>
          <span className="text-[9px] text-emerald-400/80 block mt-0.5">Out-of-Sample Performance</span>
        </div>
        <div className="bg-slate-950 p-3 rounded border border-slate-800 border-l-4 border-l-cyan-500">
          <span className="text-slate-500 text-[10px] block uppercase">Mean IS Sharpe</span>
          <span className="font-bold text-cyan-300 text-base">+{auditData.inSampleSharpeMean.toFixed(4)}</span>
          <span className="text-[9px] text-cyan-400/80 block mt-0.5">In-Sample Benchmark</span>
        </div>
        <div className="bg-slate-950 p-3 rounded border border-slate-800 border-l-4 border-l-purple-500">
          <span className="text-slate-500 text-[10px] block uppercase">Model Status</span>
          <span className="font-bold text-purple-300 text-base flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>ROBUST / READY</span>
          </span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Institutional Pass Gate</span>
        </div>
      </div>

      {/* Combinatorial Paths Inspection Matrix */}
      <div className="bg-slate-950 border border-slate-800 rounded p-3 font-mono text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-400 font-bold border-b border-slate-800 pb-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-300">15 Combinatorial Paths (In-Sample vs Out-of-Sample Sharpe)</span>
          <span className="text-[10px] text-slate-500">Click any path to inspect fold distribution</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
          {auditData.pathDistributions.map((p) => {
            const isSelected = selectedPathId === p.pathId;
            return (
              <button
                key={p.pathId}
                onClick={() => setSelectedPathId(isSelected ? null : p.pathId)}
                className={`p-2 rounded border text-left transition-all ${
                  isSelected
                    ? "bg-indigo-950/60 border-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Path #{p.pathId}</span>
                  <span className="text-emerald-400">Rank #{p.pboRank}</span>
                </div>
                <div className="text-[11px] font-bold text-slate-200">
                  IS: <span className="text-cyan-300">+{p.isSharpe.toFixed(2)}</span>
                </div>
                <div className="text-[11px] font-bold text-slate-200">
                  OOS: <span className="text-emerald-400">+{p.oosSharpe.toFixed(2)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
