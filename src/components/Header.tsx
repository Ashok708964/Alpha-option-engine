import React, { useState, useEffect } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  Sliders,
  Cpu,
  RefreshCw,
  Cloud,
  Lock,
  Shield,
  FileText,
  MessageSquare,
  Send,
} from "lucide-react";
import { IndexInfo, IndexSymbol, BrokerConnectionState } from "../types";
import { SUPPORTED_INDICES } from "../data/marketData";

interface HeaderProps {
  currentIndex: IndexInfo;
  onSelectIndex: (symbol: IndexSymbol) => void;
  executionMode: "OPTION_BUYING" | "OPTION_SELLING" | "SPREAD_HEDGE";
  onChangeExecutionMode: (mode: "OPTION_BUYING" | "OPTION_SELLING" | "SPREAD_HEDGE") => void;
  isLiveSimulating: boolean;
  onToggleSimulate: () => void;
  onOpenAIStrategist: () => void;
  brokerState: BrokerConnectionState;
  onOpenBrokerModal: () => void;
  onOpenCloudHybridModal?: () => void;
  onOpenSecurityModal?: () => void;
  onLockTerminal?: () => void;
  onOpenSpecModal?: () => void;
  onOpenNotificationCenter?: () => void;
  isNotificationsActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentIndex,
  onSelectIndex,
  executionMode,
  onChangeExecutionMode,
  isLiveSimulating,
  onToggleSimulate,
  onOpenAIStrategist,
  brokerState,
  onOpenBrokerModal,
  onOpenCloudHybridModal,
  onOpenSecurityModal,
  onLockTerminal,
  onOpenSpecModal,
  onOpenNotificationCenter,
  isNotificationsActive = true,
}) => {
  const isPositive = currentIndex.change >= 0;

  // India VIX live volatility benchmark
  const vixValue = currentIndex.symbol === "BANKNIFTY" ? 14.15 : 13.45;
  const vixChange = isPositive ? -0.38 : 0.42;
  const vixPct = isPositive ? -2.75 : 3.22;

  // Simultaneous 4 Active Indices Monitoring State
  const [secondarySymbol1, setSecondarySymbol1] = useState<IndexSymbol>(() => {
    try {
      const saved = localStorage.getItem("apex_slot2_index") as IndexSymbol;
      if (saved && SUPPORTED_INDICES[saved] && saved !== currentIndex.symbol) return saved;
    } catch {}
    return currentIndex.symbol === "BANKNIFTY" ? "NIFTY50" : "BANKNIFTY";
  });

  const [secondarySymbol2, setSecondarySymbol2] = useState<IndexSymbol>(() => {
    try {
      const saved = localStorage.getItem("apex_slot3_index") as IndexSymbol;
      if (saved && SUPPORTED_INDICES[saved] && saved !== currentIndex.symbol && saved !== secondarySymbol1) return saved;
    } catch {}
    const defaultSym = currentIndex.symbol === "FINNIFTY" ? "SPX500" : "FINNIFTY";
    return defaultSym === secondarySymbol1 ? "SPX500" : defaultSym;
  });

  const [secondarySymbol3, setSecondarySymbol3] = useState<IndexSymbol>(() => {
    try {
      const saved = localStorage.getItem("apex_slot4_index") as IndexSymbol;
      if (
        saved &&
        SUPPORTED_INDICES[saved] &&
        saved !== currentIndex.symbol &&
        saved !== secondarySymbol1 &&
        saved !== secondarySymbol2
      )
        return saved;
    } catch {}
    const candidateList: IndexSymbol[] = [
      "SPX500",
      "NASDAQ100",
      "DOWJONES",
      "FINNIFTY",
      "BTCUSD",
      "NIFTY50",
      "BANKNIFTY",
    ];
    const found = candidateList.find(
      (s) => s !== currentIndex.symbol && s !== secondarySymbol1 && s !== secondarySymbol2
    );
    return found || "SPX500";
  });

  // Dynamic simulated micro-ticks for secondary indices when isLiveSimulating is enabled
  const [tickOffsets, setTickOffsets] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isLiveSimulating) return;
    const interval = setInterval(() => {
      setTickOffsets((prev) => ({
        ...prev,
        [secondarySymbol1]:
          (prev[secondarySymbol1] || 0) +
          (Math.random() - 0.48) * (SUPPORTED_INDICES[secondarySymbol1]?.strikeStep || 50) * 0.05,
        [secondarySymbol2]:
          (prev[secondarySymbol2] || 0) +
          (Math.random() - 0.48) * (SUPPORTED_INDICES[secondarySymbol2]?.strikeStep || 50) * 0.05,
        [secondarySymbol3]:
          (prev[secondarySymbol3] || 0) +
          (Math.random() - 0.48) * (SUPPORTED_INDICES[secondarySymbol3]?.strikeStep || 50) * 0.05,
      }));
    }, 2500);
    return () => clearInterval(interval);
  }, [isLiveSimulating, secondarySymbol1, secondarySymbol2, secondarySymbol3]);

  const handleSelectPrimary = (newSym: IndexSymbol) => {
    if (newSym === secondarySymbol1) {
      setSecondarySymbol1(currentIndex.symbol);
      try {
        localStorage.setItem("apex_slot2_index", currentIndex.symbol);
      } catch {}
    } else if (newSym === secondarySymbol2) {
      setSecondarySymbol2(currentIndex.symbol);
      try {
        localStorage.setItem("apex_slot3_index", currentIndex.symbol);
      } catch {}
    } else if (newSym === secondarySymbol3) {
      setSecondarySymbol3(currentIndex.symbol);
      try {
        localStorage.setItem("apex_slot4_index", currentIndex.symbol);
      } catch {}
    }
    onSelectIndex(newSym);
  };

  const handleSelectSlot2 = (newSym: IndexSymbol) => {
    if (newSym === currentIndex.symbol) {
      onSelectIndex(secondarySymbol1);
      setSecondarySymbol1(currentIndex.symbol);
    } else {
      setSecondarySymbol1(newSym);
      try {
        localStorage.setItem("apex_slot2_index", newSym);
      } catch {}
    }
  };

  const handleSelectSlot3 = (newSym: IndexSymbol) => {
    if (newSym === currentIndex.symbol) {
      onSelectIndex(secondarySymbol2);
      setSecondarySymbol2(currentIndex.symbol);
    } else {
      setSecondarySymbol2(newSym);
      try {
        localStorage.setItem("apex_slot3_index", newSym);
      } catch {}
    }
  };

  const handleSelectSlot4 = (newSym: IndexSymbol) => {
    if (newSym === currentIndex.symbol) {
      onSelectIndex(secondarySymbol3);
      setSecondarySymbol3(currentIndex.symbol);
    } else {
      setSecondarySymbol3(newSym);
      try {
        localStorage.setItem("apex_slot4_index", newSym);
      } catch {}
    }
  };

  const handleSetPrimaryFromSlot = (targetSym: IndexSymbol, slotNum: 2 | 3 | 4) => {
    const oldPrimary = currentIndex.symbol;
    if (slotNum === 2) {
      setSecondarySymbol1(oldPrimary);
      try {
        localStorage.setItem("apex_slot2_index", oldPrimary);
      } catch {}
    } else if (slotNum === 3) {
      setSecondarySymbol2(oldPrimary);
      try {
        localStorage.setItem("apex_slot3_index", oldPrimary);
      } catch {}
    } else {
      setSecondarySymbol3(oldPrimary);
      try {
        localStorage.setItem("apex_slot4_index", oldPrimary);
      } catch {}
    }
    onSelectIndex(targetSym);
  };

  // Data calculations for Secondary Index 1 (Slot 2)
  const info2 = SUPPORTED_INDICES[secondarySymbol1] || SUPPORTED_INDICES.BANKNIFTY;
  const isSlot2Primary = currentIndex.symbol === secondarySymbol1;
  const price2 = isSlot2Primary
    ? currentIndex.currentPrice
    : Number((info2.currentPrice + (tickOffsets[secondarySymbol1] || 0)).toFixed(2));
  const change2 = isSlot2Primary
    ? currentIndex.change
    : Number((info2.change + (tickOffsets[secondarySymbol1] || 0)).toFixed(2));
  const changePct2 = isSlot2Primary
    ? currentIndex.changePercent
    : Number(((change2 / (price2 - change2)) * 100).toFixed(2));
  const isPos2 = change2 >= 0;

  // Data calculations for Secondary Index 2 (Slot 3)
  const info3 = SUPPORTED_INDICES[secondarySymbol2] || SUPPORTED_INDICES.FINNIFTY;
  const isSlot3Primary = currentIndex.symbol === secondarySymbol2;
  const price3 = isSlot3Primary
    ? currentIndex.currentPrice
    : Number((info3.currentPrice + (tickOffsets[secondarySymbol2] || 0)).toFixed(2));
  const change3 = isSlot3Primary
    ? currentIndex.change
    : Number((info3.change + (tickOffsets[secondarySymbol2] || 0)).toFixed(2));
  const changePct3 = isSlot3Primary
    ? currentIndex.changePercent
    : Number(((change3 / (price3 - change3)) * 100).toFixed(2));
  const isPos3 = change3 >= 0;

  // Data calculations for Secondary Index 3 (Slot 4)
  const info4 = SUPPORTED_INDICES[secondarySymbol3] || SUPPORTED_INDICES.SPX500;
  const isSlot4Primary = currentIndex.symbol === secondarySymbol3;
  const price4 = isSlot4Primary
    ? currentIndex.currentPrice
    : Number((info4.currentPrice + (tickOffsets[secondarySymbol3] || 0)).toFixed(2));
  const change4 = isSlot4Primary
    ? currentIndex.change
    : Number((info4.change + (tickOffsets[secondarySymbol3] || 0)).toFixed(2));
  const changePct4 = isSlot4Primary
    ? currentIndex.changePercent
    : Number(((change4 / (price4 - change4)) * 100).toFixed(2));
  const isPos4 = change4 >= 0;

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-2xl">
      {/* Top Banner Status Bar */}
      <div className="bg-slate-900/90 px-6 py-2 border-b border-slate-800/80 text-xs flex items-center justify-between overflow-x-auto gap-6 no-scrollbar">
        <div className="flex items-center gap-8 text-xs font-medium tracking-widest uppercase flex-shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em]">Market Status</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
              High Liquidity
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em]">India VIX</span>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="text-slate-200 font-bold">{vixValue.toFixed(2)}</span>
              <span
                className={`text-[10px] font-semibold ${
                  vixChange < 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {vixChange > 0 ? `+${vixChange.toFixed(2)}` : vixChange.toFixed(2)} (
                {vixPct > 0 ? `+${vixPct.toFixed(2)}%` : `${vixPct.toFixed(2)}%`})
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em]">HFT Sync</span>
            <span className="text-indigo-400 font-semibold font-mono text-[11px]">0.4ms Latency</span>
          </div>

          <div className="hidden lg:flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em]">Strategy Layer</span>
            <span className="text-slate-300 font-mono text-[11px]">Wyckoff Golden Pocket + HFT CVD</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Fyers & Broker Gateway Indicator Button */}
          <button
            onClick={onOpenBrokerModal}
            className={`px-3 py-1.5 rounded text-[11px] font-mono border transition-all flex items-center gap-1.5 ${
              brokerState.isConnected
                ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "bg-slate-900 border-indigo-500/40 text-indigo-300 hover:border-indigo-400"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                brokerState.isConnected ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" : "bg-amber-400"
              }`}
            ></div>
            <span className="font-bold">
              {brokerState.isConnected
                ? `${brokerState.broker} LIVE: ₹${brokerState.availableBalance ? Math.round(brokerState.availableBalance / 1000) + "k" : "SYNC"}`
                : "CONNECT BROKER (DHAN / UPSTOX / FYERS)"}
            </span>
          </button>

          <div className="px-3.5 py-1.5 bg-slate-900 rounded border border-slate-800 flex items-center gap-2.5">
            <span className="text-[11px] text-slate-400 font-medium tracking-wider uppercase">HFT Stream</span>
            <div className={`w-2 h-2 rounded-full ${isLiveSimulating ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-amber-500"}`}></div>
          </div>

          <button
            onClick={onToggleSimulate}
            className={`px-3 py-1.5 rounded text-[11px] font-mono border transition-all ${
              isLiveSimulating
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <RefreshCw className={`w-3 h-3 ${isLiveSimulating ? "animate-spin" : ""}`} />
              <span>{isLiveSimulating ? "LIVE FEED ACTIVE" : "FEED PAUSED"}</span>
            </span>
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Index Selector with Geometric Diamond Logo */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3.5">
            {/* Geometric Diamond Balance Logo */}
            <div className="w-8 h-8 bg-indigo-600 rounded-sm flex items-center justify-center transform rotate-45 shadow-[0_0_15px_rgba(79,70,229,0.5)] flex-shrink-0">
              <div className="w-4 h-4 border-2 border-white transform -rotate-45 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tighter text-white uppercase font-sans">
                  Apex Stratos <span className="text-indigo-400 font-semibold">Elite</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                  F&O QUANT
                </span>
              </div>
              <p className="text-[10px] text-slate-500 tracking-widest uppercase font-medium">
                Geometric Equilibrium & Institutional Order Flow
              </p>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-slate-800 hidden md:block"></div>

          {/* Simultaneous 3 Active Indices Monitoring Cluster */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Active Index Box #1 (Primary Terminal Focus) */}
            <div className="flex items-center gap-3 bg-slate-900 px-3 py-2 rounded border border-indigo-500/60 shadow-[0_0_14px_rgba(79,70,229,0.2)]">
              <div>
                <div className="flex items-center gap-1.5 text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>ACTIVE #1</span>
                  <span className="text-[8px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1 py-0.2 rounded font-mono font-bold">
                    FOCUS
                  </span>
                </div>
                <select
                  aria-label="Select Primary Active Trading Index"
                  value={currentIndex.symbol}
                  onChange={(e) => handleSelectPrimary(e.target.value as IndexSymbol)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1 font-mono mt-0.5"
                >
                  {Object.values(SUPPORTED_INDICES).map((idx) => (
                    <option key={idx.symbol} value={idx.symbol} className="bg-slate-900 text-white">
                      {idx.symbol} ({idx.name.split(" ")[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-right pl-3 border-l border-slate-800 font-mono">
                <div className="text-sm font-bold text-white">
                  {currentIndex.currency}
                  {currentIndex.currentPrice.toLocaleString()}
                </div>
                <div
                  className={`text-[10px] font-semibold flex items-center justify-end gap-1 ${
                    isPositive ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5" />
                  )}
                  <span>
                    {isPositive ? "+" : ""}
                    {currentIndex.change} ({currentIndex.changePercent}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Active Index Box #2 */}
            <div className="flex items-center gap-3 bg-slate-900/80 hover:bg-slate-900 px-3 py-2 rounded border border-slate-800 hover:border-slate-700 transition-all group">
              <div>
                <div className="flex items-center justify-between gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>ACTIVE #2</span>
                  <button
                    type="button"
                    onClick={() => handleSetPrimaryFromSlot(secondarySymbol1, 2)}
                    className="text-[8px] font-mono text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/30 px-1 py-0.2 rounded font-semibold transition-colors uppercase tracking-wider"
                    title="Switch this index to primary terminal focus"
                  >
                    FOCUS
                  </button>
                </div>
                <select
                  aria-label="Select Secondary Active Trading Index 2"
                  value={secondarySymbol1}
                  onChange={(e) => handleSelectSlot2(e.target.value as IndexSymbol)}
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer pr-1 font-mono mt-0.5"
                >
                  {Object.values(SUPPORTED_INDICES).map((idx) => (
                    <option key={idx.symbol} value={idx.symbol} className="bg-slate-900 text-white">
                      {idx.symbol} ({idx.name.split(" ")[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-right pl-3 border-l border-slate-800 font-mono">
                <div className="text-sm font-bold text-slate-200">
                  {info2.currency}
                  {price2.toLocaleString()}
                </div>
                <div
                  className={`text-[10px] font-semibold flex items-center justify-end gap-1 ${
                    isPos2 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isPos2 ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5" />
                  )}
                  <span>
                    {isPos2 ? "+" : ""}
                    {change2} ({changePct2}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Active Index Box #3 */}
            <div className="flex items-center gap-3 bg-slate-900/80 hover:bg-slate-900 px-3 py-2 rounded border border-slate-800 hover:border-slate-700 transition-all group">
              <div>
                <div className="flex items-center justify-between gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>ACTIVE #3</span>
                  <button
                    type="button"
                    onClick={() => handleSetPrimaryFromSlot(secondarySymbol2, 3)}
                    className="text-[8px] font-mono text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/30 px-1 py-0.2 rounded font-semibold transition-colors uppercase tracking-wider"
                    title="Switch this index to primary terminal focus"
                  >
                    FOCUS
                  </button>
                </div>
                <select
                  aria-label="Select Secondary Active Trading Index 3"
                  value={secondarySymbol2}
                  onChange={(e) => handleSelectSlot3(e.target.value as IndexSymbol)}
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer pr-1 font-mono mt-0.5"
                >
                  {Object.values(SUPPORTED_INDICES).map((idx) => (
                    <option key={idx.symbol} value={idx.symbol} className="bg-slate-900 text-white">
                      {idx.symbol} ({idx.name.split(" ")[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-right pl-3 border-l border-slate-800 font-mono">
                <div className="text-sm font-bold text-slate-200">
                  {info3.currency}
                  {price3.toLocaleString()}
                </div>
                <div
                  className={`text-[10px] font-semibold flex items-center justify-end gap-1 ${
                    isPos3 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isPos3 ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5" />
                  )}
                  <span>
                    {isPos3 ? "+" : ""}
                    {change3} ({changePct3}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Active Index Box #4 */}
            <div className="flex items-center gap-3 bg-slate-900/80 hover:bg-slate-900 px-3 py-2 rounded border border-slate-800 hover:border-slate-700 transition-all group">
              <div>
                <div className="flex items-center justify-between gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>ACTIVE #4</span>
                  <button
                    type="button"
                    onClick={() => handleSetPrimaryFromSlot(secondarySymbol3, 4)}
                    className="text-[8px] font-mono text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/30 px-1 py-0.2 rounded font-semibold transition-colors uppercase tracking-wider"
                    title="Switch this index to primary terminal focus"
                  >
                    FOCUS
                  </button>
                </div>
                <select
                  aria-label="Select Secondary Active Trading Index 4"
                  value={secondarySymbol3}
                  onChange={(e) => handleSelectSlot4(e.target.value as IndexSymbol)}
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer pr-1 font-mono mt-0.5"
                >
                  {Object.values(SUPPORTED_INDICES).map((idx) => (
                    <option key={idx.symbol} value={idx.symbol} className="bg-slate-900 text-white">
                      {idx.symbol} ({idx.name.split(" ")[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-right pl-3 border-l border-slate-800 font-mono">
                <div className="text-sm font-bold text-slate-200">
                  {info4.currency}
                  {price4.toLocaleString()}
                </div>
                <div
                  className={`text-[10px] font-semibold flex items-center justify-end gap-1 ${
                    isPos4 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isPos4 ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5" />
                  )}
                  <span>
                    {isPos4 ? "+" : ""}
                    {change4} ({changePct4}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Strategy Mode Switcher */}
          <div className="bg-slate-900 p-1 rounded border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => onChangeExecutionMode("OPTION_BUYING")}
              className={`px-3 py-1.5 rounded font-medium tracking-wider uppercase text-[11px] transition-all ${
                executionMode === "OPTION_BUYING"
                  ? "bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.4)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Directional Buying
            </button>
            <button
              onClick={() => onChangeExecutionMode("OPTION_SELLING")}
              className={`px-3 py-1.5 rounded font-medium tracking-wider uppercase text-[11px] transition-all ${
                executionMode === "OPTION_SELLING"
                  ? "bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.4)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Credit Spreads
            </button>
          </div>

          {/* Google Cloud Hybrid Architecture Button */}
          {onOpenCloudHybridModal && (
            <button
              id="open-cloud-hybrid-modal-btn"
              onClick={onOpenCloudHybridModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider bg-slate-900 border border-slate-700/80 text-cyan-300 hover:text-white hover:border-cyan-500/60 shadow transition-all"
            >
              <Cloud className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">GCP Hybrid</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
          )}

          {/* Broker Gateway Button */}
          <button
            onClick={onOpenBrokerModal}
            className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all border ${
              brokerState.isConnected
                ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-900/60"
                : "bg-slate-900 border-slate-800 text-indigo-300 hover:text-white hover:border-indigo-500/60 shadow"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>{brokerState.isConnected ? `${brokerState.broker} Gateway` : "Broker / FYERS"}</span>
          </button>

          {/* AI Quantitative Strategist Button */}
          <button
            onClick={onOpenAIStrategist}
            className="flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.35)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] active:scale-95 transition-all border border-indigo-400/30"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>A.I. Quant Engine</span>
          </button>

          {/* WhatsApp & Telegram Alerts Hub Button */}
          {onOpenNotificationCenter && (
            <button
              id="open-notifications-header-btn"
              onClick={onOpenNotificationCenter}
              title="Configure WhatsApp & Telegram Signal Dispatcher"
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider border shadow transition-all ${
                isNotificationsActive
                  ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)] hover:bg-emerald-900/60"
                  : "bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white"
              }`}
            >
              <div className="flex items-center -space-x-1">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <Send className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <span className="hidden sm:inline">Alerts</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isNotificationsActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                }`}
              ></span>
            </button>
          )}

          {/* Engine Specification & PDF Export Button */}
          {onOpenSpecModal && (
            <button
              id="open-engine-spec-btn"
              onClick={onOpenSpecModal}
              title="Open, View & Download Engine Specification PDF"
              className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/50 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>📄 PDF Spec</span>
            </button>
          )}

          {/* Security / 2FA Access Button */}
          {onOpenSecurityModal && (
            <button
              id="open-security-settings-btn"
              onClick={onOpenSecurityModal}
              title="Terminal Security & 2FA Setup"
              className="p-2 rounded bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:border-indigo-500/60 shadow transition-all"
            >
              <Shield className="w-4 h-4 text-indigo-400" />
            </button>
          )}

          {/* Lock Screen Trigger Button */}
          {onLockTerminal && (
            <button
              id="lock-terminal-header-btn"
              onClick={onLockTerminal}
              title="Lock Terminal Now"
              className="p-2 rounded bg-slate-900 border border-slate-700/80 text-rose-400 hover:text-rose-300 hover:border-rose-500/60 shadow transition-all"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
