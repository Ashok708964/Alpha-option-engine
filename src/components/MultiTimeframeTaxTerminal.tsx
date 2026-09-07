import React, { useState } from "react";
import { MultiTimeframeMatrix, TaxAndSlippageBreakdown, IndexInfo } from "../types";
import {
  Layers,
  Calculator,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Percent,
  Receipt,
  FileSpreadsheet,
  Zap,
} from "lucide-react";
import { calculateIndianTaxesAndSlippage } from "../utils/quantEngine";

interface MultiTimeframeTaxTerminalProps {
  index: IndexInfo;
  mtfMatrix: MultiTimeframeMatrix;
}

export const MultiTimeframeTaxTerminal: React.FC<MultiTimeframeTaxTerminalProps> = ({
  index,
  mtfMatrix,
}) => {
  const [calcEntryPremium, setCalcEntryPremium] = useState<number>(140);
  const [calcExitPremium, setCalcExitPremium] = useState<number>(210);
  const [calcLots, setCalcLots] = useState<number>(2);

  const taxBreakdown: TaxAndSlippageBreakdown = calculateIndianTaxesAndSlippage(
    calcEntryPremium,
    calcExitPremium,
    calcLots,
    index.lotSize,
    index.currency
  );

  const grossPnl = (calcExitPremium - calcEntryPremium) * (calcLots * index.lotSize);
  const isProfit = taxBreakdown.netPnlAfterCharges >= 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Multi-Timeframe Institutional Trend Alignment Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded p-4 shadow-xl space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
              Multi-Timeframe Trend Consensus (1m to 1D)
            </h4>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
              mtfMatrix.consensus.includes("BUY")
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : mtfMatrix.consensus.includes("SELL")
                ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
            }`}
          >
            {mtfMatrix.consensus.replace(/_/g, " ")} ({mtfMatrix.overallAlignmentScore}%)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-500 font-sans uppercase">
                <th className="pb-1.5">Timeframe</th>
                <th className="pb-1.5">Trend Bias</th>
                <th className="pb-1.5">EMA Ribbon</th>
                <th className="pb-1.5">VWAP Position</th>
                <th className="pb-1.5">SuperTrend</th>
                <th className="pb-1.5 text-right">RSI (14)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {mtfMatrix.timeframes.map((tf) => {
                const isBull = tf.trend.includes("BULLISH");
                return (
                  <tr key={tf.timeframe} className="hover:bg-slate-800/30">
                    <td className="py-2 font-bold text-indigo-400">{tf.timeframe}</td>
                    <td className="py-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          isBull ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {tf.trend.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-2 text-slate-300 text-[10px]">{tf.emaRibbon.replace(/_/g, " ")}</td>
                    <td className="py-2 text-slate-300 text-[10px]">{tf.vwapRelation.replace(/_/g, " ")}</td>
                    <td className="py-2">
                      <span className={`font-bold ${tf.supertrend === "GREEN" ? "text-emerald-400" : "text-rose-400"}`}>
                        {tf.supertrend}
                      </span>
                    </td>
                    <td className="py-2 text-right font-bold text-slate-200">{tf.rsi}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded p-2.5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">
              Institutional Rule: Enter only when <strong className="text-emerald-400">≥ 80% Timeframes Align</strong>
            </span>
          </div>
          <span className="text-slate-400 font-sans text-[10px]">Zero False Breakout Guard</span>
        </div>
      </div>

      {/* 2. Institutional Taxes, Exchange Levies & Slippage Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded p-4 shadow-xl space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
              Real-World Institutional Tax & Slippage Ledger
            </h4>
          </div>
          <span className="text-[10px] text-slate-400">
            NSE India / Exchange Regulatory Cost Calculator
          </span>
        </div>

        {/* Input parameters */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[9px] text-slate-500 font-sans uppercase">Entry Premium</label>
            <input
              type="number"
              value={calcEntryPremium}
              onChange={(e) => setCalcEntryPremium(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-bold mt-0.5"
            />
          </div>
          <div>
            <label className="text-[9px] text-slate-500 font-sans uppercase">Exit Premium</label>
            <input
              type="number"
              value={calcExitPremium}
              onChange={(e) => setCalcExitPremium(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-emerald-400 font-bold mt-0.5"
            />
          </div>
          <div>
            <label className="text-[9px] text-slate-500 font-sans uppercase">Lots ({index.lotSize} Qty/Lot)</label>
            <input
              type="number"
              value={calcLots}
              onChange={(e) => setCalcLots(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-bold mt-0.5"
              min="1"
            />
          </div>
        </div>

        {/* Charges Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
          <div className="bg-slate-950 border border-slate-800 rounded p-2">
            <div className="text-slate-500 uppercase font-sans">STT (0.1% on Sell)</div>
            <div className="text-rose-400 font-bold mt-0.5">
              -{index.currency}{taxBreakdown.stt}
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded p-2">
            <div className="text-slate-500 uppercase font-sans">Exchange Charges</div>
            <div className="text-rose-400 font-bold mt-0.5">
              -{index.currency}{taxBreakdown.exchangeTurnoverCharges}
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded p-2">
            <div className="text-slate-500 uppercase font-sans">GST (18%) + Brokerage</div>
            <div className="text-rose-400 font-bold mt-0.5">
              -{index.currency}{taxBreakdown.gst + 40}
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded p-2">
            <div className="text-slate-500 uppercase font-sans">Est. Slippage</div>
            <div className="text-rose-400 font-bold mt-0.5">
              -{index.currency}{taxBreakdown.estimatedSlippage}
            </div>
          </div>
        </div>

        {/* Bottom PnL Comparison */}
        <div className="bg-slate-950 border border-slate-800 rounded p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400">
              Gross P&L: <strong className={grossPnl >= 0 ? "text-emerald-400" : "text-rose-400"}>{index.currency}{grossPnl.toLocaleString()}</strong>
            </div>
            <div className="text-[10px] text-slate-500">
              Total Levies & Frictions: -{index.currency}{taxBreakdown.totalCharges}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-sans uppercase font-bold">Net In-Pocket P&L</div>
            <div className={`text-base font-bold ${isProfit ? "text-emerald-400" : "text-rose-400"}`}>
              {isProfit ? "+" : ""}{index.currency}{taxBreakdown.netPnlAfterCharges.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
