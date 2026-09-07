import React, { useState, useEffect } from "react";
import {
  VolatilitySuiteState,
  EstimatorMetric,
  VolatilityConeHorizon,
  CrossAssetComparison
} from "../types/volatility";
import {
  Activity,
  Zap,
  TrendingUp,
  BarChart3,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Layers,
  Flame,
  ArrowUpRight,
  Info,
  Sliders,
  Award
} from "lucide-react";

export function VolatilitySuiteTerminal() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>("NIFTY 50");
  const [data, setData] = useState<VolatilitySuiteState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showFormulaInfo, setShowFormulaInfo] = useState<boolean>(false);

  const symbols = ["NIFTY 50", "HDFCBANK", "RELIANCE", "ICICIBANK", "INFY", "TCS"];

  const fetchData = async (sym: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/volatility/historical?symbol=${encodeURIComponent(sym)}`);
      if (res.ok) {
        const json: VolatilitySuiteState = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load volatility suite data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedSymbol);
  }, [selectedSymbol]);

  const est = data?.estimators;
  const jump = data?.jump_disentanglement;
  const vix = data?.india_vix;
  const cone = data?.volatility_cone?.horizons || [];

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-purple-500/30 rounded-xl shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Phase 2: Historical & Macro Volatility Estimator Suite
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                5-ESTIMATORS + JUMP FILTER
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Close-to-Close • Parkinson • Garman-Klass • Rogers-Satchell • Yang-Zhang • Bipower Variation (BV) • India VIX Basis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Symbol Selector */}
          <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
            {symbols.map((sym) => (
              <button
                key={sym}
                onClick={() => setSelectedSymbol(sym)}
                className={`px-3 py-1.5 rounded text-xs font-semibold font-mono transition-colors ${
                  selectedSymbol === sym
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFormulaInfo(!showFormulaInfo)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            Formulas
          </button>

          <button
            onClick={() => fetchData(selectedSymbol)}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Recalculate
          </button>
        </div>
      </div>

      {/* Formula Cheat Sheet Modal/Dropdown */}
      {showFormulaInfo && (
        <div className="p-4 bg-slate-900 border border-purple-500/40 rounded-xl space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-200 font-bold">
            <span className="text-purple-300">Mathematical Specifications of the 5 Estimators</span>
            <button onClick={() => setShowFormulaInfo(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-300">
            <div className="p-2.5 bg-slate-800/80 rounded border border-slate-700">
              <span className="text-white font-bold">1. Close-to-Close (σ_CC):</span>
              <p className="text-slate-400 mt-0.5">Classic sample standard deviation of log returns. Ignores intraday price path and gaps.</p>
              <code className="text-emerald-300">σ = sqrt(252 / (N-1) * Σ (r_i - r̄)²)</code>
            </div>
            <div className="p-2.5 bg-slate-800/80 rounded border border-slate-700">
              <span className="text-white font-bold">2. Parkinson (σ_P):</span>
              <p className="text-slate-400 mt-0.5">Extreme value estimator using High/Low. 5.2x efficiency over CC. Assumes continuous zero-drift Brownian motion.</p>
              <code className="text-amber-300">σ = sqrt(252 / (4*ln2*N) * Σ (ln(H/L))²)</code>
            </div>
            <div className="p-2.5 bg-slate-800/80 rounded border border-slate-700">
              <span className="text-white font-bold">3. Garman-Klass (σ_GK):</span>
              <p className="text-slate-400 mt-0.5">Incorporates OHLC. 7.4x efficiency. Accounts for discrete intraday drift.</p>
              <code className="text-cyan-300">σ = sqrt(252 / N * Σ [0.5*(ln(H/L))² - (2ln2 - 1)*(ln(C/O))²])</code>
            </div>
            <div className="p-2.5 bg-slate-800/80 rounded border border-slate-700">
              <span className="text-white font-bold">4. Rogers-Satchell (σ_RS):</span>
              <p className="text-slate-400 mt-0.5">Drift-independent formulation. Invariant to trending bias across the session.</p>
              <code className="text-purple-300">σ = sqrt(252 / N * Σ [ln(H/C)*ln(H/O) + ln(L/C)*ln(L/O)])</code>
            </div>
            <div className="p-2.5 bg-slate-800/80 rounded border border-slate-700 md:col-span-2">
              <span className="text-white font-bold">5. Yang-Zhang (σ_YZ) - Minimum Variance Unbiased:</span>
              <p className="text-slate-400 mt-0.5">Gold standard. Combines overnight jump variance (σ_o²), open-to-close drift variance (σ_c²), and Rogers-Satchell continuous volatility with minimum-variance weight k.</p>
              <code className="text-emerald-400">σ_YZ = sqrt(σ_o² + k*σ_c² + (1-k)*σ_RS²) where k = 0.34 / (1.34 + (N+1)/(N-1))</code>
            </div>
          </div>
        </div>
      )}

      {/* 5 Estimators Comparative Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {est && (Object.entries(est) as [string, EstimatorMetric][]).map(([key, item]) => {
          const isYZ = key === "yang_zhang";
          return (
            <div
              key={key}
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                isYZ
                  ? "bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500/40"
                  : "bg-slate-900/80 border-slate-800"
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono font-bold text-white">{item.symbol}</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-purple-300 border border-slate-700">
                    {item.relative_efficiency}x Eff
                  </span>
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-300 truncate">
                  {item.name}
                </div>
                <div className="mt-2 text-2xl font-mono font-bold text-white">
                  {item.annualized_vol_pct.toFixed(2)}
                  <span className="text-xs text-slate-400 font-normal ml-1">%</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                {item.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mid Section: Jump Disentanglement + India VIX Term Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Barndorff-Nielsen Bipower Variation (BV) & Jump Disentanglement */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Bipower Variation (BV) & Jump Disentanglement
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Barndorff-Nielsen & Shephard (2004, 2006)
                </span>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono border ${
                jump?.has_jump
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              }`}
            >
              {jump?.has_jump ? "DISCRETE JUMP DETECTED" : "CONTINUOUS DIFFUSION"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800">
              <div className="text-[11px] text-slate-400">Continuous Diffusion Vol</div>
              <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
                {((jump?.continuous_vol || 0) * 100).toFixed(2)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Brownian motion component</div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800">
              <div className="text-[11px] text-slate-400">Discrete Jump Vol</div>
              <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">
                {((jump?.jump_vol || 0) * 100).toFixed(2)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Discontinuous macroeconomic shock</div>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2.5 bg-slate-800/40 rounded">
              <span className="text-slate-400">Total Realized Variance (RV)</span>
              <span className="text-slate-200 font-bold">{jump?.realized_variance?.toExponential(4)}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-800/40 rounded">
              <span className="text-slate-400">Bipower Variation (BV)</span>
              <span className="text-emerald-300 font-bold">{jump?.bipower_variation?.toExponential(4)}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-800/40 rounded">
              <span className="text-slate-400">Jump Share [max(0, RV - BV)/RV]</span>
              <span className="text-amber-300 font-bold">{((jump?.jump_ratio || 0) * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-800/40 rounded">
              <span className="text-slate-400">Jump Test Z-Statistic</span>
              <span className={`font-bold ${Math.abs(jump?.z_stat || 0) > 2.58 ? "text-rose-400" : "text-cyan-300"}`}>
                Z = {jump?.z_stat?.toFixed(2)} (Crit: 2.58)
              </span>
            </div>
          </div>
        </div>

        {/* Right: India VIX Term Structure & Contango/Backwardation Monitor */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  India VIX Term Structure & Basis Monitor
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Spot vs Near-Month / Next-Month Futures
                </span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {vix?.regime || "CONTANGO_NORMAL"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400">India VIX Spot</div>
              <div className="text-xl font-mono font-bold text-white mt-1">
                {vix?.vix_spot?.toFixed(2) || "13.45"}
              </div>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400">Near-Month Fut</div>
              <div className="text-xl font-mono font-bold text-cyan-300 mt-1">
                {vix?.vix_fut_near?.toFixed(2) || "13.85"}
              </div>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400">Next-Month Fut</div>
              <div className="text-xl font-mono font-bold text-purple-300 mt-1">
                {vix?.vix_fut_next?.toFixed(2) || "14.15"}
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Basis (Near Future - Spot):</span>
              <span className="text-emerald-400 font-bold">
                {vix?.basis_near !== undefined && vix.basis_near >= 0 ? "+" : ""}{vix?.basis_near?.toFixed(2)} pts ({vix?.basis_pct?.toFixed(2)}%)
              </span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Calendar Roll Spread:</span>
              <span className="text-cyan-300 font-bold">+{vix?.calendar_spread?.toFixed(2)} pts</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">1-Year VIX Percentile / Rank:</span>
              <span className="text-slate-200 font-bold">
                {vix?.vix_percentile_1y?.toFixed(1)}th %tile | Rank: {vix?.vix_rank_1y?.toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-2 pt-2 border-t border-slate-800">
              {vix?.regime_desc}
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Horizon Volatility Cones (10D, 20D, 30D, 60D, 90D) */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">
                Multi-Horizon Volatility Cone ({selectedSymbol})
              </h3>
              <span className="text-[11px] text-slate-400">
                Rolling Yang-Zhang Quantiles (Min, P25, Median, P75, Max) overlaid with Current Realized Vol
              </span>
            </div>
          </div>
          <span className="text-xs text-purple-300 font-mono">
            Annualized Volatility (%)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-2.5 px-3 text-left">Horizon</th>
                <th className="py-2.5 px-3 text-right">Min (100% Low)</th>
                <th className="py-2.5 px-3 text-right">P25 (Bottom Quartile)</th>
                <th className="py-2.5 px-3 text-right text-purple-300">Median (P50)</th>
                <th className="py-2.5 px-3 text-right">P75 (Top Quartile)</th>
                <th className="py-2.5 px-3 text-right">Max (100% High)</th>
                <th className="py-2.5 px-3 text-right text-emerald-300 font-bold">Current Vol</th>
                <th className="py-2.5 px-3 text-center">Quantile Cone Visual</th>
                <th className="py-2.5 px-3 text-right">IV Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {cone.map((h) => {
                const range = (h.max_vol - h.min_vol) || 0.01;
                const currPos = Math.max(0, Math.min(100, ((h.current_vol - h.min_vol) / range) * 100));
                const p25Pos = ((h.p25_vol - h.min_vol) / range) * 100;
                const p75Pos = ((h.p75_vol - h.min_vol) / range) * 100;

                return (
                  <tr key={h.horizon_days} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-white">{h.horizon_days} Days</td>
                    <td className="py-3 px-3 text-right text-slate-400">{(h.min_vol * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3 text-right text-slate-300">{(h.p25_vol * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3 text-right text-purple-300 font-bold">{(h.median_vol * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3 text-right text-slate-300">{(h.p75_vol * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3 text-right text-slate-400">{(h.max_vol * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold">{(h.current_vol * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3 w-64">
                      {/* Cone Bar with IQR band and current marker */}
                      <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                        {/* 25th to 75th percentile band */}
                        <div
                          className="absolute top-0 bottom-0 bg-purple-600/40 rounded-full"
                          style={{ left: `${p25Pos}%`, width: `${p75Pos - p25Pos}%` }}
                        />
                        {/* Current Vol marker */}
                        <div
                          className="absolute top-0 bottom-0 w-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                          style={{ left: `${currPos}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-300 border border-slate-700">
                        {h.iv_percentile.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cross-Asset Estimator Matrix (Nifty 50 vs Key Equities) */}
      {data?.cross_comparison && (
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Cross-Constituent Estimator Comparison Matrix (30-Day Annualized Vol)
                </h3>
                <span className="text-[11px] text-slate-400">
                  Measuring efficiency gains of Yang-Zhang and Rogers-Satchell over classic Close-to-Close
                </span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              ALL FIGURES IN %
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 text-left">Asset</th>
                  <th className="py-2.5 px-3 text-right">LTP (₹)</th>
                  <th className="py-2.5 px-3 text-right">Close-to-Close (σ_CC)</th>
                  <th className="py-2.5 px-3 text-right">Parkinson (σ_P)</th>
                  <th className="py-2.5 px-3 text-right">Garman-Klass (σ_GK)</th>
                  <th className="py-2.5 px-3 text-right">Rogers-Satchell (σ_RS)</th>
                  <th className="py-2.5 px-3 text-right text-purple-300 font-bold">Yang-Zhang (σ_YZ)</th>
                  <th className="py-2.5 px-3 text-center">Unbiased Advantage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data.cross_comparison.map((item) => (
                  <tr key={item.symbol} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">{item.symbol}</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">₹{item.ltp.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{item.sigma_cc.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{item.sigma_p.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-right text-cyan-300">{item.sigma_gk.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-right text-purple-300">{item.sigma_rs.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">{item.sigma_yz.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {item.efficiency_gain_vs_cc}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
