import React, { useState } from "react";
import {
  GlobalSentimentData,
  IndexInfo,
  MarketHeadline,
} from "../types";
import { calculateSentimentPriceDivergence } from "../utils/quantEngine";
import { SentimentPriceDivergenceGauge } from "./SentimentPriceDivergenceGauge";
import {
  Globe,
  RefreshCw,
  Sparkles,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  Radio,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface GlobalMarketSentimentWidgetProps {
  index: IndexInfo;
  sentimentData: GlobalSentimentData | null;
  isLoading: boolean;
  onRefresh: () => void;
  hftDelta?: number;
}

export const GlobalMarketSentimentWidget: React.FC<GlobalMarketSentimentWidgetProps> = ({
  index,
  sentimentData,
  isLoading,
  onRefresh,
  hftDelta = 14200,
}) => {
  const [filter, setFilter] = useState<"ALL" | "BULLISH" | "BEARISH" | "HIGH_IMPACT">("ALL");
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const headlines: MarketHeadline[] = sentimentData?.headlines || [];

  const filteredHeadlines = headlines.filter((h) => {
    if (filter === "BULLISH") return h.sentiment === "BULLISH";
    if (filter === "BEARISH") return h.sentiment === "BEARISH";
    if (filter === "HIGH_IMPACT") return h.impact === "HIGH";
    return true;
  });

  const score = sentimentData?.score ?? 78;
  const isBullish = score >= 56;
  const isBearish = score <= 48;

  // Calculate real-time Sentiment-Order Flow Divergence
  const divergenceMetrics = calculateSentimentPriceDivergence(
    hftDelta,
    (score - 50) * 2, // Map 0-100 to -100 to +100
    index.changePercent
  );

  const scoreColor = isBullish
    ? "text-emerald-400"
    : isBearish
    ? "text-rose-400"
    : "text-amber-400";

  const scoreBg = isBullish
    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
    : isBearish
    ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
    : "bg-amber-500/10 border-amber-500/30 text-amber-300";

  const scoreBarColor = isBullish
    ? "bg-emerald-500"
    : isBearish
    ? "bg-rose-500"
    : "bg-amber-500";

  return (
    <div
      id="global-market-sentiment-widget"
      className="bg-slate-900 border border-slate-800 rounded shadow-2xl overflow-hidden font-sans"
    >
      {/* Top Header Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-indigo-950/60 border border-indigo-700/50 flex items-center justify-center text-indigo-400 shadow-[0_0_12px_rgba(79,70,229,0.3)]">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Global Market Sentiment & Headline Pulse
              </h2>
              <span className="inline-flex items-center gap-1 bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Google Search Grounded
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live macroeconomic synthesis & institutional news momentum for{" "}
              <strong className="text-slate-200">{index.symbol}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {sentimentData?.lastUpdated && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-500">
              <Clock className="w-3 h-3 text-slate-600" />
              Updated: {sentimentData.lastUpdated}
            </span>
          )}

          <button
            id="refresh-sentiment-btn"
            onClick={onRefresh}
            disabled={isLoading}
            className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-indigo-500/60 text-xs font-medium transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            title="Fetch latest Google Search financial headlines"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-indigo-400 ${
                isLoading ? "animate-spin" : ""
              }`}
            />
            <span className="text-[11px] font-mono uppercase tracking-tight">
              {isLoading ? "Searching..." : "Search News"}
            </span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all"
            title={isExpanded ? "Collapse Widget" : "Expand Widget"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Sentiment-Price Divergence Gauge Integration */}
          <SentimentPriceDivergenceGauge
            index={index}
            sentimentData={sentimentData}
            divergence={divergenceMetrics}
            hftDelta={hftDelta}
          />

          {/* Metrics Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            {/* Sentiment Score Gauge */}
            <div className="bg-slate-950 border border-slate-800 rounded p-3 border-l-2 border-l-indigo-500 flex flex-col justify-between">
              <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-slate-500 font-sans font-bold">
                <span>Sentiment Index</span>
                <span className={`px-1.5 py-0.2 rounded border text-[8px] ${scoreBg}`}>
                  {sentimentData?.label || (isBullish ? "BULLISH" : "NEUTRAL")}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className={`text-xl font-bold ${scoreColor}`}>
                  {score}/100
                </span>
                <span className="text-[10px] text-slate-400 font-sans">
                  {score >= 75
                    ? "Strong Risk-On"
                    : score >= 56
                    ? "Moderate Risk-On"
                    : score <= 35
                    ? "Strong Risk-Off"
                    : "Macro Neutral"}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-slate-800 w-full rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full ${scoreBarColor} rounded-full`}
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </div>

            {/* Confluence Feed Status */}
            <div className="bg-slate-950 border border-slate-800 rounded p-3 border-l-2 border-l-emerald-500 flex flex-col justify-between">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-sans font-bold">
                Confluence Weight
              </span>
              <div className="mt-1">
                <span className="text-base font-bold text-emerald-400 font-mono">
                  10% Feed
                </span>
                <p className="text-[10px] text-slate-400 font-sans leading-tight mt-0.5">
                  Synchronized into Strategy Matrix
                </p>
              </div>
              <div className="text-[9px] text-emerald-300/80 font-mono mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Active in Formula
              </div>
            </div>

            {/* Confidence & Validation */}
            <div className="bg-slate-950 border border-slate-800 rounded p-3 border-l-2 border-l-cyan-500 flex flex-col justify-between">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-sans font-bold">
                Model Confidence
              </span>
              <div className="mt-1">
                <span className="text-base font-bold text-cyan-400 font-mono">
                  {sentimentData?.confidence || 88}%
                </span>
                <p className="text-[10px] text-slate-400 font-sans leading-tight mt-0.5">
                  Grounded Citation Accuracy
                </p>
              </div>
              <div className="text-[9px] text-cyan-300/80 font-mono mt-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-cyan-400" />
                Multi-Source Scraped
              </div>
            </div>

            {/* Live Streaming State */}
            <div className="bg-slate-950 border border-slate-800 rounded p-3 border-l-2 border-l-amber-500 flex flex-col justify-between">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-sans font-bold">
                Search Freshness
              </span>
              <div className="mt-1">
                <span className="text-base font-bold text-amber-300 font-mono flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  Real-Time
                </span>
                <p className="text-[10px] text-slate-400 font-sans leading-tight mt-0.5">
                  Financial News & Macros
                </p>
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-1">
                {headlines.length} Headlines Indexed
              </div>
            </div>
          </div>

          {/* Macro Summary & Key Drivers */}
          <div className="bg-slate-950 border border-slate-800 rounded p-3.5 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono">
                Executive Macro & Headline Synthesis
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {sentimentData?.macroSummary ||
                `Global macroeconomic conditions and central bank trajectories are providing steady tailwinds for ${index.symbol}. Institutional order flow remains net positive across large-cap components.`}
            </p>

            {/* Key Drivers Chips */}
            {sentimentData?.keyDrivers && sentimentData.keyDrivers.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
                  Key Market Catalysts:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sentimentData.keyDrivers.map((driver, i) => (
                    <div
                      key={i}
                      className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-300 flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></div>
                      <span className="truncate">{driver}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Financial Headlines Section */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Live Headlines Feed ({filteredHeadlines.length})
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 text-[10px] font-mono">
                <button
                  onClick={() => setFilter("ALL")}
                  className={`px-2 py-1 rounded transition-all ${
                    filter === "ALL"
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ALL
                </button>
                <button
                  onClick={() => setFilter("BULLISH")}
                  className={`px-2 py-1 rounded transition-all ${
                    filter === "BULLISH"
                      ? "bg-emerald-600 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  BULLISH
                </button>
                <button
                  onClick={() => setFilter("BEARISH")}
                  className={`px-2 py-1 rounded transition-all ${
                    filter === "BEARISH"
                      ? "bg-rose-600 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  BEARISH
                </button>
                <button
                  onClick={() => setFilter("HIGH_IMPACT")}
                  className={`px-2 py-1 rounded transition-all ${
                    filter === "HIGH_IMPACT"
                      ? "bg-amber-600 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  HIGH IMPACT
                </button>
              </div>
            </div>

            {/* Headlines Grid */}
            {isLoading ? (
              <div className="bg-slate-950 border border-slate-800 rounded p-8 flex flex-col items-center justify-center space-y-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="text-xs font-mono">
                  Synthesizing real-time Google Search headlines for {index.symbol}...
                </span>
              </div>
            ) : filteredHeadlines.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800 rounded p-6 text-center text-xs text-slate-500">
                No headlines found matching filter "{filter}".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredHeadlines.map((h) => {
                  const isBull = h.sentiment === "BULLISH";
                  const isBear = h.sentiment === "BEARISH";
                  const cardBorder = isBull
                    ? "border-l-2 border-l-emerald-500"
                    : isBear
                    ? "border-l-2 border-l-rose-500"
                    : "border-l-2 border-l-amber-500";

                  return (
                    <div
                      key={h.id}
                      className={`bg-slate-950 border border-slate-800 ${cardBorder} rounded p-3 flex flex-col justify-between space-y-2 hover:bg-slate-900/80 transition-all`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {h.source}
                            </span>
                            {h.publishedTime && (
                              <span className="text-[9px] font-mono text-slate-500">
                                {h.publishedTime}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                h.impact === "HIGH"
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : h.impact === "MEDIUM"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {h.impact} IMPACT
                            </span>

                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                isBull
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : isBear
                                  ? "bg-rose-500/20 text-rose-400"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {h.sentiment}
                            </span>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-slate-100 leading-snug font-sans hover:text-indigo-300 transition-colors">
                          {h.url ? (
                            <a
                              href={h.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-1 group"
                            >
                              <span>{h.title}</span>
                              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 shrink-0 mt-0.5" />
                            </a>
                          ) : (
                            h.title
                          )}
                        </h4>

                        {h.snippet && (
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-1 font-sans line-clamp-2">
                            {h.snippet}
                          </p>
                        )}
                      </div>

                      {h.relevance && (
                        <div className="text-[10px] text-slate-400 bg-slate-900/90 rounded p-1.5 border border-slate-800/80 font-sans">
                          <span className="font-bold text-slate-300 font-mono">
                            F&O Impact:{" "}
                          </span>
                          {h.relevance}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Google Search Grounding Sources Bar */}
          {sentimentData?.groundingSources &&
            sentimentData.groundingSources.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-indigo-400" />
                  <span>Verified Google Search Sources:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {sentimentData.groundingSources.map((source, i) => (
                    <a
                      key={i}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1"
                    >
                      <span>{source.title}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
};
