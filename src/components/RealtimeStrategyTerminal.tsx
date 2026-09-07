import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  IndexSymbol,
  IndexInfo,
  FuturesTick,
  OptionsTick,
  LiveDepthOfMarket,
  MarketNewsItem,
  RealtimeStrategySignal,
  RealtimeMarketFeedState,
} from "../types";
import {
  Activity,
  Zap,
  Radio,
  Wifi,
  WifiOff,
  Layers,
  Newspaper,
  Crosshair,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  ShieldAlert,
  Clock,
  ExternalLink,
  Play,
  Pause,
  RefreshCw,
  Sliders,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Flame,
  BarChart2,
  Database,
  Eye,
  Send,
} from "lucide-react";

interface RealtimeStrategyTerminalProps {
  currentIndex: IndexInfo;
  selectedSymbol: IndexSymbol;
  onSelectSymbol?: (symbol: IndexSymbol) => void;
  onExecuteTrade?: (signal: RealtimeStrategySignal) => void;
  onDispatchSignalNotification?: (signal: RealtimeStrategySignal) => void;
  isBrokerConnected?: boolean;
  connectedBrokerName?: string;
}

export const RealtimeStrategyTerminal: React.FC<RealtimeStrategyTerminalProps> = ({
  currentIndex,
  selectedSymbol,
  onSelectSymbol,
  onExecuteTrade,
  onDispatchSignalNotification,
  isBrokerConnected = false,
  connectedBrokerName = "FYERS",
}) => {
  // Feed State
  const [feedState, setFeedState] = useState<RealtimeMarketFeedState | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [activeWorkspace, setActiveWorkspace] = useState<
    "GRID" | "TICKS" | "ORDER_BOOK" | "NEWS" | "STRATEGY"
  >("GRID");
  const [activeTickTab, setActiveTickTab] = useState<"FUTURES" | "OPTIONS">("FUTURES");
  const [selectedStrikeFilter, setSelectedStrikeFilter] = useState<"ALL" | "CE" | "PE">("ALL");
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [isInjecting, setIsInjecting] = useState<boolean>(false);

  // Sound/Flash simulation for fresh ticks
  const [lastTickFlash, setLastTickFlash] = useState<"UP" | "DOWN" | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<any>(null);

  // Fetch initial snapshot or poll when SSE paused
  const fetchFeedSnapshot = async (sym: string) => {
    try {
      const res = await fetch(`/api/market/realtime-feed?symbol=${sym}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setFeedState(data);
        }
      }
    } catch (err) {
      console.warn("Feed snapshot fetch error:", err);
    }
  };

  // Setup Real-time SSE Stream or Polling
  useEffect(() => {
    let active = true;

    // First fetch immediate snapshot
    fetchFeedSnapshot(selectedSymbol);

    if (isStreaming) {
      // Initialize Server-Sent Events (SSE) stream
      try {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        const sse = new EventSource(`/api/market/stream?symbol=${selectedSymbol}`);
        eventSourceRef.current = sse;

        sse.onmessage = (event) => {
          if (!active) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === "SNAPSHOT") {
              setFeedState((prev) => ({
                ...(prev || {}),
                symbol: data.symbol,
                spotPrice: data.spotPrice,
                futuresLtp: data.futuresLtp,
                basisPoints: data.basisPoints,
                basisPercent: Number((((data.futuresLtp - data.spotPrice) / data.spotPrice) * 100).toFixed(3)),
                futuresTicks: data.futuresTicks || [],
                optionsTicks: prev?.optionsTicks || [],
                depthOfMarket: data.depthOfMarket,
                newsFeed: data.newsFeed || [],
                strategySignal: data.strategySignal,
                ticksPerSecond: 22,
                totalTicksIngested: (prev?.totalTicksIngested || 0) + 1,
                cumulativeVolumeDelta: data.cumulativeDelta || 1400,
                connectionState: "STREAMING",
                lastPacketTimestamp: new Date().toISOString(),
                feedLatencyMs: 3.8,
              }));
            } else if (data.type === "TICK") {
              setFeedState((prev) => {
                if (!prev) return null;
                const newTicks = [data.tick, ...prev.futuresTicks.slice(0, 39)];
                const isUp = data.tick.tickDirection === "UPTICK";
                setLastTickFlash(isUp ? "UP" : "DOWN");

                return {
                  ...prev,
                  futuresLtp: data.tick.price,
                  basisPoints: data.tick.basisToSpot,
                  futuresTicks: newTicks,
                  depthOfMarket: data.depthOfMarket || prev.depthOfMarket,
                  strategySignal: data.strategySignal || prev.strategySignal,
                  cumulativeVolumeDelta: data.cumulativeDelta,
                  totalTicksIngested: prev.totalTicksIngested + 1,
                  connectionState: "STREAMING",
                  lastPacketTimestamp: new Date().toISOString(),
                };
              });
            }
          } catch (e) {
            // Ignore parse error
          }
        };

        sse.onerror = () => {
          // If SSE connection drops, gracefully fallback to high frequency polling
          sse.close();
          if (active && isStreaming) {
            pollIntervalRef.current = setInterval(() => {
              fetchFeedSnapshot(selectedSymbol);
            }, 1200);
          }
        };
      } catch (err) {
        // Fallback polling
        pollIntervalRef.current = setInterval(() => {
          fetchFeedSnapshot(selectedSymbol);
        }, 1200);
      }
    } else {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      active = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedSymbol, isStreaming]);

  // Flash reset effect
  useEffect(() => {
    if (lastTickFlash) {
      const timer = setTimeout(() => setLastTickFlash(null), 300);
      return () => clearTimeout(timer);
    }
  }, [lastTickFlash]);

  // Inject Simulated Tick Action
  const handleInjectTick = async (eventType: "BULLISH_SWEEP" | "BEARISH_DUMP" | "NEWS_SHOCK", size: number) => {
    setIsInjecting(true);
    try {
      const res = await fetch("/api/market/tick-inject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: selectedSymbol,
          eventType,
          size,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setStatusNotification(`⚡ Injected: ${eventType} (${size} lots) -> Signal Updated!`);
        fetchFeedSnapshot(selectedSymbol);
      }
    } catch (e) {
      setStatusNotification("Failed to inject tick");
    } finally {
      setIsInjecting(false);
      setTimeout(() => setStatusNotification(null), 3500);
    }
  };

  const currentStrategy = feedState?.strategySignal;
  const dom = feedState?.depthOfMarket;
  const futuresTicks = feedState?.futuresTicks || [];
  const optionsTicks = feedState?.optionsTicks || [];
  const newsItems = feedState?.newsFeed || [];

  // Filtered options ticks
  const filteredOptionsTicks = useMemo(() => {
    if (selectedStrikeFilter === "ALL") return optionsTicks;
    return optionsTicks.filter((o) => o.optionType === selectedStrikeFilter);
  }, [optionsTicks, selectedStrikeFilter]);

  return (
    <div id="realtime-strategy-terminal" className="space-y-4">
      {/* Top Telemetry & Control Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 shadow-xl backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Engine Status & Symbol */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700">
              <span className="relative flex h-2 w-2">
                {isStreaming ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                )}
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-200 tracking-wider">
                {isStreaming ? "STREAMING LIVE (SSE)" : "FEED PAUSED"}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                {feedState?.feedLatencyMs ?? 4}ms
              </span>
            </div>

            {/* Symbol Identifier */}
            <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded">
              <span className="text-xs font-bold text-white font-mono">{currentIndex.symbol}</span>
              <span className="text-[11px] text-slate-400 font-mono">
                ₹{feedState?.spotPrice?.toLocaleString() || currentIndex.currentPrice.toLocaleString()}
              </span>
            </div>

            {/* Futures Basis */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono bg-slate-800/40 px-2 py-1 rounded border border-slate-800">
              <span className="text-slate-400">Fut:</span>
              <span className="text-white font-bold">
                ₹{feedState?.futuresLtp?.toLocaleString() || "..."}
              </span>
              <span
                className={`font-semibold ${
                  (feedState?.basisPoints ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                ({(feedState?.basisPoints ?? 0) >= 0 ? "+" : ""}
                {feedState?.basisPoints ?? "+38.5"} pts)
              </span>
            </div>
          </div>

          {/* Center: Live Microstructure Metrics Barometer */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
            {/* Cumulative Delta */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[10px] uppercase">CVD:</span>
              <span
                className={`font-bold ${
                  (feedState?.cumulativeVolumeDelta ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {(feedState?.cumulativeVolumeDelta ?? 0) >= 0 ? "+" : ""}
                {feedState?.cumulativeVolumeDelta ?? "+1,420"} lots
              </span>
            </div>

            {/* Order Book Imbalance */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[10px] uppercase">Book:</span>
              <span className="text-emerald-400 font-bold">
                {((dom?.imbalanceRatio ?? 0.58) * 100).toFixed(0)}% Bid
              </span>
              <span className="text-slate-500">/</span>
              <span className="text-rose-400 font-bold">
                {((1 - (dom?.imbalanceRatio ?? 0.58)) * 100).toFixed(0)}% Ask
              </span>
            </div>

            {/* Ticks Ingested */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[10px] uppercase">Ingested:</span>
              <span className="text-slate-200">{feedState?.totalTicksIngested ?? 2450} ticks</span>
            </div>
          </div>

          {/* Right: Controls & Actions */}
          <div className="flex items-center gap-2">
            {/* Play/Pause Stream */}
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isStreaming
                  ? "bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-500/30"
                  : "bg-emerald-600 text-white hover:bg-emerald-500"
              }`}
              title={isStreaming ? "Pause Live Tick Stream" : "Resume Live Tick Stream"}
            >
              {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isStreaming ? "Pause Feed" : "Resume Feed"}</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => fetchFeedSnapshot(selectedSymbol)}
              className="p-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
              title="Refresh Stream Snapshot"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Execute Live Strategy Button */}
            {currentStrategy && (
              <button
                onClick={() => onExecuteTrade && onExecuteTrade(currentStrategy)}
                className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono tracking-wide flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Execute Signal ({currentStrategy.action.split("_")[0]})</span>
              </button>
            )}

            {currentStrategy && onDispatchSignalNotification && (
              <button
                onClick={() => onDispatchSignalNotification(currentStrategy)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-all shadow"
                title="Send Instant Buy/Sell Signal to WhatsApp & Telegram"
              >
                <Send className="w-3 h-3 text-sky-400" />
                <span>Alert Mobile</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Simulation Testing Bar */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-sans text-slate-300 font-semibold">Test Ingestion Engine:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleInjectTick("BULLISH_SWEEP", 500)}
              disabled={isInjecting}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 transition-colors flex items-center gap-1"
            >
              <ArrowUpRight className="w-3 h-3" />
              <span>+500 Bullish Sweep</span>
            </button>

            <button
              onClick={() => handleInjectTick("BEARISH_DUMP", 500)}
              disabled={isInjecting}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition-colors flex items-center gap-1"
            >
              <ArrowDownRight className="w-3 h-3" />
              <span>-500 Bearish Dump</span>
            </button>

            <button
              onClick={() => handleInjectTick("NEWS_SHOCK", 750)}
              disabled={isInjecting}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800/60 transition-colors flex items-center gap-1"
            >
              <Flame className="w-3 h-3" />
              <span>Macro Shock Inflow</span>
            </button>
          </div>

          {statusNotification && (
            <div className="text-[11px] font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-700/60 animate-fade-in">
              {statusNotification}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveWorkspace("GRID")}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wide transition-colors flex items-center gap-1.5 ${
              activeWorkspace === "GRID"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Unified 4-Quadrant View</span>
          </button>

          <button
            onClick={() => setActiveWorkspace("TICKS")}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wide transition-colors flex items-center gap-1.5 ${
              activeWorkspace === "TICKS"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Tick Feed ({futuresTicks.length} Ticks)</span>
          </button>

          <button
            onClick={() => setActiveWorkspace("ORDER_BOOK")}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wide transition-colors flex items-center gap-1.5 ${
              activeWorkspace === "ORDER_BOOK"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Order Book Depth (DOM)</span>
          </button>

          <button
            onClick={() => setActiveWorkspace("NEWS")}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wide transition-colors flex items-center gap-1.5 ${
              activeWorkspace === "NEWS"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>News & Sentiment ({newsItems.length})</span>
          </button>

          <button
            onClick={() => setActiveWorkspace("STRATEGY")}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wide transition-colors flex items-center gap-1.5 ${
              activeWorkspace === "STRATEGY"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Strategy Decision Hub</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span>Broker Gateway:</span>
          <span
            className={`px-2 py-0.5 rounded font-bold ${
              isBrokerConnected
                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            {isBrokerConnected ? `${connectedBrokerName} LIVE` : "SANDBOX ARMED"}
          </span>
        </div>
      </div>

      {/* Main Workspace Render */}
      {activeWorkspace === "GRID" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Quadrant 1: Real-Time Tick Stream (5 cols) */}
          <div className="xl:col-span-4 bg-slate-900 border border-slate-800 rounded-lg p-3.5 shadow-xl flex flex-col h-[560px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Live Tick Flow Stream
                </h4>
              </div>

              {/* Sub-tab: Futures vs Options */}
              <div className="flex items-center bg-slate-800/80 p-0.5 rounded text-[10px] font-mono">
                <button
                  onClick={() => setActiveTickTab("FUTURES")}
                  className={`px-2 py-0.5 rounded ${
                    activeTickTab === "FUTURES" ? "bg-indigo-600 text-white font-bold" : "text-slate-400"
                  }`}
                >
                  Futures
                </button>
                <button
                  onClick={() => setActiveTickTab("OPTIONS")}
                  className={`px-2 py-0.5 rounded ${
                    activeTickTab === "OPTIONS" ? "bg-indigo-600 text-white font-bold" : "text-slate-400"
                  }`}
                >
                  Options
                </button>
              </div>
            </div>

            {/* Tick Stream Table */}
            <div className="flex-1 overflow-y-auto mt-2 text-xs font-mono divide-y divide-slate-800/40 pr-1">
              {activeTickTab === "FUTURES" ? (
                futuresTicks.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">Connecting to tick stream...</div>
                ) : (
                  futuresTicks.map((tick, idx) => {
                    const isUp = tick.side === "BUY";
                    return (
                      <div
                        key={tick.tickId || idx}
                        className={`py-1.5 px-1 flex items-center justify-between transition-colors ${
                          idx === 0 && lastTickFlash
                            ? lastTickFlash === "UP"
                              ? "bg-emerald-950/60"
                              : "bg-rose-950/60"
                            : "hover:bg-slate-800/30"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {tick.formattedTime.split(" ")[0]}
                          </span>
                          <span
                            className={`flex items-center font-bold ${
                              isUp ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {isUp ? (
                              <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-0.5 inline" />
                            )}
                            ₹{tick.price.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              isUp ? "bg-emerald-950 text-emerald-300" : "bg-rose-950 text-rose-300"
                            }`}
                          >
                            {tick.qty}x
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {tick.tradeType}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                optionsTicks.map((opt, idx) => (
                  <div
                    key={opt.tickId || idx}
                    className="py-1.5 px-1 flex items-center justify-between hover:bg-slate-800/30"
                  >
                    <div>
                      <span className="font-bold text-white">{opt.contract}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">
                        IV: {opt.iv}% | Δ: {opt.delta}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-bold ${
                          opt.side === "BUY" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        ₹{opt.price}
                      </span>
                      <div className="text-[10px] text-slate-500">OI: {(opt.oi / 100000).toFixed(1)}L</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quadrant 2: Level 2 Depth of Market (DOM) (4 cols) */}
          <div className="xl:col-span-4 bg-slate-900 border border-slate-800 rounded-lg p-3.5 shadow-xl flex flex-col h-[560px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Depth of Market (DOM)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Spread: <strong className="text-white">{dom?.spread ?? 0.5} pts</strong> ({dom?.spreadBps ?? 2.0} bps)
              </span>
            </div>

            {/* DOM Queue Pressure Barometer */}
            <div className="mt-2 p-2 rounded bg-slate-800/60 border border-slate-700/60 text-xs font-mono">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span className="text-emerald-400 font-bold">
                  Bids: {dom?.totalBidQty?.toLocaleString() ?? "12,450"} (
                  {((dom?.imbalanceRatio ?? 0.58) * 100).toFixed(0)}%)
                </span>
                <span className="text-rose-400 font-bold">
                  Asks: {dom?.totalAskQty?.toLocaleString() ?? "9,120"} (
                  {((1 - (dom?.imbalanceRatio ?? 0.58)) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-slate-700/60 h-2 rounded overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${(dom?.imbalanceRatio ?? 0.58) * 100}%` }}
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${(1 - (dom?.imbalanceRatio ?? 0.58)) * 100}%` }}
                />
              </div>
            </div>

            {/* 10-Level Bid/Ask Ladder */}
            <div className="flex-1 overflow-y-auto mt-2 text-[11px] font-mono">
              <div className="grid grid-cols-2 gap-2 text-center text-[10px] uppercase text-slate-500 font-bold pb-1 border-b border-slate-800">
                <span>Bids (Buyers)</span>
                <span>Asks (Sellers)</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                {/* Bids Column */}
                <div className="space-y-1">
                  {dom?.bids?.slice(0, 10).map((b, i) => (
                    <div
                      key={`bid-${i}`}
                      className={`flex items-center justify-between p-1 rounded relative overflow-hidden ${
                        b.isIceberg
                          ? "bg-emerald-950/40 border border-emerald-800/60 font-bold text-emerald-200"
                          : "bg-slate-800/20 text-slate-300"
                      }`}
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none"
                        style={{ width: `${Math.min(100, (b.size / 3000) * 100)}%` }}
                      />
                      <span className="z-10 text-[10px] text-slate-400">{b.ordersCount}o</span>
                      <span className="z-10 text-emerald-400 font-bold">₹{b.price.toFixed(1)}</span>
                      <span className="z-10">{b.size}</span>
                    </div>
                  ))}
                </div>

                {/* Asks Column */}
                <div className="space-y-1">
                  {dom?.asks?.slice(0, 10).map((a, i) => (
                    <div
                      key={`ask-${i}`}
                      className={`flex items-center justify-between p-1 rounded relative overflow-hidden ${
                        a.isIceberg
                          ? "bg-rose-950/40 border border-rose-800/60 font-bold text-rose-200"
                          : "bg-slate-800/20 text-slate-300"
                      }`}
                    >
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none"
                        style={{ width: `${Math.min(100, (a.size / 3000) * 100)}%` }}
                      />
                      <span className="z-10">{a.size}</span>
                      <span className="z-10 text-rose-400 font-bold">₹{a.price.toFixed(1)}</span>
                      <span className="z-10 text-[10px] text-slate-400">{a.ordersCount}o</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DOM Footprint Summary */}
            <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Micro-Price: <strong className="text-white">₹{dom?.microPrice ?? "..."}</strong></span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Shield className="w-3 h-3" /> Bid Wall @ ₹{dom?.topBidWall?.price ?? "..."}
              </span>
            </div>
          </div>

          {/* Quadrant 3 & 4: News & Live Strategy Synthesis (4 cols) */}
          <div className="xl:col-span-4 flex flex-col gap-4">
            {/* Top: F&O Strategy Decision Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 shadow-xl flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Real-Time Strategy Decision
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                  {currentStrategy?.confidenceScore ?? 84}% Confluence
                </span>
              </div>

              {/* Action Signal Banner */}
              <div className="mt-2.5 p-2.5 rounded-lg bg-gradient-to-r from-slate-800 to-indigo-950/60 border border-indigo-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                      Active Ingestion Signal
                    </div>
                    <div className="text-base font-bold text-white font-mono flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`${
                          currentStrategy?.action.includes("BUY") ||
                          currentStrategy?.action.includes("LONG")
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {currentStrategy?.action.replace(/_/g, " ") || "BUY DIP CALL"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="text-[10px] text-slate-400 block">Driver</span>
                    <span className="text-indigo-300 font-bold">
                      {currentStrategy?.primaryDriver.replace(/_/g, " ") || "TRIPLE CONFLUENCE"}
                    </span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Instrument</span>
                    <span className="font-bold text-white truncate block">
                      {currentStrategy?.recommendedContract || "NIFTY 24500 CE"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Entry Spot Trigger</span>
                    <span className="font-bold text-emerald-400">
                      ₹{currentStrategy?.entryTriggerPrice || "24,525.00"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3-Pillar Breakdown */}
              <div className="mt-2.5 space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">1. Tick Aggression Flow</span>
                  <span className="text-emerald-400 font-bold">
                    {currentStrategy?.tickDeltaBias.replace(/_/g, " ") || "AGGRESSIVE BUYERS"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">2. Order Book Imbalance</span>
                  <span className="text-indigo-300 font-bold">
                    {currentStrategy?.orderBookPressure.replace(/_/g, " ") || "STRONG BID SUPPORT"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">3. News Catalyst Sentiment</span>
                  <span className="text-amber-300 font-bold">
                    {currentStrategy?.newsCatalystBias.replace(/_/g, " ") || "BULLISH TAILWIND"}
                  </span>
                </div>
              </div>

              {/* Targets & SL */}
              <div className="mt-2.5 p-2 rounded bg-slate-800/40 border border-slate-800 grid grid-cols-3 gap-1 text-center font-mono text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 block">TARGET 1</span>
                  <span className="font-bold text-emerald-400">
                    ₹{currentStrategy?.target1?.toFixed(1) || "..."}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">TARGET 2</span>
                  <span className="font-bold text-emerald-300">
                    ₹{currentStrategy?.target2?.toFixed(1) || "..."}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">HARD SL</span>
                  <span className="font-bold text-rose-400">
                    ₹{currentStrategy?.invalidationPrice?.toFixed(1) || "..."}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom: Streaming News Headlines */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 shadow-xl flex-1 flex flex-col h-[270px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Live News & Sentiment
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Real-time RSS</span>
              </div>

              <div className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1">
                {newsItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-slate-400 mb-1">
                      <span className="text-slate-300 font-bold truncate max-w-[150px]">{item.source}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded font-bold ${
                          item.sentiment === "BULLISH"
                            ? "bg-emerald-950 text-emerald-300"
                            : item.sentiment === "BEARISH"
                            ? "bg-rose-950 text-rose-300"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {item.sentiment} ({item.sentimentScore})
                      </span>
                    </div>

                    <h5 className="text-xs text-white font-medium line-clamp-2 leading-snug">
                      {item.title}
                    </h5>

                    <div className="mt-1.5 pt-1 border-t border-slate-800/80 text-[10px] text-indigo-300 font-mono leading-tight">
                      <strong>F&O Impact:</strong> {item.strategyInfluence}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Views for Workspace Tabs */}
      {activeWorkspace === "TICKS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Comprehensive Tick Ingestion Stream ({currentIndex.symbol})
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">
                Throughput: <strong className="text-emerald-400">{feedState?.ticksPerSecond || 24} ticks/s</strong>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Contract</th>
                  <th className="py-2 px-3">Price</th>
                  <th className="py-2 px-3">Direction</th>
                  <th className="py-2 px-3">Volume</th>
                  <th className="py-2 px-3">Side</th>
                  <th className="py-2 px-3">Basis vs Spot</th>
                  <th className="py-2 px-3">Cum. Delta</th>
                  <th className="py-2 px-3">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {futuresTicks.map((t, idx) => (
                  <tr key={t.tickId || idx} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-400">{t.formattedTime}</td>
                    <td className="py-2 px-3 font-bold text-white">{t.contract}</td>
                    <td
                      className={`py-2 px-3 font-bold ${
                        t.side === "BUY" ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      ₹{t.price.toFixed(2)}
                    </td>
                    <td className="py-2 px-3">
                      {t.tickDirection === "UPTICK" ? (
                        <span className="text-emerald-400 font-bold">▲ UPTICK</span>
                      ) : (
                        <span className="text-rose-400 font-bold">▼ DOWNTICK</span>
                      )}
                    </td>
                    <td className="py-2 px-3">{t.qty}x</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.side === "BUY"
                            ? "bg-emerald-950 text-emerald-300"
                            : "bg-rose-950 text-rose-300"
                        }`}
                      >
                        {t.side}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      {t.basisToSpot > 0 ? `+${t.basisToSpot}` : t.basisToSpot} pts ({t.basisBps} bps)
                    </td>
                    <td className="py-2 px-3 font-bold text-indigo-300">{t.cumulativeDelta}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {t.tradeType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeWorkspace === "ORDER_BOOK" && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              Full Depth of Market Ladder (10 Bids x 10 Asks)
            </h3>
            <span className="text-xs font-mono text-slate-300">
              Queue Imbalance:{" "}
              <strong className="text-emerald-400">
                {((dom?.imbalanceRatio ?? 0.58) * 100).toFixed(1)}% Buyers
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs font-mono">
            {/* Full Bids */}
            <div className="bg-slate-800/30 p-3 rounded border border-slate-800">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Bid Liquidity Depth
              </h4>
              <div className="space-y-1.5">
                {dom?.bids?.map((b, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-1.5 rounded relative overflow-hidden ${
                      b.isIceberg
                        ? "bg-emerald-950/60 border border-emerald-700/60 font-bold"
                        : "bg-slate-800/40"
                    }`}
                  >
                    <span className="text-slate-400">{b.ordersCount} orders</span>
                    <span className="text-emerald-400 font-bold text-sm">₹{b.price.toFixed(2)}</span>
                    <span className="font-mono text-white">{b.size} lots</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Asks */}
            <div className="bg-slate-800/30 p-3 rounded border border-slate-800">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Ask Overhang Liquidity
              </h4>
              <div className="space-y-1.5">
                {dom?.asks?.map((a, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-1.5 rounded relative overflow-hidden ${
                      a.isIceberg
                        ? "bg-rose-950/60 border border-rose-700/60 font-bold"
                        : "bg-slate-800/40"
                    }`}
                  >
                    <span className="font-mono text-white">{a.size} lots</span>
                    <span className="text-rose-400 font-bold text-sm">₹{a.price.toFixed(2)}</span>
                    <span className="text-slate-400">{a.ordersCount} orders</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeWorkspace === "NEWS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-indigo-400" />
              Real-Time Market News Feed & Quantitative Impact
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Directly synthesized into trade decision
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {newsItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/40 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-indigo-300 font-bold">
                      {item.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        item.sentiment === "BULLISH"
                          ? "bg-emerald-950 text-emerald-300"
                          : item.sentiment === "BEARISH"
                          ? "bg-rose-950 text-rose-300"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {item.sentiment} ({item.sentimentScore}/100)
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-white leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">{item.source} • {item.timeStr}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800 text-xs font-mono text-emerald-300 bg-emerald-950/20 p-2 rounded">
                  <span className="font-bold block text-[10px] uppercase text-emerald-400">
                    F&O Strategy Transmission:
                  </span>
                  {item.strategyInfluence}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeWorkspace === "STRATEGY" && currentStrategy && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-indigo-400" />
              Quantitative Strategy Confluence & Execution Engine
            </h3>
            <span className="px-3 py-1 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/60 text-xs font-mono font-bold">
              {currentStrategy.confidenceScore}% Confluence Score
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Left: Execution Parameters */}
            <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-800 space-y-3 font-mono text-xs">
              <div className="text-sm font-bold text-white uppercase tracking-wider text-indigo-300">
                Actionable Execution Blueprint
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-3 rounded border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Action</span>
                  <span className="text-base font-bold text-emerald-400">
                    {currentStrategy.action.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Contract</span>
                  <span className="text-sm font-bold text-white">
                    {currentStrategy.recommendedContract}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">Entry Trigger</span>
                  <span className="font-bold text-white">₹{currentStrategy.entryTriggerPrice}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Target 1 (+35%)</span>
                  <span className="font-bold text-emerald-400">₹{currentStrategy.target1}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Hard SL</span>
                  <span className="font-bold text-rose-400">₹{currentStrategy.invalidationPrice}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onExecuteTrade && onExecuteTrade(currentStrategy)}
                  className="flex-1 py-2.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Deploy to {connectedBrokerName}</span>
                </button>

                {onDispatchSignalNotification && (
                  <button
                    onClick={() => onDispatchSignalNotification(currentStrategy)}
                    className="px-4 py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 border border-slate-700 font-bold font-mono text-xs tracking-wider flex items-center justify-center gap-2 shadow"
                    title="Send Alert to WhatsApp & Telegram"
                  >
                    <Send className="w-4 h-4 text-sky-400" />
                    <span>Alert Mobile</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right: Rationale Breakdown */}
            <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-800 space-y-2.5 font-mono text-xs">
              <div className="text-sm font-bold text-white uppercase tracking-wider text-indigo-300">
                Algorithmic Confluence Rationale
              </div>

              <div className="space-y-2">
                {currentStrategy.executionRationale.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300 leading-relaxed">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
