import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Candle, ZigZagPoint, IndexInfo, ActionableTradePlan } from "../types";
import { Maximize2, Layers, Compass, Eye, ShieldAlert, ArrowDownRight, ArrowUpRight, Crosshair, Target } from "lucide-react";

interface InteractiveChartProps {
  index: IndexInfo;
  candles: Candle[];
  zigzagPoints: ZigZagPoint[];
  activePlan: ActionableTradePlan | null;
  timeframe: string;
  onChangeTimeframe: (tf: string) => void;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  index,
  candles,
  zigzagPoints,
  activePlan,
  timeframe,
  onChangeTimeframe,
}) => {
  const [showVWAP, setShowVWAP] = useState(true);
  const [showZigZag, setShowZigZag] = useState(true);
  const [showFVG, setShowFVG] = useState(true);
  const [showPrecisionVector, setShowPrecisionVector] = useState(true);
  const [chartMode, setChartMode] = useState<"PRICE_ZIGZAG" | "CVD_FLOW">("PRICE_ZIGZAG");

  if (!candles || candles.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        Loading real-time market structure...
      </div>
    );
  }

  const latest = candles[candles.length - 1];
  const minPrice = Math.min(...candles.map((c) => c.low)) * 0.998;
  const maxPrice = Math.max(...candles.map((c) => c.high)) * 1.002;

  // Prepare chart series data
  const chartData = useMemo(() => {
    return candles.map((c) => {
      // Check if this candle is a ZigZag pivot
      const zigZag = zigzagPoints.find((z) => z.timestamp === c.timestamp);

      return {
        timestamp: c.timestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
        vwap: c.vwap,
        vwapUpper: Number((c.vwap * 1.0025).toFixed(2)),
        vwapLower: Number((c.vwap * 0.9975).toFixed(2)),
        cumDelta: c.cumDelta,
        hftDelta: c.hftDelta,
        zigzagPrice: zigZag ? zigZag.price : undefined,
        zigzagType: zigZag ? zigZag.type : undefined,
        isGreen: c.close >= c.open,
        fvgZone: c.fvgZone,
        orderBlock: c.orderBlock,
      };
    });
  }, [candles, zigzagPoints]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded shadow-2xl overflow-hidden flex flex-col">
      {/* Chart Control Toolbar */}
      <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-bold uppercase tracking-[0.2em] text-slate-300 flex items-center gap-2 text-[11px]">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>ZigZag Wave Equilibrium & Microstructure Flow</span>
          </span>

          {/* Timeframe selector */}
          <div className="flex items-center bg-slate-900 rounded border border-slate-800 p-0.5">
            {["1m", "3m", "5m", "15m", "1H"].map((tf) => (
              <button
                key={tf}
                onClick={() => onChangeTimeframe(tf)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-medium transition-all ${
                  timeframe === tf
                    ? "bg-indigo-600 text-white shadow-[0_0_8px_rgba(79,70,229,0.5)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Layer Toggles & Mode */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPrecisionVector(!showPrecisionVector)}
            className={`px-2.5 py-1 rounded border text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
              showPrecisionVector
                ? "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                : "bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400"
            }`}
          >
            <Crosshair className="w-3 h-3" />
            <span>Pinpoint Vector</span>
          </button>

          <button
            onClick={() => setShowZigZag(!showZigZag)}
            className={`px-2.5 py-1 rounded border text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
              showZigZag
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400"
            }`}
          >
            <span>ZigZag Swings</span>
          </button>

          <button
            onClick={() => setShowVWAP(!showVWAP)}
            className={`px-2.5 py-1 rounded border text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
              showVWAP
                ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                : "bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400"
            }`}
          >
            <span>VWAP Bands</span>
          </button>

          <button
            onClick={() => setShowFVG(!showFVG)}
            className={`px-2.5 py-1 rounded border text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
              showFVG
                ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                : "bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400"
            }`}
          >
            <span>FVG / OB Zones</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-800"></div>

          <button
            onClick={() =>
              setChartMode(
                chartMode === "PRICE_ZIGZAG" ? "CVD_FLOW" : "PRICE_ZIGZAG"
              )
            }
            className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 font-mono text-[10px] font-bold uppercase tracking-wider transition-all"
          >
            {chartMode === "PRICE_ZIGZAG" ? "View CVD Delta" : "View Price Wave"}
          </button>
        </div>
      </div>

      {/* Main Chart Canvas with dot grid background */}
      <div className="p-3 w-full h-[380px] bg-slate-950 bg-dot-grid relative">
        {/* Confirmed Signal Live Overlay Legend */}
        {activePlan && (
          <div className="absolute top-4 left-4 z-10 bg-slate-950/95 border border-slate-800 rounded p-3 shadow-2xl text-xs max-w-xs pointer-events-none backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-slate-800">
              <span className="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1">
                <Crosshair className="w-3 h-3 text-amber-400" />
                PIERCING VECTOR
              </span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider ${
                  activePlan.direction === "BULLISH"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                }`}
              >
                {activePlan.direction === "BULLISH" ? "DIP BUY CONFIRMED" : "TOP SELL CONFIRMED"}
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              {activePlan.precisionVector && (
                <div className="flex justify-between text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 mb-1">
                  <span>Arrow Edge Score:</span>
                  <span>{activePlan.precisionVector.arrowPiercingScore}/100</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Entry Spot:</span>
                <span className="text-white font-bold">{index.currency}{activePlan.entrySpotPrice}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Target 1 (1.272 Fib):</span>
                <span className="font-bold">{index.currency}{activePlan.target1}</span>
              </div>
              <div className="flex justify-between text-emerald-300">
                <span>Target 2 (1.618 Fib):</span>
                <span className="font-bold">{index.currency}{activePlan.target2}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>1-Tick Invalidation:</span>
                <span className="font-bold">{index.currency}{activePlan.stopLoss}</span>
              </div>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          {chartMode === "PRICE_ZIGZAG" ? (
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis
                dataKey="timestamp"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                orientation="right"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(val) => `${index.currency}${val}`}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 shadow-2xl text-xs font-mono text-slate-200">
                        <div className="font-bold text-slate-300 mb-1 border-b border-slate-800 pb-1">
                          Time: {d.timestamp}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                          <div className="text-slate-400">Open: <span className="text-white">{d.open}</span></div>
                          <div className="text-slate-400">Close: <span className={d.isGreen ? "text-emerald-400" : "text-rose-400"}>{d.close}</span></div>
                          <div className="text-slate-400">High: <span className="text-white">{d.high}</span></div>
                          <div className="text-slate-400">Low: <span className="text-white">{d.low}</span></div>
                          <div className="text-slate-400">VWAP: <span className="text-blue-400">{d.vwap}</span></div>
                          <div className="text-slate-400">HFT Delta: <span className={d.hftDelta > 0 ? "text-emerald-400" : "text-rose-400"}>{d.hftDelta > 0 ? "+" : ""}{d.hftDelta}</span></div>
                        </div>
                        {d.zigzagType && (
                          <div className={`mt-2 font-bold p-1 rounded text-center text-[10px] ${
                            d.zigzagType === "VALLEY" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-rose-950 text-rose-300 border border-rose-800"
                          }`}>
                            {d.zigzagType === "VALLEY" ? "🟢 ZIGZAG DIP CONFIRMED (BUY ZONE)" : "🔴 ZIGZAG TOP CONFIRMED (SELL ZONE)"}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Price Line */}
              <Line
                type="monotone"
                dataKey="close"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
                name="Spot Price"
                isAnimationActive={false}
              />

              {/* Anchored VWAP and Bands */}
              {showVWAP && (
                <>
                  <Line
                    type="monotone"
                    dataKey="vwap"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={false}
                    name="VWAP"
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="vwapUpper"
                    stroke="#3b82f6"
                    strokeWidth={1}
                    strokeOpacity={0.4}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="vwapLower"
                    stroke="#3b82f6"
                    strokeWidth={1}
                    strokeOpacity={0.4}
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}

              {/* ZigZag Peak and Valley Points */}
              {showZigZag && (
                <Line
                  type="linear"
                  dataKey="zigzagPrice"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  connectNulls={true}
                  isAnimationActive={false}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (!payload || payload.zigzagPrice === undefined || cx === undefined || cy === undefined) {
                      return <circle key={`dot-empty-${cx || 0}-${cy || 0}`} r={0} />;
                    }
                    const isValley = payload.zigzagType === "VALLEY";
                    return (
                      <g key={`zigzag-${cx}-${cy}`}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill={isValley ? "#10b981" : "#f43f5e"}
                          stroke="#ffffff"
                          strokeWidth={1.5}
                        />
                        <text
                          x={cx}
                          y={isValley ? cy + 16 : cy - 10}
                          fill={isValley ? "#34d399" : "#fb7185"}
                          fontSize={9}
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {isValley ? "BUY DIP" : "SELL TOP"}
                        </text>
                      </g>
                    );
                  }}
                  name="ZigZag Swings"
                />
              )}

              {/* Pinpoint Precision Reference Bands & Lines */}
              {showPrecisionVector && activePlan?.precisionVector && (
                <>
                  {/* Precision Entry Range Bounds */}
                  <ReferenceLine
                    y={activePlan.precisionVector.entryZoneRange.optimalTick}
                    stroke={activePlan.direction === "BULLISH" ? "#34d399" : "#fb7185"}
                    strokeDasharray="2 2"
                    strokeWidth={1.5}
                    label={{
                      value: `🎯 Optimal Tick (${activePlan.precisionVector.entryZoneRange.optimalTick})`,
                      fill: activePlan.direction === "BULLISH" ? "#34d399" : "#fb7185",
                      fontSize: 9,
                      position: "right",
                    }}
                  />

                  {/* Volume Profile POC Reference Line */}
                  <ReferenceLine
                    y={activePlan.precisionVector.goldenPocket.pocPrice}
                    stroke="#a855f7"
                    strokeDasharray="5 3"
                    strokeWidth={1.2}
                    label={{ value: "VPOC Magnet", fill: "#c084fc", fontSize: 9, position: "insideRight" }}
                  />

                  {/* 0.618 Golden Pocket Reference Line */}
                  <ReferenceLine
                    y={activePlan.precisionVector.goldenPocket.fib618}
                    stroke="#f59e0b"
                    strokeDasharray="4 2"
                    strokeWidth={1.2}
                    label={{ value: "0.618 Golden Pocket", fill: "#fbbf24", fontSize: 9, position: "insideLeft" }}
                  />
                </>
              )}

              {/* Target & Stop Loss Horizontal Lines */}
              {activePlan && (
                <>
                  <ReferenceLine
                    y={activePlan.target1}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{ value: "🎯 Target 1 (1.272 Fib)", fill: "#34d399", fontSize: 10, position: "left" }}
                  />
                  <ReferenceLine
                    y={activePlan.target2}
                    stroke="#059669"
                    strokeDasharray="4 2"
                    label={{ value: "🎯 Target 2 (1.618 Fib)", fill: "#10b981", fontSize: 10, position: "left" }}
                  />
                  <ReferenceLine
                    y={activePlan.stopLoss}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    label={{ value: "🛑 1-Tick Invalidation", fill: "#f87171", fontSize: 10, position: "left" }}
                  />
                </>
              )}
            </ComposedChart>
          ) : (
            /* Cumulative Volume Delta (CVD) Order Flow View */
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis
                orientation="right"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(val) => `${val > 0 ? "+" : ""}${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200">
                        <div>Time: {d.timestamp}</div>
                        <div className="text-cyan-400 font-bold">
                          Cumulative Delta: {d.cumDelta > 0 ? "+" : ""}{d.cumDelta.toLocaleString()}
                        </div>
                        <div className={d.hftDelta > 0 ? "text-emerald-400" : "text-rose-400"}>
                          Bar Delta: {d.hftDelta > 0 ? "+" : ""}{d.hftDelta.toLocaleString()}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="#475569" />
              <Line
                type="monotone"
                dataKey="cumDelta"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={false}
                name="Cumulative Volume Delta"
                isAnimationActive={false}
              />
              <Bar
                dataKey="hftDelta"
                fill="#3b82f6"
                opacity={0.7}
                name="Bar HFT Net Flow"
                isAnimationActive={false}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Sub-bar Structure Stats */}
      <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            Current Spot: <span className="text-white font-bold">{index.currency}{latest.close}</span>
          </span>
          <span>
            Anchored VWAP: <span className="text-amber-400">{index.currency}{latest.vwap}</span>
          </span>
          <span>
            Intraday RSI (14): <span className={latest.rsi > 70 ? "text-rose-400 font-bold" : latest.rsi < 30 ? "text-emerald-400 font-bold" : "text-slate-200"}>{latest.rsi}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Confirmed Dip Buy: Golden Pocket
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span> Confirmed Top Sell: Liquidity Sweep
          </span>
        </div>
      </div>
    </div>
  );
};
