import React, { useState } from "react";
import { OptionContract, IndexInfo } from "../types";
import { Check, Star, Sparkles, Filter, Info, Flame, Table, Layers } from "lucide-react";
import { VolatilityHeatmap } from "./VolatilityHeatmap";

interface OptionsChainPickerProps {
  index: IndexInfo;
  calls: OptionContract[];
  puts: OptionContract[];
  atmStrike: number;
  maxPainStrike: number;
  pcr: number;
  selectedStrike: number | null;
  onSelectOption: (contract: OptionContract) => void;
}

export const OptionsChainPicker: React.FC<OptionsChainPickerProps> = ({
  index,
  calls,
  puts,
  atmStrike,
  maxPainStrike,
  pcr,
  selectedStrike,
  onSelectOption,
}) => {
  const [showGreeks, setShowGreeks] = useState(true);
  const [viewMode, setViewMode] = useState<"COMBINED" | "HEATMAP" | "TABLE">("COMBINED");

  // Calculate ATM IV benchmark
  const atmCall = calls.find((c) => c.strike === atmStrike);
  const atmIV = (atmCall?.greeks.iv || index.baseIV) * 100;

  return (
    <div className="space-y-4">
      {/* Volatility Heatmap Module (Shown in COMBINED or HEATMAP mode) */}
      {(viewMode === "COMBINED" || viewMode === "HEATMAP") && (
        <VolatilityHeatmap
          index={index}
          calls={calls}
          puts={puts}
          atmStrike={atmStrike}
          onSelectOption={onSelectOption}
        />
      )}

      {/* Options Matrix Table (Shown in COMBINED or TABLE mode) */}
      {(viewMode === "COMBINED" || viewMode === "TABLE") && (
        <div className="bg-slate-900 border border-slate-800 rounded p-4 shadow-2xl space-y-3">
          {/* Header Info */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  Options Matrix & Greeks Volatility Surface
                </h3>
                <span className="text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 uppercase tracking-wider">
                  Weekly Expiry
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Black-Scholes Delta (Δ), Gamma (Γ), Theta (Θ), Vega (V) with IV Skew status
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="bg-slate-950 px-3 py-1 rounded border border-slate-800 text-slate-300">
                PCR:{" "}
                <span className={pcr > 1 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {pcr}
                </span>
              </div>
              <div className="bg-amber-950/30 px-3 py-1 rounded border border-amber-800/40 text-amber-300 flex items-center gap-1.5">
                <span className="text-[10px] font-sans uppercase font-bold text-amber-400/80">
                  Max Pain:
                </span>
                <span className="font-bold">{maxPainStrike}</span>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800 text-[10px]">
                <button
                  onClick={() => setViewMode("COMBINED")}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                    viewMode === "COMBINED"
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Show both Volatility Heatmap and Matrix Table"
                >
                  <Layers className="w-3 h-3" />
                  <span>Combined</span>
                </button>
                <button
                  onClick={() => setViewMode("HEATMAP")}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                    viewMode === "HEATMAP"
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Show Volatility Heatmap & Skew Curve only"
                >
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>Heatmap</span>
                </button>
                <button
                  onClick={() => setViewMode("TABLE")}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                    viewMode === "TABLE"
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Show Matrix Table only"
                >
                  <Table className="w-3 h-3" />
                  <span>Table</span>
                </button>
              </div>

              <button
                onClick={() => setShowGreeks(!showGreeks)}
                className="px-3 py-1 rounded bg-slate-950 hover:bg-slate-800 text-indigo-300 border border-slate-800 text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                {showGreeks ? "Hide Greeks" : "Show Full Greeks"}
              </button>
            </div>
          </div>

          {/* Options Matrix Table */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-[11px] font-mono text-center border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-sans uppercase text-[9px] tracking-wider">
                  {/* Call Columns */}
                  {showGreeks && <th className="py-2 px-1 text-slate-400">Delta</th>}
                  {showGreeks && <th className="py-2 px-1 text-slate-400">Theta</th>}
                  <th className="py-2 px-1 text-slate-400">Call IV</th>
                  <th className="py-2 px-1 text-slate-400">OI</th>
                  <th className="py-2 px-1 text-emerald-400 font-bold">Call LTP</th>

                  {/* Strike Column */}
                  <th className="py-2 px-3 bg-slate-850 text-white font-bold tracking-widest">
                    Strike
                  </th>

                  {/* Put Columns */}
                  <th className="py-2 px-1 text-rose-400 font-bold">Put LTP</th>
                  <th className="py-2 px-1 text-slate-400">OI</th>
                  <th className="py-2 px-1 text-slate-400">Put IV</th>
                  {showGreeks && <th className="py-2 px-1 text-slate-400">Theta</th>}
                  {showGreeks && <th className="py-2 px-1 text-slate-400">Delta</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {calls.map((call, i) => {
                  const put = puts[i] || puts[0];
                  const strike = call.strike;
                  const isATM = strike === atmStrike;
                  const isMaxPain = strike === maxPainStrike;
                  const isSelected = strike === selectedStrike;

                  const isBestCall = call.score >= 95;
                  const isBestPut = put.score >= 95;

                  const callIVVal = Number((call.greeks.iv * 100).toFixed(1));
                  const putIVVal = Number((put.greeks.iv * 100).toFixed(1));
                  const callSkewDiff = Number((callIVVal - atmIV).toFixed(1));
                  const putSkewDiff = Number((putIVVal - atmIV).toFixed(1));

                  return (
                    <tr
                      key={strike}
                      className={`hover:bg-slate-800/40 transition-all ${
                        isSelected ? "bg-indigo-950/40" : isATM ? "bg-slate-950/90" : ""
                      }`}
                    >
                      {/* Call Delta */}
                      {showGreeks && (
                        <td className="py-1.5 px-1 text-slate-300">
                          {call.greeks.delta.toFixed(2)}
                        </td>
                      )}
                      {/* Call Theta */}
                      {showGreeks && (
                        <td className="py-1.5 px-1 text-rose-400/80">
                          {call.greeks.theta.toFixed(1)}
                        </td>
                      )}
                      {/* Call IV with Skew Heat indicator */}
                      <td className="py-1.5 px-1">
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className={`${
                              callSkewDiff > 2.5
                                ? "text-rose-400 font-bold"
                                : callSkewDiff < -1
                                ? "text-emerald-400 font-bold"
                                : "text-slate-400"
                            }`}
                          >
                            {callIVVal}%
                          </span>
                          {callSkewDiff > 2.5 && (
                            <span
                              className="text-[8px] bg-rose-500/20 text-rose-300 px-1 rounded font-sans uppercase"
                              title="Rich/Overpriced IV Skew"
                            >
                              Rich
                            </span>
                          )}
                          {callSkewDiff < -1.2 && (
                            <span
                              className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-sans uppercase"
                              title="Discounted/Underpriced IV"
                            >
                              Cheap
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Call OI */}
                      <td className="py-1.5 px-1 text-slate-400">
                        {(call.oi / 1000).toFixed(0)}k
                      </td>
                      {/* Call LTP Button */}
                      <td className="py-1.5 px-1">
                        <button
                          onClick={() => onSelectOption(call)}
                          className={`w-full py-1 px-1.5 rounded font-bold transition-all text-xs flex items-center justify-center gap-1 ${
                            isBestCall
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                              : "text-emerald-400 hover:bg-emerald-950/40"
                          }`}
                        >
                          {isBestCall && (
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          )}
                          <span>{call.ltp}</span>
                        </button>
                      </td>

                      {/* Strike in Center */}
                      <td
                        className={`py-1.5 px-3 font-bold text-xs ${
                          isATM
                            ? "bg-indigo-600/20 text-indigo-200 border-x border-indigo-500/40"
                            : "bg-slate-950 text-white border-x border-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{strike}</span>
                          {isATM && (
                            <span className="text-[8px] bg-indigo-600 text-white px-1 rounded font-sans font-bold uppercase">
                              ATM
                            </span>
                          )}
                          {isMaxPain && (
                            <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 rounded font-sans uppercase font-bold">
                              PAIN
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Put LTP Button */}
                      <td className="py-1.5 px-1">
                        <button
                          onClick={() => onSelectOption(put)}
                          className={`w-full py-1 px-1.5 rounded font-bold transition-all text-xs flex items-center justify-center gap-1 ${
                            isBestPut
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                              : "text-rose-400 hover:bg-rose-950/40"
                          }`}
                        >
                          {isBestPut && (
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          )}
                          <span>{put.ltp}</span>
                        </button>
                      </td>
                      {/* Put OI */}
                      <td className="py-1.5 px-1 text-slate-400">
                        {(put.oi / 1000).toFixed(0)}k
                      </td>
                      {/* Put IV with Skew Heat indicator */}
                      <td className="py-1.5 px-1">
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className={`${
                              putSkewDiff > 2.5
                                ? "text-rose-400 font-bold"
                                : putSkewDiff < -1
                                ? "text-emerald-400 font-bold"
                                : "text-slate-400"
                            }`}
                          >
                            {putIVVal}%
                          </span>
                          {putSkewDiff > 2.5 && (
                            <span
                              className="text-[8px] bg-rose-500/20 text-rose-300 px-1 rounded font-sans uppercase"
                              title="Rich/Overpriced IV Skew"
                            >
                              Rich
                            </span>
                          )}
                          {putSkewDiff < -1.2 && (
                            <span
                              className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-sans uppercase"
                              title="Discounted/Underpriced IV"
                            >
                              Cheap
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Put Theta */}
                      {showGreeks && (
                        <td className="py-1.5 px-1 text-rose-400/80">
                          {put.greeks.theta.toFixed(1)}
                        </td>
                      )}
                      {/* Put Delta */}
                      {showGreeks && (
                        <td className="py-1.5 px-1 text-slate-300">
                          {put.greeks.delta.toFixed(2)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-amber-300 font-medium">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>Optimal 0.70 Delta Sweetspot (Maximum Gamma / Controlled Theta Decay)</span>
              </span>
            </div>
            <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
              Click any Call or Put LTP to inspect Payoff Profile
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

