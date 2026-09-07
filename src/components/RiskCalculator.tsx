import React, { useState } from "react";
import { IndexInfo, ActionableTradePlan } from "../types";
import { ShieldCheck, Calculator, AlertCircle, CheckCircle } from "lucide-react";

interface RiskCalculatorProps {
  index: IndexInfo;
  plan: ActionableTradePlan | null;
}

export const RiskCalculator: React.FC<RiskCalculatorProps> = ({ index, plan }) => {
  const [accountBalance, setAccountBalance] = useState<number>(25000);
  const [riskPercent, setRiskPercent] = useState<number>(2.0); // 2% risk rule

  const maxRiskAmount = (accountBalance * riskPercent) / 100;
  const singleLotRisk = plan ? plan.maxLoss : 120;
  const recommendedLots = Math.max(1, Math.floor(maxRiskAmount / (singleLotRisk || 1)));
  const totalCapitalRequired = plan ? plan.capitalRequired * recommendedLots : 1500;

  // Kelly Criterion: f* = (p * (b + 1) - 1) / b
  // where p = win rate (e.g. 0.84), b = risk:reward ratio (e.g. 3.5)
  const winRate = (plan ? plan.winProbability : 84) / 100;
  const b = 3.5;
  const kellyFraction = Math.max(0, (winRate * (b + 1) - 1) / b);
  const halfKellyPercent = (kellyFraction * 0.5 * 100).toFixed(1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">
              Position Sizing & Kelly Criterion Capital Risk
            </h3>
            <p className="text-[11px] text-slate-400">
              Preserve capital with strict 1-2% risk allocation rules
            </p>
          </div>
        </div>

        <span className="text-[9px] font-mono font-bold bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 uppercase tracking-widest">
          Kelly Aligned
        </span>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
        <div>
          <label className="block text-slate-400 font-sans text-xs mb-1.5 font-semibold uppercase tracking-wider">
            Trading Account Capital ({index.currency})
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-500 font-bold">{index.currency}</span>
            <input
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(Number(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-400 font-sans text-xs mb-1.5 font-semibold uppercase tracking-wider">
            Max Risk Per Trade (% of Capital)
          </label>
          <div className="flex items-center gap-2">
            {[1.0, 1.5, 2.0, 3.0].map((pct) => (
              <button
                key={pct}
                onClick={() => setRiskPercent(pct)}
                className={`flex-1 py-2 rounded font-bold transition-all ${
                  riskPercent === pct
                    ? "bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calculated Results Matrix with geometric borders */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono pt-1">
        <div className="bg-slate-950 border border-slate-800 p-3 rounded border-l-2 border-l-rose-500">
          <div className="text-[9px] text-slate-500 uppercase font-sans font-bold tracking-wider">Max Risk Budget</div>
          <div className="text-base font-bold text-rose-400 mt-0.5">
            {index.currency}{maxRiskAmount.toLocaleString()}
          </div>
          <div className="text-[9px] text-slate-500 mt-1">{riskPercent}% Portfolio Risk</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-3 rounded border-l-2 border-l-emerald-500">
          <div className="text-[9px] text-slate-500 uppercase font-sans font-bold tracking-wider">Recommended Lots</div>
          <div className="text-base font-bold text-emerald-400 mt-0.5">
            {recommendedLots} Lots ({recommendedLots * index.lotSize} Qty)
          </div>
          <div className="text-[9px] text-slate-500 mt-1">Single Stop-Loss Safe</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-3 rounded border-l-2 border-l-indigo-500">
          <div className="text-[9px] text-slate-500 uppercase font-sans font-bold tracking-wider">Capital Deployed</div>
          <div className="text-base font-bold text-white mt-0.5">
            {index.currency}{totalCapitalRequired.toLocaleString()}
          </div>
          <div className="text-[9px] text-slate-500 mt-1">
            {((totalCapitalRequired / (accountBalance || 1)) * 100).toFixed(1)}% of Account
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-3 rounded border-l-2 border-l-cyan-500">
          <div className="text-[9px] text-cyan-400 uppercase font-sans font-bold tracking-wider">Half-Kelly Edge</div>
          <div className="text-base font-bold text-cyan-300 mt-0.5">
            {halfKellyPercent}%
          </div>
          <div className="text-[9px] text-slate-500 mt-1">Optimal Compound Sizing</div>
        </div>
      </div>

      {/* Rules Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded p-3 text-[11px] text-slate-300 space-y-1">
        <div className="font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Institutional Execution Protocol</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          1. Once Target 1 is reached (+1:1.5 R:R), automatically book 50% profits and shift Stop-Loss to Cost (Breakeven).
          <br />
          2. Never average down on losing option buying contracts. Honor structural invalidation strictly.
        </p>
      </div>
    </div>
  );
};
