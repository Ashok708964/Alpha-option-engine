import React, { useState, useEffect } from "react";
import {
  SVISurfaceState,
  SVISliceData,
  SVIStrikePoint,
} from "../types/svi_surface";
import {
  Activity,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Info,
  RefreshCw,
  TrendingUp,
  Cpu,
  BarChart2,
  Table,
  Sliders,
  CheckCircle2,
  Maximize2
} from "lucide-react";

export function SviSurfaceTerminal() {
  const [data, setData] = useState<SVISurfaceState | null>(null);
  const [selectedSliceIndex, setSelectedSliceIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showFormula, setShowFormula] = useState<boolean>(false);
  const [selectedGreek, setSelectedGreek] = useState<"delta" | "gamma" | "vega" | "theta" | "vanna" | "volga">("delta");

  const fetchSurface = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/volatility/svi-surface?symbol=NIFTY%2050");
      if (res.ok) {
        const json: SVISurfaceState = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load SVI surface:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSurface();
  }, []);

  const activeSlice: SVISliceData | undefined = data?.slices[selectedSliceIndex];
  const calendarArbitrage = data?.calendar_arbitrage;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-purple-500/30 rounded-xl shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Phase 3: SVI Real-Time Options Volatility Surface
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                GATHERAL RAW SVI PARAMETRIC MODEL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Arbitrage-Free Volatility Smiles • Durrleman Density g(k) &ge; 0 • Calendar Monotonicity &part;w/&part;&tau; &ge; 0 • Quasi-Explicit Calibration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFormula(!showFormula)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            SVI Formulation
          </button>

          <button
            onClick={fetchSurface}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Recalibrate
          </button>
        </div>
      </div>

      {/* SVI Formulation Info Drawer */}
      {showFormula && (
        <div className="p-4 bg-slate-900 border border-purple-500/40 rounded-xl space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-200 font-bold">
            <span className="text-purple-300">Gatheral Raw SVI (Stochastic Volatility Inspired) Specification</span>
            <button onClick={() => setShowFormula(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-300">
            <div className="p-3 bg-slate-800/80 rounded border border-slate-700 space-y-1">
              <span className="text-white font-bold">Total Implied Variance Formulation:</span>
              <p className="text-slate-400">Total variance w(k) = &sigma;_{'{BS}'}^2 * &tau; parameterized by 5 parameters (a, b, &rho;, m, &sigma;):</p>
              <code className="text-emerald-400 block p-1.5 bg-slate-950 rounded">
                w(k) = a + b * [ &rho;*(k - m) + sqrt((k - m)^2 + &sigma;^2) ]
              </code>
              <p className="text-slate-400 text-[10px]">
                where k = ln(K / F_t) is log-moneyness.
              </p>
            </div>
            <div className="p-3 bg-slate-800/80 rounded border border-slate-700 space-y-1">
              <span className="text-white font-bold">Arbitrage-Free Conditions:</span>
              <ul className="list-disc list-inside text-slate-400 space-y-1">
                <li><span className="text-cyan-300">Durrleman Condition:</span> Risk-neutral density g(k) &ge; 0 everywhere (prevents butterfly arbitrage).</li>
                <li><span className="text-purple-300">Calendar Monotonicity:</span> &part;w/&part;&tau; &ge; 0 across expiries (prevents calendar spread arbitrage).</li>
                <li><span className="text-amber-300">Wing Constraints:</span> b*(1 + |&rho;|) &lt; 4/&tau; (prevents Roger Lee wing slope arbitrage).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Surface Status & Arbitrage Compliance Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="text-[11px] text-slate-400">Underlying Spot Price</div>
          <div className="text-xl font-mono font-bold text-white mt-0.5">
            ₹{data?.spot_price ? data.spot_price.toLocaleString() : "24,854.20"}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">NIFTY 50 Index</div>
        </div>

        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="text-[11px] text-slate-400">Active Expiry Slices</div>
          <div className="text-xl font-mono font-bold text-purple-300 mt-0.5">
            {data?.slices.length || 3} Slices
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">4 DTE • 11 DTE • 25 DTE</div>
        </div>

        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="text-[11px] text-slate-400">Calendar Arbitrage Status</div>
          <div className="flex items-center gap-1.5 mt-1">
            {calendarArbitrage?.has_calendar_arbitrage ? (
              <span className="flex items-center gap-1 text-xs font-mono font-bold text-rose-400">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                VIOLATION DETECTED
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ARBITRAGE FREE (&part;w/&part;&tau; &ge; 0)
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Monotonic Total Variance</div>
        </div>

        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="text-[11px] text-slate-400">Butterfly Durrleman Density</div>
          <div className="flex items-center gap-1.5 mt-1">
            {activeSlice?.butterfly_arbitrage.has_butterfly_arbitrage ? (
              <span className="flex items-center gap-1 text-xs font-mono font-bold text-rose-400">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                VIOLATION (g(k) &lt; 0)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                g(k) &gt; 0 (Min: {activeSlice?.butterfly_arbitrage.min_density})
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Positive Risk-Neutral Density</div>
        </div>
      </div>

      {/* Expiry Selector Pills */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {data?.slices.map((sl, idx) => (
          <button
            key={sl.name}
            onClick={() => setSelectedSliceIndex(idx)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono transition-all flex items-center gap-2 ${
              selectedSliceIndex === idx
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400"
                : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <span>{sl.name}</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-950/60 text-purple-300 border border-purple-700/50">
              RMSE: {sl.rmse_bps} bps
            </span>
          </button>
        ))}
      </div>

      {/* SVI Parameter Cards for Selected Expiry */}
      {activeSlice && (
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-white">
                Calibrated SVI Raw Parameters ({activeSlice.name})
              </span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
              <span>Forward F_t: ₹{activeSlice.forward.toLocaleString()}</span>
              <span>ATM IV: {activeSlice.atm_iv}%</span>
              <span>&tau;: {activeSlice.tau.toFixed(4)} yrs</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1">
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 font-mono">
              <div className="text-[10px] text-slate-400 uppercase">a (Vertical Shift)</div>
              <div className="text-base font-bold text-white mt-0.5">
                {activeSlice.svi_params.a.toFixed(6)}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">Overall variance level</div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 font-mono">
              <div className="text-[10px] text-slate-400 uppercase">b (Asymptote Slope)</div>
              <div className="text-base font-bold text-cyan-300 mt-0.5">
                {activeSlice.svi_params.b.toFixed(6)}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">Wing slope angle</div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 font-mono">
              <div className="text-[10px] text-slate-400 uppercase">&rho; (Skew Rotation)</div>
              <div className="text-base font-bold text-purple-300 mt-0.5">
                {activeSlice.svi_params.rho.toFixed(4)}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">Left vs right smile tilt</div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 font-mono">
              <div className="text-[10px] text-slate-400 uppercase">m (Vertex Translation)</div>
              <div className="text-base font-bold text-emerald-300 mt-0.5">
                {activeSlice.svi_params.m.toFixed(4)}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">ATM smile minimum shift</div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 font-mono">
              <div className="text-[10px] text-slate-400 uppercase">&sigma; (Curvature)</div>
              <div className="text-base font-bold text-amber-300 mt-0.5">
                {activeSlice.svi_params.sigma.toFixed(4)}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">Vertex rounding curvature</div>
            </div>
          </div>
        </div>
      )}

      {/* Volatility Smile Visualizer & Residual Bar */}
      {activeSlice && (
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Market Quotes vs SVI Fitted Volatility Smile ({activeSlice.name})
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Continuous Parametric Smile across Strike Spectrum
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
                <span className="text-slate-300">Market IV Quotes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-purple-400 inline-block"></span>
                <span className="text-purple-300 font-bold">SVI Model Curve</span>
              </div>
            </div>
          </div>

          {/* Graphical representation of the smile curve */}
          <div className="space-y-2">
            <div className="h-44 w-full bg-slate-950/70 rounded-lg p-3 relative border border-slate-800/80 flex items-end justify-between gap-1 overflow-x-auto">
              {activeSlice.points.map((pt) => {
                // Min vol ~ 8%, Max vol ~ 35%
                const heightPct = Math.min(100, Math.max(10, ((pt.svi_iv - 8.0) / (35.0 - 8.0)) * 100));
                const isATM = Math.abs(pt.log_moneyness) < 0.005;

                return (
                  <div
                    key={pt.strike}
                    className="flex-1 flex flex-col items-center group relative h-full justify-end"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col p-2 bg-slate-900 text-[10px] font-mono text-white rounded shadow-xl border border-purple-500/50 z-20 whitespace-nowrap">
                      <span className="font-bold text-purple-300">Strike: {pt.strike}</span>
                      <span>SVI IV: {pt.svi_iv}%</span>
                      <span>Mkt IV: {pt.market_iv}%</span>
                      <span>Res: {pt.residual_bps} bps</span>
                      <span>Density g(k): {pt.durrleman_density}</span>
                    </div>

                    {/* SVI Model Point */}
                    <div
                      className={`w-2.5 rounded-full transition-all ${
                        isATM
                          ? "bg-amber-400 ring-2 ring-amber-400/50 h-3"
                          : "bg-purple-500 group-hover:bg-purple-300 h-2.5"
                      }`}
                      style={{ marginBottom: `${heightPct}%` }}
                    />

                    {/* Market IV Reference tick */}
                    <div
                      className="w-1.5 h-1.5 bg-cyan-400 rounded-full absolute"
                      style={{
                        bottom: `${Math.min(100, Math.max(10, ((pt.market_iv - 8.0) / (35.0 - 8.0)) * 100))}%`
                      }}
                    />

                    <span className="text-[9px] font-mono text-slate-500 mt-2 rotate-45 origin-left">
                      {pt.strike}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 font-mono px-1">
              <span>Deep OTM Puts (Wing Bid)</span>
              <span>ATM Vertex (k &approx; 0)</span>
              <span>OTM Calls (Right Wing)</span>
            </div>
          </div>
        </div>
      )}

      {/* 3D Surface Grid Interpolation Table */}
      {data?.surface_grid && (
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Continuous Surface Time-Interpolation Matrix (Linear-in-Variance)
                </h3>
                <span className="text-[11px] text-slate-400">
                  Interpolated Black-Scholes Volatility (%) across custom Days to Expiry (DTE) and Strike Grids
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              3D GRID EVALUATOR
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 text-left">Horizon</th>
                  <th className="py-2.5 px-3 text-right">K = 23,800</th>
                  <th className="py-2.5 px-3 text-right">K = 24,200</th>
                  <th className="py-2.5 px-3 text-right">K = 24,600</th>
                  <th className="py-2.5 px-3 text-right text-amber-300">K = 24,850 (ATM)</th>
                  <th className="py-2.5 px-3 text-right">K = 25,200</th>
                  <th className="py-2.5 px-3 text-right">K = 25,600</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.surface_grid.map((row) => (
                  <tr key={row.dte} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">{row.dte} DTE</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{row["23800"]}%</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{row["24200"]}%</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{row["24600"]}%</td>
                    <td className="py-2.5 px-3 text-right text-amber-300 font-bold">{row["24850"]}%</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{row["25200"]}%</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{row["25600"]}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comprehensive Strike Chain & SVI Greeks Table */}
      {activeSlice && (
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Table className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Options Chain Strike Calibration & Greeks Scanner ({activeSlice.name})
                </h3>
                <span className="text-[11px] text-slate-400">
                  Full Black-Scholes Greeks computed via SVI Parametric Smile
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Highlight Greek:</span>
              <div className="flex items-center bg-slate-800 p-0.5 rounded border border-slate-700 text-xs font-mono">
                {(["delta", "gamma", "vega", "theta", "vanna", "volga"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGreek(g)}
                    className={`px-2 py-1 rounded capitalize ${
                      selectedGreek === g
                        ? "bg-purple-600 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs font-mono">
              <thead className="bg-slate-800/90 text-slate-400 uppercase text-[10px] sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 text-left">Strike</th>
                  <th className="py-2.5 px-2 text-right">k = ln(K/F)</th>
                  <th className="py-2.5 px-2 text-right">Mkt IV</th>
                  <th className="py-2.5 px-2 text-right text-purple-300">SVI IV</th>
                  <th className="py-2.5 px-2 text-right">Resid (bps)</th>
                  <th className="py-2.5 px-2 text-right text-emerald-400">Density g(k)</th>
                  <th className={`py-2.5 px-2 text-right ${selectedGreek === "delta" ? "text-amber-400 font-bold" : ""}`}>
                    Call &Delta;
                  </th>
                  <th className={`py-2.5 px-2 text-right ${selectedGreek === "delta" ? "text-amber-400 font-bold" : ""}`}>
                    Put &Delta;
                  </th>
                  <th className={`py-2.5 px-2 text-right ${selectedGreek === "gamma" ? "text-amber-400 font-bold" : ""}`}>
                    &Gamma;
                  </th>
                  <th className={`py-2.5 px-2 text-right ${selectedGreek === "vega" ? "text-amber-400 font-bold" : ""}`}>
                    Vega (&nu;)
                  </th>
                  <th className={`py-2.5 px-2 text-right ${selectedGreek === "theta" ? "text-amber-400 font-bold" : ""}`}>
                    Theta (&theta;)
                  </th>
                  <th className={`py-2.5 px-2 text-right ${selectedGreek === "vanna" ? "text-amber-400 font-bold" : ""}`}>
                    Vanna
                  </th>
                  <th className={`py-2.5 px-2 text-right ${selectedGreek === "volga" ? "text-amber-400 font-bold" : ""}`}>
                    Volga
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeSlice.points.map((pt) => {
                  const isATM = Math.abs(pt.log_moneyness) < 0.005;
                  return (
                    <tr
                      key={pt.strike}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isATM ? "bg-purple-950/30 font-semibold" : ""
                      }`}
                    >
                      <td className="py-2 px-3 font-bold text-white">
                        {pt.strike} {isATM && <span className="text-[10px] text-amber-400 ml-1 font-normal">(ATM)</span>}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-400">{pt.log_moneyness.toFixed(4)}</td>
                      <td className="py-2 px-2 text-right text-slate-300">{pt.market_iv.toFixed(2)}%</td>
                      <td className="py-2 px-2 text-right text-purple-300 font-bold">{pt.svi_iv.toFixed(2)}%</td>
                      <td className="py-2 px-2 text-right text-slate-400">
                        {pt.residual_bps > 0 ? "+" : ""}{pt.residual_bps.toFixed(1)}
                      </td>
                      <td className="py-2 px-2 text-right text-emerald-400">
                        {pt.durrleman_density.toFixed(4)}
                      </td>
                      <td className={`py-2 px-2 text-right ${selectedGreek === "delta" ? "text-amber-300 font-bold bg-amber-500/10" : "text-slate-300"}`}>
                        {pt.call_delta.toFixed(3)}
                      </td>
                      <td className={`py-2 px-2 text-right ${selectedGreek === "delta" ? "text-amber-300 font-bold bg-amber-500/10" : "text-slate-300"}`}>
                        {pt.put_delta.toFixed(3)}
                      </td>
                      <td className={`py-2 px-2 text-right ${selectedGreek === "gamma" ? "text-amber-300 font-bold bg-amber-500/10" : "text-slate-400"}`}>
                        {pt.gamma.toFixed(5)}
                      </td>
                      <td className={`py-2 px-2 text-right ${selectedGreek === "vega" ? "text-amber-300 font-bold bg-amber-500/10" : "text-slate-300"}`}>
                        {pt.vega.toFixed(2)}
                      </td>
                      <td className={`py-2 px-2 text-right ${selectedGreek === "theta" ? "text-amber-300 font-bold bg-amber-500/10" : "text-slate-400"}`}>
                        {pt.theta.toFixed(1)}
                      </td>
                      <td className={`py-2 px-2 text-right ${selectedGreek === "vanna" ? "text-amber-300 font-bold bg-amber-500/10" : "text-slate-400"}`}>
                        {pt.vanna.toFixed(5)}
                      </td>
                      <td className={`py-2 px-2 text-right ${selectedGreek === "volga" ? "text-amber-300 font-bold bg-amber-500/10" : "text-slate-400"}`}>
                        {pt.volga.toFixed(5)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
