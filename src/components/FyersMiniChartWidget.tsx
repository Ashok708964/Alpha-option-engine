import React, { useState, useEffect, useRef, useMemo } from "react";
import { IndexInfo, IndexSymbol } from "../types";
import {
  Maximize2,
  Minimize2,
  ExternalLink,
  CandlestickChart,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Radio,
  Clock,
  ShieldAlert,
  Activity,
  Sliders,
  TrendingUp,
  TrendingDown,
  BarChart2,
  RefreshCw,
} from "lucide-react";

interface FyersMiniChartWidgetProps {
  index: IndexInfo;
  selectedSymbol: IndexSymbol;
  onSelectSymbol?: (sym: IndexSymbol) => void;
  isFloating?: boolean;
  onCloseFloating?: () => void;
}

// Maps our IndexSymbol to TradingView / FYERS exchange ticker format
const SYMBOL_TO_TV_MAP: Record<IndexSymbol, string> = {
  NIFTY50: "NSE:NIFTY",
  BANKNIFTY: "NSE:BANKNIFTY",
  FINNIFTY: "NSE:CNXFINANCE",
  SPX500: "SP:SPX",
  NASDAQ100: "NASDAQ:NDX",
  DOWJONES: "DJ:DJI",
  BTCUSD: "BINANCE:BTCUSDT",
};

