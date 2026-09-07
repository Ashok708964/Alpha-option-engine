import React, { useState } from "react";
import { PaperTradePosition, IndexInfo } from "../types";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  DollarSign,
  ChevronRight,
  Shield,
  Activity,
  Layers,
  Download,
  Volume2,
  VolumeX,
  Plus,
  Award,
  BarChart3,
} from "lucide-react";
import { soundEngine } from "../utils/audioEngine";
import { PaperTradingSummaryModal } from "./PaperTradingSummaryModal";
import { computeSessionPerformanceMetrics } from "../utils/performanceMetrics";

interface PaperTradingTerminalProps {
  index: IndexInfo;
  positions: PaperTradePosition[];
  onClosePosition: (id: string) => void;
  onClearHistory: () => void;
  onAdjustTrailingSl: (id: string) => void;
  onManualCustomTrade?: (
    strike: number,
    optionType: "CE" | "PE",
    lots: number,
    target: number,
    sl: number
  ) => void;
}

export const PaperTradingTerminal: React.FC<PaperTradingTerminalProps> = ({
  index,
  positions,
  onClosePosition,
  onClearHistory,
  onAdjustTrailingSl,
  onManualCustomTrade,
}) => {
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "CLOSED">("ALL");
  const [isAudioMuted, setIsAudioMuted] = useState(soundEngine.getIsMuted());
  const [showCustomOrderModal, setShowCustomOrderModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const sessionMetrics = computeSessionPerformanceMetrics(positions);

  // Custom order state
  const roundStrike = Math.round(index.currentPrice / index.strikeStep) * index.strikeStep;
  const [customStrike, setCustomStrike] = useState<number>(roundStrike);
  const [customType, setCustomType] = useState<"CE" | "PE">("CE");
  const [customLots, setCustomLots] = useState<number>(1);
  const [customTarget, setCustomTarget] = useState<number>(
    Number((index.currentPrice + index.strikeStep * 2).toFixed(2))
  );
  const [customSl, setCustomSl] = useState<number>(
    Number((index.currentPrice - index.strikeStep * 1).toFixed(2))
  );

  const toggleMute = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    soundEngine.setMuted(next);
  };

  const handleExportCsv = () => {
    if (positions.length === 0) return;
    const headers = [
      "ID",
      "Timestamp",
      "Index",
      "Contract",
      "OptionType",
      "Strike",
      "EntrySpotPrice",
      "EntryPremium",
      "ExitSpotPrice",
      "ExitPremium",
      "Lots",
      "LotSize",
      "CapitalInvested",
      "Target1",
      "StopLoss",
      "RealizedPnl",
      "ROI_Percent",
      "Status",
    ];

    const rows = positions.map((p) => [
      p.id,
      p.timestamp,
      p.index,
      `"${p.contract}"`,
      p.optionType,
      p.strike,
      p.entrySpotPrice,
      p.entryPremium,
      p.currentSpotPrice,
      p.currentPremium,
      p.lots,
      p.lotSize,
      p.capitalInvested,
      p.target1,
      p.stopLoss,
      p.status === "ACTIVE" ? p.unrealizedPnl : p.realizedPnl || 0,
      p.status === "ACTIVE" ? p.unrealizedRoi : Number((((p.realizedPnl || 0) / p.capitalInvested) * 100).toFixed(1)),
      p.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OmniAlpha_PaperTrade_Journal_${index.symbol}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPositions = positions.filter((p) => {
    if (filter === "ACTIVE") return p.status === "ACTIVE";
    if (filter === "CLOSED") return p.status !== "ACTIVE";
    return true;
  });

  const activePositions = positions.filter((p) => p.status === "ACTIVE");
  const closedPositions = positions.filter((p) => p.status !== "ACTIVE");

  const totalRealizedPnl = closedPositions.reduce((sum, p) => sum + (p.realizedPnl || 0), 0);
  const totalUnrealizedPnl = activePositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  const totalPnl = totalRealizedPnl + totalUnrealizedPnl;

  const winCount = closedPositions.filter((p) => (p.realizedPnl || 0) > 0).length;
  const winRate = closedPositions.length > 0 ? Math.round((winCount / closedPositions.length) * 100) : 100;

  return (
    <div id="paper-trading-terminal" className="bg-slate-900 border border-slate-800 rounded p-5 shadow-2xl space-y-5">
      {/* Terminal Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white uppercase tracking-tight">
                Monday Live Paper Trading Desk
              </h3>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Simulated Execution
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Zero-risk real-time execution engine tracking tick-by-tick mark-to-market P&L with automated trailing stop-losses.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Custom Strike Launcher */}
          {onManualCustomTrade && (
            <button
              onClick={() => setShowCustomOrderModal(true)}
              className="px-2.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(79,70,229,0.3)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>CUSTOM ORDER</span>
            </button>
          )}

          {/* Sortino & Performance Summary Dialog Button */}
          <button
            onClick={() => setShowSummaryModal(true)}
            className="px-2.5 py-1.5 rounded bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)] hover:border-amber-400"
            title="Open Sortino Ratio, Maximum Drawdown & Performance Summary Dialog"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>SORTINO & SUMMARY</span>
          </button>

          {/* Sound Alert Toggle */}
          <button
            onClick={toggleMute}
            className={`p-1.5 rounded border text-xs font-mono transition-all ${
              isAudioMuted
                ? "bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300"
                : "bg-indigo-950/40 text-indigo-400 border-indigo-500/30 hover:bg-indigo-900/50"
            }`}
            title={isAudioMuted ? "Sound Alerts Muted" : "Sound Alerts Active"}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* CSV Export */}
          {positions.length > 0 && (
            <button
              onClick={handleExportCsv}
              className="px-2.5 py-1.5 rounded bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-xs font-mono flex items-center gap-1.5 transition-all"
              title="Download Paper Trading Trade Log (CSV)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT CSV</span>
            </button>
          )}

          <div className="flex rounded bg-slate-950 p-0.5 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1 rounded transition-all ${
                filter === "ALL" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ALL ({positions.length})
            </button>
            <button
              onClick={() => setFilter("ACTIVE")}
              className={`px-3 py-1 rounded transition-all ${
                filter === "ACTIVE" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ACTIVE ({activePositions.length})
            </button>
            <button
              onClick={() => setFilter("CLOSED")}
              className={`px-3 py-1 rounded transition-all ${
                filter === "CLOSED" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              CLOSED ({closedPositions.length})
            </button>
          </div>

          {positions.length > 0 && (
            <button
              onClick={onClearHistory}
              className="px-2.5 py-1.5 rounded bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs font-mono flex items-center gap-1 transition-all"
              title="Reset Simulated Portfolio"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Order Placement Modal */}
      {showCustomOrderModal && onManualCustomTrade && (
        <div className="bg-slate-950 border border-indigo-500/30 rounded p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-indigo-400 font-bold uppercase font-sans">
            <span>Direct Custom Strike Order Placement</span>
            <button
              onClick={() => setShowCustomOrderModal(false)}
              className="text-slate-500 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="text-[10px] text-slate-400">Strike Price</label>
              <input
                type="number"
                value={customStrike}
                onChange={(e) => setCustomStrike(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-bold mt-1"
                step={index.strikeStep}
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Option Type</label>
              <select
                value={customType}
                onChange={(e) => setCustomType(e.target.value as "CE" | "PE")}
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-bold mt-1"
              >
                <option value="CE">Call (CE - Bullish)</option>
                <option value="PE">Put (PE - Bearish)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Lots ({index.lotSize} Qty/Lot)</label>
              <input
                type="number"
                value={customLots}
                onChange={(e) => setCustomLots(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-bold mt-1"
                min="1"
                max="50"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Target Spot</label>
              <input
                type="number"
                value={customTarget}
                onChange={(e) => setCustomTarget(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-emerald-400 font-bold mt-1"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Stop-Loss Spot</label>
              <input
                type="number"
                value={customSl}
                onChange={(e) => setCustomSl(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-rose-400 font-bold mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowCustomOrderModal(false)}
              className="px-3 py-1 rounded bg-slate-900 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onManualCustomTrade(customStrike, customType, customLots, customTarget, customSl);
                setShowCustomOrderModal(false);
              }}
              className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Simulate Position
            </button>
          </div>
        </div>
      )}

      {/* Portfolio Performance Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
        <div className="bg-slate-950 border border-slate-800 rounded p-3">
          <div className="text-[9px] text-slate-500 uppercase font-sans font-bold tracking-wider">
            TOTAL COMBINED P&L
          </div>
          <div
            className={`text-lg font-bold mt-0.5 flex items-center gap-1 ${
              totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {totalPnl >= 0 ? "+" : ""}
            {index.currency}
            {totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Realized: {index.currency}{totalRealizedPnl.toFixed(0)} • Live: {index.currency}{totalUnrealizedPnl.toFixed(0)}
          </div>
        </div>

        {/* Sortino Ratio Card */}
        <div
          onClick={() => setShowSummaryModal(true)}
          className="bg-slate-950 border border-slate-800 hover:border-amber-500/40 cursor-pointer rounded p-3 transition-colors group"
          title="Click to view complete Sortino & Drawdown Summary Dialog"
        >
          <div className="flex items-center justify-between text-[9px] text-slate-500 uppercase font-sans font-bold tracking-wider">
            <span>SORTINO RATIO</span>
            <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded">
              Downside Adj
            </span>
          </div>
          <div className="text-lg font-bold text-amber-300 mt-0.5 flex items-center justify-between">
            <span>{sessionMetrics.sortinoRatio.toFixed(2)}</span>
            <span className="text-[9px] font-sans text-slate-500 group-hover:text-amber-400">
              Audit ↗
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Downside Vol: {sessionMetrics.downsideDeviationPct}%
          </div>
        </div>

        {/* Max Drawdown Card */}
        <div
          onClick={() => setShowSummaryModal(true)}
          className="bg-slate-950 border border-slate-800 hover:border-rose-500/40 cursor-pointer rounded p-3 transition-colors group"
          title="Click to view Peak-to-Trough Drawdown Curve"
        >
          <div className="flex items-center justify-between text-[9px] text-slate-500 uppercase font-sans font-bold tracking-wider">
            <span>MAX DRAWDOWN</span>
            <span className="text-[8px] bg-rose-500/20 text-rose-300 px-1 py-0.2 rounded">
              MDD
            </span>
          </div>
          <div className="text-lg font-bold text-rose-400 mt-0.5">
            -{sessionMetrics.maxDrawdownPct.toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Max Drop: -{index.currency}{sessionMetrics.maxDrawdownAmount.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded p-3">
          <div className="text-[9px] text-slate-500 uppercase font-sans font-bold tracking-wider">
            WIN RATE (CLOSED)
          </div>
          <div className="text-lg font-bold text-white mt-0.5">
            {winRate}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {winCount} Wins / {closedPositions.length - winCount} Losses
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded p-3">
          <div className="text-[9px] text-slate-500 uppercase font-sans font-bold tracking-wider">
            OPEN POSITIONS
          </div>
          <div className="text-lg font-bold text-indigo-400 mt-0.5">
            {activePositions.length} Active
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Margin: {index.currency}
            {activePositions.reduce((s, p) => s + p.capitalInvested, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Position Log Table */}
      {filteredPositions.length === 0 ? (
        <div className="bg-slate-950 border border-dashed border-slate-800 rounded-lg p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Activity className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wide">No Active Paper Trades</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            When you see a confirmed quantitative setup in the top card, click <strong className="text-indigo-300">"PAPER TRADE CONTRACT"</strong> to simulate Monday execution with live tick-by-tick P&L tracking.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase font-sans tracking-wider">
                <th className="py-2.5 px-3">Contract / Index</th>
                <th className="py-2.5 px-3">Entry & Current</th>
                <th className="py-2.5 px-3">Target / SL</th>
                <th className="py-2.5 px-3">Lots & Margin</th>
                <th className="py-2.5 px-3">Live P&L</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPositions.map((pos) => {
                const isCall = pos.optionType === "CE";
                const isClosed = pos.status !== "ACTIVE";
                const pnl = isClosed ? pos.realizedPnl || 0 : pos.unrealizedPnl;
                const roi = isClosed ? Number(((pnl / pos.capitalInvested) * 100).toFixed(1)) : pos.unrealizedRoi;
                const isProfitable = pnl >= 0;

                return (
                  <tr key={pos.id} className="hover:bg-slate-950/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            isCall
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {pos.optionType}
                        </span>
                        <div>
                          <div className="font-bold text-slate-200 text-xs">{pos.contract}</div>
                          <div className="text-[10px] text-slate-500">
                            {pos.timestamp} • Strike {pos.strike}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div>
                        <span className="text-slate-400">Entry: </span>
                        <strong className="text-white font-semibold">
                          {index.currency}{pos.entryPremium}
                        </strong>
                        <span className="text-[10px] text-slate-500 ml-1">
                          (Spot: {pos.entrySpotPrice})
                        </span>
                      </div>
                      <div className="text-[11px] mt-0.5">
                        <span className="text-slate-500">Now: </span>
                        <strong className={isProfitable ? "text-emerald-400" : "text-rose-400"}>
                          {index.currency}{pos.currentPremium}
                        </strong>
                        <span className="text-[10px] text-slate-500 ml-1">
                          (Spot: {pos.currentSpotPrice})
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-[11px] text-emerald-400">
                        T1: {index.currency}{pos.target1} • T2: {index.currency}{pos.target2}
                      </div>
                      <div className="text-[11px] text-rose-400 mt-0.5">
                        SL: {index.currency}{pos.stopLoss}
                        {pos.trailingSlActive && (
                          <span className="ml-1 text-[9px] bg-indigo-500/20 text-indigo-300 px-1 py-0.2 rounded border border-indigo-500/30">
                            Trailing SL
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-300">
                        {pos.lots} Lot ({pos.lots * pos.lotSize} Qty)
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Margin: {index.currency}{pos.capitalInvested.toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div
                        className={`text-sm font-bold flex items-center gap-1 ${
                          isProfitable ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isProfitable ? "+" : ""}
                        {index.currency}
                        {pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div
                        className={`text-[10px] font-semibold ${
                          isProfitable ? "text-emerald-500" : "text-rose-500"
                        }`}
                      >
                        {isProfitable ? "+" : ""}
                        {roi}% ROI
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      {!isClosed ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onAdjustTrailingSl(pos.id)}
                            className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-slate-800 text-[10px] transition-all"
                            title="Toggle Trailing Stop-Loss to Breakeven"
                          >
                            {pos.trailingSlActive ? "SL TRAILED" : "TRAIL SL"}
                          </button>

                          <button
                            onClick={() => onClosePosition(pos.id)}
                            className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-[10px] font-bold transition-all"
                          >
                            CLOSE
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            pos.status === "TARGET_1_HIT" || pos.status === "TARGET_2_HIT"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : pos.status === "STOPPED_OUT"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {pos.status}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Institutional Session Performance & Sortino Summary Dialog */}
      <PaperTradingSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        index={index}
        positions={positions}
      />
    </div>
  );
};
