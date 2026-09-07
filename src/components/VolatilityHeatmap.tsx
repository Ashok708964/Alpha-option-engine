import React, { useState, useMemo } from "react";
import { OptionContract, IndexInfo } from "../types";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Area,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Info,
  Layers,
  Sparkles,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface VolatilityHeatmapProps {
  index: IndexInfo;
  calls: OptionContract[];
  puts: OptionContract[];
  atmStrike: number;
  onSelectOption: (contract: OptionContract) => void;
}

export interface StrikeVolatilityMetrics {
  strike: number;
  moneyness: "ITM" | "ATM" | "OTM";
  callIV: number;
  putIV: number;
  avgIV: number;
  callSkewDiff: number; // vs ATM baseline in %
  putSkewDiff: number; // vs ATM baseline in %
  callStatus: "OVERPRICED" | "FAIR" | "UNDERPRICED";
  putStatus: "OVERPRICED" | "FAIR" | "UNDERPRICED";
  callContract: OptionContract;
  putContract: OptionContract;
  callScore: number;
  putScore: number;
  callOI: number;
  putOI: number;
  callDelta: number;
  putDelta: number;
  callVega: number;
  putVega: number;
}

export const VolatilityHeatmap: React.FC<VolatilityHeatmapProps> = ({
  index,
  calls,
  puts,
  atmStrike,
  onSelectOption,
}) => {
  const [selectedSide, setSelectedSide] = useState<"BOTH" | "CALLS" | "PUTS">("BOTH");
  const [selectedStrikeHover, setSelectedStrikeHover] = useState<number | null>(null);

  // ATM Baseline IV
  const atmCall = calls.find((c) => c.strike === atmStrike) || calls[Math.floor(calls.length / 2)];
  const atmIV = (atmCall?.greeks.iv || index.baseIV) * 100;

  // Process IV Skew and relative pricing metrics for all strikes
  const metrics: StrikeVolatilityMetrics[] = useMemo(() => {
    return calls.map((call, i) => {
      const put = puts[i] || puts[0];
      const strike = call.strike;
      const callIV = Number((call.greeks.iv * 100).toFixed(2));
      const putIV = Number((put.greeks.iv * 100).toFixed(2));
      const avgIV = Number(((callIV + putIV) / 2).toFixed(2));

      const callSkewDiff = Number((callIV - atmIV).toFixed(2));
      const putSkewDiff = Number((putIV - atmIV).toFixed(2));

      // Overpriced if IV is elevated > +3.0% vs ATM baseline
      // Underpriced if IV is discounted < -1.0% or noticeably lower relative to standard volatility smile
      const getStatus = (diff: number): "OVERPRICED" | "FAIR" | "UNDERPRICED" => {
        if (diff > 2.8) return "OVERPRICED";
        if (diff < -1.2) return "UNDERPRICED";
        return "FAIR";
      };

      const moneyness: "ITM" | "ATM" | "OTM" =
        strike === atmStrike ? "ATM" : strike < atmStrike ? "ITM" : "OTM";

      return {
        strike,
        moneyness,
        callIV,
        putIV,
        avgIV,
        callSkewDiff,
        putSkewDiff,
        callStatus: getStatus(callSkewDiff),
        putStatus: getStatus(putSkewDiff),
        callContract: call,
        putContract: put,
        callScore: call.score,
        putScore: put.score,
        callOI: call.oi,
        putOI: put.oi,
        callDelta: call.greeks.delta,
        putDelta: put.greeks.delta,
        callVega: call.greeks.vega,
        putVega: put.greeks.vega,
      };
    });
  }, [calls, puts, atmStrike, atmIV]);

  // Find extremes for skew summary
  const mostOverpricedCall = useMemo(
    () => [...metrics].sort((a, b) => b.callSkewDiff - a.callSkewDiff)[0],
    [metrics]
  );
  const mostUnderpricedCall = useMemo(
    () => [...metrics].sort((a, b) => a.callSkewDiff - b.callSkewDiff)[0],
    [metrics]
  );
  const mostOverpricedPut = useMemo(
    () => [...metrics].sort((a, b) => b.putSkewDiff - a.putSkewDiff)[0],
    [metrics]
  );
  const mostUnderpricedPut = useMemo(
    () => [...metrics].sort((a, b) => a.putSkewDiff - b.putSkewDiff)[0],
    [metrics]
  );

  // 25-Delta Put Skew vs 25-Delta Call Skew
  const delta25Put = metrics.find((m) => Math.abs(m.putDelta - -0.25) < 0.15) || metrics[metrics.length - 2];
  const delta25Call = metrics.find((m) => Math.abs(m.callDelta - 0.25) < 0.15) || metrics[1];
  const putCallSkewRatio = delta25Put && delta25Call ? (delta25Put.putIV / (delta25Call.callIV || 1)).toFixed(2) : "1.12";

  // Color mapper for heatmap tiles based on IV percentage and skew
  const getIVHeatColor = (ivVal: number, status: "OVERPRICED" | "FAIR" | "UNDERPRICED") => {
    if (status === "OVERPRICED") {
      return {
        bg: "bg-rose-950/70 hover:bg-rose-900/80 border-rose-500/50",
        text: "text-rose-300",
        badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        label: "Overpriced (Sell Bias)",
      };
    }
    if (status === "UNDERPRICED") {
      return {
        bg: "bg-emerald-950/70 hover:bg-emerald-900/80 border-emerald-500/50",
        text: "text-emerald-300",
        badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        label: "Underpriced (Buy Bias)",
      };
    }
    return {
      bg: "bg-slate-900 hover:bg-slate-850 border-slate-800",
      text: "text-indigo-300",
      badge: "bg-slate-800 text-slate-400 border-slate-700",
      label: "Fair Market IV",
    };
  };

  // Chart data for IV Curve
  const chartData = useMemo(() => {
    return metrics.map((m) => ({
      strike: m.strike,
      callIV: m.callIV,
      putIV: m.putIV,
      atmBaseline: atmIV,
      strikeLabel: `${m.strike}`,
      callDelta: m.callDelta,
      putDelta: m.putDelta,
      callSkew: m.callSkewDiff,
      putSkew: m.putSkewDiff,
    }));
  }, [metrics, atmIV]);

  return (
    <div
      id="volatility-heatmap-container"
      className="bg-slate-950 border border-slate-800 rounded p-4 shadow-2xl space-y-4 font-sans"
    >
      {/* Top Title & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-rose-950/60 border border-rose-700/50 flex items-center justify-center text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Implied Volatility (IV) Skew & Mispricing Heatmap
              </h3>
              <span className="bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                Smile Surface
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Detect rich (over-priced) vs cheap (under-priced) option contracts across strike moneyness
            </p>
          </div>
        </div>

        {/* View Selection Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded border border-slate-800 text-[10px] font-mono">
          <span className="text-slate-500 px-1 font-sans uppercase font-bold">Filter:</span>
          <button
            onClick={() => setSelectedSide("BOTH")}
            className={`px-2.5 py-1 rounded transition-all ${
              selectedSide === "BOTH"
                ? "bg-indigo-600 text-white font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Strikes
          </button>
          <button
            onClick={() => setSelectedSide("CALLS")}
            className={`px-2.5 py-1 rounded transition-all ${
              selectedSide === "CALLS"
                ? "bg-emerald-600 text-white font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Calls (CE)
          </button>
          <button
            onClick={() => setSelectedSide("PUTS")}
            className={`px-2.5 py-1 rounded transition-all ${
              selectedSide === "PUTS"
                ? "bg-rose-600 text-white font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Puts (PE)
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        {/* ATM Baseline */}
        <div className="bg-slate-900 border border-slate-800 rounded p-3 border-l-2 border-l-indigo-500">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-sans font-bold block">
            ATM Benchmark IV
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-indigo-400">{atmIV.toFixed(1)}%</span>
            <span className="text-[10px] text-slate-400 font-sans">Strike {atmStrike}</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-0.5">Reference baseline for skew calculation</p>
        </div>

        {/* 25D Put/Call Skew Ratio */}
        <div className="bg-slate-900 border border-slate-800 rounded p-3 border-l-2 border-l-amber-500">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-sans font-bold block">
            Put/Call Skew Ratio
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-amber-300">{putCallSkewRatio}x</span>
            <span className="text-[10px] text-amber-400 font-sans">
              {Number(putCallSkewRatio) > 1.05 ? "Put Heavy (Tail Hedging)" : "Balanced"}
            </span>
          </div>
          <p className="text-[9px] text-slate-500 mt-0.5">25-Delta OTM Put IV ÷ 25-Delta Call IV</p>
        </div>

        {/* Most Underpriced (Best Buy) */}
        <div className="bg-slate-900 border border-slate-800 rounded p-3 border-l-2 border-l-emerald-500">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-sans font-bold block">
            Cheapest IV Discount
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-emerald-400">
              {mostUnderpricedCall?.strike} CE
            </span>
            <span className="text-[10px] text-emerald-300 font-sans">
              {mostUnderpricedCall?.callIV}% ({mostUnderpricedCall?.callSkewDiff}% vs ATM)
            </span>
          </div>
          <p className="text-[9px] text-emerald-400/80 mt-0.5 flex items-center gap-1 font-sans">
            <CheckCircle2 className="w-2.5 h-2.5" /> High gamma edge / low volatility drag
          </p>
        </div>

        {/* Most Overpriced (Best Sell) */}
        <div className="bg-slate-900 border border-slate-800 rounded p-3 border-l-2 border-l-rose-500">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-sans font-bold block">
            Richest IV Premium
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-rose-400">
              {mostOverpricedPut?.strike} PE
            </span>
            <span className="text-[10px] text-rose-300 font-sans">
              {mostOverpricedPut?.putIV}% (+{mostOverpricedPut?.putSkewDiff}%)
            </span>
          </div>
          <p className="text-[9px] text-rose-400/80 mt-0.5 flex items-center gap-1 font-sans">
            <AlertTriangle className="w-2.5 h-2.5" /> Prime for credit spreads & option writing
          </p>
        </div>
      </div>

      {/* Volatility Smile Curve Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Implied Volatility Smile & Skew Curve
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <span>Call IV Curve</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
              <span>Put IV Curve</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-400">
              <div className="w-2.5 h-0.5 bg-indigo-400"></div>
              <span>ATM Baseline ({atmIV.toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="strike"
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
              />
              <YAxis
                domain={["auto", "auto"]}
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = metrics.find((m) => m.strike === Number(label));
                  if (!item) return null;

                  return (
                    <div className="bg-slate-950 border border-slate-800 rounded p-2.5 shadow-2xl font-mono text-xs space-y-1.5 z-50">
                      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-1">
                        <span className="font-bold text-white">Strike {label}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-sans font-bold uppercase ${
                            item.moneyness === "ATM"
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {item.moneyness}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div>
                          <span className="text-emerald-400 font-bold block">Call Option (CE):</span>
                          <div className="text-slate-300">IV: {item.callIV}%</div>
                          <div className="text-slate-400 text-[10px]">Δ: {item.callDelta.toFixed(2)} | Skew: {item.callSkewDiff > 0 ? `+${item.callSkewDiff}` : item.callSkewDiff}%</div>
                          <div className={`text-[9px] font-bold mt-0.5 ${item.callStatus === "UNDERPRICED" ? "text-emerald-400" : item.callStatus === "OVERPRICED" ? "text-rose-400" : "text-slate-400"}`}>
                            {item.callStatus}
                          </div>
                        </div>

                        <div>
                          <span className="text-rose-400 font-bold block">Put Option (PE):</span>
                          <div className="text-slate-300">IV: {item.putIV}%</div>
                          <div className="text-slate-400 text-[10px]">Δ: {item.putDelta.toFixed(2)} | Skew: {item.putSkewDiff > 0 ? `+${item.putSkewDiff}` : item.putSkewDiff}%</div>
                          <div className={`text-[9px] font-bold mt-0.5 ${item.putStatus === "UNDERPRICED" ? "text-emerald-400" : item.putStatus === "OVERPRICED" ? "text-rose-400" : "text-slate-400"}`}>
                            {item.putStatus}
                          </div>
                        </div>
                      </div>

                      <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-800 font-sans">
                        Click contract below to load into Payoff Simulator
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={atmIV}
                stroke="#6366f1"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: "ATM Benchmark",
                  fill: "#818cf8",
                  fontSize: 9,
                  position: "insideTopRight",
                }}
              />
              <ReferenceLine
                x={atmStrike}
                stroke="#475569"
                strokeDasharray="2 2"
                label={{
                  value: "ATM",
                  fill: "#94a3b8",
                  fontSize: 9,
                  position: "top",
                }}
              />
              <Line
                type="monotone"
                dataKey="callIV"
                name="Call IV %"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#10b981" }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="putIV"
                name="Put IV %"
                stroke="#f43f5e"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#f43f5e" }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Volatility Heatmap Strike Matrix Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Strike-By-Strike Volatility Heatmap Matrix
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500"></span>
              <span>Underpriced (Cheap IV)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700"></span>
              <span>Fair Market IV</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-500"></span>
              <span>Overpriced (Rich IV)</span>
            </span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {metrics.map((m) => {
            const isATM = m.strike === atmStrike;
            const callStyle = getIVHeatColor(m.callIV, m.callStatus);
            const putStyle = getIVHeatColor(m.putIV, m.putStatus);

            return (
              <div
                key={m.strike}
                className={`bg-slate-900/90 border rounded p-2.5 transition-all space-y-2 ${
                  isATM
                    ? "border-indigo-500/80 shadow-[0_0_15px_rgba(99,102,241,0.15)] bg-slate-900"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Strike Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-white">
                      {m.strike}
                    </span>
                    {isATM && (
                      <span className="text-[8px] font-mono font-bold bg-indigo-600 text-white px-1.5 py-0.2 rounded uppercase">
                        ATM Spot
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Avg IV: <strong className="text-slate-200">{m.avgIV}%</strong>
                  </span>
                </div>

                {/* Dual Call and Put Heatmap Cells */}
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  {/* Call Box */}
                  {(selectedSide === "BOTH" || selectedSide === "CALLS") && (
                    <div
                      onClick={() => onSelectOption(m.callContract)}
                      className={`p-2 rounded border cursor-pointer transition-all ${callStyle.bg} flex flex-col justify-between space-y-1.5`}
                      title="Click to load Call Payoff Simulator"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-emerald-400">CALL (CE)</span>
                        <span className="text-slate-400 font-bold">₹{m.callContract.ltp}</span>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <span className={`text-sm font-bold ${callStyle.text}`}>
                          {m.callIV}% IV
                        </span>
                        <span className="text-[9px] text-slate-400">
                          Δ {m.callDelta.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/50 text-[9px]">
                        <span className={`px-1 py-0.2 rounded border font-bold ${callStyle.badge}`}>
                          {m.callStatus === "UNDERPRICED"
                            ? "CHEAP IV"
                            : m.callStatus === "OVERPRICED"
                            ? "RICH IV"
                            : "FAIR"}
                        </span>
                        <span className="text-slate-500 font-sans">
                          {m.callSkewDiff > 0 ? `+${m.callSkewDiff}%` : `${m.callSkewDiff}%`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Put Box */}
                  {(selectedSide === "BOTH" || selectedSide === "PUTS") && (
                    <div
                      onClick={() => onSelectOption(m.putContract)}
                      className={`p-2 rounded border cursor-pointer transition-all ${putStyle.bg} flex flex-col justify-between space-y-1.5`}
                      title="Click to load Put Payoff Simulator"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-rose-400">PUT (PE)</span>
                        <span className="text-slate-400 font-bold">₹{m.putContract.ltp}</span>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <span className={`text-sm font-bold ${putStyle.text}`}>
                          {m.putIV}% IV
                        </span>
                        <span className="text-[9px] text-slate-400">
                          Δ {m.putDelta.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/50 text-[9px]">
                        <span className={`px-1 py-0.2 rounded border font-bold ${putStyle.badge}`}>
                          {m.putStatus === "UNDERPRICED"
                            ? "CHEAP IV"
                            : m.putStatus === "OVERPRICED"
                            ? "RICH IV"
                            : "FAIR"}
                        </span>
                        <span className="text-slate-500 font-sans">
                          {m.putSkewDiff > 0 ? `+${m.putSkewDiff}%` : `${m.putSkewDiff}%`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quantitative Insight Footer */}
      <div className="bg-slate-900 border border-slate-800 rounded p-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-sans">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>
            <strong className="text-slate-200 font-mono">Volatility Exploitation Rule:</strong> Buy options with discounted IV (Green) for directional momentum; Write options or enter Credit Spreads at rich IV strikes (Rose) to capture inflated volatility premium.
          </span>
        </div>
        <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
          Click any heatmap card to simulate payoff
        </div>
      </div>
    </div>
  );
};