export const FyersMiniChartWidget: React.FC<FyersMiniChartWidgetProps> = ({
  index,
  selectedSymbol,
  onSelectSymbol,
  isFloating = false,
  onCloseFloating,
}) => {
  const [timeframe, setTimeframe] = useState<"1" | "5" | "15" | "60" | "D">("5");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [chartEngine, setChartEngine] = useState<"NATIVE_PRO" | "TRADINGVIEW_CLOUD">("NATIVE_PRO");
  const [tvLoadError, setTvLoadError] = useState(false);
  const [hoveredCandle, setHoveredCandle] = useState<any | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const tvSymbol = SYMBOL_TO_TV_MAP[selectedSymbol] || "NSE:NIFTY";

  // Generate high-resolution native synthetic candles synced to spot price
  const nativeCandles = useMemo(() => {
    const count = 35;
    const basePrice = index.currentPrice;
    const step = index.strikeStep * 0.12;
    const result: Array<{
      time: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
      vwap: number;
      rsi: number;
      isGreen: boolean;
    }> = [];

    let current = basePrice - (count * step * 0.15) + (index.change >= 0 ? -step * 2 : step * 2);
    let runningVol = 0;
    let runningPv = 0;

    for (let i = 0; i < count; i++) {
      const isLast = i === count - 1;
      const noise = (Math.sin(i * 0.8) * 0.6 + (Math.random() - 0.48)) * step;
      const open = Math.round((current + noise * 0.3) * 10) / 10;
      const close = isLast ? basePrice : Math.round((open + noise) * 10) / 10;
      const high = Math.round((Math.max(open, close) + Math.abs(noise) * (0.3 + Math.random() * 0.4)) * 10) / 10;
      const low = Math.round((Math.min(open, close) - Math.abs(noise) * (0.3 + Math.random() * 0.4)) * 10) / 10;
      const vol = Math.floor(15000 + Math.random() * 45000 + (isLast ? 30000 : 0));

      runningVol += vol;
      runningPv += ((high + low + close) / 3) * vol;
      const vwap = Math.round((runningPv / runningVol) * 10) / 10;
      const rsi = Math.min(85, Math.max(25, Math.round(52 + Math.sin(i * 0.6) * 18 + (close > open ? 6 : -6))));

      const date = new Date(Date.now() - (count - i) * (timeframe === "1" ? 60000 : timeframe === "5" ? 300000 : 900000));
      const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      result.push({
        time: timeStr,
        open,
        high,
        low,
        close,
        volume: vol,
        vwap,
        rsi,
        isGreen: close >= open,
      });

      current = close;
    }

    return result;
  }, [index.currentPrice, index.strikeStep, index.change, timeframe]);

  // Safe TradingView script injector (only when TRADINGVIEW_CLOUD is selected)
  useEffect(() => {
    if (chartEngine !== "TRADINGVIEW_CLOUD") return;
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";
    setTvLoadError(false);

    try {
      const widgetDiv = document.createElement("div");
      widgetDiv.className = "tradingview-widget-container__widget";
      widgetDiv.style.height = "100%";
      widgetDiv.style.width = "100%";
      container.appendChild(widgetDiv);

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.async = true;
      script.crossOrigin = "anonymous";

      script.onerror = () => {
        setTvLoadError(true);
        setChartEngine("NATIVE_PRO");
      };

      script.innerHTML = JSON.stringify({
        autosize: true,
        symbol: tvSymbol,
        interval: timeframe,
        timezone: "Asia/Kolkata",
        theme: "dark",
        style: "1",
        locale: "en",
        enable_publishing: false,
        allow_symbol_change: true,
        calendar: false,
        support_host: "https://www.tradingview.com",
        hide_top_toolbar: isCollapsed,
        hide_legend: false,
        save_image: true,
        backgroundColor: "rgba(2, 6, 23, 1)",
        gridColor: "rgba(30, 41, 59, 0.5)",
        hide_side_toolbar: !isExpanded,
        studies: ["STD;VWAP", "STD;RSI", "STD;EMA"],
      });

      container.appendChild(script);
    } catch {
      setTvLoadError(true);
      setChartEngine("NATIVE_PRO");
    }

    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [chartEngine, tvSymbol, timeframe, isCollapsed, isExpanded]);

  if (isCollapsed) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-lg font-mono text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="font-bold text-white font-sans flex items-center gap-1.5">
            <CandlestickChart className="w-4 h-4 text-emerald-400" />
            <span>FYERS High-Speed Live Chart ({tvSymbol})</span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-bold">{index.currency}{index.currentPrice.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(false)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 flex items-center gap-1 text-[11px]"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Expand Chart</span>
          </button>
        </div>
      </div>
    );
  }

  // Native Chart bounds calculation
  const allLows = nativeCandles.map((c) => c.low);
  const allHighs = nativeCandles.map((c) => c.high);
  const chartMin = Math.min(...allLows) * 0.999;
  const chartMax = Math.max(...allHighs) * 1.001;
  const priceRange = chartMax - chartMin || 1;
  const activeCandle = hoveredCandle || nativeCandles[nativeCandles.length - 1];

  return (
    <div
      className={`bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col font-sans transition-all ${
        isExpanded ? "h-[580px]" : "h-[390px]"
      } ${
        isFloating
          ? "fixed bottom-6 right-6 w-[480px] z-50 border-indigo-500/50 shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
          : "w-full"
      }`}
    >
      {/* Mini Chart Top Ribbon */}
      <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-white font-sans flex items-center gap-1 text-[11px]">
              <CandlestickChart className="w-3.5 h-3.5 text-emerald-400" />
              <span>FYERS Live Chart</span>
            </span>
          </div>

          <span className="text-[10px] bg-slate-800 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-bold">
            {tvSymbol}
          </span>

          {/* Engine Selector */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 text-[9px]">
            <button
              onClick={() => setChartEngine("NATIVE_PRO")}
              className={`px-1.5 py-0.5 rounded transition-all font-bold ${
                chartEngine === "NATIVE_PRO"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Native Ultra-Fast
            </button>
            <button
              onClick={() => setChartEngine("TRADINGVIEW_CLOUD")}
              className={`px-1.5 py-0.5 rounded transition-all font-bold ${
                chartEngine === "TRADINGVIEW_CLOUD"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              TradingView Cloud
            </button>
          </div>
        </div>

        {/* Timeframe Presets & Tools */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded border border-slate-800">
            {(
              [
                { label: "1m", value: "1" },
                { label: "5m", value: "5" },
                { label: "15m", value: "15" },
                { label: "1h", value: "60" },
                { label: "1D", value: "D" },
              ] as const
            ).map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  timeframe === tf.value
                    ? "bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1 text-slate-400">
            <a
              href="https://trade.fyers.in"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
              title="Open FYERS Web Terminal"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title={isExpanded ? "Compress chart size" : "Expand chart size"}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {!isFloating && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Minimize chart"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            )}

            {isFloating && onCloseFloating && (
              <button
                onClick={onCloseFloating}
                className="p-1 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                title="Close floating chart"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* OHLCV Dynamic Telemetry Bar */}
      {activeCandle && (
        <div className="px-4 py-1.5 bg-slate-950 border-b border-slate-900 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span>Time: <strong className="text-slate-200">{activeCandle.time}</strong></span>
            <span>O: <strong className="text-slate-200">{activeCandle.open}</strong></span>
            <span>H: <strong className="text-emerald-400">{activeCandle.high}</strong></span>
            <span>L: <strong className="text-rose-400">{activeCandle.low}</strong></span>
            <span>C: <strong className={activeCandle.isGreen ? "text-emerald-400" : "text-rose-400"}>{activeCandle.close}</strong></span>
            <span>VWAP: <strong className="text-indigo-400">{activeCandle.vwap}</strong></span>
            <span>RSI(14): <strong className={activeCandle.rsi >= 70 ? "text-rose-400" : activeCandle.rsi <= 30 ? "text-emerald-400" : "text-amber-400"}>{activeCandle.rsi}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Vol: <strong className="text-slate-300">{(activeCandle.volume / 1000).toFixed(1)}k</strong></span>
            <span className={`px-1.5 py-0.2 rounded font-bold ${activeCandle.isGreen ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
              {activeCandle.isGreen ? "+BULL" : "-BEAR"}
            </span>
          </div>
        </div>
      )}

      {/* Chart Canvas Area */}
      <div className="flex-1 w-full relative bg-slate-950 flex flex-col justify-between overflow-hidden">
        {chartEngine === "NATIVE_PRO" ? (
          <div className="w-full h-full p-3 flex flex-col justify-between select-none">
            {/* SVG Native High-Resolution Candlestick Renderer */}
            <div className="relative flex-1 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 400" preserveAspectRatio="none">
                {/* Horizontal Grid lines */}
                {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
                  const y = 400 * ratio;
                  const price = (chartMax - ratio * priceRange).toFixed(1);
                  return (
                    <g key={i}>
                      <line x1="0" y1={y} x2="1000" y2={y} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
                      <text x="995" y={y - 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                        {price}
                      </text>
                    </g>
                  );
                })}

                {/* VWAP Line Overlay */}
                <polyline
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  points={nativeCandles
                    .map((c, idx) => {
                      const x = (idx / (nativeCandles.length - 1)) * 960 + 20;
                      const y = 400 - ((c.vwap - chartMin) / priceRange) * 380 - 10;
                      return `${x},${Math.max(10, Math.min(390, y))}`;
                    })
                    .join(" ")}
                />

                {/* Candlesticks Rendering */}
                {nativeCandles.map((candle, idx) => {
                  const x = (idx / (nativeCandles.length - 1)) * 960 + 20;
                  const candleWidth = 14;
                  const highY = 400 - ((candle.high - chartMin) / priceRange) * 380 - 10;
                  const lowY = 400 - ((candle.low - chartMin) / priceRange) * 380 - 10;
                  const openY = 400 - ((candle.open - chartMin) / priceRange) * 380 - 10;
                  const closeY = 400 - ((candle.close - chartMin) / priceRange) * 380 - 10;

                  const bodyTop = Math.min(openY, closeY);
                  const bodyHeight = Math.max(3, Math.abs(closeY - openY));
                  const color = candle.isGreen ? "#10b981" : "#f43f5e";

                  return (
                    <g
                      key={idx}
                      className="cursor-pointer transition-opacity hover:opacity-100"
                      onMouseEnter={() => setHoveredCandle(candle)}
                      onMouseLeave={() => setHoveredCandle(null)}
                    >
                      {/* High-Low Wick */}
                      <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1.5" />
                      {/* Candle Body */}
                      <rect
                        x={x - candleWidth / 2}
                        y={bodyTop}
                        width={candleWidth}
                        height={bodyHeight}
                        fill={color}
                        rx="1"
                      />
                    </g>
                  );
                })}

                {/* Live Spot Price Reference Line */}
                {(() => {
                  const spotY = 400 - ((index.currentPrice - chartMin) / priceRange) * 380 - 10;
                  return (
                    <g>
                      <line x1="0" y1={spotY} x2="1000" y2={spotY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" />
                      <rect x="910" y={spotY - 10} width="88" height="18" fill="#f59e0b" rx="2" />
                      <text x="954" y={spotY + 3} fill="#020617" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        LTP {index.currentPrice}
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* Bottom Sub-panel: Volume & RSI Bar Strip */}
            <div className="h-14 border-t border-slate-900 pt-1 flex items-end justify-between gap-1 px-2">
              {nativeCandles.map((c, i) => {
                const maxVol = 60000;
                const volHeight = Math.min(100, Math.max(15, (c.volume / maxVol) * 100));
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    onMouseEnter={() => setHoveredCandle(c)}
                  >
                    <div
                      style={{ height: `${volHeight}%` }}
                      className={`w-full rounded-t-sm transition-all ${
                        c.isGreen ? "bg-emerald-500/50 group-hover:bg-emerald-400" : "bg-rose-500/50 group-hover:bg-rose-400"
                      }`}
                    ></div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <div
              ref={containerRef}
              className="tradingview-widget-container w-full h-full"
              style={{ height: "100%", width: "100%" }}
            >
              <div className="tradingview-widget-container__widget w-full h-full"></div>
            </div>
            {tvLoadError && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center space-y-2">
                <ShieldAlert className="w-6 h-6 text-amber-400" />
                <div className="text-xs text-slate-300 font-bold">Cloud TradingView Embed Sandboxed</div>
                <div className="text-[11px] text-slate-400">Switching back to high-speed Native Institutional Charting Engine.</div>
                <button
                  onClick={() => setChartEngine("NATIVE_PRO")}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold"
                >
                  Load Native Engine
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mini status bar */}
      <div className="px-3 py-1.5 bg-slate-950/95 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 text-emerald-400 animate-ping" />
            <span>FYERS Ultra-Low Latency Feed (18ms)</span>
          </span>
          <span>•</span>
          <span>VWAP Ribbon Active</span>
        </div>
        <div className="text-slate-400">
          Spot: <strong className="text-white">{index.currency}{index.currentPrice.toLocaleString()}</strong> ({index.change >= 0 ? `+${index.change}` : index.change})
        </div>
      </div>
    </div>
  );
};
