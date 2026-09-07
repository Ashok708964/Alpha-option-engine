import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { OptionContract, IndexInfo } from "../types";
import { calculateStrategyPayoff } from "../utils/blackScholes";
import { Sliders, TrendingUp, ShieldCheck, RefreshCw } from "lucide-react";

interface PayoffSimulatorProps {
  index: IndexInfo;
  selectedContract: OptionContract | null;
  strategyArchetype: "SINGLE_LEG" | "BULL_PUT_SPREAD" | "BEAR_CALL_SPREAD" | "IRON_CONDOR";
  onChangeArchetype: (archetype: "SINGLE_LEG" | "BULL_PUT_SPREAD" | "BEAR_CALL_SPREAD" | "IRON_CONDOR") => void;
}

export const PayoffSimulator: React.FC<PayoffSimulatorProps> = ({
  index,
  selectedContract,
  strategyArchetype,
  onChangeArchetype,
}) => {
  const [ivShift, setIvShift] = useState(0); // -20% to +20%
  const [daysToExpiry, setDaysToExpiry] = useState(4); // 0 to 14 days
  const [contractsCount, setContractsCount] = useState(1);

  const spot = index.currentPrice;
  const step = index.strikeStep;

  // Create range around spot
  const spotRange = useMemo(() => {
    const range: number[] = [];
    const min = spot - step * 6;
    const max = spot + step * 6;
    const count = 35;
    const delta = (max - min) / count;

    for (let i = 0; i <= count; i++) {
      range.push(min + i * delta);
    }
    return range;
  }, [spot, step]);

  // Strategy legs builder
  const payoffData = useMemo(() => {
    const defaultStrike = Math.round(spot / step) * step;
    const defaultPremium = defaultStrike * 0.008;

    let legs: {
      type: "BUY_CALL" | "SELL_CALL" | "BUY_PUT" | "SELL_PUT";
      strike: number;
      premium: number;
      contracts: number;
    }[] = [];

    if (strategyArchetype === "SINGLE_LEG") {
      const strike = selectedContract ? selectedContract.strike : defaultStrike;
      const premium = selectedContract ? selectedContract.ltp : defaultPremium;
      const isCall = selectedContract ? selectedContract.type === "CALL" : true;

      legs = [
        {
          type: isCall ? "BUY_CALL" : "BUY_PUT",
          strike,
          premium,
          contracts: contractsCount,
        },
      ];
    } else if (strategyArchetype === "BULL_PUT_SPREAD") {
      // Sell ATM Put, Buy OTM Put for protection (Bullish Credit Spread)
      legs = [
        {
          type: "SELL_PUT",
          strike: defaultStrike,
          premium: defaultPremium * 1.2,
          contracts: contractsCount,
        },
        {
          type: "BUY_PUT",
          strike: defaultStrike - step,
          premium: defaultPremium * 0.5,
          contracts: contractsCount,
        },
      ];
    } else if (strategyArchetype === "BEAR_CALL_SPREAD") {
      // Sell ATM Call, Buy OTM Call for protection (Bearish Credit Spread)
      legs = [
        {
          type: "SELL_CALL",
          strike: defaultStrike,
          premium: defaultPremium * 1.2,
          contracts: contractsCount,
        },
        {
          type: "BUY_CALL",
          strike: defaultStrike + step,
          premium: defaultPremium * 0.5,
          contracts: contractsCount,
        },
      ];
    } else {
      // Iron Condor (Range-bound market neutral)
      legs = [
        {
          type: "SELL_PUT",
          strike: defaultStrike - step,
          premium: defaultPremium * 0.8,
          contracts: contractsCount,
        },
        {
          type: "BUY_PUT",
          strike: defaultStrike - step * 2,
          premium: defaultPremium * 0.3,
          contracts: contractsCount,
        },
        {
          type: "SELL_CALL",
          strike: defaultStrike + step,
          premium: defaultPremium * 0.8,
          contracts: contractsCount,
        },
        {
          type: "BUY_CALL",
          strike: defaultStrike + step * 2,
          premium: defaultPremium * 0.3,
          contracts: contractsCount,
        },
      ];
    }

    return calculateStrategyPayoff(spotRange, legs);
  }, [strategyArchetype, selectedContract, spotRange, spot, step, contractsCount]);

  // Find breakeven points
  const breakevens = useMemo(() => {
    const beList: number[] = [];
    for (let i = 1; i < payoffData.length; i++) {
      const prev = payoffData[i - 1];
      const curr = payoffData[i];
      if ((prev.pnl <= 0 && curr.pnl >= 0) || (prev.pnl >= 0 && curr.pnl <= 0)) {
        beList.push(curr.spot);
      }
    }
    return beList;
  }, [payoffData]);

  const maxProfitVal = Math.max(...payoffData.map((d) => d.pnl));
  const maxLossVal = Math.min(...payoffData.map((d) => d.pnl));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4 shadow-2xl space-y-4">
      {/* Header & Archetype Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-tight">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Option Payoff Surface & PnL Simulation</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Simulate PnL across index spot levels, Theta decay days, and IV shifts
          </p>
        </div>

        {/* Archetype Toggle Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800 text-[10px] font-bold uppercase tracking-wider font-mono">
          <button
            onClick={() => onChangeArchetype("SINGLE_LEG")}
            className={`px-2.5 py-1 rounded transition-all ${
              strategyArchetype === "SINGLE_LEG"
                ? "bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Directional Buying
          </button>
          <button
            onClick={() => onChangeArchetype("BULL_PUT_SPREAD")}
            className={`px-2.5 py-1 rounded transition-all ${
              strategyArchetype === "BULL_PUT_SPREAD"
                ? "bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Bull Put Credit
          </button>
          <button
            onClick={() => onChangeArchetype("BEAR_CALL_SPREAD")}
            className={`px-2.5 py-1 rounded transition-all ${
              strategyArchetype === "BEAR_CALL_SPREAD"
                ? "bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Bear Call Credit
          </button>
          <button
            onClick={() => onChangeArchetype("IRON_CONDOR")}
            className={`px-2.5 py-1 rounded transition-all ${
              strategyArchetype === "IRON_CONDOR"
                ? "bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Iron Condor
          </button>
        </div>
      </div>

      {/* Payoff Chart Canvas */}
      <div className="w-full h-64 bg-slate-950 rounded p-2 border border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={payoffData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
            <XAxis
              dataKey="spot"
              stroke="#64748b"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickFormatter={(v) => `${index.currency}${v}`}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-950 border border-slate-800 rounded p-2.5 text-xs font-mono text-slate-200 shadow-2xl">
                      <div>Spot: {index.currency}{d.spot}</div>
                      <div className={`font-bold ${d.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        Estimated PnL: {d.pnl >= 0 ? "+" : ""}{index.currency}{d.pnl} per lot
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
            <ReferenceLine
              x={spot}
              stroke="#6366f1"
              strokeDasharray="3 3"
              label={{ value: "Current Spot", fill: "#818cf8", fontSize: 10, position: "top" }}
            />
            <Area
              type="monotone"
              dataKey="pnl"
              stroke="#10b981"
              fill="url(#profitGrad)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Payoff Stats Metrics with geometric accents */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
        <div className="bg-slate-950 p-2.5 rounded border border-slate-800 border-l-2 border-l-indigo-500">
          <div className="text-[9px] text-slate-500 font-sans uppercase font-bold tracking-wider">Breakeven Spot</div>
          <div className="font-bold text-white mt-0.5">
            {breakevens.length > 0
              ? breakevens.map((b) => `${index.currency}${b}`).join(", ")
              : `${index.currency}${spot}`}
          </div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded border border-slate-800 border-l-2 border-l-emerald-500">
          <div className="text-[9px] text-emerald-400 font-sans uppercase font-bold tracking-wider">Max Potential Gain</div>
          <div className="font-bold text-emerald-400 mt-0.5">
            {maxProfitVal > 15000 ? "UNLIMITED" : `+${index.currency}${maxProfitVal}`}
          </div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded border border-slate-800 border-l-2 border-l-rose-500">
          <div className="text-[9px] text-rose-400 font-sans uppercase font-bold tracking-wider">Max Defined Risk</div>
          <div className="font-bold text-rose-400 mt-0.5">
            {index.currency}{Math.abs(maxLossVal)}
          </div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded border border-slate-800 border-l-2 border-l-cyan-500">
          <div className="text-[9px] text-cyan-400 font-sans uppercase font-bold tracking-wider">Target R:R Ratio</div>
          <div className="font-bold text-cyan-300 mt-0.5">
            1 : {(Math.abs(maxProfitVal / (maxLossVal || 1))).toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
};
