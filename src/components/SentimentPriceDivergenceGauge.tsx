import React from "react";
import { IndexInfo, GlobalSentimentData, SentimentPriceDivergenceMetrics } from "../types";
import {
  Activity,
  AlertTriangle,
  Flame,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Zap,
  Radio,
  ArrowRightLeft,
  Crosshair,
  Gauge,
} from "lucide-react";

interface SentimentPriceDivergenceGaugeProps {
  index: IndexInfo;
  sentimentData: GlobalSentimentData | null;
  divergence: SentimentPriceDivergenceMetrics;
  hftDelta: number;
}

export const SentimentPriceDivergenceGauge: React.FC<SentimentPriceDivergenceGaugeProps> = ({
  index,
  sentimentData,
  divergence,
  hftDelta,
}) => {
  const isCritical = divergence.exhaustionRisk === "CRITICAL_EXHAUSTION";
  const isElevated = divergence.exhaustionRisk === "ELEVATED_DIVERGENCE";

  const isBullishExhaustion = divergence.divergenceType === "BULLISH_EXHAUSTION_DIVERGENCE";
  const isBearishExhaustion = divergence.divergenceType === "BEARISH_EXHAUSTION_DIVERGENCE";
  const isConfirming = divergence.divergenceType === "CONFIRMING_MOMENTUM";

  // Needle angle for gauge (-90deg to +90deg based on disparity spread)
  // disparity = hftNormalizedDelta - groundedSentimentNormalized (-200 to +200)
  const spread = divergence.hftNormalizedDelta - divergence.groundedSentimentNormalized;
  const clampedSpread = Math.max(-100, Math.min(100, spread / 1.5));
  const needleRotation = clampedSpread * 0.85; // degrees from center

  return (
    <div
      id="sentiment-price-divergence-gauge"
      className={`bg-slate-950 border rounded-lg p-4 font-mono transition-all ${
        isCritical
          ? "border-rose-500/60 shadow-[0_0_25px_rgba(244,63,94,0.25)] ring-1 ring-rose-500/40"
          : isElevated
          ? "border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          : "border-slate-800"
      }`}
    >
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded flex items-center justify-center border ${
              isCritical
                ? "bg-rose-950/60 text-rose-400 border-rose-600/50 animate-pulse"
                : isElevated
                ? "bg-amber-950/60 text-amber-400 border-amber-600/50"
                : "bg-indigo-950/60 text-indigo-400 border-indigo-700/50"
            }`}
          >
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
                Sentiment–Order Flow Divergence Gauge
              </h3>
              <span
                className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border flex items-center gap-1 ${
                  isCritical
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-bounce"
                    : isElevated
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : isConfirming
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {isCritical ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    CRITICAL EXHAUSTION
                  </>
                ) : isElevated ? (
                  <>
                    <Flame className="w-3 h-3 text-amber-400" />
                    ELEVATED DIVERGENCE
                  </>
                ) : isConfirming ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    FLOW SYNCED
                  </>
                ) : (
                  "EQUILIBRIUM"
                )}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">
              Contrasting real-time micro HFT order flow delta against Google-grounded macroeconomic sentiment.
            </p>
          </div>
        </div>

        {/* Divergence Intensity Metric */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 ml-auto">
          <div>
            <div className="text-[9px] text-slate-500 uppercase font-sans font-bold">Divergence Disparity</div>
            <div className="text-base font-bold text-amber-300">
              {divergence.divergenceIntensity}%
            </div>
          </div>
          <div className="h-6 w-[1px] bg-slate-800"></div>
          <div>
            <div className="text-[9px] text-slate-500 uppercase font-sans font-bold">Signal Edge</div>
            <div
              className={`text-[11px] font-bold ${
                isBullishExhaustion
                  ? "text-emerald-400"
                  : isBearishExhaustion
                  ? "text-rose-400"
                  : "text-indigo-300"
              }`}
            >
              {divergence.divergenceType.replace(/_/g, " ")}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Dual Scale Comparison Bars */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scale 1: Real-Time HFT Order Flow CVD */}
        <div className="bg-slate-900/90 border border-slate-800 rounded p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-300 font-sans font-bold uppercase text-[10px]">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              1. Real-Time HFT Order Flow Delta
            </span>
            <span
              className={`font-bold ${
                hftDelta >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {hftDelta > 0 ? "+" : ""}{hftDelta.toLocaleString()} CVD
            </span>
          </div>

          {/* Bi-directional Delta Bar */}
          <div className="relative h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            {/* Center zero divider */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-slate-700 z-10"></div>
            {divergence.hftNormalizedDelta >= 0 ? (
              <div
                className="absolute left-1/2 top-0 bottom-0 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-r-full transition-all duration-300"
                style={{ width: `${Math.min(50, (divergence.hftNormalizedDelta / 100) * 50)}%` }}
              ></div>
            ) : (
              <div
                className="absolute right-1/2 top-0 bottom-0 bg-gradient-to-l from-rose-600 to-rose-400 rounded-l-full transition-all duration-300"
                style={{ width: `${Math.min(50, (Math.abs(divergence.hftNormalizedDelta) / 100) * 50)}%` }}
              ></div>
            )}
          </div>
          <div className="flex justify-between text-[9px] text-slate-500 font-sans">
            <span>-100% Institutional Selling</span>
            <span>0 Neutral</span>
            <span>+100% Limit Bid Absorption</span>
          </div>
        </div>

        {/* Scale 2: Google Search Grounded Macro Sentiment */}
        <div className="bg-slate-900/90 border border-slate-800 rounded p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-300 font-sans font-bold uppercase text-[10px]">
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
              2. Google Search Grounded Sentiment
            </span>
            <span
              className={`font-bold ${
                divergence.groundedSentimentNormalized >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {sentimentData?.score ?? 78}/100 ({sentimentData?.label || "BULLISH"})
            </span>
          </div>

          {/* Bi-directional Sentiment Bar */}
          <div className="relative h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-slate-700 z-10"></div>
            {divergence.groundedSentimentNormalized >= 0 ? (
              <div
                className="absolute left-1/2 top-0 bottom-0 bg-gradient-to-r from-indigo-600 to-cyan-400 rounded-r-full transition-all duration-300"
                style={{ width: `${Math.min(50, (divergence.groundedSentimentNormalized / 100) * 50)}%` }}
              ></div>
            ) : (
              <div
                className="absolute right-1/2 top-0 bottom-0 bg-gradient-to-l from-rose-600 to-amber-400 rounded-l-full transition-all duration-300"
                style={{ width: `${Math.min(50, (Math.abs(divergence.groundedSentimentNormalized) / 100) * 50)}%` }}
              ></div>
            )}
          </div>
          <div className="flex justify-between text-[9px] text-slate-500 font-sans">
            <span>Extreme Fear / Risk-Off</span>
            <span>50 Neutral</span>
            <span>Extreme Greed / Risk-On</span>
          </div>
        </div>
      </div>

      {/* Dial & Exhaustion Synthesis Banner */}
      <div className="mt-3 bg-slate-900 border border-slate-800 rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5 max-w-2xl">
          <ArrowRightLeft
            className={`w-4 h-4 shrink-0 mt-0.5 ${
              isCritical
                ? "text-rose-400 animate-spin"
                : isElevated
                ? "text-amber-400"
                : "text-emerald-400"
            }`}
          />
          <div className="space-y-1">
            <p className="text-slate-200 font-sans font-bold leading-tight">
              {divergence.divergenceSignal}
            </p>
            <p className="text-[11px] text-slate-400 font-sans leading-normal">
              <strong className="text-amber-300 font-mono">Institutional Action: </strong>
              {divergence.smartMoneyAction}
            </p>
          </div>
        </div>

        {/* Visual Needle / Exhaustion Pill */}
        <div className="flex items-center gap-2 self-center">
          <div
            className={`px-3 py-1.5 rounded border text-[10px] font-bold font-sans uppercase tracking-wider ${
              isBullishExhaustion
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                : isBearishExhaustion
                ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
            }`}
          >
            {isBullishExhaustion
              ? "🚀 Bullish Spring Absorption"
              : isBearishExhaustion
              ? "⚠️ Bearish Distribution Top"
              : "⚖️ Order Flow In Sync"}
          </div>
        </div>
      </div>
    </div>
  );
};
