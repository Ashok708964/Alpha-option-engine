import React, { useState } from "react";
import { ActionableTradePlan, IndexInfo } from "../types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { Activity, ShieldCheck, DollarSign, TrendingUp, AlertOctagon } from "lucide-react";

interface OptionPayoffVisualizerProps {
  index: IndexInfo;
  plan: ActionableTradePlan;
}

export const OptionPayoffVisualizer: React.FC<OptionPayoffVisualizerProps> = ({
  index,
  plan,
}) => {
  const [lotMultiplier, setLotMultiplier] = useState<number>(1);
  const totalQty = index.lotSize * lotMultiplier;

  // Calculate payoff curve data points around the current strike
  const isCall = plan.direction === "BULLISH";
  const entrySpot = plan.entrySpotPrice;
  const premium = plan.entryOptionPremium;
  const strikeStep = index.strikeStep;

  const strike = plan.spreadLegs
    ? plan.spreadLegs.buyStrike
    : Math.round(entrySpot / strikeStep) * strikeStep;

  // Range from -6 steps to +6 steps
  const curveData = [];
  for (let i = -8; i <= 8; i++) {
    const spot = Number((strike + i * (strikeStep * 0.75)).toFixed(2));
    let optionIntrinsic = 0;

    if (plan.spreadLegs) {
      // Bull Put Spread or Bear Call Spread
      const longIntrinsic = isCall
        ? Math.max(0, spot - plan.spreadLegs.buyStrike)
        : Math.max(0, plan.spreadLegs.buyStrike - spot);

      const shortIntrinsic = isCall
        ? Math.max(0, spot - plan.spreadLegs.sellStrike)
        : Math.max(0, plan.spreadLegs.sellStrike - spot);

      const netValue = longIntrinsic - shortIntrinsic;
      const profitPerShare = netValue - premium;
      const totalPnl = Math.round(profitPerShare * totalQty);

      curveData.push({
        spot,
        pnl: totalPnl,
        isProfit: totalPnl >= 0,
      });
    } else {
      // 0.70 Delta Single Leg
      optionIntrinsic = isCall
        ? Math.max(0, spot - strike)
        : Math.max(0, strike - spot);

      const profitPerShare = optionIntrinsic - premium;
      const totalPnl = Math.round(profitPerShare * totalQty);

      curveData.push({
        spot,
        pnl: totalPnl,
        isProfit: totalPnl >= 0,
      });
    }
  }

  const breakEven = isCall ? strike + premium : strike - premium;
  const maxLoss = Math.round(premium * totalQty);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white uppercase font-sans tracking-wider">
            Interactive Expiry Payoff & Break-Even Curve
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">Position Scale:</span>
          <div className="flex bg-slate-900 rounded p-0.5 border border-slate-800">
            {[1, 2, 5, 10].map((l) => (
              <button
                key={l}
                onClick={() => setLotMultiplier(l)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  lotMultiplier === l
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {l}x ({l * index.lotSize} Qty)
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={curveData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="payoffGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="payoffRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.0} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="spot"
              stroke="#64748b"
              tick={{ fontSize: 9 }}
              tickFormatter={(v) => `${index.currency}${v}`}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 9 }}
              tickFormatter={(v) => `${index.currency}${v}`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", fontSize: "10px" }}
              formatter={(val: any) => [`${index.currency}${Number(val).toLocaleString()}`, "P&L at Expiry"]}
              labelFormatter={(label) => `Underlying Spot: ${index.currency}${label}`}
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
            <ReferenceLine
              x={entrySpot}
              stroke="#6366f1"
              strokeDasharray="3 3"
              label={{ value: "Entry Spot", fill: "#818cf8", fontSize: 9, position: "top" }}
            />
            <ReferenceLine
              x={Number(breakEven.toFixed(2))}
              stroke="#fbbf24"
              strokeDasharray="4 2"
              label={{ value: "Break-Even", fill: "#fbbf24", fontSize: 9, position: "top" }}
            />
            <Area
              type="monotone"
              dataKey="pnl"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#payoffGreen)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
        <div className="bg-slate-900 border border-slate-800 rounded p-2">
          <div className="text-slate-500 uppercase font-sans font-bold">Max Defined Risk</div>
          <div className="text-rose-400 font-bold text-xs mt-0.5">
            -{index.currency}{maxLoss.toLocaleString()}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded p-2">
          <div className="text-slate-500 uppercase font-sans font-bold">Break-Even Point</div>
          <div className="text-amber-400 font-bold text-xs mt-0.5">
            {index.currency}{breakEven.toFixed(2)}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded p-2">
          <div className="text-slate-500 uppercase font-sans font-bold">Target 1 P&L</div>
          <div className="text-emerald-400 font-bold text-xs mt-0.5">
            +{index.currency}{Math.round((Math.abs(plan.target1 - entrySpot) * 0.7 * totalQty)).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
