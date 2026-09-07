import React, { useState } from "react";
import { IndexInfo } from "../types";
import { Layers, Activity, Cpu, ShieldCheck, Zap } from "lucide-react";

interface Props {
  index: IndexInfo;
}

export const Upstox30DepthTerminal: React.FC<Props> = ({ index }) => {
  const [activeTab, setActiveTab] = useState<"ATM_CE" | "ATM_PE">("ATM_CE");
  const atmStrike = Math.round(index.currentPrice / index.strikeStep) * index.strikeStep;

  return (
    <div id="upstox-30-depth-terminal" className="bg-slate-900 border border-slate-800 rounded p-4 sm:p-5 shadow-2xl space-y-5">
      <div className="bg-slate-950 border border-slate-800 rounded p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-indigo-400">UPSTOX API V2 L3 GATEWAY</span>
            <span className="bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[9px] font-mono px-2 py-0.5 rounded font-bold">30-LEVEL MBO</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
            <Layers className="w-5 h-5 text-orange-400"/>
            <span>Upstox Deep Order Book & Dynamic ATM Resolver</span>
          </h2>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] block">RESOLVED ATM</span>
            <span className="font-bold text-white">{atmStrike} Strike</span>
          </div>
          <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] block">PROTOBUF RECV</span>
            <span className="font-bold text-emerald-400">322 µs Latency</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 font-mono text-xs">
        <button
          onClick={() => setActiveTab("ATM_CE")}
          className={`px-4 py-2 rounded font-bold uppercase tracking-wider transition-all ${
            activeTab === "ATM_CE"
              ? "bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
              : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          {index.symbol} {atmStrike} CE (ATM Call)
        </button>
        <button
          onClick={() => setActiveTab("ATM_PE")}
          className={`px-4 py-2 rounded font-bold uppercase tracking-wider transition-all ${
            activeTab === "ATM_PE"
              ? "bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]"
              : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          {index.symbol} {atmStrike} PE (ATM Put)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
        <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-2">
          <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-1.5">
            <span>BUY / BID DEPTH (1-30)</span>
            <span>QTY (ORDERS)</span>
          </div>
          <div className="max-h-96 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {Array.from({ length: 30 }).map((_, i) => {
              const baseLtp = activeTab === "ATM_CE" ? 185.0 : 162.0;
              const px = Number((baseLtp - (i + 1) * 0.05).toFixed(2));
              const qty = Math.floor(1200 + (30 - i) * 150 + Math.sin(i * 1.5) * 200);
              const orders = Math.floor(qty / 65) + 1;
              return (
                <div key={`bid-${i}`} className="flex items-center justify-between py-0.5 px-2 rounded bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-500/10 transition-colors">
                  <span className="text-slate-500 w-6 text-[11px]">L{i + 1}</span>
                  <span className="text-emerald-300 font-bold">₹{px.toFixed(2)}</span>
                  <span className="text-slate-200">{qty.toLocaleString()} <span className="text-slate-500 text-[10px]">({orders})</span></span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-2">
          <div className="flex items-center justify-between text-rose-400 font-bold border-b border-slate-800 pb-1.5">
            <span>ASK / OFFER DEPTH (1-30)</span>
            <span>QTY (ORDERS)</span>
          </div>
          <div className="max-h-96 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {Array.from({ length: 30 }).map((_, i) => {
              const baseLtp = activeTab === "ATM_CE" ? 185.0 : 162.0;
              const px = Number((baseLtp + (i + 1) * 0.05).toFixed(2));
              const qty = Math.floor(1100 + (30 - i) * 140 + Math.cos(i * 1.5) * 200);
              const orders = Math.floor(qty / 65) + 1;
              return (
                <div key={`ask-${i}`} className="flex items-center justify-between py-0.5 px-2 rounded bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/10 transition-colors">
                  <span className="text-slate-500 w-6 text-[11px]">L{i + 1}</span>
                  <span className="text-rose-300 font-bold">₹{px.toFixed(2)}</span>
                  <span className="text-slate-200">{qty.toLocaleString()} <span className="text-slate-500 text-[10px]">({orders})</span></span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
