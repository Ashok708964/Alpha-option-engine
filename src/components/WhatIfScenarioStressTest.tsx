import React, { useState, useMemo } from "react";
import {
  IndexInfo,
  StrategyConfluence,
  ActionableTradePlan,
  WhatIfStressScenario,
  WhatIfSimulationResult,
} from "../types";
import {
  PRESET_WHAT_IF_SCENARIOS,
  simulateWhatIfStressScenario,
} from "../utils/quantEngine";
import {
  Sliders,
  AlertTriangle,
  Flame,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Zap,
  Radio,
  Crosshair,
  Gauge,
  ArrowRight,
  Sparkles,
  HelpCircle,
  RefreshCcw,
  ShieldAlert,
  Layers,
  ChevronDown,
  ChevronUp,
  Activity,
  Cpu,
  Clock,
  Lock,
} from "lucide-react";

interface WhatIfScenarioStressTestProps {
  index: IndexInfo;
  confluence: StrategyConfluence;
  plan: ActionableTradePlan | null;
  currentHftDelta?: number;
}

export const WhatIfScenarioStressTest: React.FC<WhatIfScenarioStressTestProps> = ({
  index,
  confluence,
  plan,
  currentHftDelta = 14200,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("vol_surge_central_bank");
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Custom scenario state
  const [customVolShock, setCustomVolShock] = useState<number>(35);
  const [customSpotShock, setCustomSpotShock] = useState<number>(-1.5);
  const [customCvdShock, setCustomCvdShock] = useState<number>(-35000);
  const [customSentimentShift, setCustomSentimentShift] = useState<number>(-40);
  const [customTimeHorizon, setCustomTimeHorizon] = useState<number>(30);

  // Active Scenario definition
  const activeScenario: WhatIfStressScenario = useMemo(() => {
    if (isCustomMode) {
      return {
        id: "custom_what_if",
        name: "Custom Interactive 30-Min Stress Scenario",
        category: "CUSTOM",
        description: "User-calibrated volatility shock, spot displacement, order flow CVD sweep, and macro sentiment shift.",
        timeHorizonMinutes: customTimeHorizon,
        volatilityShockPct: customVolShock,
        spotPriceShockPct: customSpotShock,
        orderFlowCvdShock: customCvdShock,
        groundedSentimentShift: customSentimentShift,
        liquiditySpreadMultiplier: Math.abs(customVolShock) > 40 ? 3.0 : 1.8,
      };
    }
    const found = PRESET_WHAT_IF_SCENARIOS.find((s) => s.id === selectedScenarioId);
    return found || PRESET_WHAT_IF_SCENARIOS[0];
  }, [
    isCustomMode,
    selectedScenarioId,
    customVolShock,
    customSpotShock,
    customCvdShock,
    customSentimentShift,
    customTimeHorizon,
  ]);

  // Compute real-time simulation result
  const simulation: WhatIfSimulationResult = useMemo(() => {
    return simulateWhatIfStressScenario(activeScenario, confluence, index, plan, currentHftDelta);
  }, [activeScenario, confluence, index, plan, currentHftDelta]);

  const isFragile = simulation.confluenceResilienceRating === "FRAGILE_TO_VOLATILITY";
  const isModerate = simulation.confluenceResilienceRating === "MODERATE_SENSITIVITY";
  const isResilient = simulation.confluenceResilienceRating === "HIGH_RESILIENCE";

  const isStopHit = simulation.isStopLossTriggered;
  const isTargetHit = simulation.isTarget1Triggered;

  return (
    <div
      id="what-if-scenario-stress-test"
      className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-5 font-mono"
    >
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-rose-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            <Sliders className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white uppercase tracking-tight font-sans">
                What-If Scenario Stress Test & Volatility Shock
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                <Clock className="w-3 h-3 text-purple-400" />
                30-MIN HORIZON
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Simulate real-time confluence score shifts under volatility spikes, central bank rate shocks, and macroeconomic events.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCustomMode(!isCustomMode)}
            className={`px-3 py-1.5 rounded text-xs font-sans font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
              isCustomMode
                ? "bg-purple-600 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isCustomMode ? "Active: Custom Sandbox" : "Custom Sliders Sandbox"}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Scenario Selection Pills */}
          {!isCustomMode ? (
            <div className="space-y-2">
              <div className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Select 30-Minute Macro & Volatility Shock Event Scenario:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {PRESET_WHAT_IF_SCENARIOS.map((scenario) => {
                  const isSelected = selectedScenarioId === scenario.id;
                  const isHawkishOrBear = scenario.spotPriceShockPct < 0;
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => setSelectedScenarioId(scenario.id)}
                      className={`text-left p-3 rounded-lg border transition-all relative overflow-hidden ${
                        isSelected
                          ? "bg-purple-950/40 border-purple-500/70 shadow-[0_0_18px_rgba(168,85,247,0.25)] ring-1 ring-purple-500/50"
                          : "bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`text-xs font-bold font-sans ${
                            isSelected ? "text-purple-200" : "text-slate-200"
                          }`}
                        >
                          {scenario.name}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            isHawkishOrBear
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          }`}
                        >
                          {scenario.spotPriceShockPct > 0 ? "+" : ""}
                          {scenario.spotPriceShockPct}% Spot
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans line-clamp-2 leading-relaxed">
                        {scenario.description}
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          IV: {scenario.volatilityShockPct > 0 ? "+" : ""}{scenario.volatilityShockPct}%
                        </span>
                        <span>CVD: {scenario.orderFlowCvdShock > 0 ? "+" : ""}{scenario.orderFlowCvdShock.toLocaleString()}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Custom Interactive Sliders Box */
            <div className="bg-slate-950 border border-purple-500/40 rounded-lg p-4 space-y-4 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-purple-300 uppercase font-sans flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  Custom Scenario Parameter Calibration
                </span>
                <button
                  onClick={() => {
                    setCustomVolShock(0);
                    setCustomSpotShock(0);
                    setCustomCvdShock(0);
                    setCustomSentimentShift(0);
                  }}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-sans"
                >
                  <RefreshCcw className="w-3 h-3" />
                  Reset to Zero Shock
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* Volatility Shock Slider */}
                <div className="space-y-1.5 bg-slate-900/90 border border-slate-800 rounded p-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">IV Volatility Shock:</span>
                    <span className={`font-bold ${customVolShock >= 0 ? "text-amber-400" : "text-cyan-400"}`}>
                      {customVolShock > 0 ? "+" : ""}{customVolShock}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="100"
                    step="5"
                    value={customVolShock}
                    onChange={(e) => setCustomVolShock(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-sans">
                    <span>-40% Vol Crush</span>
                    <span>+100% Shock</span>
                  </div>
                </div>

                {/* Spot Price Displacement Slider */}
                <div className="space-y-1.5 bg-slate-900/90 border border-slate-800 rounded p-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Spot Price Move:</span>
                    <span className={`font-bold ${customSpotShock >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {customSpotShock > 0 ? "+" : ""}{customSpotShock}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-4.0"
                    max="4.0"
                    step="0.2"
                    value={customSpotShock}
                    onChange={(e) => setCustomSpotShock(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-sans">
                    <span>-4.0% Crash</span>
                    <span>+4.0% Rally</span>
                  </div>
                </div>

                {/* Order Flow CVD Shock Slider */}
                <div className="space-y-1.5 bg-slate-900/90 border border-slate-800 rounded p-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Order Flow CVD Shock:</span>
                    <span className={`font-bold ${customCvdShock >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {customCvdShock > 0 ? "+" : ""}{customCvdShock.toLocaleString()} lots
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-75000"
                    max="75000"
                    step="5000"
                    value={customCvdShock}
                    onChange={(e) => setCustomCvdShock(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-sans">
                    <span>-75k Dump</span>
                    <span>+75k Bid Sweep</span>
                  </div>
                </div>

                {/* Macro Sentiment Shift Slider */}
                <div className="space-y-1.5 bg-slate-900/90 border border-slate-800 rounded p-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Macro Sentiment Shift:</span>
                    <span className={`font-bold ${customSentimentShift >= 0 ? "text-indigo-300" : "text-amber-400"}`}>
                      {customSentimentShift > 0 ? "+" : ""}{customSentimentShift} pts
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-60"
                    max="60"
                    step="5"
                    value={customSentimentShift}
                    onChange={(e) => setCustomSentimentShift(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-sans">
                    <span>-60 Bear News</span>
                    <span>+60 Bull News</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Core Simulation Outcome Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 1. Confluence Delta & Resilience Meter */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300 uppercase font-sans flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-amber-400" />
                  Confluence Resilience
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${
                    isResilient
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : isModerate
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                  }`}
                >
                  {simulation.confluenceResilienceRating.replace(/_/g, " ")}
                </span>
              </div>

              {/* Before vs After Score Cards */}
              <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-lg p-3">
                <div className="text-center flex-1">
                  <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">Baseline</div>
                  <div className="text-xl font-bold text-white mt-0.5">
                    {simulation.baselineConfluenceScore}
                    <span className="text-xs text-slate-500">/100</span>
                  </div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5">{confluence.signal.replace(/_/g, " ")}</div>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-purple-400" />
                  <span
                    className={`text-[11px] font-bold mt-1 ${
                      simulation.confluenceDelta > 0
                        ? "text-emerald-400"
                        : simulation.confluenceDelta < 0
                        ? "text-rose-400"
                        : "text-slate-400"
                    }`}
                  >
                    {simulation.confluenceDelta > 0 ? "+" : ""}
                    {simulation.confluenceDelta}
                  </span>
                </div>

                <div className="text-center flex-1 bg-slate-950 border border-slate-800 rounded p-1.5">
                  <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">Simulated</div>
                  <div
                    className={`text-xl font-bold mt-0.5 ${
                      simulation.simulatedConfluenceScore >= 75
                        ? "text-emerald-400"
                        : simulation.simulatedConfluenceScore >= 50
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {simulation.simulatedConfluenceScore}
                    <span className="text-xs text-slate-500">/100</span>
                  </div>
                  <div
                    className={`text-[9px] font-bold truncate mt-0.5 ${
                      simulation.simulatedConfluenceScore >= 75
                        ? "text-emerald-400"
                        : simulation.simulatedConfluenceScore >= 50
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {simulation.simulatedStatus.replace(/_/g, " ")}
                  </div>
                </div>
              </div>

              {/* Progress bar visual comparison */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-400 font-sans">
                  <span>Confluence Threshold Shift</span>
                  <span>{simulation.simulatedConfluenceScore}% Remaining</span>
                </div>
                <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
                  {/* Baseline marker */}
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-white z-10"
                    style={{ left: `${simulation.baselineConfluenceScore}%` }}
                    title={`Baseline: ${simulation.baselineConfluenceScore}%`}
                  ></div>
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      simulation.simulatedConfluenceScore >= 75
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                        : simulation.simulatedConfluenceScore >= 50
                        ? "bg-gradient-to-r from-amber-600 to-amber-400"
                        : "bg-gradient-to-r from-rose-600 to-rose-400"
                    }`}
                    style={{ width: `${simulation.simulatedConfluenceScore}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-sans">
                  <span>0 (Invalidated)</span>
                  <span>50 (Chop)</span>
                  <span>80+ (Laser Lock)</span>
                </div>
              </div>
            </div>

            {/* 2. Trade Strategy & Option Premium Stress Impact */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300 uppercase font-sans flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Contract Payoff & Premium Shock
                </span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded font-mono font-bold">
                  {plan?.contractFullName || plan?.recommendedContract || "NIFTY 24500 CE"}
                </span>
              </div>

              {/* Exact Contract To Buy/Sell High-Visibility Pill */}
              <div className="bg-slate-900 border border-slate-800 rounded p-2.5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[9px] text-slate-400 uppercase font-sans font-bold">EXECUTION CONTRACT</div>
                  <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.2 text-[9px] rounded font-bold ${plan?.direction === "BULLISH" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                      {plan?.contractAction || (plan?.direction === "BULLISH" ? "BUY" : "BUY")}
                    </span>
                    <span>{plan?.contractFullName || plan?.recommendedContract}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-slate-400 uppercase font-sans font-bold">LOT SIZE</div>
                  <div className="text-xs font-bold text-indigo-300 font-mono">
                    {plan?.lotSize || index.lotSize || 50} Qty
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between bg-slate-900/90 border border-slate-800 rounded p-2">
                  <span className="text-slate-400 font-sans">Simulated Spot Price:</span>
                  <div className="text-right">
                    <span className="text-white font-bold">{index.currency}{simulation.simulatedSpotPrice.toLocaleString()}</span>
                    <span
                      className={`ml-1.5 text-[10px] font-bold ${
                        activeScenario.spotPriceShockPct >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      ({activeScenario.spotPriceShockPct > 0 ? "+" : ""}{activeScenario.spotPriceShockPct}%)
                    </span>
                  </div>
                </div>

                <div className="flex justify-between bg-slate-900/90 border border-slate-800 rounded p-2">
                  <span className="text-slate-400 font-sans">Simulated Option Premium:</span>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] mr-1 font-mono">Base: {index.currency}{simulation.baselineOptionPremium} →</span>
                    <span className="text-white font-bold">{index.currency}{simulation.simulatedOptionPremium}</span>
                    <span
                      className={`ml-1.5 text-[10px] font-bold ${
                        simulation.optionPremiumDeltaPct >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      ({simulation.optionPremiumDeltaPct > 0 ? "+" : ""}{simulation.optionPremiumDeltaPct}%)
                    </span>
                  </div>
                </div>

                <div className="flex justify-between bg-slate-900/90 border border-slate-800 rounded p-2">
                  <span className="text-slate-400 font-sans">Estimated PnL ({plan?.lotSize || index.lotSize || 50} Qty Lot):</span>
                  <span
                    className={`font-bold ${
                      simulation.simulatedEstimatedPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {simulation.simulatedEstimatedPnl >= 0 ? "+" : ""}
                    {index.currency}{simulation.simulatedEstimatedPnl.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between bg-slate-900/90 border border-slate-800 rounded p-2">
                  <span className="text-slate-400 font-sans">Gamma Risk Level:</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      simulation.simulatedGammaRisk === "CATASTROPHIC"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : simulation.simulatedGammaRisk === "HIGH_GAMMA_CLIFF"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    }`}
                  >
                    {simulation.simulatedGammaRisk.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Status Alert Pills */}
              {isStopHit && (
                <div className="bg-rose-500/15 border border-rose-500/50 rounded p-2 text-rose-300 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span><strong>Stop-Loss Breached:</strong> Spot ({index.currency}{simulation.simulatedSpotPrice}) violates the invalidation trigger.</span>
                </div>
              )}
              {isTargetHit && (
                <div className="bg-emerald-500/15 border border-emerald-500/50 rounded p-2 text-emerald-300 text-xs flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Target 1 Milestone Hit:</strong> Spot reaches initial profit milestone ({index.currency}{plan?.target1}).</span>
                </div>
              )}
            </div>

            {/* 3. Institutional Playbook & Recommended Defensive Hedge */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300 uppercase font-sans flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  Institutional Defensive Playbook
                </span>
                <span className="text-[10px] text-slate-500">Auto-Hedge Rules</span>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-1">
                  <div className="text-[10px] text-amber-400 uppercase font-sans font-bold">Execution Directive:</div>
                  <p className="text-xs text-slate-200 font-sans leading-relaxed">
                    {simulation.institutionalActionAdvice}
                  </p>
                </div>

                <div className="bg-purple-950/30 border border-purple-500/30 rounded p-3 space-y-1">
                  <div className="text-[10px] text-purple-300 uppercase font-sans font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-purple-400" />
                    Recommended Derivative Hedge:
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {simulation.recommendedDefensiveHedge}
                  </p>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 font-mono">
                  <span>Simulated IV: <strong className="text-white">{simulation.simulatedIv}%</strong></span>
                  <span>Simulated Delta: <strong className="text-white">{simulation.simulatedDelta}</strong></span>
                  <span>Vega PnL: <strong className={simulation.simulatedVegaPnlImpact >= 0 ? "text-emerald-400" : "text-rose-400"}>{index.currency}{simulation.simulatedVegaPnlImpact}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Detailed 6-Factor Confluence Shift Breakdown Matrix */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase font-sans flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                6-Factor Confluence Component Impact Matrix
              </span>
              <span className="text-[10px] text-slate-500 font-sans">
                Real-time recalculation of each underlying algorithmic sub-factor
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Factor 1: HFT Order Flow */}
              <div className="bg-slate-900/90 border border-slate-800 rounded p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-sans font-bold text-slate-300 flex items-center gap-1.5 text-[11px]">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    1. HFT CVD Order Flow
                  </span>
                  <span
                    className={`font-bold text-[11px] ${
                      simulation.factorShifts.hftDeltaScore.delta >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {simulation.factorShifts.hftDeltaScore.before} → {simulation.factorShifts.hftDeltaScore.after} ({simulation.factorShifts.hftDeltaScore.delta > 0 ? "+" : ""}{simulation.factorShifts.hftDeltaScore.delta})
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-normal">
                  {simulation.factorShifts.hftDeltaScore.rationale}
                </p>
              </div>

              {/* Factor 2: Smart Money Concepts */}
              <div className="bg-slate-900/90 border border-slate-800 rounded p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-sans font-bold text-slate-300 flex items-center gap-1.5 text-[11px]">
                    <Crosshair className="w-3.5 h-3.5 text-purple-400" />
                    2. SMC FVG & Order Block
                  </span>
                  <span
                    className={`font-bold text-[11px] ${
                      simulation.factorShifts.smcStructureScore.delta >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {simulation.factorShifts.smcStructureScore.before} → {simulation.factorShifts.smcStructureScore.after} ({simulation.factorShifts.smcStructureScore.delta > 0 ? "+" : ""}{simulation.factorShifts.smcStructureScore.delta})
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-normal">
                  {simulation.factorShifts.smcStructureScore.rationale}
                </p>
              </div>

              {/* Factor 3: ZigZag Swing Wave */}
              <div className="bg-slate-900/90 border border-slate-800 rounded p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-sans font-bold text-slate-300 flex items-center gap-1.5 text-[11px]">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    3. ZigZag Wave Momentum
                  </span>
                  <span
                    className={`font-bold text-[11px] ${
                      simulation.factorShifts.zigzagMomentumScore.delta >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {simulation.factorShifts.zigzagMomentumScore.before} → {simulation.factorShifts.zigzagMomentumScore.after} ({simulation.factorShifts.zigzagMomentumScore.delta > 0 ? "+" : ""}{simulation.factorShifts.zigzagMomentumScore.delta})
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-normal">
                  {simulation.factorShifts.zigzagMomentumScore.rationale}
                </p>
              </div>

              {/* Factor 4: Greeks & Vega/Gamma */}
              <div className="bg-slate-900/90 border border-slate-800 rounded p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-sans font-bold text-slate-300 flex items-center gap-1.5 text-[11px]">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    4. Greeks & Vega/Gamma
                  </span>
                  <span
                    className={`font-bold text-[11px] ${
                      simulation.factorShifts.greeksVegaGammaScore.delta >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {simulation.factorShifts.greeksVegaGammaScore.before} → {simulation.factorShifts.greeksVegaGammaScore.after} ({simulation.factorShifts.greeksVegaGammaScore.delta > 0 ? "+" : ""}{simulation.factorShifts.greeksVegaGammaScore.delta})
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-normal">
                  {simulation.factorShifts.greeksVegaGammaScore.rationale}
                </p>
              </div>

              {/* Factor 5: OI Max Pain */}
              <div className="bg-slate-900/90 border border-slate-800 rounded p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-sans font-bold text-slate-300 flex items-center gap-1.5 text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    5. OI & Max Pain Strike
                  </span>
                  <span
                    className={`font-bold text-[11px] ${
                      simulation.factorShifts.oiMaxPainScore.delta >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {simulation.factorShifts.oiMaxPainScore.before} → {simulation.factorShifts.oiMaxPainScore.after} ({simulation.factorShifts.oiMaxPainScore.delta > 0 ? "+" : ""}{simulation.factorShifts.oiMaxPainScore.delta})
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-normal">
                  {simulation.factorShifts.oiMaxPainScore.rationale}
                </p>
              </div>

              {/* Factor 6: Grounded Sentiment */}
              <div className="bg-slate-900/90 border border-slate-800 rounded p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-sans font-bold text-slate-300 flex items-center gap-1.5 text-[11px]">
                    <Radio className="w-3.5 h-3.5 text-rose-400" />
                    6. Macro News Sentiment
                  </span>
                  <span
                    className={`font-bold text-[11px] ${
                      simulation.factorShifts.macroSentimentScore.delta >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {simulation.factorShifts.macroSentimentScore.before} → {simulation.factorShifts.macroSentimentScore.after} ({simulation.factorShifts.macroSentimentScore.delta > 0 ? "+" : ""}{simulation.factorShifts.macroSentimentScore.delta})
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-normal">
                  {simulation.factorShifts.macroSentimentScore.rationale}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
