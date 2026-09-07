import React, { useState } from "react";
import { IndexInfo, ActionableTradePlan, StrategyConfluence, GarchVolForecast } from "../types";
import {
  Crosshair,
  Target,
  ShieldCheck,
  Zap,
  Lock,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Activity,
  BarChart3,
  Cpu,
  Flame,
  Radio,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  Gauge,
  Sliders,
} from "lucide-react";

interface PinpointPrecisionRadarProps {
  index: IndexInfo;
  confluence: StrategyConfluence;
  plan: ActionableTradePlan | null;
  garchForecast?: GarchVolForecast;
  onExecuteTrade: () => void;
  onNavigateToGarchSuite?: () => void;
}

export const PinpointPrecisionRadar: React.FC<PinpointPrecisionRadarProps> = ({
  index,
  confluence,
  plan,
  garchForecast,
  onExecuteTrade,
  onNavigateToGarchSuite,
}) => {
  const precision = confluence.precisionVector || plan?.precisionVector;
  const isBullish = confluence.signal === "CONFIRMED_BUY_DIP" || confluence.signal === "WAIT_ACCUMULATION";
  
  // GARCH(1,1) Dynamic Adaptive Risk Mode Toggle
  const [useGarchAdjustment, setUseGarchAdjustment] = useState<boolean>(true);

  if (!precision) {
    return null;
  }

  const currentPrice = index.currentPrice;
  const distToOptimal = Number((currentPrice - precision.entryZoneRange.optimalTick).toFixed(2));
  const isInsideEntryZone =
    currentPrice >= precision.entryZoneRange.min && currentPrice <= precision.entryZoneRange.max;

  // Compute GARCH-conditioned dynamic parameters
  const stopMultiplier = (useGarchAdjustment && garchForecast?.pinpointRiskAdjustments?.dynamicStopMultiplier) || 1.0;
  const targetExtension = (useGarchAdjustment && garchForecast?.pinpointRiskAdjustments?.dynamicTargetExtension) || 1.0;
  const sizingPct = (useGarchAdjustment && garchForecast?.pinpointRiskAdjustments?.recommendedPositionSizing) || 100;

  // Raw stop distance from optimal entry
  const rawStopDistance = Math.abs(precision.entryZoneRange.optimalTick - precision.invalidationTrigger);
  const adjustedStopDistance = rawStopDistance * stopMultiplier;
  
  const garchAdjustedStop = isBullish
    ? Number((precision.entryZoneRange.optimalTick - adjustedStopDistance).toFixed(2))
    : Number((precision.entryZoneRange.optimalTick + adjustedStopDistance).toFixed(2));

  // Dynamically adjusted Targets
  const rawT1Dist = Math.abs(precision.laserTargets.t1_1272 - precision.entryZoneRange.optimalTick);
  const rawT2Dist = Math.abs(precision.laserTargets.t2_1618 - precision.entryZoneRange.optimalTick);
  const rawT3Dist = Math.abs(precision.laserTargets.t3_2618 - precision.entryZoneRange.optimalTick);

  const garchT1 = isBullish
    ? Number((precision.entryZoneRange.optimalTick + rawT1Dist * targetExtension).toFixed(2))
    : Number((precision.entryZoneRange.optimalTick - rawT1Dist * targetExtension).toFixed(2));

  const garchT2 = isBullish
    ? Number((precision.entryZoneRange.optimalTick + rawT2Dist * targetExtension).toFixed(2))
    : Number((precision.entryZoneRange.optimalTick - rawT2Dist * targetExtension).toFixed(2));

  const garchT3 = isBullish
    ? Number((precision.entryZoneRange.optimalTick + rawT3Dist * targetExtension).toFixed(2))
    : Number((precision.entryZoneRange.optimalTick - rawT3Dist * targetExtension).toFixed(2));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-5 font-mono">
      {/* Precision Header & Arrow Piercing Index Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-amber-500/20 border border-indigo-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Crosshair className="w-5 h-5 animate-pulse text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white uppercase tracking-tight font-sans">
                Arrow-Piercing Precision Confluence Matrix
              </h3>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                  precision.precisionStatus === "PIERCING_ENTRY_TRIGGERED"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse"
                    : precision.precisionStatus === "ACCELERATING_TO_T1"
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}
              >
                {precision.precisionStatus.replace(/_/g, " ")}
              </span>

              {/* GARCH(1,1) Volatility Badge */}
              {garchForecast && (
                <div
                  onClick={onNavigateToGarchSuite}
                  className={`cursor-pointer text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 border transition-all ${
                    garchForecast.volatilityRegime === "VOLATILITY_EXPANSION"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30"
                      : garchForecast.volatilityRegime === "VOLATILITY_CONTRACTION"
                      ? "bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30"
                      : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30"
                  }`}
                  title="Click to view full Operations Research & GARCH(1,1) Suite"
                >
                  <Activity className="w-3 h-3 text-purple-400" />
                  <span>GARCH(1,1) {garchForecast.volatilityRegime.replace(/_/g, " ")}</span>
                  <span className="text-white font-mono">({garchForecast.annualizedForecastVol}% IV)</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              8-factor institutional lock matrix, volume profile POC, and GARCH(1,1) time-varying risk calibration.
            </p>
          </div>
        </div>

        {/* Dynamic GARCH Risk Calibrations Toggle & Piercing Score Card */}
        <div className="flex items-center gap-3 flex-wrap">
          {garchForecast && (
            <button
              onClick={() => setUseGarchAdjustment((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-sans font-bold uppercase flex items-center gap-1.5 transition-all ${
                useGarchAdjustment
                  ? "bg-purple-950/60 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)]"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>GARCH Risk Dynamic: {useGarchAdjustment ? "ACTIVE" : "OFF"}</span>
            </button>
          )}

          <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">Piercing Edge Score</div>
              <div className="text-2xl font-bold font-sans text-amber-400">
                {precision.arrowPiercingScore}
                <span className="text-sm text-slate-500">/100</span>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-slate-800"></div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">Velocity</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                {precision.projectedVelocity.replace(/_/g, " ")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Target & Invalidation Precision Laser Path */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-sans font-bold text-slate-300 border-b border-slate-900 pb-2">
          <span className="flex items-center gap-2 uppercase tracking-wider">
            <Target className="w-4 h-4 text-indigo-400" />
            Laser-Piercing Trajectory & Execution Invalidation
            {useGarchAdjustment && (
              <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded font-mono">
                GARCH Adjusted (Stop ×{stopMultiplier} | Target ×{targetExtension})
              </span>
            )}
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Current Spot: <strong className="text-white">{index.currency}{currentPrice.toLocaleString()}</strong>
          </span>
        </div>

        {/* Trajectory Milestones Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          {/* 1. Structural / GARCH Stop */}
          <div className="bg-slate-900/90 border border-rose-500/30 rounded p-2.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-rose-400 font-sans font-bold uppercase">
              <span>Invalidation Line</span>
              <span>{useGarchAdjustment ? `GARCH ${stopMultiplier}x` : "1-Tick Stop"}</span>
            </div>
            <div className="text-base font-bold text-rose-400">
              {index.currency}{garchAdjustedStop.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500">
              {isBullish ? `-${(currentPrice - garchAdjustedStop).toFixed(2)} pts` : `+${(garchAdjustedStop - currentPrice).toFixed(2)} pts`}
            </div>
          </div>

          {/* 2. Optimal Precision Entry */}
          <div
            className={`rounded p-2.5 space-y-1 border ${
              isInsideEntryZone
                ? "bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "bg-slate-900 border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-amber-300 font-sans font-bold uppercase">
              <span>Optimal Entry Tick</span>
              <span className="text-[9px] bg-amber-500/20 px-1 py-0.2 rounded">±0.08% Band</span>
            </div>
            <div className="text-base font-bold text-amber-300">
              {index.currency}{precision.entryZoneRange.optimalTick.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">
              Range: {precision.entryZoneRange.min} – {precision.entryZoneRange.max}
            </div>
          </div>

          {/* 3. Target 1 (1.272 Fib-ATR) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-emerald-400 font-sans font-bold uppercase">
              <span>Target 1 (1.272 Fib)</span>
              <span className="text-[9px] bg-emerald-500/20 px-1 py-0.2 rounded text-emerald-300">High Prob</span>
            </div>
            <div className="text-base font-bold text-emerald-400">
              {index.currency}{garchT1.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500">
              {isBullish ? `+${(garchT1 - currentPrice).toFixed(2)} pts` : `-${(currentPrice - garchT1).toFixed(2)} pts`}
            </div>
          </div>

          {/* 4. Target 2 (1.618 Golden Ratio) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-indigo-300 font-sans font-bold uppercase">
              <span>Target 2 (1.618 Fib)</span>
              <span className="text-[9px] bg-indigo-500/20 px-1 py-0.2 rounded">Expansion</span>
            </div>
            <div className="text-base font-bold text-indigo-300">
              {index.currency}{garchT2.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500">
              {isBullish ? `+${(garchT2 - currentPrice).toFixed(2)} pts` : `-${(currentPrice - garchT2).toFixed(2)} pts`}
            </div>
          </div>

          {/* 5. Target 3 (2.618 Extended Moonshot) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-purple-300 font-sans font-bold uppercase">
              <span>Target 3 (2.618 Fib)</span>
              <span className="text-[9px] bg-purple-500/20 px-1 py-0.2 rounded">Runner</span>
            </div>
            <div className="text-base font-bold text-purple-300">
              {index.currency}{garchT3.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500">
              {isBullish ? `+${(garchT3 - currentPrice).toFixed(2)} pts` : `-${(currentPrice - garchT3).toFixed(2)} pts`}
            </div>
          </div>
        </div>
      </div>

      {/* GARCH Risk Warning & Sizing Banner */}
      {garchForecast && useGarchAdjustment && (
        <div className="bg-purple-950/40 border border-purple-500/30 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <span className="font-bold text-purple-200">GARCH(1,1) Dynamic Risk Calibration: </span>
              <span className="text-slate-300">{garchForecast.pinpointRiskAdjustments.volClusterRiskWarning}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <div className="bg-slate-900 px-2.5 py-1 rounded border border-purple-500/30 text-purple-300">
              Optimal Sizing: <strong className="text-white">{sizingPct}% Lots</strong>
            </div>
            <div className="bg-slate-900 px-2.5 py-1 rounded border border-purple-500/30 text-purple-300">
              Max Risk: <strong className="text-emerald-400">{index.currency}{garchForecast.pinpointRiskAdjustments.maxRiskPerTradeAdjustedInr.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      )}

      {/* 8-Factor Institutional Confluence Lock Matrix */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-sans font-bold text-slate-300">
          <span className="flex items-center gap-2 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            8-Factor Institutional Synchronization Lock
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
            {precision.confluenceLocks.filter((l) => l.status === "LOCKED").length}/8 Confluence Pillars Locked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {precision.confluenceLocks.map((lock) => (
            <div
              key={lock.id}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded p-3 space-y-1.5 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wide truncate">
                  {lock.name}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold flex items-center gap-1 uppercase ${
                    lock.status === "LOCKED"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}
                >
                  <Lock className="w-2.5 h-2.5" />
                  {lock.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-white font-bold">{lock.metric}</span>
                <span className="text-[11px] text-indigo-400 font-bold">{lock.score}%</span>
              </div>

              <div className="text-[9px] text-slate-500 truncate group-hover:text-slate-400 transition-colors">
                {lock.details}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Volume Profile POC & Golden Pocket Calibration Ribbon */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-300">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span className="font-sans font-bold text-slate-400 uppercase text-[10px]">VPOC Volume Node:</span>
            <span className="text-indigo-300 font-bold">{index.currency}{precision.goldenPocket.pocPrice}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="font-sans font-bold text-slate-400 uppercase text-[10px]">0.618 Golden Pocket:</span>
            <span className="text-amber-400 font-bold">{index.currency}{precision.goldenPocket.fib618}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="font-sans font-bold text-slate-400 uppercase text-[10px]">Value Area (70%):</span>
            <span className="text-slate-300 font-bold">{precision.goldenPocket.valueAreaLow} – {precision.goldenPocket.valueAreaHigh}</span>
          </div>
        </div>

        {/* Recommended Contract & 1-Click Trade Dispatch */}
        {plan && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 flex items-center gap-2">
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${plan.direction === "BULLISH" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                {plan.contractAction || (plan.direction === "BULLISH" ? "BUY" : "BUY")}
              </span>
              <span className="text-white font-bold text-xs">{plan.contractFullName || plan.recommendedContract}</span>
              <span className="text-indigo-300 text-xs">@{index.currency}{plan.entryOptionPremium}</span>
            </div>

            <button
              onClick={onExecuteTrade}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-sans text-xs font-bold uppercase flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Paper Trade Piercing Strike</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
