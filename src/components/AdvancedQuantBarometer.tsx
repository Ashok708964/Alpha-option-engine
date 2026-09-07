import React from "react";
import { IvSkewPoint, OrbSetup, GlobalCorrelationItem, IndexInfo } from "../types";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Zap,
  Globe,
  Maximize2,
  Minimize2,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Radio,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface AdvancedQuantBarometerProps {
  index: IndexInfo;
  orbSetup: OrbSetup;
  ivSkewData: IvSkewPoint[];
  globalCorrelations: GlobalCorrelationItem[];
}

export const AdvancedQuantBarometer: React.FC<AdvancedQuantBarometerProps> = ({
  index,
  orbSetup,
  ivSkewData,
  globalCorrelations,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Monday 15-Minute Opening Range Breakout (ORB) Scanner */}
      <div className="bg-slate-900 border border-slate-800 rounded p-4 shadow-xl space-y-3 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
              15m Opening Range Breakout (ORB)
            </h4>
          </div>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
              orbSetup.status === "BULLISH_EXPANSION"
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : orbSetup.status === "BEARISH_BREAKDOWN"
                ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
            }`}
          >
            {orbSetup.status.replace(/_/g, " ")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
          <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
            <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">09:15-09:30 Range High</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {index.currency}{orbSetup.rangeHigh.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Resistance Pivot</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
            <div className="text-[9px] text-slate-500 font-sans font-bold uppercase">09:15-09:30 Range Low</div>
            <div className="text-base font-bold text-rose-400 mt-0.5">
              {index.currency}{orbSetup.rangeLow.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Support Base</div>
          </div>
        </div>

        {/* Fibonacci Breakout Extensions */}
        <div className="bg-slate-950 border border-slate-800 rounded p-2.5 space-y-1.5 font-mono text-xs">
          <div className="text-[9px] font-sans font-bold uppercase text-indigo-400 flex items-center justify-between">
            <span>Fibonacci ORB Expansion Targets</span>
            <span>Mid: {index.currency}{orbSetup.midpoint}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
              <div className="text-slate-500 text-[9px]">1.618 Fib Ext</div>
              <div className="text-emerald-400 font-bold">{index.currency}{orbSetup.fibExtensions.fib1618}</div>
            </div>
            <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
              <div className="text-slate-500 text-[9px]">2.618 Fib Ext</div>
              <div className="text-indigo-300 font-bold">{index.currency}{orbSetup.fibExtensions.fib2618}</div>
            </div>
            <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
              <div className="text-slate-500 text-[9px]">Pullback Retest</div>
              <div className="text-amber-400 font-bold">{index.currency}{orbSetup.fibExtensions.fib0618Retest}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 3D Volatility Smile & IV Skew Curve */}
      <div className="bg-slate-900 border border-slate-800 rounded p-4 shadow-xl space-y-3 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
              Volatility Smile & IV Skew Curve
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            ATM IV: <strong className="text-emerald-400">{index.iv}%</strong>
          </span>
        </div>

        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ivSkewData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="strike" stroke="#64748b" tick={{ fontSize: 9 }} tickLine={false} />
              <YAxis domain={["auto", "auto"]} stroke="#64748b" tick={{ fontSize: 9 }} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", fontSize: "10px", fontFamily: "monospace" }}
                formatter={(val: any, name: any) => [`${val}%`, name === "putIv" ? "Put IV (Downside Skew)" : "Call IV (Upside Skew)"]}
              />
              <Line type="monotone" dataKey="putIv" stroke="#f43f5e" strokeWidth={2} dot={{ r: 2 }} name="putIv" />
              <Line type="monotone" dataKey="callIv" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} name="callIv" />
              <ReferenceLine x={Math.round(index.currentPrice / index.strikeStep) * index.strikeStep} stroke="#6366f1" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded p-2 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-400">Put Volatility Smile (OTM Hedges)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-400">Call Wing IV</span>
          </div>
        </div>
      </div>

      {/* 3. Global Overnight Correlation & Tailwind Index */}
      <div className="bg-slate-900 border border-slate-800 rounded p-4 shadow-xl space-y-3 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
              Overnight Global Correlation Index
            </h4>
          </div>
          <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">
            GIFT NIFTY +0.62%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
          {globalCorrelations.map((item) => (
            <div key={item.symbol} className="bg-slate-950 border border-slate-800 rounded p-2">
              <div className="text-[9px] text-slate-400 font-sans truncate font-bold">{item.asset}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-slate-200 font-bold text-[11px]">{item.price}</span>
                <span className={`text-[10px] font-bold flex items-center ${item.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {item.changePercent >= 0 ? "+" : ""}{item.changePercent}%
                </span>
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5 flex justify-between">
                <span>Corr: {item.correlationWithNifty}</span>
                <span className="text-emerald-400 font-sans">Tailwind</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded p-2 text-xs flex items-center justify-between font-mono">
          <span className="text-slate-400 text-[10px]">Overnight Gap Projection:</span>
          <span className="text-emerald-400 font-bold text-[11px]">+80 to +110 Pts Bullish Breakaway Gap</span>
        </div>
      </div>
    </div>
  );
};
