import React, { useState } from "react";
import { PaperTradePosition, IndexInfo } from "../types";
import { computeSessionPerformanceMetrics } from "../utils/performanceMetrics";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  Award,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Activity,
  BarChart3,
  Percent,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  FileText,
} from "lucide-react";

interface PaperTradingSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  index: IndexInfo;
  positions: PaperTradePosition[];
  initialCapital?: number;
}

export const PaperTradingSummaryModal: React.FC<PaperTradingSummaryModalProps> = ({
  isOpen,
  onClose,
  index,
  positions,
  initialCapital = 500000,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<"EQUITY" | "DRAWDOWN">("EQUITY");

  if (!isOpen) return null;

  const metrics = computeSessionPerformanceMetrics(positions, initialCapital);
  const isProfitable = metrics.totalPnl >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden font-mono">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white uppercase tracking-tight font-sans">
                  Session Performance & Sortino Consistency Audit
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    metrics.consistencyScore >= 75
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : metrics.consistencyScore >= 50
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  Consistency Score: {metrics.consistencyScore}/100
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Quantified risk-adjusted metrics, downside deviation, Sortino ratio, and peak-to-trough drawdown verification.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Main Key Quantitative Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Sortino Ratio */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider">
                  Sortino Ratio
                </span>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded">
                  Downside-Adjusted
                </span>
              </div>
              <div
                className={`text-2xl font-bold font-sans mt-1.5 ${
                  metrics.sortinoRatio >= 2.0
                    ? "text-emerald-400"
                    : metrics.sortinoRatio >= 1.0
                    ? "text-indigo-400"
                    : metrics.sortinoRatio >= 0
                    ? "text-amber-400"
                    : "text-rose-400"
                }`}
              >
                {metrics.sortinoRatio.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Downside Vol: {metrics.downsideDeviationPct}%</span>
                <span className="text-slate-500">Target MAR: 0%</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-1 border-t border-slate-900 pt-1">
                {metrics.sortinoRatio >= 2.0
                  ? "★ Institutional Grade (Exceptional)"
                  : metrics.sortinoRatio >= 1.0
                  ? "Solid Asymmetric Edge"
                  : "Needs Downside Tightening"}
              </div>
            </div>

            {/* 2. Maximum Drawdown (MDD) */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider">
                  Maximum Drawdown
                </span>
                <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded">
                  Peak-to-Trough
                </span>
              </div>
              <div
                className={`text-2xl font-bold font-sans mt-1.5 ${
                  metrics.maxDrawdownPct <= 1.5
                    ? "text-emerald-400"
                    : metrics.maxDrawdownPct <= 3.5
                    ? "text-amber-400"
                    : "text-rose-400"
                }`}
              >
                -{metrics.maxDrawdownPct.toFixed(2)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Max Drop:</span>
                <span className="text-rose-400 font-bold">
                  -{index.currency}{metrics.maxDrawdownAmount.toLocaleString()}
                </span>
              </div>
              <div className="text-[9px] text-slate-500 mt-1 border-t border-slate-900 pt-1">
                {metrics.maxDrawdownPct <= 2.0
                  ? "✓ Pristine Capital Preservation"
                  : "Moderate Peak Pullback"}
              </div>
            </div>

            {/* 3. Profit Factor & Payoff Ratio */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider">
                  Profit Factor
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  Gross P/L
                </span>
              </div>
              <div className="text-2xl font-bold font-sans text-emerald-400 mt-1.5">
                {metrics.profitFactor >= 9.9 ? "∞ (No Losses)" : `${metrics.profitFactor.toFixed(2)}x`}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Payoff Ratio:</span>
                <span className="text-indigo-300 font-bold">{metrics.winLossRatio}:1</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-1 border-t border-slate-900 pt-1">
                Avg Win: {index.currency}{metrics.avgWin.toFixed(0)} | Avg Loss: {index.currency}{metrics.avgLoss.toFixed(0)}
              </div>
            </div>

            {/* 4. Total Net P&L & Expectancy */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider">
                  Net Session P&L
                </span>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded">
                  {metrics.totalTrades} Trades
                </span>
              </div>
              <div
                className={`text-2xl font-bold font-sans mt-1.5 flex items-center gap-1 ${
                  isProfitable ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isProfitable ? "+" : ""}
                {index.currency}
                {metrics.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Expectancy / Trade:</span>
                <span className="text-emerald-400 font-bold">
                  +{index.currency}{metrics.expectancyPerTrade.toFixed(0)}
                </span>
              </div>
              <div className="text-[9px] text-slate-500 mt-1 border-t border-slate-900 pt-1">
                Win Rate: {metrics.winRate}% ({metrics.winCount}W - {metrics.lossCount}L)
              </div>
            </div>
          </div>

          {/* Interactive Chart Section: Cumulative Equity Curve vs Drawdown Underwater Chart */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white font-sans uppercase">
                  Session Equity Curve & Drawdown Evolution
                </span>
              </div>

              <div className="flex gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[10px]">
                <button
                  onClick={() => setActiveChartTab("EQUITY")}
                  className={`px-3 py-1 rounded transition-all font-bold ${
                    activeChartTab === "EQUITY"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Cumulative P&L Curve
                </button>
                <button
                  onClick={() => setActiveChartTab("DRAWDOWN")}
                  className={`px-3 py-1 rounded transition-all font-bold ${
                    activeChartTab === "DRAWDOWN"
                      ? "bg-rose-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Underwater Drawdown (%)
                </button>
              </div>
            </div>

            {/* Chart Container */}
            <div className="h-60 w-full">
              {activeChartTab === "EQUITY" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.equityCurve} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="equityGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="tradeIndex"
                      stroke="#64748b"
                      tick={{ fontSize: 9 }}
                      tickFormatter={(i) => (i === 0 ? "Start" : `Trade ${i}`)}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fontSize: 9 }}
                      tickFormatter={(v) => `${index.currency}${v.toLocaleString()}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", fontSize: "10px" }}
                      formatter={(val: any) => [`${index.currency}${Number(val).toLocaleString()}`, "Cumulative P&L"]}
                      labelFormatter={(label, payload) => {
                        const item = payload[0]?.payload;
                        return item ? `Trade #${item.tradeIndex}: ${item.label} (${item.timestamp})` : `Trade #${label}`;
                      }}
                    />
                    <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                    <Area
                      type="monotone"
                      dataKey="cumulativePnl"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fill="url(#equityGreen)"
                      name="Cumulative Net P&L"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.equityCurve} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="drawdownRose" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="tradeIndex"
                      stroke="#64748b"
                      tick={{ fontSize: 9 }}
                      tickFormatter={(i) => (i === 0 ? "Start" : `Trade ${i}`)}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fontSize: 9 }}
                      tickFormatter={(v) => `-${v}%`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", fontSize: "10px" }}
                      formatter={(val: any) => [`-${val}%`, "Drawdown from Peak"]}
                    />
                    <ReferenceLine y={metrics.maxDrawdownPct} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: `Max DD: -${metrics.maxDrawdownPct}%`, fill: "#f43f5e", fontSize: 9 }} />
                    <Area
                      type="monotone"
                      dataKey="drawdownPct"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fill="url(#drawdownRose)"
                      name="Drawdown Depth"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Secondary Statistical Audit & Educational Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sortino vs Sharpe Comparison Details */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200 font-sans uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Why Sortino Outperforms Sharpe for Options
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  S = (R - MAR) / σ_d
                </span>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-300">
                <p>
                  • <strong>Standard Sharpe Ratio ({metrics.sharpeRatio.toFixed(2)})</strong> penalizes <em>all</em> volatility equally, including massive explosive upside profits (+50% to +100% option moves).
                </p>
                <p>
                  • <strong>Sortino Ratio ({metrics.sortinoRatio.toFixed(2)})</strong> isolates and penalizes <em>only harmful downside volatility</em> (loss deviations below target), rewarding positive skewness.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-900 text-slate-400 text-[10px]">
                  <div>
                    Total Volatility (σ): <strong className="text-white">{metrics.totalVolatilityPct}%</strong>
                  </div>
                  <div>
                    Downside Deviation (σ_d): <strong className="text-indigo-300">{metrics.downsideDeviationPct}%</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Streaks, Consistency & Trade Statistics */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200 font-sans uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Execution Consistency & Streaks
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Current Streak: {metrics.currentStreak.count} {metrics.currentStreak.type}S
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="bg-slate-900 border border-slate-800 rounded p-2">
                  <div className="text-slate-500 uppercase">Max Win Streak</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">
                    {metrics.maxConsecutiveWins} Consecutive
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded p-2">
                  <div className="text-slate-500 uppercase">Max Loss Streak</div>
                  <div className="text-base font-bold text-rose-400 mt-0.5">
                    {metrics.maxConsecutiveLosses} Consecutive
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded p-2">
                  <div className="text-slate-500 uppercase">Calmar Ratio</div>
                  <div className="text-base font-bold text-indigo-400 mt-0.5">
                    {metrics.calmarRatio.toFixed(2)}x
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 bg-slate-900 border border-slate-800 rounded p-2.5">
                Strategy Consistency Score: <strong className="text-emerald-400">{metrics.consistencyScore}/100</strong>. Win rate, payoff ratio, and tight downside variance indicate strong positive statistical edge.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/70">
          <div className="text-[10px] text-slate-400">
            Validated on {metrics.totalTrades} total simulated execution orders • Mark-to-market updated
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-sans uppercase transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)]"
          >
            Done & Return to Desk
          </button>
        </div>
      </div>
    </div>
  );
};
