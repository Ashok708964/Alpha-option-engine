import React from "react";
import { OrderBookLevel, HFTTapePrint, IndexInfo } from "../types";
import { Zap, ShieldAlert, Cpu, Activity } from "lucide-react";

interface OrderFlowTapeProps {
  index: IndexInfo;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  imbalanceRatio: number;
  tapePrints: HFTTapePrint[];
}

export const OrderFlowTape: React.FC<OrderFlowTapeProps> = ({
  index,
  bids,
  asks,
  imbalanceRatio,
  tapePrints,
}) => {
  const maxBidSize = Math.max(...bids.map((b) => b.size), 1);
  const maxAskSize = Math.max(...asks.map((a) => a.size), 1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4 shadow-2xl flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
              HFT LOB Depth & Time of Sales
            </h3>
            <p className="text-[10px] text-slate-500 tracking-wider uppercase">
              Microstructure CVD & Iceberg Sweep
            </p>
          </div>
        </div>

        {/* Imbalance Meter */}
        <div className="text-right">
          <div className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-slate-500">
            Bid/Ask Imbalance
          </div>
          <div className="text-xs font-mono font-bold flex items-center justify-end gap-1.5 mt-0.5">
            <span className="text-emerald-400">{(imbalanceRatio * 100).toFixed(1)}%</span>
            <span className="text-slate-600">/</span>
            <span className="text-rose-400">{((1 - imbalanceRatio) * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Level 2 Depth Book */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        {/* Bids Column */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] text-slate-500 font-sans uppercase font-bold tracking-widest pb-1 border-b border-slate-800">
            <span>Bid Size</span>
            <span>Bid Price</span>
          </div>
          {bids.slice(0, 6).map((b, i) => {
            const widthPct = Math.min(100, (b.size / maxBidSize) * 100);
            return (
              <div
                key={`bid-${i}`}
                className="relative flex items-center justify-between px-2 py-1 rounded bg-slate-950 overflow-hidden text-[11px] border border-slate-800/60"
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-emerald-500/10"
                  style={{ width: `${widthPct}%` }}
                ></div>
                <span className="relative z-10 text-slate-300 flex items-center gap-1">
                  {b.isIceberg && (
                    <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1 rounded font-bold uppercase">
                      ICEBERG
                    </span>
                  )}
                  {b.size.toLocaleString()}
                </span>
                <span className="relative z-10 text-emerald-400 font-bold">
                  {b.price}
                </span>
              </div>
            );
          })}
        </div>

        {/* Asks Column */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] text-slate-500 font-sans uppercase font-bold tracking-widest pb-1 border-b border-slate-800">
            <span>Ask Price</span>
            <span>Ask Size</span>
          </div>
          {asks.slice(0, 6).map((a, i) => {
            const widthPct = Math.min(100, (a.size / maxAskSize) * 100);
            return (
              <div
                key={`ask-${i}`}
                className="relative flex items-center justify-between px-2 py-1 rounded bg-slate-950 overflow-hidden text-[11px] border border-slate-800/60"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-rose-500/10"
                  style={{ width: `${widthPct}%` }}
                ></div>
                <span className="relative z-10 text-rose-400 font-bold">
                  {a.price}
                </span>
                <span className="relative z-10 text-slate-300 flex items-center gap-1">
                  {a.size.toLocaleString()}
                  {a.isIceberg && (
                    <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1 rounded font-bold uppercase">
                      WALL
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Streaming HFT Tape Prints */}
      <div className="pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>HFT Microstructure Tape</span>
          </span>
          <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE
          </span>
        </div>

        <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] font-mono pr-1 no-scrollbar">
          {tapePrints.map((tp) => (
            <div
              key={tp.id}
              className={`flex items-center justify-between px-2.5 py-1 rounded bg-slate-950 border border-slate-800/80 ${
                tp.side === "BUY"
                  ? "border-l-2 border-l-emerald-500 text-emerald-300"
                  : "border-l-2 border-l-rose-500 text-rose-300"
              }`}
            >
              <span className="text-slate-500 text-[10px]">{tp.time}</span>
              <span className="font-bold text-slate-200">
                {index.currency}{tp.price}
              </span>
              <span className="font-semibold">
                {tp.side === "BUY" ? "+" : "-"}{tp.size} lots
              </span>
              <span
                className={`text-[8px] px-1 py-0.2 rounded font-sans uppercase font-bold tracking-wider ${
                  tp.type === "BLOCK_SWEEP"
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    : tp.type === "ICEBERG_FILL"
                    ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                    : "text-slate-400"
                }`}
              >
                {tp.type.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
