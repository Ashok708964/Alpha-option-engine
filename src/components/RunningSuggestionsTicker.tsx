import React, { useState } from "react";
import {
  Sparkles,
  Pause,
  Play,
  Database,
  Layers,
  Activity,
  ShieldAlert,
  Compass,
  CheckCircle2,
  ChevronRight,
  Zap,
} from "lucide-react";

export interface SuggestionItem {
  id: string;
  category: "DATABASES" | "ORDER_FLOW" | "GREEKS" | "CONFLUENCE" | "HEDGING";
  categoryLabel: string;
  icon: "database" | "order_flow" | "greeks" | "confluence" | "hedging";
  text: string;
  badge?: string;
}

export const QUANT_SUGGESTIONS: SuggestionItem[] = [
  // Database & Replay queries
  {
    id: "db-quest",
    category: "DATABASES",
    categoryLabel: "QuestDB TSDB",
    icon: "database",
    text: "Query QuestDB time-series for 1-minute order book CVD tick delta divergence",
    badge: "TSDB",
  },
  {
    id: "db-cosmos",
    category: "DATABASES",
    categoryLabel: "Cosmos DB",
    icon: "database",
    text: "Fetch Azure Cosmos DB micro-batch for NIFTY 24500 CE TBT stream & RU usage",
    badge: "NoSQL",
  },
  {
    id: "db-postgres",
    category: "DATABASES",
    categoryLabel: "PostgreSQL",
    icon: "database",
    text: "Reconcile PostgreSQL ACID financial ledger against broker executed fills and margins",
    badge: "ACID",
  },
  {
    id: "db-redis",
    category: "DATABASES",
    categoryLabel: "Redis Cache",
    icon: "database",
    text: "Inspect Redis sub-millisecond Level-3 bid-ask depth state and distributed trade locks",
    badge: "L3 CACHE",
  },
  {
    id: "db-duckdb",
    category: "DATABASES",
    categoryLabel: "DuckDB Lake",
    icon: "database",
    text: "Replay historical Parquet lakehouse tick data for Walk-Forward CPCV backtest",
    badge: "COLD LAKE",
  },

  // Order flow & Depth
  {
    id: "flow-dhan",
    category: "ORDER_FLOW",
    categoryLabel: "Level-3 Depth",
    icon: "order_flow",
    text: "Simulate 200-Level Dhan & 30-Level Upstox order book liquidity sweeps and wall shifts",
    badge: "200-LVL",
  },
  {
    id: "flow-iceberg",
    category: "ORDER_FLOW",
    categoryLabel: "Smart Money",
    icon: "order_flow",
    text: "Detect institutional iceberg limit orders and passive absorption at key strike pivots",
    badge: "ICEBERG",
  },
  {
    id: "flow-fvg",
    category: "ORDER_FLOW",
    categoryLabel: "SMC FVG",
    icon: "order_flow",
    text: "Audit Smart Money Order Blocks & Fair Value Gaps at Key Demand Zone",
    badge: "SMC",
  },

  // Greeks & Volatility
  {
    id: "greeks-gamma",
    category: "GREEKS",
    categoryLabel: "Options Greeks",
    icon: "greeks",
    text: "Evaluate Greeks Gamma Squeeze vs Theta Decay for Current Weekly Expiry",
    badge: "GAMMA",
  },
  {
    id: "greeks-svi",
    category: "GREEKS",
    categoryLabel: "SVI Volatility",
    icon: "greeks",
    text: "Compute SVI implied volatility smile arbitrage & skewness across OTM strikes",
    badge: "SVI SMILE",
  },
  {
    id: "greeks-maxpain",
    category: "GREEKS",
    categoryLabel: "Max Pain",
    icon: "greeks",
    text: "Calculate Max Pain strike pinning probability and Put-Call Ratio inflection",
    badge: "PCR/PAIN",
  },

  // Algorithmic Confluence
  {
    id: "conf-synth",
    category: "CONFLUENCE",
    categoryLabel: "Full Synthesis",
    icon: "confluence",
    text: "Synthesize Full Institutional & HFT Confluence Trade Plan with strict targets",
    badge: "PLAN",
  },
  {
    id: "conf-trailing",
    category: "CONFLUENCE",
    categoryLabel: "Trailing SL",
    icon: "confluence",
    text: "Calculate dynamic trailing stop-loss threshold based on ATR & Wyckoff structural wave",
    badge: "DYNAMIC SL",
  },

  // Hedging & Tail Risk
  {
    id: "hedge-tail",
    category: "HEDGING",
    categoryLabel: "Tail Risk",
    icon: "hedging",
    text: "Formulate Delta-Neutral Volatility Hedge against Sudden Flash Crash & VIX spike",
    badge: "HEDGE",
  },
  {
    id: "hedge-spread",
    category: "HEDGING",
    categoryLabel: "Spread Design",
    icon: "hedging",
    text: "Compare 0DTE Iron Fly vs Long Delta Put debit spread for risk-defined positioning",
    badge: "0DTE",
  },
];

