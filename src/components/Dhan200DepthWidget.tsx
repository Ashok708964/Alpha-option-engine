import React, { useState, useEffect } from "react";
import {
  Layers,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Filter,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Cpu,
  BarChart3,
  Server,
  Radio,
  Plus,
  Edit2,
  LayoutGrid,
  List,
  CheckCircle2,
  Sparkles,
  Info,
  SlidersHorizontal,
  Compass,
  Flame,
  Scale,
  Crosshair,
  ArrowRightLeft,
  Eye,
} from "lucide-react";
import {
  Dhan200DepthStream,
  DepthLevel,
  Dhan200DepthSlot,
  Companion20DepthStream,
} from "../types/dhan200Depth";

interface Dhan200DepthWidgetProps {
  symbol?: string;
  isDhanConnected: boolean;
  onSelectPrice?: (price: number) => void;
}

export const Dhan200DepthWidget: React.FC<Dhan200DepthWidgetProps> = ({
  symbol: initialSymbol = "NIFTY50",
  isDhanConnected,
  onSelectPrice,
}) => {
  // Underlying Selector
  const [selectedUnderlying, setSelectedUnderlying] = useState<"NIFTY50" | "BANKNIFTY" | "FINNIFTY" | "SENSEX">(
    initialSymbol.includes("BANK")
      ? "BANKNIFTY"
      : initialSymbol.includes("FIN")
      ? "FINNIFTY"
      : initialSymbol.includes("SENSEX")
      ? "SENSEX"
      : "NIFTY50"
  );

  // Companion 20-Depth Broker Selection
  const [companionBroker, setCompanionBroker] = useState<
    "ZERODHA" | "FYERS" | "UPSTOX" | "ANGELONE" | "ALICEBLUE" | "SHOONYA"
  >("ZERODHA");

  const [isDynamic5Mode, setIsDynamic5Mode] = useState<boolean>(true);
  const [selectedSlotNumber, setSelectedSlotNumber] = useState<number>(1);
  const [activeSymbol, setActiveSymbol] = useState<string>("NIFTY 24250 CE");
  const [viewMode, setViewMode] = useState<"DUAL_BROKER_SPLIT" | "SINGLE_200_DEPTH" | "MULTI_5_SLOT_GRID">("DUAL_BROKER_SPLIT");
  const [visibleLevelCount, setVisibleLevelCount] = useState<20 | 50 | 100 | 200>(50);
  const [filterBlockOrdersOnly, setFilterBlockOrdersOnly] = useState<boolean>(false);
  const [isAutoStreaming, setIsAutoStreaming] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  
  // Slots & Streams State
  const [slots, setSlots] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [multiSlotSummaries, setMultiSlotSummaries] = useState<any[]>([]);
  const [dhanDepthData, setDhanDepthData] = useState<Dhan200DepthStream | null>(null);
  const [companionDepthData, setCompanionDepthData] = useState<Companion20DepthStream | null>(null);
  const [isEditingSlot, setIsEditingSlot] = useState<number | null>(null);
  const [customSlotSymbol, setCustomSlotSymbol] = useState<string>("");
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState<boolean>(false);

  // Sync Underlying with Dynamic 5-Slots
  const syncDynamic5Slots = async (underlying: string) => {
    try {
      const res = await fetch("/api/broker/dhan/slots/dynamic-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ underlying, enabled: isDynamic5Mode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSlots(data.slots);
        if (data.slots && data.slots.length > 0) {
          const current = data.slots[selectedSlotNumber - 1] || data.slots[0];
          setActiveSymbol(current.symbol);
        }
      }
    } catch (err) {
      console.error("Failed to sync dynamic 5-slots", err);
    }
  };

  // Fetch Slots
  const fetchSlotsConfig = async () => {
    try {
      const res = await fetch(`/api/broker/dhan/slots?underlying=${selectedUnderlying}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSlots(data.slots || []);
        setPresets(data.presets || []);
      }
    } catch (err) {
      console.error("Failed to load Dhan slots configuration", err);
    }
  };

  // Fetch Companion Broker 20-Depth Stream (Indices, Futures, Equities)
  const fetchCompanion20Depth = async () => {
    try {
      const res = await fetch(
        `/api/broker/companion/20-depth?broker=${companionBroker}&symbol=${selectedUnderlying}&type=INDEX_FUT`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setCompanionDepthData(data);
      }
    } catch (err) {
      console.error("Failed to stream companion 20-depth", err);
    }
  };

  // Fetch Detailed 200-Depth Stream for Active Dhan Instrument
  const fetch200Depth = async () => {
    try {
      const res = await fetch(`/api/broker/dhan/200-depth?symbol=${encodeURIComponent(activeSymbol)}&levels=${visibleLevelCount}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setDhanDepthData(data);
      }
    } catch (err) {
      console.error("Failed to stream Dhan 200 depth data", err);
    }
  };

  useEffect(() => {
    fetchSlotsConfig();
  }, [selectedUnderlying]);

  // When underlying changes, auto-recompute dynamic slots
  useEffect(() => {
    syncDynamic5Slots(selectedUnderlying);
  }, [selectedUnderlying, isDynamic5Mode]);

  // Update active symbol when slot selection changes
  useEffect(() => {
    const currentSlot = slots.find((s) => s.slotNumber === selectedSlotNumber);
    if (currentSlot && currentSlot.symbol) {
      setActiveSymbol(currentSlot.symbol);
    }
  }, [selectedSlotNumber, slots]);

  // Streaming loop
  useEffect(() => {
    fetch200Depth();
    fetchCompanion20Depth();

    let interval: any;
    if (isAutoStreaming) {
      interval = setInterval(() => {
        fetch200Depth();
        fetchCompanion20Depth();
      }, 600);
    }
    return () => clearInterval(interval);
  }, [activeSymbol, selectedUnderlying, companionBroker, visibleLevelCount, isAutoStreaming]);

  // Derived max qty for visual bar scaling
  const maxBidQty = dhanDepthData ? Math.max(...dhanDepthData.levels.map((l) => l.bidQty), 1) : 1000;
  const maxAskQty = dhanDepthData ? Math.max(...dhanDepthData.levels.map((l) => l.askQty), 1) : 1000;

  const companionMaxBid = companionDepthData ? Math.max(...companionDepthData.levels.map((l) => l.bidQty), 1) : 1000;
  const companionMaxAsk = companionDepthData ? Math.max(...companionDepthData.levels.map((l) => l.askQty), 1) : 1000;

  return (
    <div
      id="dhan-200-depth-container"
      className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl font-mono text-xs flex flex-col"
    >
      {/* 1. TOP HEADER & MULTI-BROKER INTEGRATION BAR */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 border border-orange-400 text-white flex items-center justify-center font-bold text-xs shadow-lg">
            200+
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-sm font-sans tracking-wide">
                Dual Broker Hybrid Depth: <span className="text-orange-400">DhanHQ 200-Depth (5 Dynamic Options)</span> + <span className="text-cyan-400">{companionBroker} 20-Depth (Futures/Spot)</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                <span>SYNC LIVE</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-sans flex items-center gap-2 mt-0.5 flex-wrap">
              <span>Underlying: <strong className="text-white">{selectedUnderlying}</strong></span>
              <span>•</span>
              <span className="text-amber-300">5 Dynamic Option Slots Active</span>
              <span>•</span>
              <span className="text-cyan-300">{companionBroker} Index/Futures Wire Active</span>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Underlying Index Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(["NIFTY50", "BANKNIFTY", "FINNIFTY", "SENSEX"] as const).map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedUnderlying(idx)}
                className={`px-2 py-1 text-[11px] font-bold rounded transition ${
                  selectedUnderlying === idx
                    ? "bg-orange-500 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {idx}
              </button>
            ))}
          </div>

          {/* Companion Broker Selector */}
          <div className="flex items-center bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 gap-1.5">
            <span className="text-[10px] text-slate-400 font-sans">Companion 20-Lvl:</span>
            <select
              value={companionBroker}
              onChange={(e: any) => setCompanionBroker(e.target.value)}
              className="bg-slate-900 text-cyan-300 border border-slate-700 text-[11px] font-bold rounded px-1.5 py-0.5 focus:outline-none"
            >
              <option value="ZERODHA">Zerodha Kite (20 Lvl)</option>
              <option value="FYERS">FYERS 20-Lvl TBT</option>
              <option value="UPSTOX">Upstox Pro 20-Lvl</option>
              <option value="ANGELONE">Angel One SmartAPI</option>
              <option value="ALICEBLUE">Alice Blue ANT</option>
              <option value="SHOONYA">Shoonya Finvasia</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode("DUAL_BROKER_SPLIT")}
              className={`px-2.5 py-1 text-[11px] font-bold rounded flex items-center gap-1.5 transition ${
                viewMode === "DUAL_BROKER_SPLIT"
                  ? "bg-gradient-to-r from-orange-500 to-cyan-500 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Dual Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("SINGLE_200_DEPTH")}
              className={`px-2.5 py-1 text-[11px] font-bold rounded flex items-center gap-1.5 transition ${
                viewMode === "SINGLE_200_DEPTH"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Full Dhan 200</span>
            </button>
          </div>

          {/* Institutional Block Orders Toggle */}
          <button
            type="button"
            onClick={() => setFilterBlockOrdersOnly(!filterBlockOrdersOnly)}
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition ${
              filterBlockOrdersOnly
                ? "bg-amber-500/20 border-amber-500 text-amber-300"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>Big Blocks</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC 5-SLOT AUTO-ALLOCATION ENGINE RIBBON */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-orange-400 animate-pulse" />
            <span>DHAN 5 DYNAMIC SLOTS:</span>
          </div>

          <div className="flex items-center gap-2">
            {slots.map((slot) => {
              const isSelected = selectedSlotNumber === slot.slotNumber;

              let badgeColor = "bg-slate-800 text-slate-300 border-slate-700";
              if (slot.role === "ATM_CE") badgeColor = "bg-emerald-950/80 text-emerald-300 border-emerald-500/60";
              else if (slot.role === "ATM_PE") badgeColor = "bg-rose-950/80 text-rose-300 border-rose-500/60";
              else if (slot.role === "HIGHEST_OI_CE") badgeColor = "bg-amber-950/80 text-amber-300 border-amber-500/60";
              else if (slot.role === "HIGHEST_OI_PE") badgeColor = "bg-purple-950/80 text-purple-300 border-purple-500/60";
              else if (slot.role === "HIGHEST_VOLUME") badgeColor = "bg-cyan-950/80 text-cyan-300 border-cyan-500/60";

              return (
                <div
                  key={slot.slotNumber}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
                    isSelected
                      ? "bg-orange-500/25 border-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                  onClick={() => {
                    setSelectedSlotNumber(slot.slotNumber);
                    setActiveSymbol(slot.symbol);
                  }}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] font-bold text-orange-300 flex items-center justify-center">
                        #{slot.slotNumber}
                      </span>
                      <span className="font-bold text-white">{slot.symbol}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-[9px] px-1 py-0.2 rounded border font-sans font-bold ${badgeColor}`}>
                        {slot.role ? slot.role.replace("_", " ") : "CUSTOM"}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {slot.metricValue}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Mode Switcher */}
        <button
          type="button"
          onClick={() => {
            const nextMode = !isDynamic5Mode;
            setIsDynamic5Mode(nextMode);
            syncDynamic5Slots(selectedUnderlying);
          }}
          className={`px-2.5 py-1 rounded-md border text-[10px] font-bold flex items-center gap-1.5 shrink-0 transition ${
            isDynamic5Mode
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              : "bg-slate-800 text-slate-300 border-slate-700"
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>{isDynamic5Mode ? "Auto Dynamic Mode (ON)" : "Manual Slots Mode"}</span>
        </button>
      </div>

      {/* 3. MAIN WORKSPACE: DUAL-SPLIT VIEW (DHAN 200-DEPTH OPTION + COMPANION 20-DEPTH FUTURES) */}
      {viewMode === "DUAL_BROKER_SPLIT" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* LEFT PANE: DHAN 200-LEVEL DEPTH (ACTIVE DYNAMIC OPTION CONTRACT) */}
          <div className="flex flex-col bg-slate-950">
            {/* Left Header */}
            <div className="px-4 py-2 bg-orange-950/20 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                <span className="font-bold text-orange-300 text-xs font-sans">
                  DhanHQ 200-Level Depth: <span className="text-white">{activeSymbol}</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-200 border border-orange-500/30">
                  SLOT #{selectedSlotNumber} ({slots[selectedSlotNumber - 1]?.role || "OPTION"})
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                LTP: <strong className="text-white">₹{dhanDepthData?.ltp.toFixed(2)}</strong> | Imbalance: <strong className="text-emerald-400">{dhanDepthData?.orderBookImbalanceRatio}x</strong>
              </span>
            </div>

            {/* Dhan 200-Depth Order Book Table */}
            {dhanDepthData && (
              <div className="overflow-x-auto max-h-96 overflow-y-auto divide-y divide-slate-800/40">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900/90 sticky top-0 z-10 text-[10px] text-slate-400 uppercase tracking-wider font-sans border-b border-slate-800">
                    <tr>
                      <th className="py-1.5 px-2 text-center w-10">Lvl</th>
                      <th className="py-1.5 px-2 text-right">Orders</th>
                      <th className="py-1.5 px-2 text-right text-emerald-400">Bid Qty</th>
                      <th className="py-1.5 px-2 text-right font-bold text-emerald-300">Bid (₹)</th>
                      <th className="py-1.5 px-2 text-left font-bold text-rose-300">Ask (₹)</th>
                      <th className="py-1.5 px-2 text-left text-rose-400">Ask Qty</th>
                      <th className="py-1.5 px-2 text-left">Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 font-mono text-[11px]">
                    {dhanDepthData.levels
                      .slice(0, visibleLevelCount)
                      .filter((l) => !filterBlockOrdersOnly || l.bidQty >= 2500 || l.askQty >= 2500)
                      .map((lvl) => {
                        const bidWidthPct = Math.min(100, Math.round((lvl.bidQty / maxBidQty) * 100));
                        const askWidthPct = Math.min(100, Math.round((lvl.askQty / maxAskQty) * 100));

                        return (
                          <tr
                            key={lvl.level}
                            className="hover:bg-slate-800/60 transition group cursor-pointer"
                            onClick={() => onSelectPrice && onSelectPrice(lvl.bidPrice)}
                          >
                            <td className="py-1 px-2 text-center text-[10px] text-slate-500">
                              {lvl.level}
                            </td>
                            <td className="py-1 px-2 text-right text-slate-400">
                              {lvl.bidOrders}
                            </td>
                            <td className="py-1 px-2 text-right relative">
                              <div
                                className="absolute inset-y-0 right-0 bg-emerald-500/15 pointer-events-none rounded-l"
                                style={{ width: `${bidWidthPct}%` }}
                              />
                              <span className="relative z-10 font-bold text-emerald-400">
                                {lvl.bidQty.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-1 px-2 text-right font-bold text-white bg-emerald-950/20">
                              ₹{lvl.bidPrice.toFixed(2)}
                            </td>
                            <td className="py-1 px-2 text-left font-bold text-white bg-rose-950/20">
                              ₹{lvl.askPrice.toFixed(2)}
                            </td>
                            <td className="py-1 px-2 text-left relative">
                              <div
                                className="absolute inset-y-0 left-0 bg-rose-500/15 pointer-events-none rounded-r"
                                style={{ width: `${askWidthPct}%` }}
                              />
                              <span className="relative z-10 font-bold text-rose-400">
                                {lvl.askQty.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-1 px-2 text-left text-slate-400">
                              {lvl.askOrders}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RIGHT PANE: COMPANION BROKER 20-LEVEL DEPTH (INDEX FUTURES / SPOT) */}
          <div className="flex flex-col bg-slate-950">
            {/* Right Header */}
            <div className="px-4 py-2 bg-cyan-950/20 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-bold text-cyan-300 text-xs font-sans">
                  {companionBroker} 20-Level Depth: <span className="text-white">{selectedUnderlying} FUT</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
                  UNDERLYING INDEX FUTURES
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                LTP: <strong className="text-white">₹{companionDepthData?.ltp.toFixed(2)}</strong> | Imbalance: <strong className="text-cyan-400">{companionDepthData?.imbalanceRatio}x</strong>
              </span>
            </div>

            {/* Companion 20-Depth Order Book Table */}
            {companionDepthData && (
              <div className="overflow-x-auto max-h-96 overflow-y-auto divide-y divide-slate-800/40">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900/90 sticky top-0 z-10 text-[10px] text-slate-400 uppercase tracking-wider font-sans border-b border-slate-800">
                    <tr>
                      <th className="py-1.5 px-2 text-center w-10">Lvl</th>
                      <th className="py-1.5 px-2 text-right">Orders</th>
                      <th className="py-1.5 px-2 text-right text-emerald-400">Bid Qty</th>
                      <th className="py-1.5 px-2 text-right font-bold text-emerald-300">Bid (₹)</th>
                      <th className="py-1.5 px-2 text-left font-bold text-rose-300">Ask (₹)</th>
                      <th className="py-1.5 px-2 text-left text-rose-400">Ask Qty</th>
                      <th className="py-1.5 px-2 text-left">Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 font-mono text-[11px]">
                    {companionDepthData.levels.map((lvl) => {
                      const bidWidthPct = Math.min(100, Math.round((lvl.bidQty / companionMaxBid) * 100));
                      const askWidthPct = Math.min(100, Math.round((lvl.askQty / companionMaxAsk) * 100));

                      return (
                        <tr
                          key={lvl.level}
                          className="hover:bg-slate-800/60 transition group cursor-pointer"
                          onClick={() => onSelectPrice && onSelectPrice(lvl.bidPrice)}
                        >
                          <td className="py-1 px-2 text-center text-[10px] text-slate-500">
                            {lvl.level}
                          </td>
                          <td className="py-1 px-2 text-right text-slate-400">
                            {lvl.bidOrders}
                          </td>
                          <td className="py-1 px-2 text-right relative">
                            <div
                              className="absolute inset-y-0 right-0 bg-cyan-500/15 pointer-events-none rounded-l"
                              style={{ width: `${bidWidthPct}%` }}
                            />
                            <span className="relative z-10 font-bold text-cyan-300">
                              {lvl.bidQty.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-1 px-2 text-right font-bold text-white bg-emerald-950/20">
                            ₹{lvl.bidPrice.toFixed(2)}
                          </td>
                          <td className="py-1 px-2 text-left font-bold text-white bg-rose-950/20">
                            ₹{lvl.askPrice.toFixed(2)}
                          </td>
                          <td className="py-1 px-2 text-left relative">
                            <div
                              className="absolute inset-y-0 left-0 bg-rose-500/15 pointer-events-none rounded-r"
                              style={{ width: `${askWidthPct}%` }}
                            />
                            <span className="relative z-10 font-bold text-rose-300">
                              {lvl.askQty.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-1 px-2 text-left text-slate-400">
                            {lvl.askOrders}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SINGLE 200-DEPTH FULL VIEW */}
      {viewMode === "SINGLE_200_DEPTH" && dhanDepthData && (
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto divide-y divide-slate-800/40">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/90 sticky top-0 z-10 text-[10px] text-slate-400 uppercase tracking-wider font-sans border-b border-slate-800">
              <tr>
                <th className="py-2 px-2 text-center w-12">Lvl</th>
                <th className="py-2 px-2 text-right">Orders</th>
                <th className="py-2 px-3 text-right text-emerald-400">Bid Qty</th>
                <th className="py-2 px-3 text-right font-bold text-emerald-300">Bid (₹)</th>
                <th className="py-2 px-3 text-left font-bold text-rose-300">Ask (₹)</th>
                <th className="py-2 px-3 text-left text-rose-400">Ask Qty</th>
                <th className="py-2 px-2 text-left">Orders</th>
                <th className="py-2 px-3 text-center">Depth Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-mono text-[11px]">
              {dhanDepthData.levels
                .slice(0, visibleLevelCount)
                .filter((l) => !filterBlockOrdersOnly || l.bidQty >= 2500 || l.askQty >= 2500)
                .map((lvl) => {
                  const bidWidthPct = Math.min(100, Math.round((lvl.bidQty / maxBidQty) * 100));
                  const askWidthPct = Math.min(100, Math.round((lvl.askQty / maxAskQty) * 100));

                  return (
                    <tr
                      key={lvl.level}
                      className="hover:bg-slate-800/60 transition group cursor-pointer"
                      onClick={() => onSelectPrice && onSelectPrice(lvl.bidPrice)}
                    >
                      <td className="py-1 px-2 text-center text-[10px] text-slate-500 font-mono">
                        {lvl.level}
                      </td>
                      <td className="py-1 px-2 text-right text-slate-400 text-[11px]">
                        {lvl.bidOrders}
                      </td>
                      <td className="py-1 px-3 text-right relative">
                        <div
                          className="absolute inset-y-0 right-0 bg-emerald-500/15 pointer-events-none rounded-l"
                          style={{ width: `${bidWidthPct}%` }}
                        />
                        <span className="relative z-10 font-bold text-emerald-400">
                          {lvl.bidQty.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-1 px-3 text-right font-bold text-white bg-emerald-950/20 group-hover:text-emerald-300">
                        ₹{lvl.bidPrice.toFixed(2)}
                      </td>
                      <td className="py-1 px-3 text-left font-bold text-white bg-rose-950/20 group-hover:text-rose-300">
                        ₹{lvl.askPrice.toFixed(2)}
                      </td>
                      <td className="py-1 px-3 text-left relative">
                        <div
                          className="absolute inset-y-0 left-0 bg-rose-500/15 pointer-events-none rounded-r"
                          style={{ width: `${askWidthPct}%` }}
                        />
                        <span className="relative z-10 font-bold text-rose-400">
                          {lvl.askQty.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-1 px-2 text-left text-slate-400 text-[11px]">
                        {lvl.askOrders}
                      </td>
                      <td className="py-1 px-3 text-center">
                        <div className="w-24 h-2 bg-slate-900 rounded-full mx-auto overflow-hidden flex border border-slate-800">
                          <div
                            className="bg-emerald-500 h-full"
                            style={{ width: `${Math.max(10, Math.min(90, (lvl.bidQty / (lvl.bidQty + lvl.askQty)) * 100))}%` }}
                          />
                          <div
                            className="bg-rose-500 h-full"
                            style={{ width: `${Math.max(10, Math.min(90, (lvl.askQty / (lvl.bidQty + lvl.askQty)) * 100))}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* FOOTER MULTI-BROKER TELEMETRY STRIP */}
      <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 flex-wrap gap-2">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span><strong>Dual-Broker Sync Active</strong>: DhanHQ 200-Depth TBT (5 Option Strikes) + {companionBroker} 20-Depth (Underlying Index Futures)</span>
        </span>
        <span className="text-slate-400">
          Active Dynamic Slot #{selectedSlotNumber}: <strong className="text-white">{activeSymbol}</strong>
        </span>
      </div>
    </div>
  );
};
