import React, { useState } from "react";
import { GexProfile, MonteCarloSimulationResult, IndexInfo } from "../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  Layers,
  Zap,
  TrendingUp,
  TrendingDown,
  Shield,
  Activity,
  Compass,
  AlertTriangle,
  Target,
  Sparkles,
} from "lucide-react";

interface GexMonteCarloTerminalProps {
  index: IndexInfo;
  gexProfile: GexProfile;
  monteCarlo: MonteCarloSimulationResult;
}

export const GexMonteCarloTerminal: React.FC<GexMonteCarloTerminalProps> = ({
  index,
  gexProfile,
  monteCarlo,
}) => {
  const [activeView, setActiveView] = useState<"GEX_HEATMAP" | "MONTE_CARLO_CONE">("GEX_HEATMAP");

  const isPositiveGamma = gexProfile.regime === "POSITIVE_GAMMA_STICKY";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4 shadow-xl space-y-4">
      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
              Market Maker Gamma Exposure (GEX) & Probabilistic Monte Carlo Cone
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Delta-Neutral Dealer Positioning • Gamma Flip Regimes • 10,000-Path Volatility Dispersion
            </p>
          </div>
        </div>

        <div className="flex bg-slate-950 rounded p-0.5 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveView("GEX_HEATMAP")}
            className={`px-3 py-1.5 rounded transition-all font-bold ${
              activeView === "GEX_HEATMAP"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            GEX PROFILE & GAMMA FLIP
          </button>
          <button
            onClick={() => setActiveView("MONTE_CARLO_CONE")}
            className={`px-3 py-1.5 rounded transition-all font-bold ${
              activeView === "MONTE_CARLO_CONE"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            MONTE CARLO PROBABILITY CONE
          </button>
        </div>
      </div>

      {activeView === "GEX_HEATMAP" ? (
        <div className="space-y-4 font-mono text-xs">
          {/* Market Maker Posture Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Net Dealer Gamma</div>
              <div className={`text-base font-bold mt-0.5 ${isPositiveGamma ? "text-emerald-400" : "text-rose-400"}`}>
                {gexProfile.totalNetGex > 0 ? "+" : ""}{gexProfile.totalNetGex} Cr / 1%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isPositiveGamma ? "Positive Gamma Regime" : "Negative Gamma Accelerator"}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Gamma Flip Level</div>
              <div className="text-base font-bold text-amber-400 mt-0.5">
                {index.currency}{gexProfile.gammaFlipLevel.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {index.currentPrice >= gexProfile.gammaFlipLevel ? "Trading Above Flip (Sticky)" : "Below Flip (Vol Surge)"}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Call Wall (Major Ceiling)</div>
              <div className="text-base font-bold text-rose-400 mt-0.5">
                {index.currency}{gexProfile.callWall.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Pinning Resistance</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Put Wall (Major Floor)</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">
                {index.currency}{gexProfile.putWall.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Institutional Bid Cushion</div>
            </div>
          </div>

          {/* GEX Bar Chart */}
          <div className="bg-slate-950 border border-slate-800 rounded p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-sans font-bold uppercase">
                Net Gamma Exposure by Strike ({index.currency} Crores per 1% Underlying Shift)
              </span>
              <span className="text-[10px] text-slate-400">
                Green = Call Gamma (Resistance) • Red = Put Gamma (Support)
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gexProfile.strikeLevels} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="strike" stroke="#64748b" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", fontSize: "10px" }}
                    formatter={(val: any, name: any) => [
                      `${index.currency}${val} Cr`,
                      name === "callGex" ? "Call GEX (Sticky Resistance)" : "Put GEX (Support Floor)",
                    ]}
                  />
                  <ReferenceLine x={index.currentPrice} stroke="#6366f1" strokeDasharray="3 3" label={{ value: "Spot", fill: "#818cf8", fontSize: 9 }} />
                  <ReferenceLine x={gexProfile.gammaFlipLevel} stroke="#fbbf24" strokeDasharray="4 2" label={{ value: "Gamma Flip", fill: "#fbbf24", fontSize: 9 }} />
                  <Bar dataKey="callGex" fill="#10b981" name="callGex" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="putGex" fill="#f43f5e" name="putGex" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded p-3 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">
                Dealer Posture: <strong className="text-white">{gexProfile.marketMakerPosture.replace(/_/g, " ")}</strong>
              </span>
            </div>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
              {isPositiveGamma ? "MEAN REVERSION FAVORED" : "TREND BREAKOUT FAVORED"}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4 font-mono text-xs">
          {/* Monte Carlo Stats Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Expected 1-Day Move (1σ)</div>
              <div className="text-base font-bold text-indigo-400 mt-0.5">
                ±{index.currency}{monteCarlo.expectedMove1Day}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">68.2% Probability Band</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">1σ Cone Boundary</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">
                {index.currency}{monteCarlo.oneSigmaLower} - {monteCarlo.oneSigmaUpper}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Normal Market Envelope</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Probability of Profit (POP)</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">
                {monteCarlo.probabilityOfProfit}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Based on Delta & Vol Skew</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">Probability of Touching T1</div>
              <div className="text-base font-bold text-indigo-300 mt-0.5">
                {monteCarlo.probabilityOfTouchTarget}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Intraday Target Reachability</div>
            </div>
          </div>

          {/* Monte Carlo Probability Cone Chart */}
          <div className="bg-slate-950 border border-slate-800 rounded p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-sans font-bold uppercase">
                10,000-Path Monte Carlo Volatility Cone (99th, 90th & 50th Percentiles)
              </span>
              <span className="text-[10px] text-slate-400">
                1σ Envelope (68%) • 2σ Tail Risk (95%)
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monteCarlo.simulatedPaths} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="coneGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="step" stroke="#64748b" tick={{ fontSize: 9 }} tickFormatter={(s) => `T+${s}`} />
                  <YAxis domain={["auto", "auto"]} stroke="#64748b" tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", fontSize: "10px" }} />
                  <Line type="monotone" dataKey="p99" stroke="#f43f5e" strokeDasharray="2 2" strokeWidth={1} dot={false} name="99% Extreme Upper" />
                  <Line type="monotone" dataKey="p90" stroke="#10b981" strokeWidth={2} dot={false} name="90% Upper Target Band" />
                  <Line type="monotone" dataKey="p50" stroke="#38bdf8" strokeWidth={2} dot={false} name="50% Median Trajectory" />
                  <Line type="monotone" dataKey="p10" stroke="#f59e0b" strokeWidth={2} dot={false} name="10% Lower Invalidation" />
                  <Line type="monotone" dataKey="p01" stroke="#f43f5e" strokeDasharray="2 2" strokeWidth={1} dot={false} name="01% Extreme Lower" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
