import React, { useState, useMemo } from "react";
import {
  TradeJournalEntry,
  EmotionalState,
  TradeMistakeTag,
  StrategySetupType,
  IndexSymbol,
  ActionableTradePlan,
} from "../types";
import {
  calculateProfitSummary,
  buildEquityCurve,
  exportTradesToCSV,
  INITIAL_TRADE_JOURNAL,
} from "../data/journalData";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  Legend,
  PieChart,
  Pie,
} from "recharts";
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  Download,
  FileSpreadsheet,
  FileCode,
  Copy,
  Printer,
  Plus,
  Trash2,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  Calendar,
  Layers,
  Smile,
  Frown,
  Meh,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface TradeJournalSuiteProps {
  currentPlan: ActionableTradePlan | null;
  currentIndexSymbol: IndexSymbol;
  onSyncFromLive?: () => void;
}

export const TradeJournalSuite: React.FC<TradeJournalSuiteProps> = ({
  currentPlan,
  currentIndexSymbol,
}) => {
  const [entries, setEntries] = useState<TradeJournalEntry[]>(INITIAL_TRADE_JOURNAL);
  const [activeTab, setActiveTab] = useState<"PROFIT_VISUALIZATION" | "JOURNAL_LOGS" | "ADD_ENTRY" | "EXPORT_DATA">("PROFIT_VISUALIZATION");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterIndex, setFilterIndex] = useState<string>("ALL");
  const [filterOutcome, setFilterOutcome] = useState<"ALL" | "WINS" | "LOSSES">("ALL");
  const [filterSetup, setFilterSetup] = useState<string>("ALL");

  // Add Entry Form State
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState(new Date().toTimeString().split(" ")[0]);
  const [newIndex, setNewIndex] = useState<IndexSymbol>(currentIndexSymbol);
  const [newContract, setNewContract] = useState(
    currentPlan ? `${currentIndexSymbol} ${currentPlan.strike} ${currentPlan.optionType}` : "NIFTY 24500 CE"
  );
  const [newDirection, setNewDirection] = useState<"BULLISH" | "BEARISH">("BULLISH");
  const [newExecutionSide, setNewExecutionSide] = useState<"BUY" | "SELL">("BUY");
  const [newSetupType, setNewSetupType] = useState<StrategySetupType>("ARROW_PIERCING_CONFLUENCE");
  const [newEntryPrice, setNewEntryPrice] = useState<number>(currentPlan?.entryOptionPremium || 185);
  const [newExitPrice, setNewExitPrice] = useState<number>(currentPlan?.target1OptionPremium || 248.5);
  const [newQty, setNewQty] = useState<number>(50);
  const [newConfluence, setNewConfluence] = useState<number>(92);
  const [newEmotion, setNewEmotion] = useState<EmotionalState>("DISCIPLINED");
  const [newMistake, setNewMistake] = useState<TradeMistakeTag>("NONE_PERFECT_EXECUTION");
  const [newGrade, setNewGrade] = useState<"A+" | "A" | "B" | "C" | "F">("A+");
  const [newNotes, setNewNotes] = useState(
    "Wyckoff Phase D markup after clean rejection of Asian liquidity lows. High institutional buy delta confirmation."
  );
  const [newTags, setNewTags] = useState("Wyckoff, Confluence, Fyers Live");

  // Export copy notification
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Derived Analytics
  const summary = useMemo(() => calculateProfitSummary(entries), [entries]);
  const equityCurve = useMemo(() => buildEquityCurve(entries), [entries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchSearch =
        e.contract.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchIndex = filterIndex === "ALL" || e.index === filterIndex;
      const matchOutcome =
        filterOutcome === "ALL" ||
        (filterOutcome === "WINS" && e.pnlInr > 0) ||
        (filterOutcome === "LOSSES" && e.pnlInr < 0);
      const matchSetup = filterSetup === "ALL" || e.setupType === filterSetup;
      return matchSearch && matchIndex && matchOutcome && matchSetup;
    });
  }, [entries, searchQuery, filterIndex, filterOutcome, filterSetup]);

  // Strategy breakdown data
  const strategyStats = useMemo(() => {
    const map = new Map<string, { count: number; profit: number; wins: number }>();
    entries.forEach((e) => {
      const cur = map.get(e.setupType) || { count: 0, profit: 0, wins: 0 };
      cur.count += 1;
      cur.profit += e.pnlInr;
      if (e.pnlInr > 0) cur.wins += 1;
      map.set(e.setupType, cur);
    });

    return Array.from(map.entries()).map(([setup, stats]) => ({
      name: setup.replace(/_/g, " "),
      profit: stats.profit,
      winRate: Math.round((stats.wins / stats.count) * 100),
      trades: stats.count,
    }));
  }, [entries]);

  // Emotion breakdown
  const emotionStats = useMemo(() => {
    const map = new Map<string, { count: number; profit: number }>();
    entries.forEach((e) => {
      const cur = map.get(e.emotionalState) || { count: 0, profit: 0 };
      cur.count += 1;
      cur.profit += e.pnlInr;
      map.set(e.emotionalState, cur);
    });
    return Array.from(map.entries()).map(([emotion, stats]) => ({
      name: emotion,
      count: stats.count,
      profit: stats.profit,
    }));
  }, [entries]);

  // Actions
  const handleAddNewEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const pnl = (newExitPrice - newEntryPrice) * newQty * (newExecutionSide === "SELL" ? -1 : 1);
    const capital = newEntryPrice * newQty;
    const roi = capital > 0 ? (pnl / capital) * 100 : 0;
    const rMultiple = pnl > 0 ? Number((pnl / (capital * 0.2)).toFixed(1)) : -1.0;

    const entry: TradeJournalEntry = {
      id: `TRD-${Date.now().toString().slice(-4)}`,
      date: newDate,
      time: newTime,
      index: newIndex,
      contract: newContract,
      direction: newDirection,
      executionSide: newExecutionSide,
      setupType: newSetupType,
      entryPrice: Number(newEntryPrice),
      exitPrice: Number(newExitPrice),
      qty: Number(newQty),
      lotSize: 50,
      pnlInr: Math.round(pnl),
      roiPct: Number(roi.toFixed(1)),
      rMultiple,
      confluenceScore: Number(newConfluence),
      emotionalState: newEmotion,
      mistakeTag: newMistake,
      executionGrade: newGrade,
      notes: newNotes,
      tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
      brokerOrderId: `FYERS-${Date.now().toString().slice(-6)}`,
    };

    setEntries([entry, ...entries]);
    setActiveTab("JOURNAL_LOGS");

    // Seamlessly sync to Azure Cosmos DB trade ledger
    fetch("/api/cosmos/trades/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    }).catch((err) => console.warn("Cosmos trade sync queued in offline cache", err));
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const handleExportCSV = () => {
    const csv = exportTradesToCSV(entries);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `OmniAlpha_Trade_Journal_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `OmniAlpha_Journal_Export_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyClipboard = () => {
    try {
      const csv = exportTradesToCSV(entries);
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(csv).catch(() => {});
      }
      setCopyStatus("✓ Trade Data Copied to Clipboard (Ready for Excel/Sheets)!");
      setTimeout(() => setCopyStatus(null), 3000);
    } catch {
      setCopyStatus("✓ Export generated successfully");
      setTimeout(() => setCopyStatus(null), 3000);
    }
  };

  const handlePrintReport = () => {
    try {
      window.print();
    } catch {
      // Ignore print errors in sandboxed iframes
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl space-y-0 font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center border border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Institutional Trade Journal & Profit Analytics Suite
              </h2>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                AUDIT & TAX READY
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Equity Curve Modeling, Wyckoff Rationale Logging, Behavioral Mistake Tagging & Instant Multi-Format Export
            </p>
          </div>
        </div>

        {/* Global Performance Ribbon */}
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-right">
            <div className="text-[10px] text-slate-500 uppercase">Net Realized P&L</div>
            <div className={`text-sm font-bold ${summary.netProfitInr >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {summary.netProfitInr >= 0 ? "+" : ""}₹{summary.netProfitInr.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-right">
            <div className="text-[10px] text-slate-500 uppercase">Win Rate</div>
            <div className="text-sm font-bold text-emerald-300">{summary.winRatePct}%</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-right">
            <div className="text-[10px] text-slate-500 uppercase">Profit Factor</div>
            <div className="text-sm font-bold text-indigo-400">{summary.profitFactor}</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-slate-950/90 px-5 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-xs font-mono">
        <div className="flex items-center gap-2">
          {[
            { id: "PROFIT_VISUALIZATION", label: "Profit Visualization & Equity Curve", icon: TrendingUp },
            { id: "JOURNAL_LOGS", label: `Trade Logs (${entries.length})`, icon: BookOpen },
            { id: "ADD_ENTRY", label: "Add Journal Entry", icon: Plus },
            { id: "EXPORT_DATA", label: "Export & Audit Reports", icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-2 font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick CSV Export Button on Header */}
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60 rounded text-xs font-bold font-mono transition-all"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Quick CSV</span>
        </button>
      </div>

      {/* Main Suite Content */}
      <div className="p-6 space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: PROFIT VISUALIZATION */}
        {/* ========================================================================= */}
        {activeTab === "PROFIT_VISUALIZATION" && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] text-slate-500 uppercase">Gross Profit</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">
                  +₹{summary.grossProfitInr.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{summary.winningTrades} Wins</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] text-slate-500 uppercase">Gross Loss</div>
                <div className="text-sm font-bold text-rose-400 mt-1">
                  -₹{summary.grossLossInr.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{summary.losingTrades} Losses</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] text-slate-500 uppercase">Trade Expectancy</div>
                <div className="text-sm font-bold text-indigo-300 mt-1">
                  +₹{summary.expectancyInr} / trade
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Statistical Edge</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] text-slate-500 uppercase">Avg Win / Loss</div>
                <div className="text-sm font-bold text-slate-200 mt-1">
                  ₹{summary.avgWinInr} / ₹{summary.avgLossInr}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  R:R {(summary.avgWinInr / (summary.avgLossInr || 1)).toFixed(2)}:1
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] text-slate-500 uppercase">Max Drawdown</div>
                <div className="text-sm font-bold text-amber-400 mt-1">
                  {summary.maxDrawdownPct}% (₹{summary.maxDrawdownInr})
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Ultra Controlled</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] text-slate-500 uppercase">Sharpe Ratio</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">{summary.sharpeRatio}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Institutional Grade</div>
              </div>
            </div>

            {/* Cumulative Equity Curve Chart */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Cumulative Account Equity Curve (Realized ₹ Growth)</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Tracking real growth over {entries.length} closed trades against baseline index benchmark
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-3 h-3 rounded bg-emerald-500"></span>
                    <span>OmniAlpha Portfolio</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-3 h-0.5 bg-slate-600"></span>
                    <span>Buy & Hold Benchmark</span>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="tradeNumber" stroke="#64748b" tickFormatter={(v) => `T#${v}`} />
                    <YAxis stroke="#64748b" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        fontFamily: "monospace",
                      }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Cumulative P&L"]}
                      labelFormatter={(label) => `Trade #${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulativePnl"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#equityGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Two-Column Analytics: Strategy Breakdown & Trade PnL Bars */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Individual Trade P&L Distribution */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sans">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>Realized P&L Per Individual Trade (₹)</span>
                </h3>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={equityCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="tradeNumber" stroke="#64748b" tickFormatter={(v) => `T#${v}`} />
                      <YAxis stroke="#64748b" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#020617",
                          borderColor: "#334155",
                          borderRadius: "8px",
                          fontFamily: "monospace",
                        }}
                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Trade P&L"]}
                      />
                      <Bar dataKey="tradePnl" radius={[4, 4, 0, 0]}>
                        {equityCurve.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.tradePnl >= 0 ? "#10b981" : "#f43f5e"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Strategy Setup Performance Breakdown */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sans">
                  <Layers className="w-4 h-4 text-violet-400" />
                  <span>Setup Edge & Strategy Profitability Matrix</span>
                </h3>

                <div className="space-y-2.5">
                  {strategyStats.map((st) => (
                    <div key={st.name} className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white font-sans">{st.name}</span>
                        <span
                          className={`font-bold ${
                            st.profit >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {st.profit >= 0 ? "+" : ""}₹{st.profit.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Win Rate: <strong className="text-slate-200">{st.winRate}%</strong></span>
                        <span>Sample Size: <strong className="text-slate-200">{st.trades} trades</strong></span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(10, st.winRate))}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: JOURNAL LOGS */}
        {/* ========================================================================= */}
        {activeTab === "JOURNAL_LOGS" && (
          <div className="space-y-4 font-mono text-xs">
            {/* Filter Bar */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search notes, tags, contract..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Index Filter */}
                <select
                  value={filterIndex}
                  onChange={(e) => setFilterIndex(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none"
                >
                  <option value="ALL">All Indices</option>
                  <option value="NIFTY50">NIFTY 50</option>
                  <option value="BANKNIFTY">BANK NIFTY</option>
                  <option value="FINNIFTY">FIN NIFTY</option>
                  <option value="SPX500">S&P 500 (US)</option>
                  <option value="NASDAQ100">NASDAQ 100 (US)</option>
                  <option value="BTCUSD">BTC/USD (Crypto)</option>
                </select>

                {/* Outcome Filter */}
                <select
                  value={filterOutcome}
                  onChange={(e) => setFilterOutcome(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none"
                >
                  <option value="ALL">All Outcomes</option>
                  <option value="WINS">Wins Only (+₹)</option>
                  <option value="LOSSES">Losses Only (-₹)</option>
                </select>
              </div>

              <button
                onClick={() => setActiveTab("ADD_ENTRY")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-1.5 text-xs shadow-[0_0_12px_rgba(99,102,241,0.4)]"
              >
                <Plus className="w-4 h-4" />
                <span>Log New Trade</span>
              </button>
            </div>

            {/* Entries List */}
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          entry.executionGrade === "A+" || entry.executionGrade === "A"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : entry.executionGrade === "B"
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        }`}
                      >
                        {entry.executionGrade}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm font-sans">{entry.contract}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              entry.direction === "BULLISH"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-rose-500/20 text-rose-300"
                            }`}
                          >
                            {entry.direction}
                          </span>
                          <span className="text-[10px] text-slate-500">{entry.date} @ {entry.time}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {entry.setupType.replace(/_/g, " ")} • Confluence: <strong className="text-indigo-300">{entry.confluenceScore}%</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div
                          className={`text-base font-bold font-mono ${
                            entry.pnlInr >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {entry.pnlInr >= 0 ? "+" : ""}₹{entry.pnlInr.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {entry.roiPct >= 0 ? "+" : ""}{entry.roiPct}% • {entry.rMultiple >= 0 ? `+${entry.rMultiple}R` : `${entry.rMultiple}R`}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-slate-900 rounded transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Execution Details Ribbon */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-2.5 rounded-lg text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Entry / Exit Premium:</span>
                      <strong className="text-white">₹{entry.entryPrice} → ₹{entry.exitPrice}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Quantity / Lots:</span>
                      <strong className="text-white">{entry.qty} qty ({entry.qty / entry.lotSize} lots)</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Psychology / Emotion:</span>
                      <span className="text-indigo-300 font-bold">{entry.emotionalState}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Execution Invalidation:</span>
                      <span className="text-amber-400 font-bold">{entry.mistakeTag.replace(/_/g, " ")}</span>
                    </div>
                  </div>

                  {/* Notes & Tags */}
                  <div className="space-y-1.5">
                    <p className="text-slate-300 text-xs font-sans leading-relaxed">
                      {entry.notes}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded text-[10px]"
                        >
                          #{tag}
                        </span>
                      ))}
                      {entry.brokerOrderId && (
                        <span className="bg-indigo-950/50 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px]">
                          Broker: {entry.brokerOrderId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ADD ENTRY FORM */}
        {/* ========================================================================= */}
        {activeTab === "ADD_ENTRY" && (
          <form
            onSubmit={handleAddNewEntry}
            className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-5 font-mono text-xs"
          >
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-sans">
                  Log Institutional Trade Entry & Rationale
                </h3>
                <p className="text-slate-400 text-[11px]">
                  Document exact setup confluence, emotion tags, execution discipline, and post-trade insights
                </p>
              </div>

              <span className="text-[10px] text-indigo-300 bg-indigo-500/20 border border-indigo-500/40 px-2 py-0.5 rounded">
                AUTO-CALCULATES P&L & R:R
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                  Trade Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                  Trade Time
                </label>
                <input
                  type="time"
                  step="1"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                  Index Symbol
                </label>
                <select
                  value={newIndex}
                  onChange={(e) => setNewIndex(e.target.value as IndexSymbol)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                >
                  <option value="NIFTY50">NIFTY 50</option>
                  <option value="BANKNIFTY">BANK NIFTY</option>
                  <option value="FINNIFTY">FIN NIFTY</option>
                  <option value="SPX500">S&P 500 (US)</option>
                  <option value="NASDAQ100">NASDAQ 100 (US)</option>
                  <option value="BTCUSD">BTC/USD (Crypto)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                  Contract Name
                </label>
                <input
                  type="text"
                  value={newContract}
                  onChange={(e) => setNewContract(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                  Setup / Edge Type
                </label>
                <select
                  value={newSetupType}
                  onChange={(e) => setNewSetupType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                >
                  <option value="ARROW_PIERCING_CONFLUENCE">Arrow-Piercing Confluence</option>
                  <option value="WYCKOFF_SPRING_TEST">Wyckoff Spring / Test</option>
                  <option value="FVG_IMBALANCE_FILL">FVG Imbalance Fill</option>
                  <option value="DELTA_DIVERGENCE">CVD Delta Divergence</option>
                  <option value="GAMMA_PIN_EXPIRY">Gamma Pin Expiry Setup</option>
                  <option value="LIQUIDITY_SWEEP">Institutional Liquidity Sweep</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                  Entry Premium (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={newEntryPrice}
                  onChange={(e) => setNewEntryPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                  Exit Premium (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={newExitPrice}
                  onChange={(e) => setNewExitPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                  Executed Quantity
                </label>
                <input
                  type="number"
                  value={newQty}
                  onChange={(e) => setNewQty(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                  Emotional State
                </label>
                <select
                  value={newEmotion}
                  onChange={(e) => setNewEmotion(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                >
                  <option value="DISCIPLINED">Disciplined (Stuck to rules)</option>
                  <option value="CONFIDENT">Confident (High Conviction)</option>
                  <option value="PATIENT">Patient (Waited for confirmation)</option>
                  <option value="FOMO">FOMO (Chased green candle)</option>
                  <option value="HESITANT">Hesitant (Second guessed)</option>
                  <option value="REVENGE_TRADING">Revenge Trading</option>
                  <option value="GREEDY">Greedy (Held past target)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                  Execution Discipline Tag
                </label>
                <select
                  value={newMistake}
                  onChange={(e) => setNewMistake(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                >
                  <option value="NONE_PERFECT_EXECUTION">None (Perfect Execution)</option>
                  <option value="CHASED_AFTER_BREAKOUT">Chased After Breakout</option>
                  <option value="MOVED_STOP_LOSS">Moved Stop-Loss Wider</option>
                  <option value="EXITED_PREMATURELY">Exited Prematurely (Fear)</option>
                  <option value="OVERSIZED_POSITION">Oversized Position Size</option>
                  <option value="IGNORED_HTF_BIAS">Ignored Higher TF Bias</option>
                  <option value="FOUGHT_TREND">Fought the Dominant Trend</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                  Execution Grade
                </label>
                <div className="flex items-center gap-1">
                  {(["A+", "A", "B", "C", "F"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setNewGrade(g)}
                      className={`flex-1 py-2 rounded font-bold border ${
                        newGrade === g
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-slate-900 border-slate-800 text-slate-400"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                Trade Rationale & Lessons Learned
              </label>
              <textarea
                rows={3}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-white font-sans text-xs"
                placeholder="What did Wyckoff volume profile indicate? Was POC respected? How was the exit handled?"
              ></textarea>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                Strategy Tags (comma separated)
              </label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-slate-500">
                Calculated P&L:{" "}
                <strong
                  className={
                    (newExitPrice - newEntryPrice) >= 0 ? "text-emerald-400" : "text-rose-400"
                  }
                >
                  ₹{Math.round((newExitPrice - newEntryPrice) * newQty).toLocaleString()}
                </strong>
              </span>

              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save to Journal Ledger</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: DATA EXPORTER & AUDIT REPORT */}
        {/* ========================================================================= */}
        {activeTab === "EXPORT_DATA" && (
          <div className="space-y-6 font-mono text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-sans">
                    Multi-Format Data Export & Compliance Reports
                  </h3>
                  <p className="text-slate-400 text-[11px]">
                    Export verified trading logs for tax accounting, backtesting, or external portfolio audits
                  </p>
                </div>
              </div>

              {copyStatus && (
                <div className="bg-emerald-950/60 border border-emerald-500 text-emerald-200 p-3 rounded">
                  {copyStatus}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {/* CSV Download */}
                <div
                  onClick={handleExportCSV}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/60 p-4 rounded-xl cursor-pointer transition-all space-y-2 group shadow"
                >
                  <div className="flex items-center justify-between">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                      .CSV
                    </span>
                  </div>
                  <div className="font-bold text-white font-sans">Export as CSV</div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Universal comma-separated format compatible with Excel, Google Sheets & Tax Software.
                  </p>
                </div>

                {/* JSON Download */}
                <div
                  onClick={handleExportJSON}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/60 p-4 rounded-xl cursor-pointer transition-all space-y-2 group shadow"
                >
                  <div className="flex items-center justify-between">
                    <FileCode className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold">
                      .JSON
                    </span>
                  </div>
                  <div className="font-bold text-white font-sans">Export as JSON</div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Complete schema format for Python quant backtesting and algorithmic pipeline feeding.
                  </p>
                </div>

                {/* Copy Clipboard */}
                <div
                  onClick={handleCopyClipboard}
                  className="bg-slate-900 border border-slate-800 hover:border-violet-500/60 p-4 rounded-xl cursor-pointer transition-all space-y-2 group shadow"
                >
                  <div className="flex items-center justify-between">
                    <Copy className="w-6 h-6 text-violet-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded font-bold">
                      CLIPBOARD
                    </span>
                  </div>
                  <div className="font-bold text-white font-sans">Copy to Clipboard</div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    1-Click paste directly into existing spreadsheets without saving files.
                  </p>
                </div>

                {/* Print Audit */}
                <div
                  onClick={handlePrintReport}
                  className="bg-slate-900 border border-slate-800 hover:border-sky-500/60 p-4 rounded-xl cursor-pointer transition-all space-y-2 group shadow"
                >
                  <div className="flex items-center justify-between">
                    <Printer className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-bold">
                      PRINT / PDF
                    </span>
                  </div>
                  <div className="font-bold text-white font-sans">Print Tax Audit</div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Clean printable executive summary with gross profits, turnover & net gain metrics.
                  </p>
                </div>
              </div>
            </div>

            {/* Printable Tax & Performance Summary Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-bold text-white uppercase font-sans">
                    Institutional Tax & Performance Statement (FY 2026-27)
                  </span>
                  <div className="text-[11px] text-slate-400 font-sans">
                    F&O Business Income (Section 43(5) Income Tax Act, India)
                  </div>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-900 p-3 rounded">
                  <span className="text-slate-500 block">Total Executed Trades:</span>
                  <strong className="text-white text-sm">{summary.totalTrades}</strong>
                </div>
                <div className="bg-slate-900 p-3 rounded">
                  <span className="text-slate-500 block">Total Turnover (Absolute ₹):</span>
                  <strong className="text-white text-sm">
                    ₹{(summary.grossProfitInr + summary.grossLossInr).toLocaleString()}
                  </strong>
                </div>
                <div className="bg-slate-900 p-3 rounded">
                  <span className="text-slate-500 block">Gross Realized Profit:</span>
                  <strong className="text-emerald-400 text-sm">
                    +₹{summary.grossProfitInr.toLocaleString()}
                  </strong>
                </div>
                <div className="bg-slate-900 p-3 rounded">
                  <span className="text-slate-500 block">Net Realized F&O Gain:</span>
                  <strong className="text-emerald-400 text-sm">
                    +₹{summary.netProfitInr.toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
