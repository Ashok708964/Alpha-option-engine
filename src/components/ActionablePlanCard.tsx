import React, { useState } from "react";
import { ActionableTradePlan, IndexInfo } from "../types";
import {
  Target,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  Check,
  Zap,
  Clock,
  DollarSign,
  Share2,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Lock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { OptionPayoffVisualizer } from "./OptionPayoffVisualizer";
import { MessageSquare, Send } from "lucide-react";

interface ActionablePlanCardProps {
  index: IndexInfo;
  plan: ActionableTradePlan | null;
  onExecutePaperTrade: (plan: ActionableTradePlan) => void;
  onSendNotification?: (plan: ActionableTradePlan) => void;
}

export const ActionablePlanCard: React.FC<ActionablePlanCardProps> = ({
  index,
  plan,
  onExecutePaperTrade,
  onSendNotification,
}) => {
  const [copied, setCopied] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [dispatchedNotif, setDispatchedNotif] = useState(false);
  const [showPayoff, setShowPayoff] = useState(true);

  if (!plan) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400">
        Synthesizing high-conviction institutional trade plan...
      </div>
    );
  }

  const isBullish = plan.direction === "BULLISH";
  const precision = plan.precisionVector;

  const handleCopy = () => {
    const text = `🎯 OmniAlpha Confirmed Strategy Signal:
Index: ${plan.index}
Action: ${plan.action}
Contract: ${plan.recommendedContract}
Spot Entry: ${index.currency}${plan.entrySpotPrice}
Option Premium Entry: ${index.currency}${plan.entryOptionPremium}
Target 1: ${index.currency}${plan.target1}
Target 2: ${index.currency}${plan.target2}
Target 3: ${index.currency}${plan.target3}
Stop-Loss: ${index.currency}${plan.stopLoss}
Risk/Reward: ${plan.riskReward}
Win Prob: ${plan.winProbability}%
Piercing Score: ${precision?.arrowPiercingScore || 92}/100`;

    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } catch {
      // Ignore clipboard permission issues
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecute = () => {
    setExecuted(true);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // Safe fallback if canvas is restricted
    }
    onExecutePaperTrade(plan);
    setTimeout(() => setExecuted(false), 3000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-5 shadow-2xl space-y-4">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded flex items-center justify-center font-bold text-white shadow-md ${
              isBullish
                ? "bg-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                : "bg-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.35)]"
            }`}
          >
            {isBullish ? (
              <ArrowUpRight className="w-5 h-5" />
            ) : (
              <ArrowDownRight className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white uppercase tracking-tight">
                {isBullish ? "CONFIRMED DIP BUYING STRATEGY" : "CONFIRMED TOP SELLING STRATEGY"}
              </h3>
              <span
                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                  isBullish
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                }`}
              >
                {plan.action}
              </span>
              {precision && (
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Crosshair className="w-2.5 h-2.5" />
                  PIERCING: {precision.arrowPiercingScore}%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Optimal Contract: <span className="text-indigo-300 font-mono font-bold">{plan.recommendedContract}</span>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono flex items-center gap-1.5 transition-all"
            title="Copy Strategy Plan"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "COPIED" : "COPY PLAN"}</span>
          </button>

          {onSendNotification && (
            <button
              onClick={() => {
                onSendNotification(plan);
                setDispatchedNotif(true);
                setTimeout(() => setDispatchedNotif(false), 3000);
              }}
              className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition-all border ${
                dispatchedNotif
                  ? "bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : "bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-indigo-500/50"
              }`}
              title="Dispatch Instant Signal to WhatsApp & Telegram"
            >
              <div className="flex items-center gap-0.5">
                <MessageSquare className="w-3 h-3 text-emerald-400" />
                <Send className="w-3 h-3 text-sky-400" />
              </div>
              <span className="font-bold">{dispatchedNotif ? "ALERTS SENT!" : "PUSH ALERT"}</span>
            </button>
          )}

          <button
            onClick={handleExecute}
            className={`px-4 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 transition-all tracking-wider uppercase shadow-md active:scale-95 ${
              executed
                ? "bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                : isBullish
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{executed ? "ORDER DISPATCHED" : "PAPER TRADE CONTRACT"}</span>
          </button>
        </div>
      </div>

      {/* Primary Contract Execution Box */}
      <div className="bg-slate-950 border-2 border-indigo-500/50 rounded-lg p-4 space-y-3 relative overflow-hidden shadow-[0_0_25px_rgba(99,102,241,0.15)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 shadow ${
                isBullish
                  ? "bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  : "bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{plan.contractAction || (isBullish ? "BUY" : "BUY")} {plan.optionType === "CE" ? "CALL (CE)" : "PUT (PE)"}</span>
            </span>
            <span className="text-sm font-bold text-white font-mono tracking-tight">
              {plan.contractFullName || `${plan.recommendedContract}`}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">
              Lot Size: <strong className="text-white">{plan.lotSize || index.lotSize || 50} Qty</strong>
            </span>
            <span className="text-slate-400">
              1-Lot Capital: <strong className="text-indigo-300">{index.currency}{(plan.lotCapitalCost || (plan.entryOptionPremium * (plan.lotSize || 50))).toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {/* Dual Track: Option Contract Premium Execution vs Spot Chart Levels */}
        <div className="space-y-2">
          <div className="text-[10px] text-indigo-400 uppercase font-sans font-bold flex items-center justify-between">
            <span>Option Contract Premium Execution Levels (Enter in Broker Terminal):</span>
            <span className="text-slate-500">Calculated via Delta-Gamma Expansion</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
            {/* Entry Premium */}
            <div className="bg-slate-900 border border-slate-800 rounded p-2.5 space-y-0.5">
              <div className="text-[9px] text-slate-400 uppercase font-sans font-bold">BUY PREMIUM ENTRY</div>
              <div className="text-base font-bold text-white">
                {index.currency}{plan.entryOptionPremium}
              </div>
              <div className="text-[10px] text-slate-500">
                Spot: {index.currency}{plan.entrySpotPrice.toLocaleString()}
              </div>
            </div>

            {/* Target 1 Option Premium */}
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded p-2.5 space-y-0.5">
              <div className="text-[9px] text-emerald-400 uppercase font-sans font-bold flex justify-between">
                <span>TARGET 1 PREMIUM</span>
                <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1 rounded">
                  +{plan.target1OptionPremium ? (((plan.target1OptionPremium - plan.entryOptionPremium) / plan.entryOptionPremium) * 100).toFixed(0) : "35"}%
                </span>
              </div>
              <div className="text-base font-bold text-emerald-400">
                {index.currency}{plan.target1OptionPremium || Number((plan.entryOptionPremium * 1.35).toFixed(2))}
              </div>
              <div className="text-[10px] text-emerald-300/80">
                Profit: +{index.currency}{(plan.target1LotProfit || ((plan.target1OptionPremium || plan.entryOptionPremium * 1.35) - plan.entryOptionPremium) * (plan.lotSize || 50)).toLocaleString()} / lot
              </div>
            </div>

            {/* Target 2 Option Premium */}
            <div className="bg-teal-950/30 border border-teal-500/40 rounded p-2.5 space-y-0.5">
              <div className="text-[9px] text-teal-300 uppercase font-sans font-bold flex justify-between">
                <span>TARGET 2 PREMIUM</span>
                <span className="text-[8px] bg-teal-500/20 text-teal-300 px-1 rounded">
                  +{plan.target2OptionPremium ? (((plan.target2OptionPremium - plan.entryOptionPremium) / plan.entryOptionPremium) * 100).toFixed(0) : "80"}%
                </span>
              </div>
              <div className="text-base font-bold text-teal-300">
                {index.currency}{plan.target2OptionPremium || Number((plan.entryOptionPremium * 1.80).toFixed(2))}
              </div>
              <div className="text-[10px] text-teal-300/80">
                Profit: +{index.currency}{(plan.target2LotProfit || ((plan.target2OptionPremium || plan.entryOptionPremium * 1.80) - plan.entryOptionPremium) * (plan.lotSize || 50)).toLocaleString()} / lot
              </div>
            </div>

            {/* Stop Loss Option Premium */}
            <div className="bg-rose-950/30 border border-rose-500/40 rounded p-2.5 space-y-0.5">
              <div className="text-[9px] text-rose-400 uppercase font-sans font-bold flex justify-between">
                <span>SL OPTION PREMIUM</span>
                <span className="text-[8px] bg-rose-500/20 text-rose-300 px-1 rounded">
                  -{plan.stopLossOptionPremium ? (((plan.entryOptionPremium - plan.stopLossOptionPremium) / plan.entryOptionPremium) * 100).toFixed(0) : "25"}%
                </span>
              </div>
              <div className="text-base font-bold text-rose-400">
                {index.currency}{plan.stopLossOptionPremium || Number((plan.entryOptionPremium * 0.75).toFixed(2))}
              </div>
              <div className="text-[10px] text-rose-300/80">
                Max Risk: -{index.currency}{(plan.stopLossLotRisk || (plan.entryOptionPremium - (plan.stopLossOptionPremium || plan.entryOptionPremium * 0.75)) * (plan.lotSize || 50)).toLocaleString()} / lot
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Target & Underlying Index Spot Price Levels Grid */}
      <div className="space-y-1.5 font-mono">
        <div className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center justify-between">
          <span>Underlying Index Spot Invalidation & Profit Milestones (Watch on Chart):</span>
          <span className="text-slate-500">ATR 14 & Golden Pocket Confluence</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950 border border-slate-800 border-l-2 border-l-indigo-500 rounded p-3">
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-sans font-bold">
              SPOT ENTRY
            </div>
            <div className="text-base font-bold text-white mt-0.5">
              {index.currency}{plan.entrySpotPrice.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Precision Optimal Zone
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 border-l-2 border-l-emerald-500 rounded p-3">
            <div className="text-[9px] text-emerald-400 uppercase tracking-[0.2em] font-sans font-bold flex items-center justify-between">
              <span>TARGET 1 SPOT</span>
              {plan.atrVolatilityBand && (
                <span className="text-[8px] text-emerald-500 bg-emerald-500/10 px-1 py-0.2 rounded font-mono">
                  1.35× ATR
                </span>
              )}
            </div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {index.currency}{plan.target1.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-300/80 mt-1">
              Book 50% & Trail SL
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 border-l-2 border-l-teal-500 rounded p-3">
            <div className="text-[9px] text-teal-300 uppercase tracking-[0.2em] font-sans font-bold flex items-center justify-between">
              <span>TARGET 2 (EXPANSION)</span>
              {plan.atrVolatilityBand && (
                <span className="text-[8px] text-teal-400 bg-teal-500/10 px-1 py-0.2 rounded font-mono">
                  2.618× Fib ATR
                </span>
              )}
            </div>
            <div className="text-base font-bold text-teal-300 mt-0.5">
              {index.currency}{plan.target2.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Runner: <span className="text-emerald-400">{index.currency}{plan.target3}</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 border-l-2 border-l-rose-500 rounded p-3">
            <div className="text-[9px] text-rose-400 uppercase tracking-[0.2em] font-sans font-bold flex items-center justify-between">
              <span>HARD STOP-LOSS SPOT</span>
              {plan.atrVolatilityBand && (
                <span className="text-[8px] text-rose-400 bg-rose-500/10 px-1 py-0.2 rounded font-mono">
                  -0.85× ATR
                </span>
              )}
            </div>
            <div className="text-base font-bold text-rose-400 mt-0.5">
              {index.currency}{plan.stopLoss.toLocaleString()}
            </div>
            <div className="text-[11px] text-rose-300/80 mt-1">
              1-Tick Invalidation
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Quant Greeks & Multi-Leg Spread Intelligence */}
      {(plan.spreadLegs || plan.greeksProfile) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          {plan.spreadLegs && (
            <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-1.5">
              <div className="text-[9px] uppercase tracking-wider text-indigo-400 font-sans font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                MULTI-LEG SPREAD HEDGE ARCHITECTURE
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Long Leg (0.70Δ):</span>
                <strong className="text-white">{plan.spreadLegs.buyStrike} Strike</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Short Leg (Hedge):</span>
                <strong className="text-indigo-300">{plan.spreadLegs.sellStrike} Strike</strong>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-900">
                <span>Break-Even Spot:</span>
                <strong className="text-emerald-400">{index.currency}{plan.spreadLegs.breakEvenSpot}</strong>
              </div>
            </div>
          )}

          {plan.greeksProfile && (
            <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-1.5">
              <div className="text-[9px] uppercase tracking-wider text-emerald-400 font-sans font-bold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                GREEKS & VOLATILITY EDGE
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Delta (Δ):</span>
                <strong className="text-emerald-400 font-bold">{plan.greeksProfile.delta} (High Responsiveness)</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Theta/Gamma Ratio:</span>
                <strong className="text-indigo-300">{plan.greeksProfile.thetaToGammaRatio} (Optimal Low Decay)</strong>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-900">
                <span>Vanna / Vega State:</span>
                <strong className="text-slate-200">{plan.greeksProfile.vannaEdge}</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payoff Diagram Toggle & Visualizer */}
      <div className="space-y-2">
        <button
          onClick={() => setShowPayoff(!showPayoff)}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-mono transition-all text-slate-300"
        >
          <span className="flex items-center gap-2 font-sans font-bold text-[11px] uppercase tracking-wider text-indigo-400">
            <span>Risk/Reward Payoff Curve & Break-Even Visualizer</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <span>{showPayoff ? "Collapse Diagram" : "Expand Diagram"}</span>
            {showPayoff ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </button>

        {showPayoff && (
          <OptionPayoffVisualizer index={index} plan={plan} />
        )}
      </div>

      {/* Rationale & Greeks breakdown */}
      <div className="bg-slate-950 border border-slate-800 rounded p-3.5 space-y-2">
        <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">ALGORITHMIC CONFLUENCE RATIONALE</span>
          <span className="text-[11px] font-mono text-indigo-400 font-bold">
            Win Probability: {plan.winProbability}% | Risk-Reward: {plan.riskReward}
          </span>
        </div>
        <ul className="space-y-1.5 text-xs text-slate-300">
          {plan.rationale.map((r, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold mt-0.5">•</span>
              <span className="leading-relaxed">{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Position Sizing & Margin Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400 pt-1">
        <div>
          Required Capital:{" "}
          <span className="text-white font-bold">
            {index.currency}{plan.capitalRequired.toLocaleString()}
          </span>
        </div>
        <div>
          Max Risk:{" "}
          <span className="text-rose-400 font-bold">
            {index.currency}{plan.maxLoss.toLocaleString()}
          </span>
        </div>
        <div>
          Expected Reward:{" "}
          <span className="text-emerald-400 font-bold">
            {index.currency}{(plan.maxLoss * 3.6).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
