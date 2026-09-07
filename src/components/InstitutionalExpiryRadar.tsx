import React from "react";
import { InstitutionalParticipantFlow, ZeroDteExpiryClock, IndexInfo } from "../types";
import {
  Building2,
  Clock,
  Flame,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Zap,
  Target,
  Percent,
  Compass,
} from "lucide-react";

interface InstitutionalExpiryRadarProps {
  index: IndexInfo;
  institutionalFlow: InstitutionalParticipantFlow;
  expiryClock: ZeroDteExpiryClock;
}

export const InstitutionalExpiryRadar: React.FC<InstitutionalExpiryRadarProps> = ({
  index,
  institutionalFlow,
  expiryClock,
}) => {
  const isFiiBullish = institutionalFlow.fiiFuturesNetRatio >= 60;
  const isProBullish = institutionalFlow.proDeskBias === "PUT_WRITING_FLOOR";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Institutional Participant Tape (FII / DII / Pro Desk) */}
      <div className="bg-slate-900 border border-slate-800 rounded p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
              Institutional Participant Positioning (FII / DII)
            </h4>
          </div>
          <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-bold">
            SMART MONEY RADAR
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
          <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
            <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">FII Index Futures</div>
            <div className={`text-base font-bold mt-0.5 ${isFiiBullish ? "text-emerald-400" : "text-rose-400"}`}>
              {institutionalFlow.fiiFuturesNetRatio}% Long
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              +{institutionalFlow.fiiNetContracts.toLocaleString()} Lots
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
            <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">FII Net Cash Buy</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              +{index.currency}{institutionalFlow.fiiCashFlowCrores.toLocaleString()} Cr
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Equity Flow Bias</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
            <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">DII Net Cash Buy</div>
            <div className="text-base font-bold text-indigo-300 mt-0.5">
              +{index.currency}{institutionalFlow.diiCashFlowCrores.toLocaleString()} Cr
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Domestic Support</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
            <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Proprietary Desk</div>
            <div className={`text-xs font-bold mt-1 ${isProBullish ? "text-emerald-400" : "text-rose-400"}`}>
              {institutionalFlow.proDeskBias.replace(/_/g, " ")}
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">Option Writers</div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded p-2.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 text-[11px]">
              Institutional vs Retail Posture:{" "}
              <strong className="text-white">
                FIIs Heavy Long ({institutionalFlow.fiiFuturesNetRatio}%) vs Retail ({institutionalFlow.retailSentiment.replace(/_/g, " ")})
              </strong>
            </span>
          </div>
          {institutionalFlow.smartMoneyDivergence && (
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-mono font-bold">
              SMART DIVERGENCE ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* 2. Zero-DTE Expiry Barometer & Gamma Pinning Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
              Intraday 0-DTE Expiry Clock & Gamma Velocity
            </h4>
          </div>
          <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
            {expiryClock.currentPhase.replace(/_/g, " ")}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
          <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
            <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Time to Close</div>
            <div className="text-base font-bold text-amber-400 mt-0.5">
              {expiryClock.minutesToMarketClose} mins
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Intraday Window</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
            <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Theta Decay Rate</div>
            <div className="text-base font-bold text-rose-400 mt-0.5">
              {expiryClock.thetaDecayRatePerHour}% / hr
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Time Depreciation</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
            <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Gamma Surge Risk</div>
            <div className="text-base font-bold text-indigo-400 mt-0.5">
              {expiryClock.gammaSpikeProbability}% Prob
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Spike Sensitivity</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
            <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Safe Strike Range</div>
            <div className="text-xs font-bold text-emerald-400 mt-1">
              {expiryClock.safeStrikesRange.lower} - {expiryClock.safeStrikesRange.upper}
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">Institutional Bounds</div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded p-2.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-300 text-[11px]">
              Recommended Expiry Playbook:{" "}
              <strong className="text-emerald-400">{expiryClock.recommendedStrategy}</strong>
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-mono">
            0.70Δ ITM Immune to Theta Drag
          </span>
        </div>
      </div>
    </div>
  );
};
