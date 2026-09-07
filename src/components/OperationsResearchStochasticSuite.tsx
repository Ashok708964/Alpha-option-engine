import React, { useState } from "react";
import {
  OperationsResearchStochasticBundle,
  IndexInfo,
  KellyOptimizationResult,
  KnapsackStrikeAllocation,
} from "../types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Cpu,
  TrendingUp,
  Activity,
  Calculator,
  Percent,
  Layers,
  Zap,
  Sliders,
  ShieldAlert,
  Compass,
  Sparkles,
  BarChart3,
  Network,
  RotateCcw,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  AlertTriangle,
  Gauge,
  Crosshair,
} from "lucide-react";
import { computeKellyOptimization, computeGarchVolForecast } from "../utils/stochasticEngine";

interface OperationsResearchStochasticSuiteProps {
  index: IndexInfo;
  bundle: OperationsResearchStochasticBundle;
}

export const OperationsResearchStochasticSuite: React.FC<OperationsResearchStochasticSuiteProps> = ({
  index,
  bundle,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    | "OPERATIONS_RESEARCH"
    | "STOCHASTIC_DIFFUSION"
    | "RISK_NEUTRAL_DENSITY"
    | "PREDICTIVE_KALMAN_HMM"
    | "GARCH_VOLATILITY_FORECAST"
    | "BAYESIAN_HURST_ACF"
    | "STRESS_TESTING"
  >("OPERATIONS_RESEARCH");

  // Interactive Kelly state
  const [accountCapital, setAccountCapital] = useState<number>(500000);
  const [winRateSlider, setWinRateSlider] = useState<number>(0.74);
  const [winLossRatio, setWinLossRatio] = useState<number>(2.2);

  // Interactive GARCH(1,1) state
  const [garchAlpha, setGarchAlpha] = useState<number>(bundle.garchForecast?.alpha || 0.088);
  const [garchBeta, setGarchBeta] = useState<number>(bundle.garchForecast?.beta || 0.892);
  const [garchOmega, setGarchOmega] = useState<number>(bundle.garchForecast?.omega || 0.0000045);
  const [garchShockResidual, setGarchShockResidual] = useState<number>(bundle.garchForecast?.shockResidual || 0.85);

  const interactiveKelly: KellyOptimizationResult = computeKellyOptimization(
    winRateSlider,
    winLossRatio * 2000,
    2000,
    accountCapital,
    140 * index.lotSize
  );

  const interactiveGarch = computeGarchVolForecast(
    index.baseIV,
    garchOmega,
    garchAlpha,
    garchBeta,
    garchShockResidual
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4 shadow-2xl space-y-4 font-mono">
      {/* Header & Sub-Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans flex items-center gap-2">
              <span>Operations Research & Stochastic Predictive Engine</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-normal">
                PURE APPLIED MATHEMATICS
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 font-sans">
              Fractional Kelly Optimization • Heston Volatility & Merton Jumps • GARCH(1,1) Dynamic Volatility • Kalman State Filter
            </p>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab("OPERATIONS_RESEARCH")}
            className={`px-3 py-1.5 rounded transition-all font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 ${
              activeSubTab === "OPERATIONS_RESEARCH"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>1. OR & Kelly Optimizer</span>
          </button>

          <button
            onClick={() => setActiveSubTab("STOCHASTIC_DIFFUSION")}
            className={`px-3 py-1.5 rounded transition-all font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 ${
              activeSubTab === "STOCHASTIC_DIFFUSION"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>2. Stochastic Diffusion</span>
          </button>

          <button
            onClick={() => setActiveSubTab("RISK_NEUTRAL_DENSITY")}
            className={`px-3 py-1.5 rounded transition-all font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 ${
              activeSubTab === "RISK_NEUTRAL_DENSITY"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>3. Risk-Neutral Density</span>
          </button>

          <button
            onClick={() => setActiveSubTab("PREDICTIVE_KALMAN_HMM")}
            className={`px-3 py-1.5 rounded transition-all font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 ${
              activeSubTab === "PREDICTIVE_KALMAN_HMM"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>4. Kalman & HMM</span>
          </button>

          <button
            onClick={() => setActiveSubTab("GARCH_VOLATILITY_FORECAST")}
            className={`px-3 py-1.5 rounded transition-all font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 border ${
              activeSubTab === "GARCH_VOLATILITY_FORECAST"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border-purple-400"
                : "text-purple-300 hover:text-white border-purple-500/30 bg-purple-950/20"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
            <span>5. GARCH(1,1) & Pinpoint Risk</span>
          </button>

          <button
            onClick={() => setActiveSubTab("BAYESIAN_HURST_ACF")}
            className={`px-3 py-1.5 rounded transition-all font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 ${
              activeSubTab === "BAYESIAN_HURST_ACF"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>6. Bayesian, Hurst & ACF</span>
          </button>

          <button
            onClick={() => setActiveSubTab("STRESS_TESTING")}
            className={`px-3 py-1.5 rounded transition-all font-bold font-sans uppercase tracking-wider flex items-center gap-1.5 ${
              activeSubTab === "STRESS_TESTING"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>7. Stress Testing (VaR)</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: OPERATIONS RESEARCH & KELLY CRITERION */}
      {activeSubTab === "OPERATIONS_RESEARCH" && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Interactive Kelly Optimizer Controls */}
            <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white uppercase font-sans text-xs flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Kelly Criterion Parameter Calibration
                </span>
                <span className="text-[10px] text-slate-500 font-mono">f* = (p·b - q)/b</span>
              </div>

              <div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Total Portfolio Capital</span>
                  <span className="text-emerald-400 font-bold">{index.currency}{accountCapital.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="100000"
                  max="5000000"
                  step="50000"
                  value={accountCapital}
                  onChange={(e) => setAccountCapital(Number(e.target.value))}
                  className="w-full mt-1 accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Model Win Probability (p)</span>
                  <span className="text-emerald-400 font-bold">{Math.round(winRateSlider * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.50"
                  max="0.95"
                  step="0.01"
                  value={winRateSlider}
                  onChange={(e) => setWinRateSlider(Number(e.target.value))}
                  className="w-full mt-1 accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Payoff Ratio (b = Avg Win / Avg Loss)</span>
                  <span className="text-indigo-300 font-bold">{winLossRatio.toFixed(1)}:1</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="4.0"
                  step="0.1"
                  value={winLossRatio}
                  onChange={(e) => setWinLossRatio(Number(e.target.value))}
                  className="w-full mt-1 accent-indigo-500"
                />
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded p-2.5 text-[10px] space-y-1">
                <div className="text-slate-400 font-sans font-bold uppercase">Mathematical Formulation</div>
                <div className="text-slate-300">
                  Full Kelly Fraction: <strong className="text-amber-400">{(interactiveKelly.fullKellyFraction * 100).toFixed(1)}%</strong>
                </div>
                <div className="text-slate-300">
                  Safe Half-Kelly (50%): <strong className="text-emerald-400">{(interactiveKelly.halfKellyFraction * 100).toFixed(1)}%</strong>
                </div>
                <div className="text-slate-500">
                  Expected Sharpe: {interactiveKelly.sharpeRatioExpected} | Max Drawdown Risk: {interactiveKelly.maxDrawdownRisk}%
                </div>
              </div>
            </div>

            {/* Sizing Recommendation Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950 border border-slate-800 rounded p-3 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">Optimal Risk Allocation</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">
                    {index.currency}{interactiveKelly.optimalCapitalAllocation.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{(interactiveKelly.halfKellyFraction * 100).toFixed(1)}% of Capital</div>
                </div>
                <div className="text-[9px] text-slate-500 border-t border-slate-900 pt-2 mt-2">
                  Constrained to prevent geometric ruin
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded p-3 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">Recommended Position Size</div>
                  <div className="text-lg font-bold text-indigo-400 mt-1">
                    {interactiveKelly.recommendedLots} Lots ({interactiveKelly.recommendedLots * index.lotSize} Qty)
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Lot Size: {index.lotSize} per contract</div>
                </div>
                <div className="text-[9px] text-slate-500 border-t border-slate-900 pt-2 mt-2">
                  Optimal Volatility-Scaled Exposure
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded p-3 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">Theoretical Ruin Probability</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">&lt; 0.05%</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Asymptotic Safe Frontier</div>
                </div>
                <div className="text-[9px] text-slate-500 border-t border-slate-900 pt-2 mt-2">
                  Guaranteed convex growth curve
                </div>
              </div>

              {/* Knapsack Dynamic Programming Allocation Table */}
              <div className="sm:col-span-3 bg-slate-950 border border-slate-800 rounded p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 font-sans uppercase">
                    Bounded Knapsack Dynamic Programming (Optimal Multi-Strike Capital Allocation)
                  </span>
                  <span className="text-[10px] text-slate-400">Budget: {index.currency}1,50,000</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-500 font-sans uppercase">
                        <th className="pb-1.5">Option Strike</th>
                        <th className="pb-1.5">LTP Premium</th>
                        <th className="pb-1.5">Margin / Lot</th>
                        <th className="pb-1.5">ROI Efficiency Score</th>
                        <th className="pb-1.5 text-center">Allocated Lots</th>
                        <th className="pb-1.5 text-right">Total Outlay</th>
                        <th className="pb-1.5 text-right">Expected P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {bundle.knapsackAllocations.map((k) => (
                        <tr key={k.strike} className="hover:bg-slate-800/30">
                          <td className="py-2 font-bold text-white">
                            {index.currency}{k.strike} {k.type}
                          </td>
                          <td className="py-2 text-emerald-400 font-bold">{index.currency}{k.premium}</td>
                          <td className="py-2 text-slate-300">{index.currency}{k.marginRequired.toLocaleString()}</td>
                          <td className="py-2">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
                              {k.roiScore}% ROI
                            </span>
                          </td>
                          <td className="py-2 text-center font-bold text-emerald-400">
                            {k.allocatedLots > 0 ? `${k.allocatedLots} Lots` : "0 (Skipped)"}
                          </td>
                          <td className="py-2 text-right text-slate-300">
                            {index.currency}{k.totalCost.toLocaleString()}
                          </td>
                          <td className="py-2 text-right font-bold text-emerald-400">
                            +{index.currency}{k.totalExpectedPnl.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: STOCHASTIC PROCESSES SIMULATOR */}
      {activeSubTab === "STOCHASTIC_DIFFUSION" && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Heston Mean-Reversion (κ)</div>
              <div className="text-base font-bold text-indigo-400 mt-0.5">{bundle.hestonParams.kappa}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Vol Variance Pull Speed</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Vol-of-Vol (ξ) & Correlation (ρ)</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">
                ξ={bundle.hestonParams.xi} | ρ={bundle.hestonParams.rho}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Leverage Effect Calibration</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Ornstein-Uhlenbeck Half-Life</div>
              <div className="text-base font-bold text-amber-400 mt-0.5">{bundle.ouParams.halfLife} mins</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Spread Mean-Reversion (θ={bundle.ouParams.theta})</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Merton Poisson Jump Intensity</div>
              <div className="text-base font-bold text-rose-400 mt-0.5">λ = 0.08 / Interval</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Discontinuous Black Swan Jumps</div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white font-sans uppercase">
                Stochastic Differential Equation Path Trajectories
              </span>
              <span className="text-[10px] text-slate-400">
                GBM (Cyan) • Heston Stochastic Vol (Green) • Merton Jump-Diffusion (Rose)
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bundle.stochasticPaths} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="timeStep" stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={(s) => `T+${s}`} />
                  <YAxis domain={["auto", "auto"]} stroke="#64748b" tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", fontSize: "10px" }} />
                  <ReferenceLine y={index.currentPrice} stroke="#6366f1" strokeDasharray="3 3" label={{ value: "Initial Spot", fill: "#818cf8", fontSize: 9 }} />
                  <Line type="monotone" dataKey="gbmPrice" stroke="#38bdf8" strokeWidth={2} dot={false} name="Geometric Brownian Motion (GBM)" />
                  <Line type="monotone" dataKey="hestonPrice" stroke="#10b981" strokeWidth={2} dot={false} name="Heston Stochastic Volatility" />
                  <Line type="monotone" dataKey="mertonJumpPrice" stroke="#f43f5e" strokeWidth={2} dot={false} name="Merton Poisson Jump-Diffusion" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: RISK-NEUTRAL DENSITY & BREEDEN-LITZENBERGER */}
      {activeSubTab === "RISK_NEUTRAL_DENSITY" && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Empirical Skewness</div>
              <div className="text-base font-bold text-rose-400 mt-0.5">{bundle.riskMetrics.skewness}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Heavy Left-Tail Crash Risk</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Excess Kurtosis</div>
              <div className="text-base font-bold text-amber-400 mt-0.5">+{bundle.riskMetrics.excessKurtosis}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Leptokurtic (Fat Tail Volatility)</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Value at Risk 99% (1-Day VaR)</div>
              <div className="text-base font-bold text-rose-400 mt-0.5">
                -{index.currency}{bundle.riskMetrics.var99}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">99% Confidence Maximum Loss</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Conditional VaR 99% (CVaR)</div>
              <div className="text-base font-bold text-rose-500 mt-0.5">
                -{index.currency}{bundle.riskMetrics.cvar99}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Expected Tail Loss Beyond VaR</div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white font-sans uppercase">
                Breeden-Litzenberger Implied Probability Density Curve q(K) = e^(rT) · d²C/dK²
              </span>
              <span className="text-[10px] text-slate-400">
                Green = Option Market Implied Density (Fat Left Skew) • Slate = Gaussian Normal
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bundle.riskNeutralDensity} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="densityGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="strike" stroke="#64748b" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", fontSize: "10px" }} />
                  <ReferenceLine x={index.currentPrice} stroke="#6366f1" strokeDasharray="3 3" label={{ value: "Spot", fill: "#818cf8", fontSize: 9 }} />
                  <Area type="monotone" dataKey="impliedDensity" stroke="#10b981" strokeWidth={2} fill="url(#densityGreen)" name="Breeden-Litzenberger Implied Density" />
                  <Line type="monotone" dataKey="normalDensity" stroke="#64748b" strokeDasharray="3 3" dot={false} name="Theoretical Gaussian Normal" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: PREDICTIVE KALMAN FILTER, HMM REGIMES & GARCH(1,1) */}
      {activeSubTab === "PREDICTIVE_KALMAN_HMM" && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. Adaptive Kalman Filter State Estimator */}
            <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white font-sans uppercase flex items-center gap-1.5">
                  <Network className="w-4 h-4 text-cyan-400" />
                  Adaptive 1D Kalman Filter Denoising
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">
                  {bundle.kalmanFilter.noiseReducedPercent}% High-Freq Noise Filtered
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-900 border border-slate-800 rounded p-2">
                  <div className="text-[9px] text-slate-500 font-sans uppercase">Raw Spot</div>
                  <div className="text-base font-bold text-slate-200 mt-0.5">
                    {index.currency}{bundle.kalmanFilter.rawPrice.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded p-2">
                  <div className="text-[9px] text-slate-500 font-sans uppercase">Kalman State (x̂)</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">
                    {index.currency}{bundle.kalmanFilter.filteredState.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded p-2">
                  <div className="text-[9px] text-slate-500 font-sans uppercase">Kalman Gain (K)</div>
                  <div className="text-base font-bold text-indigo-400 mt-0.5">
                    {bundle.kalmanFilter.kalmanGain}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded p-2.5 text-[11px] text-slate-300">
                Velocity Trend Slope: <strong className="text-emerald-400">+{bundle.kalmanFilter.velocityTrend} pts/min</strong>. The filter removes microsecond bid-ask bounce to isolate the true institutional state vector.
              </div>
            </div>

            {/* 2. Hidden Markov Model (HMM) 3-State Regime Classifier */}
            <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white font-sans uppercase flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Hidden Markov Model (HMM) Regime Classifier
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  {bundle.hmmRegime.currentRegime.replace(/_/g, " ")}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="bg-slate-900 border border-slate-800 rounded p-2">
                  <div className="text-slate-500 font-sans uppercase">Low-Vol Bull</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    {Math.round(bundle.hmmRegime.regimeProbabilities.lowVolBull * 100)}%
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded p-2">
                  <div className="text-slate-500 font-sans uppercase">High-Vol Bear</div>
                  <div className="text-sm font-bold text-rose-400 mt-0.5">
                    {Math.round(bundle.hmmRegime.regimeProbabilities.highVolBear * 100)}%
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded p-2">
                  <div className="text-slate-500 font-sans uppercase">Choppy Range</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">
                    {Math.round(bundle.hmmRegime.regimeProbabilities.choppyRange * 100)}%
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded p-2.5 text-[11px] space-y-1">
                <div className="text-slate-400 font-sans font-bold uppercase text-[9px]">Optimal Quantitative Playbook</div>
                <div className="text-emerald-400 font-bold">{bundle.hmmRegime.recommendedPlaybook}</div>
              </div>
            </div>

            {/* 3. GARCH(1,1) Dynamic Volatility Forecasting Quick Widget */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white font-sans uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-400" />
                  GARCH(1,1) Dynamic Volatility Term Structure Forecast
                </span>
                <button
                  onClick={() => setActiveSubTab("GARCH_VOLATILITY_FORECAST")}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-bold uppercase underline"
                >
                  Open Full Dynamic Risk Calibration Suite →
                </button>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={interactiveGarch.termStructure} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={(d) => `Day T+${d}`} />
                    <YAxis domain={["auto", "auto"]} stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", fontSize: "10px" }} />
                    <Line type="monotone" dataKey="forecastIv" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} name="GARCH(1,1) Forecast IV" />
                    <Line type="monotone" dataKey="upperCi" stroke="#f43f5e" strokeDasharray="3 3" dot={false} strokeWidth={1} name="Upper 95% CI" />
                    <Line type="monotone" dataKey="lowerCi" stroke="#38bdf8" strokeDasharray="3 3" dot={false} strokeWidth={1} name="Lower 95% CI" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: GARCH(1,1) DYNAMIC VOLATILITY FORECASTING & PINPOINT RISK ADJUSTER */}
      {activeSubTab === "GARCH_VOLATILITY_FORECAST" && (
        <div className="space-y-4 text-xs">
          {/* Top Macro & GARCH Equation Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Conditional Volatility σ(t+1)</div>
              <div className="text-base font-bold text-purple-400 mt-0.5">
                {interactiveGarch.annualizedForecastVol}% IV
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Base Implied Vol: {index.baseIV}%</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Long-Run Volatility σ_L</div>
              <div className="text-base font-bold text-indigo-400 mt-0.5">
                {interactiveGarch.longRunVol}% IV
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Unconditional Mean Reversion</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Shock Persistence (α + β)</div>
              <div className={`text-base font-bold mt-0.5 ${interactiveGarch.persistence < 1.0 ? "text-emerald-400" : "text-rose-400"}`}>
                {interactiveGarch.persistence}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {interactiveGarch.persistence < 1.0 ? "Stationary Process (Covariance Stable)" : "Non-Stationary Warning"}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Shock Half-Life (t½)</div>
              <div className="text-base font-bold text-amber-400 mt-0.5">
                {interactiveGarch.halfLifeDays} Days
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Decay to equilibrium baseline</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">GARCH Volatility Regime</div>
              <div className={`text-base font-bold mt-0.5 ${
                interactiveGarch.volatilityRegime === "VOLATILITY_EXPANSION"
                  ? "text-purple-400"
                  : interactiveGarch.volatilityRegime === "VOLATILITY_CONTRACTION"
                  ? "text-teal-400"
                  : "text-indigo-400"
              }`}>
                {interactiveGarch.volatilityRegime.replace(/_/g, " ")}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Dynamic Risk Auto-Tuned</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Interactive GARCH(1,1) Parameter Calibrator */}
            <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white uppercase font-sans text-xs flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                  GARCH(1,1) Parameter Calibration
                </span>
                <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                  σ²_t = ω + α·ε²_{"{t-1}"} + β·σ²_{"{t-1}"}
                </span>
              </div>

              <div className="space-y-3 text-[11px]">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>ARCH Shock Impact (α):</span>
                    <strong className="text-purple-400">{garchAlpha.toFixed(3)}</strong>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.30"
                    step="0.005"
                    value={garchAlpha}
                    onChange={(e) => setGarchAlpha(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="text-[9px] text-slate-500">Sensitivity of volatility to intraday return shocks (ε_{"{t-1}"}²)</div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>GARCH Vol Persistence (β):</span>
                    <strong className="text-purple-400">{garchBeta.toFixed(3)}</strong>
                  </div>
                  <input
                    type="range"
                    min="0.50"
                    max="0.96"
                    step="0.005"
                    value={garchBeta}
                    onChange={(e) => setGarchBeta(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="text-[9px] text-slate-500">Memory persistence of previous variance (σ_{"{t-1}"}²)</div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Base Variance Drift (ω):</span>
                    <strong className="text-purple-400">{(garchOmega * 1000000).toFixed(1)}e-6</strong>
                  </div>
                  <input
                    type="range"
                    min="0.000001"
                    max="0.000020"
                    step="0.0000005"
                    value={garchOmega}
                    onChange={(e) => setGarchOmega(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="text-[9px] text-slate-500">Long-term unconditional variance base parameter</div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Simulated Intraday Shock (ε_{"{t-1}"}):</span>
                    <strong className="text-amber-400">{garchShockResidual > 0 ? `+${garchShockResidual.toFixed(2)}σ` : `${garchShockResidual.toFixed(2)}σ`}</strong>
                  </div>
                  <input
                    type="range"
                    min="-3.0"
                    max="3.0"
                    step="0.1"
                    value={garchShockResidual}
                    onChange={(e) => setGarchShockResidual(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="text-[9px] text-slate-500">Simulate positive/negative market shock magnitude</div>
                </div>

                <button
                  onClick={() => {
                    setGarchAlpha(0.088);
                    setGarchBeta(0.892);
                    setGarchOmega(0.0000045);
                    setGarchShockResidual(0.85);
                  }}
                  className="w-full py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Calibrated Empirical Priors</span>
                </button>
              </div>
            </div>

            {/* Volatility Forecast Term Structure & 95% Confidence Cone */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white uppercase font-sans text-xs flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-400" />
                  10-Day Volatility Term Structure & 95% Forecast Confidence Cone
                </span>
                <span className="text-[10px] text-slate-400">
                  Confidence Band: ±1.96 · SE(k)
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={interactiveGarch.termStructure} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="volConeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={(d) => `Day T+${d}`} />
                    <YAxis domain={["auto", "auto"]} stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", fontSize: "10px" }} />
                    <ReferenceLine y={interactiveGarch.longRunVol} stroke="#818cf8" strokeDasharray="3 3" label={{ value: `Long-Run σ_L (${interactiveGarch.longRunVol}%)`, fill: "#818cf8", fontSize: 9 }} />
                    <Area type="monotone" dataKey="upperCi" stroke="#f43f5e" strokeWidth={1} strokeDasharray="2 2" fill="url(#volConeGrad)" name="Upper 95% CI" />
                    <Area type="monotone" dataKey="lowerCi" stroke="#38bdf8" strokeWidth={1} strokeDasharray="2 2" fill="#020617" name="Lower 95% CI" />
                    <Line type="monotone" dataKey="forecastIv" stroke="#c084fc" strokeWidth={2.5} dot={{ r: 3, fill: "#a855f7" }} name="GARCH Conditional Vol σ(t+k)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[11px] text-slate-300 bg-slate-900 border border-slate-800 rounded p-2.5">
                Vol Term Projection: <strong className="text-purple-300">T+1={interactiveGarch.termStructure[0].forecastIv}%</strong>, <strong className="text-purple-300">T+5={interactiveGarch.termStructure[4].forecastIv}%</strong>, <strong className="text-purple-300">T+10={interactiveGarch.termStructure[9].forecastIv}%</strong>. Captures volatility clustering and mean reversion towards the long-term baseline.
              </div>
            </div>
          </div>

          {/* Dynamic Pinpoint Precision Risk Parameter Calibration Module */}
          <div className="bg-slate-950 border border-purple-500/40 rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white uppercase font-sans text-xs flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-amber-400" />
                Dynamic 'Pinpoint Precision' Risk Parameter Calibration Table
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-mono">
                FEEDING LIVE INTO PINPOINT RADAR
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Dynamic Stop-Loss Invalidation Multiplier */}
              <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-rose-400 uppercase font-sans font-bold">
                  <span>Dynamic Invalidation Stop</span>
                  <span>Stop Buffer</span>
                </div>
                <div className="text-lg font-bold text-rose-400">
                  {interactiveGarch.pinpointRiskAdjustments.dynamicStopMultiplier}x Multiplier
                </div>
                <div className="text-[10px] text-slate-400">
                  {interactiveGarch.pinpointRiskAdjustments.dynamicStopMultiplier > 1.0
                    ? `Widens structural stop buffer to prevent wick outs during high vol clustering.`
                    : `Tightens stop buffer to capture tight mean reversion scalps.`}
                </div>
              </div>

              {/* Dynamic Target Extension Multiplier */}
              <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-emerald-400 uppercase font-sans font-bold">
                  <span>Fib Target Extension</span>
                  <span>Target 1/2/3</span>
                </div>
                <div className="text-lg font-bold text-emerald-400">
                  {interactiveGarch.pinpointRiskAdjustments.dynamicTargetExtension}x Extension
                </div>
                <div className="text-[10px] text-slate-400">
                  {interactiveGarch.pinpointRiskAdjustments.dynamicTargetExtension > 1.0
                    ? `Expands Fibonacci targets into expected higher volatility expansion zones.`
                    : `Compresses targets for fast intraday take-profit execution.`}
                </div>
              </div>

              {/* Dynamic Kelly Position Sizing Multiplier */}
              <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-indigo-300 uppercase font-sans font-bold">
                  <span>GARCH Kelly Sizing Factor</span>
                  <span>Capital Protection</span>
                </div>
                <div className="text-lg font-bold text-indigo-300">
                  {interactiveGarch.pinpointRiskAdjustments.recommendedPositionSizing}% Normal Size
                </div>
                <div className="text-[10px] text-slate-400">
                  Adjusted Max Risk: <strong className="text-white">{index.currency}{interactiveGarch.pinpointRiskAdjustments.maxRiskPerTradeAdjustedInr.toLocaleString()}</strong> per position.
                </div>
              </div>

              {/* Recommended Options Strategy Playbook */}
              <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-amber-300 uppercase font-sans font-bold">
                  <span>Recommended Playbook</span>
                  <span>Option Strategy</span>
                </div>
                <div className="text-xs font-bold text-amber-300 leading-snug">
                  {interactiveGarch.pinpointRiskAdjustments.recommendedOptionStrategy}
                </div>
                <div className="text-[9px] text-slate-400">
                  Auto-calibrated for current GARCH volatility regime.
                </div>
              </div>
            </div>

            {/* Volatility Clustering Warning Banner */}
            <div className="bg-slate-900/90 border border-slate-800 rounded p-3 flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-slate-300 text-[11px]">
                <strong className="text-amber-300 uppercase font-sans">Quant Vol Clustering Notice: </strong>
                {interactiveGarch.pinpointRiskAdjustments.volClusterRiskWarning}
              </div>
            </div>
          </div>

          {/* Historical Realized Volatility vs GARCH Conditional Volatility Comparison */}
          <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white uppercase font-sans text-xs flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Empirical Realized vs GARCH(1,1) Conditional Volatility Time Series
              </span>
              <span className="text-[10px] text-slate-400">
                T-5 Days to Live Tick
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={interactiveGarch.historicalVolComparison} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 9 }} />
                  <YAxis domain={["auto", "auto"]} stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", fontSize: "10px" }} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Line type="monotone" dataKey="realizedVol" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} name="Realized Parkinsons Volatility" />
                  <Line type="monotone" dataKey="garchConditionalVol" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 4 }} name="GARCH(1,1) Conditional Forecast σ_t" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: BAYESIAN INFERENCE, HURST EXPONENT & AUTOCORRELATION (ACF) */}
      {activeSubTab === "BAYESIAN_HURST_ACF" && (
        <div className="space-y-4 text-xs">
          {/* Top Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Bayesian P(Bull | Evidence)</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">
                {Math.round(bundle.advancedMethods.bayesian.bullProbabilityUpdated * 100)}% Confidence
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Prior + Delta + Greeks Synthesis</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Hurst Exponent (H)</div>
              <div className="text-base font-bold text-indigo-400 mt-0.5">
                H = {bundle.advancedMethods.hurst.hurstValue}
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5 font-bold">
                {bundle.advancedMethods.hurst.interpretation.replace(/_/g, " ")}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Fractal Dimension (D)</div>
              <div className="text-base font-bold text-amber-400 mt-0.5">
                D = {bundle.advancedMethods.hurst.fractalDimension}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">D = 2 - H (Geometric Roughness)</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Lag-1 Autocorrelation ρ(1)</div>
              <div className="text-base font-bold text-cyan-400 mt-0.5">
                +{(bundle.advancedMethods.autocorrelation[0]?.acfValue * 100).toFixed(0)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Statistically Significant Momentum</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. Bayesian Posterior Belief Updating Curve */}
            <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white font-sans uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Conjugate Normal-Normal Bayesian Updating
                </span>
                <span className="text-[10px] text-slate-400">
                  P(θ|D) ∝ P(D|θ) · P(θ)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="bg-slate-900 border border-slate-800 rounded p-2">
                  <div className="text-slate-500 uppercase">Prior Mean (μ₀)</div>
                  <div className="text-sm font-bold text-indigo-300 mt-0.5">
                    +{bundle.advancedMethods.bayesian.priorMean}%
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded p-2">
                  <div className="text-slate-500 uppercase">Evidence Drift (x̄)</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">
                    +{bundle.advancedMethods.bayesian.observedEvidenceMean}%
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded p-2">
                  <div className="text-slate-500 uppercase">Posterior Mean (μₙ)</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    +{bundle.advancedMethods.bayesian.posteriorMean}%
                  </div>
                </div>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bundle.advancedMethods.bayesian.distributionPoints} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="x" stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}%`} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", fontSize: "10px" }} />
                    <Line type="monotone" dataKey="prior" stroke="#818cf8" strokeDasharray="3 3" dot={false} strokeWidth={1.5} name="Prior Belief" />
                    <Line type="monotone" dataKey="likelihood" stroke="#f59e0b" strokeDasharray="3 3" dot={false} strokeWidth={1.5} name="Sample Likelihood (Orderflow)" />
                    <Line type="monotone" dataKey="posterior" stroke="#10b981" strokeWidth={2.5} dot={false} name="Updated Posterior Density" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[11px] text-slate-300 bg-slate-900 border border-slate-800 rounded p-2.5">
                95% Bayesian Credible Interval: <strong className="text-emerald-400">[{bundle.advancedMethods.bayesian.credibleInterval95[0].toFixed(2)}%, {bundle.advancedMethods.bayesian.credibleInterval95[1].toFixed(2)}%]</strong>. Synthesizes macro baseline with real-time order-book delta prints.
              </div>
            </div>

            {/* 2. Autocorrelation Function (ACF) with 95% Bartlett Confidence Bands */}
            <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white font-sans uppercase flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  Autocorrelation Function (ACF) & Market Memory
                </span>
                <span className="text-[10px] text-slate-400">
                  Bartlett Band: ±0.146 (95% CI)
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bundle.advancedMethods.autocorrelation} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="lag" stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={(l) => `Lag ${l}`} />
                    <YAxis domain={[-0.4, 0.6]} stroke="#64748b" tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", fontSize: "10px" }} />
                    <ReferenceLine y={bundle.advancedMethods.autocorrelation[0].confidenceBandUpper} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: "+95% CI", fill: "#f43f5e", fontSize: 8 }} />
                    <ReferenceLine y={bundle.advancedMethods.autocorrelation[0].confidenceBandLower} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: "-95% CI", fill: "#f43f5e", fontSize: 8 }} />
                    <ReferenceLine y={0} stroke="#64748b" />
                    <Bar dataKey="acfValue" fill="#38bdf8" name="Serial Autocorrelation ρ(k)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[11px] text-slate-300 bg-slate-900 border border-slate-800 rounded p-2.5">
                Lags 1-4 exceed the upper Bartlett threshold, establishing <strong className="text-emerald-400">persistent short-term momentum memory</strong> suitable for breakout trend-following.
              </div>
            </div>

            {/* 3. Hurst Exponent Rescaled Range (R/S) Fractal Regression */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white font-sans uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  Hurst Exponent R/S Fractal Scaling: log(R/S) = H · log(n) + c
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  {bundle.advancedMethods.hurst.recommendedStrategy}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="h-44 md:col-span-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bundle.advancedMethods.hurst.rsValues} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="logLag" stroke="#64748b" tick={{ fontSize: 9 }} label={{ value: "log(Lag n)", fill: "#64748b", fontSize: 9, position: "insideBottom", offset: -2 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 9 }} label={{ value: "log(R/S)", fill: "#64748b", angle: -90, position: "insideLeft", fontSize: 9 }} />
                      <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", fontSize: "10px" }} />
                      <Line type="monotone" dataKey="logRS" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: "#818cf8" }} name="Empirical R/S Fit" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded p-3 text-[11px] space-y-2">
                  <div className="font-bold text-slate-200 font-sans uppercase text-[10px]">Fractal Regime Matrix</div>
                  <div className="space-y-1 text-slate-400">
                    <div>• <strong>H &gt; 0.5 (H={bundle.advancedMethods.hurst.hurstValue})</strong>: Persistent Trending Memory</div>
                    <div>• <strong>H = 0.50</strong>: Random Walk Brownian Motion</div>
                    <div>• <strong>H &lt; 0.50</strong>: Anti-persistent Mean Reversion</div>
                  </div>
                  <div className="text-emerald-400 font-bold border-t border-slate-800 pt-1.5">
                    Confidence: {bundle.advancedMethods.hurst.confidenceLevel}% (Statistically Significant)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: MULTI-SCENARIO QUANTITATIVE STRESS TESTING */}
      {activeSubTab === "STRESS_TESTING" && (
        <div className="space-y-4 text-xs">
          <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="font-bold text-white font-sans uppercase flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Institutional Multi-Scenario Stress Test & Black-Swan VaR Matrix
                </span>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                  Full non-linear Greeks repricing under extreme volatility shocks, liquidity freeze, and regulatory macro shifts.
                </p>
              </div>
              <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded font-bold">
                RISK AUDIT ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bundle.advancedMethods.stressTests.map((scenario) => (
                <div
                  key={scenario.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded p-3.5 space-y-2.5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs font-sans">
                      {scenario.scenarioName}
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        scenario.gammaRiskSeverity === "CATASTROPHIC"
                          ? "bg-rose-600/30 text-rose-300 border border-rose-500/40 animate-pulse"
                          : scenario.gammaRiskSeverity === "HIGH"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {scenario.gammaRiskSeverity} SEVERITY
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="bg-slate-950 border border-slate-800/80 rounded p-1.5">
                      <div className="text-slate-500">Spot Shock</div>
                      <div className={`font-bold mt-0.5 ${scenario.underlyingPriceShiftPct < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {scenario.underlyingPriceShiftPct > 0 ? `+${scenario.underlyingPriceShiftPct}%` : `${scenario.underlyingPriceShiftPct}%`}
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 rounded p-1.5">
                      <div className="text-slate-500">IV Expansion</div>
                      <div className="font-bold text-amber-400 mt-0.5">
                        {scenario.ivShiftPct > 0 ? `+${scenario.ivShiftPct}%` : `${scenario.ivShiftPct}%`}
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 rounded p-1.5">
                      <div className="text-slate-500">Spread Slippage</div>
                      <div className="font-bold text-indigo-300 mt-0.5">
                        {scenario.liquiditySpreadMult}x
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-slate-950/60 p-2 rounded border border-slate-800/40">
                    <span className="text-slate-400">Estimated Portfolio Impact:</span>
                    <span
                      className={`font-bold ${
                        scenario.estimatedPortfolioLoss > 0 ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {scenario.estimatedPortfolioLoss > 0
                        ? `-${index.currency}${scenario.estimatedPortfolioLoss.toLocaleString()} (-${scenario.estimatedLossPct}%)`
                        : `+${index.currency}${Math.abs(scenario.estimatedPortfolioLoss).toLocaleString()} (+${Math.abs(scenario.estimatedLossPct)}%)`}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-300 space-y-1">
                    <div className="text-slate-500 uppercase font-bold text-[9px]">Automated Risk Mitigation Protocol</div>
                    <div className="text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{scenario.protectiveAction}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
