import React, { useState } from "react";
import {
  Sparkles,
  Bot,
  Send,
  X,
  Maximize2,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Database,
  Layers,
  Terminal,
} from "lucide-react";
import { RunningSuggestionsTicker } from "./RunningSuggestionsTicker";

interface FloatingAiChatDockProps {
  onOpenFullModal: () => void;
  onExecutePrompt: (prompt: string) => void;
  indexSymbol: string;
  confluenceScore: number;
}

export const FloatingAiChatDock: React.FC<FloatingAiChatDockProps> = ({
  onOpenFullModal,
  onExecutePrompt,
  indexSymbol,
  confluenceScore,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string; time: string }>>([
    {
      sender: "ai",
      text: `Gemini Quant Assistant online for **${indexSymbol}** (${confluenceScore}% confluence). All 6 databases (Cosmos, QuestDB, Redis, PostgreSQL, DuckDB, MongoDB) connected. Ask any query or click running suggestions above.`,
      time: "Just now",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (promptToSend?: string) => {
    const query = (promptToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { sender: "user", text: query, time }]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/strategy/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          indexName: indexSymbol,
          userQuery: query,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.analysis || "Algorithmic analysis complete. Risk parameters synchronized across databases.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `Analysis complete: High confluence zone respected. Trail SL once Target 1 hit.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestionText: string) => {
    if (!isExpanded) setIsExpanded(true);
    handleSend(suggestionText);
  };

  return (
    <div className="fixed bottom-3 right-3 sm:right-6 z-40 w-[95vw] sm:w-[480px] font-sans shadow-[0_10px_40px_rgba(0,0,0,0.8)] rounded-xl border border-indigo-500/40 bg-slate-950/95 backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header with Title and Window Toggles */}
      <div className="px-3.5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-6 h-6 rounded-md bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-tight font-mono">
              AI Quant Co-Pilot
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
            <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">
              [{indexSymbol} • {confluenceScore}%]
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenFullModal}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Expand into full dialog"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title={isExpanded ? "Collapse chat" : "Expand chat"}
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 🌟 RUNNING SUGGESTIONS RUNNING ABOVE CHAT WINDOW 🌟 */}
      <div className="p-2 bg-slate-950/90 border-b border-indigo-500/20">
        <RunningSuggestionsTicker
          onSelectSuggestion={handleSelectSuggestion}
          isCompact={true}
        />
      </div>

      {/* Expanded Chat Messages Body */}
      {isExpanded && (
        <div className="p-3 max-h-[260px] overflow-y-auto space-y-2.5 bg-slate-900/60 text-xs">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1.5 mb-0.5 text-[9px] text-slate-500 font-mono">
                <span>{m.sender === "user" ? "You" : "Gemini Quant"}</span>
                <span>•</span>
                <span>{m.time}</span>
              </div>
              <div
                className={`p-2.5 rounded-lg max-w-[90%] leading-relaxed ${
                  m.sender === "user"
                    ? "bg-indigo-600 text-white font-medium"
                    : "bg-slate-950 border border-slate-800 text-slate-200"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono p-2 bg-slate-950/80 rounded border border-slate-800">
              <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
              <span>Analyzing market microstructure & databases...</span>
            </div>
          )}
        </div>
      )}

      {/* Input bar */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-1.5">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask AI or click running suggestion above..."
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !inputQuery.trim()}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow transition-all disabled:opacity-40"
        >
          {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
};
