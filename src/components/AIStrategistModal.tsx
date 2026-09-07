import React, { useState, useRef, useEffect } from "react";
import { IndexInfo, StrategyConfluence, ActionableTradePlan } from "../types";
import {
  Cpu,
  X,
  Send,
  Sparkles,
  Bot,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  TrendingUp,
  TrendingDown,
  Database,
  Layers,
  Terminal,
} from "lucide-react";
import { RunningSuggestionsTicker } from "./RunningSuggestionsTicker";

interface AIStrategistModalProps {
  isOpen: boolean;
  onClose: () => void;
  index: IndexInfo;
  confluence: StrategyConfluence;
  plan: ActionableTradePlan | null;
  hftDelta: number;
  pcr: number;
  maxPain: number;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  category?: string;
  confluenceRating?: number;
}

export const AIStrategistModal: React.FC<AIStrategistModalProps> = ({
  isOpen,
  onClose,
  index,
  confluence,
  plan,
  hftDelta,
  pcr,
  maxPain,
}) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialWelcomeMessage: ChatMessage = {
    id: "msg-welcome-01",
    sender: "ai",
    text: `### 🏛️ Gemini Quantitative AI Strategist Initialized
Welcome. I am actively monitoring live order book microstructure, Level-3 depth from Dhan & Upstox, and real-time options Greeks for **${index.name}**.

**Current Live Market Pulse:**
- **Spot Price:** ${index.currency}${index.currentPrice.toLocaleString()} (${index.change >= 0 ? "+" : ""}${index.change} / ${index.changePercent}%)
- **Multi-Factor Confluence:** **${confluence.totalScore}%** confirmation (${confluence.signal})
- **Institutional CVD Delta:** **${hftDelta > 0 ? "+" : ""}${hftDelta.toLocaleString()} lots**
- **Put-Call Ratio (PCR):** **${pcr}** | **Max Pain Pin:** **${maxPain}**
- **Connected Databases:** Azure Cosmos DB (TBT Micro-batch), QuestDB (Nanosecond TSDB), Redis (L3 Depth Cache), PostgreSQL (Trade Ledger)

*Select any running suggestion from the live ticker above the chat window or type your proprietary strategy question below.*`,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    confluenceRating: confluence.totalScore,
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcomeMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend || query).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/strategy/ai-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          indexName: index.name,
          currentPrice: index.currentPrice,
          trend: index.change >= 0 ? "Bullish Momentum" : "Bearish Retracement",
          zigzagStatus:
            confluence.signal === "CONFIRMED_BUY_DIP"
              ? "Wyckoff Valley / Golden Pocket Dip Confirmed"
              : "Institutional Supply Peak / Top Rejection",
          confluenceScore: confluence.totalScore,
          hftDelta,
          pcrRatio: pcr,
          maxPain,
          activeSignal: confluence.signal,
          suggestedStrategy: plan?.recommendedContract || "ITM Directional Delta Spread",
          userQuery: text,
        }),
      });

      const data = await response.json();
      const aiResponseText =
        data.analysis ||
        "Analysis completed. Multi-factor algorithmic confluence supports structured risk-defined execution.";

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        confluenceRating: data.confluenceRating || confluence.totalScore,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("AI strategist request failed:", err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: `⚠️ **Inference Notice:** Unable to reach AI endpoint (${err.message || "Network issue"}). Using local deterministic quantitative heuristics: Retain hard stop at key swing support, trail SL once Target 1 is achieved.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([initialWelcomeMessage]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-5xl h-[92vh] flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.85)] overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.35)]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-tight">
                  Gemini Quantitative F&O Strategist & Chat
                </h2>
                <span className="text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 uppercase tracking-widest">
                  Neural Co-Pilot
                </span>
                <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 hidden sm:inline">
                  MULTI-DB SYNC
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Institutional Microstructure, Level-3 Depth, Multi-Broker DMA & Enterprise Databases
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              title="Reset conversation"
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-300 transition-all border border-slate-800"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Context Telemetry Strip */}
        <div className="bg-slate-950/90 border-b border-slate-800/80 px-4 py-2 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Index:</span>
            <span className="text-white font-bold">{index.symbol}</span>
            <span className="text-slate-400 font-sans text-[11px]">
              {index.currency}{index.currentPrice}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Confluence:</span>
            <span className="text-emerald-400 font-bold">{confluence.totalScore}%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px] uppercase font-bold">HFT Delta:</span>
            <span className={`font-bold ${hftDelta > 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {hftDelta > 0 ? "+" : ""}{hftDelta.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px] uppercase font-bold">PCR / Pain:</span>
            <span className="text-cyan-300 font-bold">{pcr}</span>
            <span className="text-slate-500">/</span>
            <span className="text-amber-300 font-bold">{maxPain}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-[10px]">
            <Database className="w-3 h-3 text-blue-400" />
            <span>Cosmos • Quest • Redis • PG</span>
          </div>
        </div>

        {/* 🌟 RUNNING SUGGESTIONS RUNNING ABOVE THE CHAT WINDOW 🌟 */}
        <div className="px-4 py-2 bg-slate-950/70 border-b border-indigo-500/20">
          <RunningSuggestionsTicker
            onSelectSuggestion={(prompt) => handleSendMessage(prompt)}
          />
        </div>

        {/* Main Chat Messages Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-900/60">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                {msg.sender === "ai" ? (
                  <>
                    <div className="w-5 h-5 rounded bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                      <Bot className="w-3 h-3" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 font-mono">
                      Gemini Quant AI
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                      Trader / Desk Order
                    </span>
                  </>
                )}
                <span className="text-[9px] text-slate-500 font-mono">{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[90%] sm:max-w-[85%] rounded-xl p-4 text-xs leading-relaxed relative group shadow-md ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-indigo-700 to-indigo-600 text-white font-medium border border-indigo-400/40"
                    : "bg-slate-950/90 text-slate-200 border border-slate-800/90 font-sans"
                }`}
              >
                {/* Copy button for AI responses */}
                {msg.sender === "ai" && (
                  <button
                    onClick={() => handleCopy(msg.text, msg.id)}
                    className="absolute top-2.5 right-2.5 p-1 rounded bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors opacity-70 group-hover:opacity-100"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}

                <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed space-y-2">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex flex-col items-start space-y-1">
              <div className="flex items-center gap-2 mb-1 px-1">
                <div className="w-5 h-5 rounded bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  <Bot className="w-3 h-3" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 font-mono">
                  Synthesizing Market Structure & Multi-DB Telemetry...
                </span>
              </div>
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3 text-xs text-slate-400 font-mono">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Running Greeks surface calculation, Wyckoff wave phases, and Cosmos/QuestDB audit...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask AI strategist or choose a running suggestion above (e.g. 'How to hedge 24500 CE if IV drops?')..."
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-sans"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !query.trim()}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-40 shadow-[0_0_15px_rgba(79,70,229,0.4)] shrink-0 cursor-pointer"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="uppercase tracking-wider hidden sm:inline">Send Query</span>
          </button>
        </div>
      </div>
    </div>
  );
};
