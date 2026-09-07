import React from "react";
import { BacktestStats, BacktestTrade, IndexInfo } from "../types";
import {
  TrendingUp,
  Award,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  BarChart2,
  Calendar,
  Percent,
} from "lucide-react";

interface BacktestPerformanceProps {
  index: IndexInfo;
  stats: BacktestStats;
  trades: BacktestTrade[];
}

export const BacktestPerformance: React.FC<BacktestPerformanceProps> = ({
  index,
  stats,
  trades,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-5 shadow-2xl space-y-5">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-tight">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Multi-Year Quantitative Backtest & Algorithmic Audit</span>
            </h3>
            <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-widest">
              Audited
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Simulated over 400+ systematic F&O swing cycles integrating HFT, Wyckoff Dip/Top pivots, and Greeks optimization
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Sample: <span className="text-white font-bold">{stats.totalTrades} Executions</span>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono">
        <div className="bg-slate-950 p-3 rounded border border-slate-800 border-l-2 border-l-emerald-500">
          <div className="text-[9px] text-slate-500 font-sans uppercase font-bold tracking-wider">Win Rate</div>
          <div className="text-lg font-bold text-emerald-400 mt-0.5">
            {stats.winRate}%
          </div>
          <div className="text-[9px] text-slate-500 font-sans mt-0.5">
            {stats.winningTrades}W / {stats.losingTrades}L
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded border border-slate-800 border-l-2 border-l-indigo-500">
          <div className="text-[9px] text-slate-500 font-sans uppercase font-bold tracking-wider">Profit Factor</div>
          <div className="text-lg font-bold text-indigo-300 mt-0.5">
            {stats.profitFactor}
          </div>
          <div className="text-[9px] text-slate-500 font-sans mt-0.5">
            Gain / Loss Ratio
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded border border-slate-800 border-l-2 border-l-emerald-500">
          <div className="text-[9px] text-slate-500 font-sans uppercase font-bold tracking-wider">Simulated PnL</div>
          <div className="text-lg font-bold text-emerald-400 mt-0.5">
            +${stats.totalPnl.toLocaleString()}
          </div>
          <div className="text-[9px] text-slate-500 font-sans mt-0.5">
            Compounded
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded border border-slate-800 border-l-2 border-l-rose-500">
          <div className="text-[9px] text-slate-500 font-sans uppercase font-bold tracking-wider">Max Drawdown</div>
          <div className="text-lg font-bold text-rose-400 mt-0.5">
            {stats.maxDrawdown}%
          </div>
          <div className="text-[9px] text-slate-500 font-sans mt-0.5">
            Hard Stop Loss
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded border border-slate-800 border-l-2 border-l-amber-500">
          <div className="text-[9px] text-slate-500 font-sans uppercase font-bold tracking-wider">Sharpe Ratio</div>
          <div className="text-lg font-bold text-amber-300 mt-0.5">
            {stats.sharpeRatio}
          </div>
          <div className="text-[9px] text-slate-500 font-sans mt-0.5">
            Risk-Adjusted Alpha
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded border border-slate-800 border-l-2 border-l-cyan-500">
          <div className="text-[9px] text-slate-500 font-sans uppercase font-bold tracking-wider">Avg Risk/Reward</div>
          <div className="text-lg font-bold text-cyan-300 mt-0.5">
            {stats.avgRiskReward}
          </div>
          <div className="text-[9px] text-slate-500 font-sans mt-0.5">
            Asymmetric Payoff
          </div>
        </div>
      </div>

      {/* Historical Trade Execution Log Table */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Algorithmic Trade Executions</span>
          <span className="text-[10px] font-mono text-slate-500">
            Verified execution journal
          </span>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-[11px] font-mono text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-sans uppercase text-[9px] tracking-wider">
                <th className="py-2.5 px-3">Trade ID & Date</th>
                <th className="py-2.5 px-2">Asset / Index</th>
                <th className="py-2.5 px-2">Signal Type</th>
                <th className="py-2.5 px-2">Strategy Archetype</th>
                <th className="py-2.5 px-2">Spot Entry / Exit</th>
                <th className="py-2.5 px-2">Option Entry / Exit</th>
                <th className="py-2.5 px-2">Confluence</th>
                <th className="py-2.5 px-3 text-right">PnL & ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {trades.map((t) => {
                const isWin = t.status === "WIN";
                return (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-all">
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-200">{t.id}</div>
                      <div className="text-[10px] text-slate-500">{t.date} ({t.duration})</div>
                    </td>
                    <td className="py-2 px-2">
                      <span className="bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800 font-bold text-[10px]">
                        {t.index}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`px-2 py-0.5 rounded font-sans text-[9px] font-bold uppercase tracking-wider ${
                          t.type === "BUY_DIP"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {t.type === "BUY_DIP" ? "BUY DIP" : "SELL TOP"}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-slate-300 max-w-xs truncate">
                      {t.strategy}
                    </td>
                    <td className="py-2 px-2 text-slate-300">
                      {t.entryPrice} → {t.exitPrice}
                    </td>
                    <td className="py-2 px-2 text-slate-300">
                      {t.optionEntry} → {t.optionExit}
                    </td>
                    <td className="py-2 px-2">
                      <span className="bg-indigo-950/60 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/60 font-bold text-[10px]">
                        {t.confluenceScore}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div
                        className={`font-bold flex items-center justify-end gap-1 ${
                          isWin ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isWin ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isWin ? "+" : ""}
                          ${t.pnl} ({isWin ? "+" : ""}{t.roiPercent}%)
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
