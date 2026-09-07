import React from "react";
import {
  StrategyConfluence,
  IndexInfo,
  ActionableTradePlan,
} from "../types";
import {
  ShieldCheck,
  Zap,
  Layers,
  TrendingUp,
  TrendingDown,
  Cpu,
  BarChart3,
  Target,
  Globe,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface StrategyMatrixProps {
  index: IndexInfo;
  confluence: StrategyConfluence;
  plan: ActionableTradePlan | null;
  onExecuteSimulatedTrade: () => void;
}

export const StrategyMatrix: React.FC<StrategyMatrixProps> = ({
  index,
  confluence,
  plan,
  onExecuteSimulatedTrade,
}) => {
  const isConfirmed = confluence.totalScore >= 85;
  const isBullish =
    confluence.signal === "CONFIRMED_BUY_DIP" ||
    confluence.signal === "WAIT_ACCUMULATION";

  const pillars = [
    {
      id: "hft",
      name: "HFT Engine & CVD (20%)",
      score: confluence.hftScore,
      icon: Zap,
      details: confluence.hftDetails,
      badge: confluence.hftScore >= 85 ? "Institutional Flow" : "Moderate Delta",
      borderAccent: "border-l-2 border-indigo-500",
      barColor: "bg-indigo-500",
    },
    {
      id: "smc",
      name: "Smart Money & SMC (20%)",
      score: confluence.smcScore,
      icon: Layers,
      details: confluence.smcDetails,
      badge: confluence.smcScore >= 85 ? "FVG & OB Validated" : "Liquidity Active",
      borderAccent: "border-l-2 border-emerald-500",
      barColor: "bg-emerald-500",
    },
    {
      id: "zigzag",
      name: "ZigZag Wyckoff (25%)",
      score: confluence.zigzagScore,
      icon: Target,
      details: confluence.zigzagDetails,
      badge:
        confluence.zigzagScore >= 90
          ? "Confirmed Pivot Point"
          : "Wave in Motion",
      borderAccent: "border-l-2 border-amber-500",
      barColor: "bg-amber-500",
    },
    {
      id: "greeks",
      name: "Option Greeks 0.7Δ (15%)",
      score: confluence.greeksScore,
      icon: Cpu,
      details: confluence.greeksDetails,
      badge:
        confluence.greeksScore >= 85
          ? "Gamma Squeeze Edge"
          : "Delta Balanced",
      borderAccent: "border-l-2 border-cyan-500",
      barColor: "bg-cyan-500",
    },
    {
      id: "oi",
      name: "Max Pain & PCR (10%)",
      score: confluence.oiScore,
      icon: BarChart3,
      details: confluence.oiDetails,
      badge: confluence.oiScore >= 85 ? "Max Pain Alignment" : "OI Accumulation",
      borderAccent: "border-l-2 border-rose-500",
      barColor: "bg-rose-500",
    },
    {
      id: "sentiment",
      name: "Global Sentiment (10%)",
      score: confluence.sentimentScore || 78,
      icon: Globe,
      details:
        confluence.sentimentDetails ||
        "Real-time financial headlines & Google Search macro synthesis.",
      badge:
        (confluence.sentimentScore || 78) >= 80
          ? "Bullish Macro Flow"
          : (confluence.sentimentScore || 78) <= 45
          ? "Bearish Macro Drag"
          : "Grounded Search Pulse",
      borderAccent: "border-l-2 border-violet-500",
      barColor: "bg-violet-500",
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-5 shadow-2xl space-y-5">
      {/* Top Banner: Master Confluence Index */}
      <div className="bg-slate-950 border border-slate-800 rounded p-4 flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center flex-shrink-0">
            {/* Geometric diamond framing score */}
            <div className="w-16 h-16 rounded bg-slate-900 border border-slate-700 flex flex-col items-center justify-center relative shadow-[0_0_15px_rgba(79,70,229,0.25)]">
              <span className="text-xl font-bold font-mono text-white">
                {confluence.totalScore}%
              </span>
              <span className="text-[8px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                SCORE
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                CORE STRATEGY EQUILIBRIUM
              </span>
              {isConfirmed ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Confirmed Execution Signal
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
                  <AlertTriangle className="w-3 h-3" /> Filtering Micro Noise
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {confluence.signal === "CONFIRMED_BUY_DIP" ? (
                <span className="text-emerald-400 flex items-center gap-1.5 uppercase">
                  <TrendingUp className="w-5 h-5" /> Confirmed Buy at Dip (Wyckoff Valley + HFT Accumulation)
                </span>
              ) : confluence.signal === "CONFIRMED_SELL_TOP" ? (
                <span className="text-rose-400 flex items-center gap-1.5 uppercase">
                  <TrendingDown className="w-5 h-5" /> Confirmed Sell at Top (Supply Rejection + HFT Distribution)
                </span>
              ) : isBullish ? (
                <span className="text-indigo-400 uppercase">
                  Accumulation Sequence in Motion (Golden Pocket Staging)
                </span>
              ) : (
                <span className="text-purple-400 uppercase">
                  Distribution Sequence in Motion (Top Order Block Sweep)
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400 mt-1 max-w-2xl font-normal">
              Continuous 6-layer verification syncing sub-millisecond HFT tape, order blocks, ZigZag swings, Black-Scholes gamma, and live Google Search sentiment.
            </p>
          </div>
        </div>

        {/* Action Button */}
        {plan && (
          <div className="text-right w-full md:w-auto flex md:flex-col items-center md:items-end justify-between gap-2.5 flex-shrink-0">
            <div className="text-xs text-slate-400 font-mono">
              Win Probability: <span className="text-emerald-400 font-bold">{plan.winProbability}%</span> | R:R: <span className="text-white font-bold">{plan.riskReward}</span>
            </div>
            <button
              onClick={onExecuteSimulatedTrade}
              className="px-5 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_4px_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all flex items-center gap-2 tracking-wider uppercase"
            >
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>EXECUTE CONFIRMED ORDER</span>
            </button>
          </div>
        )}
      </div>

      {/* Advanced Quant Enhancements: Multi-Timeframe & VPIN Microstructure Bar */}
      {confluence.mtfAlignment && confluence.vpinMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
          {/* MTF Matrix */}
          <div className="bg-slate-950 border border-slate-800 rounded p-3 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-[9px] uppercase tracking-wider font-sans font-bold text-indigo-400">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> MULTI-TIMEFRAME SYNCHRONIZATION
              </span>
              <span className={confluence.mtfAlignment.isFullyAligned ? "text-emerald-400" : "text-amber-400"}>
                {confluence.mtfAlignment.confluencePercentage}% ALIGNED
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="bg-slate-900 border border-slate-800 rounded p-1.5">
                <div className="text-[9px] text-slate-500 font-sans">15M HTF</div>
                <div className={`font-bold mt-0.5 ${confluence.mtfAlignment.tf15m.trend === "BULLISH" ? "text-emerald-400" : "text-rose-400"}`}>
                  {confluence.mtfAlignment.tf15m.trend}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded p-1.5">
                <div className="text-[9px] text-slate-500 font-sans">5M SETUP</div>
                <div className={`font-bold mt-0.5 ${confluence.mtfAlignment.tf5m.trend === "BULLISH" ? "text-emerald-400" : "text-rose-400"}`}>
                  {confluence.mtfAlignment.tf5m.trend}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded p-1.5">
                <div className="text-[9px] text-slate-500 font-sans">1M TAPE</div>
                <div className={`font-bold mt-0.5 ${confluence.mtfAlignment.tf1m.trend === "BULLISH" ? "text-emerald-400" : "text-rose-400"}`}>
                  {confluence.mtfAlignment.tf1m.trend}
                </div>
              </div>
            </div>
          </div>

          {/* VPIN & Toxicity */}
          <div className="bg-slate-950 border border-slate-800 rounded p-3 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-[9px] uppercase tracking-wider font-sans font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> MICROSTRUCTURE VPIN & GAMMA RISK
              </span>
              <span className="text-slate-300 font-mono">
                VPIN: {confluence.vpinMetrics.vpinScore}/100
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-slate-900 border border-slate-800 rounded p-1.5">
                <div className="text-[9px] text-slate-500 font-sans">ORDER TOXICITY</div>
                <div className="font-bold text-emerald-400 mt-0.5 truncate">
                  {confluence.vpinMetrics.toxicityLevel}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded p-1.5">
                <div className="text-[9px] text-slate-500 font-sans">GAMMA SQUEEZE</div>
                <div className="font-bold text-indigo-300 mt-0.5 truncate">
                  {confluence.vpinMetrics.gammaSqueezeRisk}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6-Pillar Confluence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {pillars.map((p) => {
          const Icon = p.icon;
          const isHigh = p.score >= 85;
          return (
            <div
              key={p.id}
              className={`bg-slate-950 p-3.5 rounded-r-lg border border-slate-800 ${p.borderAccent} flex flex-col justify-between hover:bg-slate-900/60 transition-all`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-white truncate">
                      {p.name}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      isHigh
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {p.score}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-slate-800 w-full rounded-full overflow-hidden my-2">
                  <div
                    className={`h-full ${p.barColor} rounded-full`}
                    style={{ width: `${p.score}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2 mt-1">
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                  {p.details}
                </p>
                <div className="text-[8px] font-mono font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/40 px-1.5 py-1 rounded border border-indigo-800/40 text-center truncate">
                  {p.badge}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