interface RunningSuggestionsTickerProps {
  onSelectSuggestion: (text: string) => void;
  className?: string;
  isCompact?: boolean;
}

export const RunningSuggestionsTicker: React.FC<RunningSuggestionsTickerProps> = ({
  onSelectSuggestion,
  className = "",
  isCompact = false,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [speed, setSpeed] = useState<"normal" | "slow" | "fast">("normal");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSuggestions =
    selectedCategory === "ALL"
      ? QUANT_SUGGESTIONS
      : QUANT_SUGGESTIONS.filter((s) => s.category === selectedCategory);

  // Duplicate items to ensure seamless infinite looping ticker
  const displayItems = [...filteredSuggestions, ...filteredSuggestions];

  const speedDuration = {
    slow: "60s",
    normal: "38s",
    fast: "24s",
  }[speed];

  const getCategoryIcon = (icon: SuggestionItem["icon"]) => {
    switch (icon) {
      case "database":
        return <Database className="w-3 h-3 text-cyan-400" />;
      case "order_flow":
        return <Layers className="w-3 h-3 text-orange-400" />;
      case "greeks":
        return <Activity className="w-3 h-3 text-emerald-400" />;
      case "confluence":
        return <Compass className="w-3 h-3 text-indigo-400" />;
      case "hedging":
        return <ShieldAlert className="w-3 h-3 text-rose-400" />;
      default:
        return <Sparkles className="w-3 h-3 text-indigo-400" />;
    }
  };

  const handleItemClick = (item: SuggestionItem) => {
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
    onSelectSuggestion(item.text);
  };

  return (
    <div
      className={`bg-slate-950/95 border border-indigo-500/30 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(79,70,229,0.15)] flex flex-col ${className}`}
    >
      {/* Ticker Top Bar Controls */}
      <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Live Suggestions Running</span>
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hidden sm:inline">
            CLICK TO INJECT
          </span>
        </div>

        {/* Filter categories & controls */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <div className="hidden md:flex items-center gap-1">
            {["ALL", "DATABASES", "ORDER_FLOW", "GREEKS", "HEDGING"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold transition-all ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-[0_0_8px_rgba(79,70,229,0.4)]"
                    : "text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800"
                }`}
              >
                {cat === "ORDER_FLOW" ? "ORDER FLOW" : cat}
              </button>
            ))}
          </div>

          <div className="h-3 w-[1px] bg-slate-800 hidden md:block" />

          {/* Speed Selector */}
          <select
            value={speed}
            onChange={(e) => setSpeed(e.target.value as any)}
            className="bg-slate-950 text-slate-300 text-[10px] font-mono border border-slate-800 rounded px-1.5 py-0.5 focus:outline-none"
            title="Ticker Speed"
          >
            <option value="slow">Speed: 0.7x</option>
            <option value="normal">Speed: 1.0x</option>
            <option value="fast">Speed: 1.5x</option>
          </select>

          {/* Pause / Play Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title={isPaused ? "Resume running ticker" : "Pause running ticker"}
          >
            {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Running Marquee Track */}
      <div
        className="relative overflow-hidden py-2 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/60"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Soft edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

        <div
          className="flex items-center gap-3 whitespace-nowrap will-change-transform"
          style={{
            animation: `marqueeLinear ${speedDuration} linear infinite`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        >
          {displayItems.map((item, idx) => (
            <button
              key={`${item.id}-${idx}`}
              onClick={() => handleItemClick(item)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-indigo-950/80 border border-slate-700/70 hover:border-indigo-500/80 text-slate-300 hover:text-white transition-all text-xs font-sans group shrink-0 shadow-sm active:scale-95 cursor-pointer"
            >
              <span className="p-1 rounded-full bg-slate-950 border border-slate-800 group-hover:border-indigo-500/50 transition-colors">
                {getCategoryIcon(item.icon)}
              </span>

              {item.badge && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {item.badge}
                </span>
              )}

              <span className="text-slate-200 group-hover:text-indigo-200 text-xs transition-colors">
                {item.text}
              </span>

              {copiedId === item.id ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              )}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marqueeLinear {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};
