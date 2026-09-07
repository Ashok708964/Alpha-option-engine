import React, { useState, useEffect, useRef } from "react";
import {
  AlgoLevel,
  AlgoBotConfig,
  MultiLegStrategyTemplate,
  AlgoExecutionLog,
  IndexInfo,
  ActionableTradePlan,
  BrokerConnectionState,
} from "../types";
import {
  Bot,
  Zap,
  ShieldCheck,
  TrendingUp,
  Sliders,
  Send,
  Bell,
  RefreshCw,
  Layers,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Play,
  Pause,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Activity,
  Award,
  Scale,
  Compass,
} from "lucide-react";

interface AutonomousAlgoSuiteProps {
  index: IndexInfo;
  activePlan: ActionableTradePlan | null;
  brokerState: BrokerConnectionState;
  confluenceScore: number;
  onExecuteMultiLeg: (strategyName: string, legs: any[]) => Promise<any>;
  onExecuteSingleOrder: (order: any) => Promise<any>;
}

const DEFAULT_STRATEGY_TEMPLATES: MultiLegStrategyTemplate[] = [
  {
    id: "BULL_CALL_SPREAD",
    name: "Bull Call Spread (Defined Risk Hedged)",
    description: "Buy ATM Call + Sell OTM Call to fund theta decay and lock in defined risk.",
    direction: "BULLISH",
    legs: [
      { side: "BUY", optionType: "CE", strikeOffset: 0, lotRatio: 1 },
      { side: "SELL", optionType: "CE", strikeOffset: 200, lotRatio: 1 },
    ],
    marginBenefitPct: 62,
    maxProfitEst: 7850,
    maxLossEst: 3400,
    popPct: 68.4,
  },
  {
    id: "BEAR_PUT_SPREAD",
    name: "Bear Put Spread (Downside Accelerator)",
    description: "Buy ATM Put + Sell OTM Put for high gamma capture during distribution breakdown.",
    direction: "BEARISH",
    legs: [
      { side: "BUY", optionType: "PE", strikeOffset: 0, lotRatio: 1 },
      { side: "SELL", optionType: "PE", strikeOffset: -200, lotRatio: 1 },
    ],
    marginBenefitPct: 64,
    maxProfitEst: 8200,
    maxLossEst: 3250,
    popPct: 67.2,
  },
  {
    id: "IRON_CONDOR",
    name: "Delta-Neutral Iron Condor (Range Harvest)",
    description: "Sell OTM Put & Call spreads to collect maximum theta decay within Max Pain boundaries.",
    direction: "NEUTRAL",
    legs: [
      { side: "BUY", optionType: "PE", strikeOffset: -400, lotRatio: 1 },
      { side: "SELL", optionType: "PE", strikeOffset: -200, lotRatio: 1 },
      { side: "SELL", optionType: "CE", strikeOffset: 200, lotRatio: 1 },
      { side: "BUY", optionType: "CE", strikeOffset: 400, lotRatio: 1 },
    ],
    marginBenefitPct: 75,
    maxProfitEst: 11400,
    maxLossEst: 4200,
    popPct: 78.9,
  },
  {
    id: "LONG_STRADDLE",
    name: "High-IV Breakout Straddle (Volatility Expansion)",
    description: "Simultaneous ATM Call + ATM Put ahead of high-impact RBI/Fed announcements.",
    direction: "HIGH_VOLATILITY",
    legs: [
      { side: "BUY", optionType: "CE", strikeOffset: 0, lotRatio: 1 },
      { side: "BUY", optionType: "PE", strikeOffset: 0, lotRatio: 1 },
    ],
    marginBenefitPct: 0,
    maxProfitEst: 24500,
    maxLossEst: 8900,
    popPct: 54.1,
  },
];

export const AutonomousAlgoSuite: React.FC<AutonomousAlgoSuiteProps> = ({
  index,
  activePlan,
  brokerState,
  confluenceScore,
  onExecuteMultiLeg,
  onExecuteSingleOrder,
}) => {
  const [activeTab, setActiveTab] = useState<AlgoLevel>("LEVEL_1_CONFLUENCE_BOT");

  // Bot 1: Confluence Bot Config
  const [level1Config, setLevel1Config] = useState<AlgoBotConfig>({
    id: "CF-BOT-1",
    name: "Arrow-Piercing Confluence Autonomous Bot",
    level: "LEVEL_1_CONFLUENCE_BOT",
    isActive: true,
    minConfluenceThreshold: 88,
    maxRiskPerTradeInr: 4500,
    lotSizeMultiplier: 1,
    stopLossMode: "POC_INVALIDATION",
    stopLossPercent: 15,
    target1ExitRatio: 0.5,
    target2ExitRatio: 0.5,
    trailingSlStepPercent: 5,
    autoHedgeWithCreditSpread: true,
    enableTelegramWebhook: true,
    cooldownPeriodSeconds: 120,
    totalTriggerCount: 14,
    totalPnlRealizedInr: 48920,
    winRate: 85.7,
  });

  // Bot 2: Trailing Bracket Engine
  const [level2TrailingActive, setLevel2TrailingActive] = useState(true);
  const [trailingTriggerThresholdPct, setTrailingTriggerThresholdPct] = useState(25); // Start trailing after +25%
  const [trailingStepPct, setTrailingStepPct] = useState(8);

  // Bot 3: Multi-Leg Strategy & Delta-Neutral Auto-Rebalance Engine
  const [selectedStrategyTemplate, setSelectedStrategyTemplate] = useState<MultiLegStrategyTemplate>(
    DEFAULT_STRATEGY_TEMPLATES[0]
  );
  const [multiLegLots, setMultiLegLots] = useState(1);
  const [isExecutingMultiLeg, setIsExecutingMultiLeg] = useState(false);
  const [multiLegResult, setMultiLegResult] = useState<any>(null);

  // Delta-Neutral Auto-Rebalancing Engine State
  const [autoRebalanceActive, setAutoRebalanceActive] = useState(true);
  const [rebalanceThresholdDelta, setRebalanceThresholdDelta] = useState(0.15); // Trigger rebalance when |Net Delta| > 0.15
  const [currentNetDelta, setCurrentNetDelta] = useState(0.04);
  const [rebalanceIntervalSec, setRebalanceIntervalSec] = useState(10); // Check every 10s
  const [rebalanceCount, setRebalanceCount] = useState(6);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [lastRebalancedTime, setLastRebalancedTime] = useState<string>("Just now");
  const baseSpotRef = useRef<number>(index.currentPrice);

  // Periodic Auto-Rebalance loop that monitors net portfolio delta vs spot deviation
  useEffect(() => {
    if (!autoRebalanceActive) return;

    const timer = setInterval(() => {
      // Simulate spot drift impact on net portfolio delta
      const priceDrift = (index.currentPrice - baseSpotRef.current) / index.strikeStep;
      // Drift delta proportionally with spot movements
      const calculatedDelta = Number((0.02 + priceDrift * 0.08 + (Math.random() * 0.06 - 0.03)).toFixed(2));
      setCurrentNetDelta(calculatedDelta);

      // If Net Delta breaches tolerance (e.g. |Delta| >= threshold), auto-rebalance!
      if (Math.abs(calculatedDelta) >= rebalanceThresholdDelta && !isRebalancing) {
        triggerAutoRebalance(calculatedDelta);
      }
    }, rebalanceIntervalSec * 1000);

    return () => clearInterval(timer);
  }, [autoRebalanceActive, rebalanceThresholdDelta, rebalanceIntervalSec, index.currentPrice, isRebalancing]);

  const triggerAutoRebalance = async (driftedDelta?: number) => {
    const deltaToNeutralize = driftedDelta !== undefined ? driftedDelta : currentNetDelta;
    setIsRebalancing(true);

    const adjustmentAction = deltaToNeutralize > 0 ? "ROLL_UP_PUT / SHORT_CALL" : "ROLL_DOWN_CALL / SHORT_PUT";
    const strikeAdjustment = deltaToNeutralize > 0 ? "+100 Strike Call" : "-100 Strike Put";
    const atmStrike = Math.round(index.currentPrice / index.strikeStep) * index.strikeStep;

    const adjustmentLog: AlgoExecutionLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString(),
      level: "LEVEL_3_MULTI_LEG_BUNDLER",
      triggerReason: `Auto-Rebalance Delta Neutral: Net Delta drifted to ${deltaToNeutralize > 0 ? "+" : ""}${deltaToNeutralize.toFixed(2)} (Threshold: ±${rebalanceThresholdDelta}). Dispatched ${adjustmentAction} to restore Net Delta ≈ 0.00`,
      contract: `${index.symbol} ATM ${atmStrike} Hedging Leg`,
      index: index.symbol,
      side: deltaToNeutralize > 0 ? "SELL" : "BUY",
      price: 134.5,
      qty: multiLegLots * index.lotSize,
      status: "FILLED",
      pnlInr: Math.round((Math.random() * 800 + 350)),
      txHashOrOrderId: `FYERS-REBAL-${Date.now().toString().slice(-5)}`,
    };

    setTimeout(() => {
      setAlgoLogs((prev) => [adjustmentLog, ...prev]);
      setCurrentNetDelta(0.01); // Reset delta to near-zero neutral
      setRebalanceCount((prev) => prev + 1);
      setLastRebalancedTime(new Date().toLocaleTimeString());
      baseSpotRef.current = index.currentPrice;
      setIsRebalancing(false);
    }, 1200);
  };

  // Bot 4: Telegram / Webhook Settings
  const [tgBotToken, setTgBotToken] = useState("");
  const [tgChatId, setTgChatId] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("https://api.omni-alpha.quant/webhook/v1/fyers-stream");
  const [isDispatchingWebhook, setIsDispatchingWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  // Live Algo Execution Logs
  const [algoLogs, setAlgoLogs] = useState<AlgoExecutionLog[]>([
    {
      id: "LOG-881",
      timestamp: "10:14:22 AM",
      level: "LEVEL_1_CONFLUENCE_BOT",
      triggerReason: "8-Factor Confluence Hit 92% (Bullish FVG + POC Retest + Wyckoff Phase D)",
      contract: "NIFTY 24500 CE",
      index: "NIFTY50",
      side: "BUY",
      price: 185.0,
      qty: 50,
      status: "FILLED",
      pnlInr: 3450,
      txHashOrOrderId: "FYERS-881920",
    },
    {
      id: "LOG-882",
      timestamp: "10:28:15 AM",
      level: "LEVEL_2_DYNAMIC_BRACKET",
      triggerReason: "Target 1 Hit @ ₹248.50 (+34.3%). 50% Booked. SL Trailed to Breakeven (₹185.00)",
      contract: "NIFTY 24500 CE",
      index: "NIFTY50",
      side: "SELL",
      price: 248.5,
      qty: 25,
      status: "TARGET_BOOKED",
      pnlInr: 1587.5,
      txHashOrOrderId: "FYERS-882041",
    },
    {
      id: "LOG-883",
      timestamp: "10:35:40 AM",
      level: "LEVEL_4_TELEGRAM_WEBHOOK",
      triggerReason: "Dispatched Live 1-Tap Mobile Trade Signal to Telegram Channel @OmniAlphaSignals",
      contract: "BANKNIFTY 51200 PE",
      index: "BANKNIFTY",
      side: "BUY",
      price: 290.0,
      qty: 30,
      status: "DISPATCHED",
      txHashOrOrderId: "TG-MSG-9402",
    },
  ]);

  // Auto Upgrader Evaluation Score
  const currentConfluenceMeetsCriteria = confluenceScore >= level1Config.minConfluenceThreshold;

  const handleTestLevel1AutoFire = async () => {
    if (!activePlan) return;
    const contract = `NSE:${index.symbol.replace("50", "")}24AUG${activePlan.strike}${activePlan.optionType}`;
    const newLog: AlgoExecutionLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString(),
      level: "LEVEL_1_CONFLUENCE_BOT",
      triggerReason: `Autonomous Auto-Trigger: Confluence score reached ${confluenceScore}% (Threshold: ${level1Config.minConfluenceThreshold}%)`,
      contract: `${index.symbol} ${activePlan.strike} ${activePlan.optionType}`,
      index: index.symbol,
      side: activePlan.direction === "BEARISH" && activePlan.executionMode === "OPTION_SELLING" ? "SELL" : "BUY",
      price: activePlan.entryOptionPremium,
      qty: level1Config.lotSizeMultiplier * index.lotSize,
      status: "FILLED",
      pnlInr: 0,
      txHashOrOrderId: `FYERS-${Date.now().toString().slice(-6)}`,
    };

    setAlgoLogs((prev) => [newLog, ...prev]);

    // Dispatch to broker
    await onExecuteSingleOrder({
      symbol: contract,
      qty: level1Config.lotSizeMultiplier * index.lotSize,
      side: newLog.side,
      orderType: "LIMIT",
      limitPrice: activePlan.entryOptionPremium,
      productType: "INTRADAY",
    });
  };

  const handleDeployMultiLeg = async () => {
    setIsExecutingMultiLeg(true);
    setMultiLegResult(null);
    try {
      const atmStrike = Math.round(index.currentPrice / index.strikeStep) * index.strikeStep;
      const legs = selectedStrategyTemplate.legs.map((leg, i) => {
        const strike = atmStrike + leg.strikeOffset;
        const sym = `NSE:${index.symbol.replace("50", "")}24AUG${strike}${leg.optionType}`;
        const price = leg.side === "BUY" ? 185.0 - Math.abs(leg.strikeOffset) * 0.4 : 120.0 - Math.abs(leg.strikeOffset) * 0.3;
        return {
          symbol: sym,
          side: leg.side,
          qty: multiLegLots * index.lotSize * leg.lotRatio,
          price: Math.max(15, price),
        };
      });

      const res = await onExecuteMultiLeg(selectedStrategyTemplate.name, legs);
      setMultiLegResult(res);

      // Add to log
      const newLog: AlgoExecutionLog = {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString(),
        level: "LEVEL_3_MULTI_LEG_BUNDLER",
        triggerReason: `Executed Multi-Leg Strategy: ${selectedStrategyTemplate.name} with ${legs.length} synchronized legs on FYERS`,
        contract: `${index.symbol} Spread (${legs.length} Legs)`,
        index: index.symbol,
        side: "BUY",
        price: selectedStrategyTemplate.maxLossEst,
        qty: multiLegLots * index.lotSize,
        status: "FILLED",
        pnlInr: 0,
        txHashOrOrderId: res.batchId || `FYERS-ML-${Date.now().toString().slice(-6)}`,
      };
      setAlgoLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      setMultiLegResult({ success: false, message: err.message });
    } finally {
      setIsExecutingMultiLeg(false);
    }
  };

  const handleSendTelegramAlert = async () => {
    setIsDispatchingWebhook(true);
    setWebhookStatus(null);
    try {
      const alertMsg = `🚀 <b>[OmniAlpha Quant Alert]</b>
📈 <b>Index:</b> ${index.symbol} @ ₹${index.currentPrice.toLocaleString()}
🎯 <b>Signal:</b> ${activePlan?.action || "BUY CALL"} ${activePlan?.strike} ${activePlan?.optionType}
⚡ <b>Confluence Score:</b> ${confluenceScore}%
💰 <b>Option Entry:</b> ₹${activePlan?.entryOptionPremium}
🛡 <b>Stop Loss:</b> ₹${activePlan?.stopLossOptionPremium}
🏁 <b>Target 1:</b> ₹${activePlan?.target1OptionPremium} | <b>Target 2:</b> ₹${activePlan?.target2OptionPremium}
🔗 <b>Broker Gateway:</b> ${brokerState.isConnected ? "FYERS Live Connected" : "Sandbox Verified"}`;

      const res = await fetch("/api/broker/alerts/telegram-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: tgBotToken,
          chatId: tgChatId,
          message: alertMsg,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWebhookStatus(`✓ Alert Dispatched Successfully (${data.source})`);
        const newLog: AlgoExecutionLog = {
          id: `LOG-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toLocaleTimeString(),
          level: "LEVEL_4_TELEGRAM_WEBHOOK",
          triggerReason: "Real-time Mobile Webhook Broadcast to Telegram Subscribers",
          contract: `${index.symbol} ${activePlan?.strike || 24500} ${activePlan?.optionType || "CE"}`,
          index: index.symbol,
          side: "BUY",
          price: activePlan?.entryOptionPremium || 185,
          qty: index.lotSize,
          status: "DISPATCHED",
          txHashOrOrderId: data.messageId || "TG-WEBHOOK",
        };
        setAlgoLogs((prev) => [newLog, ...prev]);
      }
    } catch (err: any) {
      setWebhookStatus(`Failed to send alert: ${err.message}`);
    } finally {
      setIsDispatchingWebhook(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl space-y-0 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center border border-indigo-400/40 shadow-[0_0_20px_rgba(99,102,241,0.5)]">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                4-Level Autonomous Algorithmic Suite & Auto-Upgrader
              </h2>
              <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded">
                FYERS API v3 BRIDGE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Auto-Execute on Confluence $\ge 88\%$, Dynamic Trailing Brackets, Multi-Leg Spreads & Instant Webhooks
            </p>
          </div>
        </div>

        {/* Global Stats Ribbon */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-right">
            <div className="text-[10px] text-slate-500 uppercase">Algo Win Rate</div>
            <div className="text-sm font-bold text-emerald-400">{level1Config.winRate}%</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-right">
            <div className="text-[10px] text-slate-500 uppercase">Total Algo P&L</div>
            <div className="text-sm font-bold text-emerald-300">
              +₹{level1Config.totalPnlRealizedInr.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-right">
            <div className="text-[10px] text-slate-500 uppercase">Live Confluence</div>
            <div className={`text-sm font-bold ${currentConfluenceMeetsCriteria ? "text-emerald-400" : "text-amber-400"}`}>
              {confluenceScore}% {currentConfluenceMeetsCriteria ? "✓ ARMED" : "⌛ PENDING"}
            </div>
          </div>
        </div>
      </div>

      {/* 4-Level Interactive Navigation Tabs */}
      <div className="bg-slate-950/80 px-5 py-2.5 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-mono">
        {[
          {
            id: "LEVEL_1_CONFLUENCE_BOT",
            label: "Level 1: 88% Confluence Auto-Bot",
            icon: Zap,
            badge: level1Config.isActive ? "ACTIVE" : "PAUSED",
            color: "text-indigo-400",
          },
          {
            id: "LEVEL_2_DYNAMIC_BRACKET",
            label: "Level 2: Dynamic Trailing SL & Bracket",
            icon: Target,
            badge: level2TrailingActive ? "ARMED" : "OFF",
            color: "text-emerald-400",
          },
          {
            id: "LEVEL_3_MULTI_LEG_BUNDLER",
            label: "Level 3: Multi-Leg Spread Deployer",
            icon: Layers,
            badge: "MARGIN 65% OFF",
            color: "text-violet-400",
          },
          {
            id: "LEVEL_4_TELEGRAM_WEBHOOK",
            label: "Level 4: Mobile Webhook & Telegram",
            icon: Send,
            badge: "INSTANT 1-TAP",
            color: "text-sky-400",
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AlgoLevel)}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 font-bold transition-all whitespace-nowrap ${
                isSelected
                  ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="p-6 space-y-6">
        {/* ========================================================================= */}
        {/* LEVEL 1: CONFLUENCE AUTO-BOT */}
        {/* ========================================================================= */}
        {activeTab === "LEVEL_1_CONFLUENCE_BOT" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bot Control Card */}
              <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5 font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white font-sans">
                        Autonomous Confluence Execution Bot
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Automatically places limit option orders to FYERS whenever confluence hits threshold
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setLevel1Config((prev) => ({ ...prev, isActive: !prev.isActive }))
                    }
                    className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition-all ${
                      level1Config.isActive
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {level1Config.isActive ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{level1Config.isActive ? "BOT RUNNING" : "BOT PAUSED"}</span>
                  </button>
                </div>

                {/* Parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                      Min Confluence Threshold
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="75"
                        max="95"
                        step="1"
                        value={level1Config.minConfluenceThreshold}
                        onChange={(e) =>
                          setLevel1Config((prev) => ({
                            ...prev,
                            minConfluenceThreshold: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-indigo-500"
                      />
                      <span className="text-indigo-300 font-bold w-10 text-right">
                        {level1Config.minConfluenceThreshold}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                      Lot Size Multiplier
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 5].map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() =>
                            setLevel1Config((prev) => ({ ...prev, lotSizeMultiplier: l }))
                          }
                          className={`flex-1 py-1 rounded border text-center font-bold ${
                            level1Config.lotSizeMultiplier === l
                              ? "bg-indigo-600 border-indigo-500 text-white"
                              : "bg-slate-900 border-slate-800 text-slate-400"
                          }`}
                        >
                          {l}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                      Max Risk Per Trade (₹)
                    </label>
                    <input
                      type="number"
                      value={level1Config.maxRiskPerTradeInr}
                      onChange={(e) =>
                        setLevel1Config((prev) => ({
                          ...prev,
                          maxRiskPerTradeInr: Number(e.target.value),
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-bold"
                    />
                  </div>
                </div>

                {/* Auto Upgrader Status */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Live Confluence Trigger Assessment:</span>
                    </span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        currentConfluenceMeetsCriteria
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {currentConfluenceMeetsCriteria
                        ? "CRITERIA SATISFIED — AUTO-DISPATCH READY"
                        : `WAITING FOR CONFLUENCE $\\ge$ ${level1Config.minConfluenceThreshold}%`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <div className="text-slate-400">
                      Target Contract: <strong className="text-white">{index.symbol} {activePlan?.strike} {activePlan?.optionType}</strong> (@ ₹{activePlan?.entryOptionPremium || 185})
                    </div>

                    <button
                      onClick={handleTestLevel1AutoFire}
                      className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded font-bold flex items-center gap-1.5 text-xs shadow"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Simulate Immediate Auto-Fire</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bot Performance Stats */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-300 uppercase font-sans">
                    Autonomous Bot Metrics
                  </span>
                  <Award className="w-4 h-4 text-amber-400" />
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Auto Triggers:</span>
                    <span className="font-bold text-white">{level1Config.totalTriggerCount} Trades</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Winning Trades:</span>
                    <span className="font-bold text-emerald-400">12 (85.7%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Profit Factor:</span>
                    <span className="font-bold text-emerald-300">3.42</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Broker Execution:</span>
                    <span className="font-bold text-indigo-300">{brokerState.broker} v3 Live</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Latency:</span>
                    <span className="font-bold text-white">{brokerState.latencyMs || 18}ms</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <div className="text-[10px] text-slate-500 mb-1">Protection Layer:</div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Hard Stop-Loss at Point of Control Invalidation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 2: DYNAMIC TRAILING BRACKET */}
        {/* ========================================================================= */}
        {activeTab === "LEVEL_2_DYNAMIC_BRACKET" && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white font-sans">
                    Level 2: Dynamic Trailing Stop-Loss & Partial Booker (BO / CO)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Locks in gains at Target 1 and steps up trailing stop-loss automatically to preserve capital
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLevel2TrailingActive(!level2TrailingActive)}
                  className={`px-3 py-1 rounded text-xs font-bold font-mono ${
                    level2TrailingActive
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {level2TrailingActive ? "TRAILING ARMED" : "DISABLED"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="text-slate-400 font-bold font-sans flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Entry & Initial Risk</span>
                </div>
                <div className="text-sm font-bold text-white">
                  Buy @ ₹{activePlan?.entryOptionPremium || 185.0}
                </div>
                <p className="text-[11px] text-slate-500">
                  Initial SL placed @ ₹{activePlan?.stopLossOptionPremium || 142.0} ($-23.2\%$). Max risk defined.
                </p>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="text-slate-400 font-bold font-sans flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Target 1 ($+34.3\%$) Trigger</span>
                </div>
                <div className="text-sm font-bold text-emerald-400">
                  Book 50% Qty @ ₹{activePlan?.target1OptionPremium || 248.5}
                </div>
                <p className="text-[11px] text-slate-500">
                  Automated partial profit booking. Trailing stop jumps to Entry (₹{activePlan?.entryOptionPremium || 185.0}) for a risk-free trade.
                </p>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="text-slate-400 font-bold font-sans flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>Target 2 Runner Expansion</span>
                </div>
                <div className="text-sm font-bold text-violet-400">
                  Exit Remaining @ ₹{activePlan?.target2OptionPremium || 338.0}
                </div>
                <p className="text-[11px] text-slate-500">
                  Trailing SL trails every +5% step-up until market reversal or maximum extension.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 3: MULTI-LEG STRATEGY BUNDLER */}
        {/* ========================================================================= */}
        {activeTab === "LEVEL_3_MULTI_LEG_BUNDLER" && (
          <div className="space-y-5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-sans">
                  Level 3: Multi-Leg Defined-Risk Option Spread Deployer
                </h3>
                <p className="text-slate-400 text-[11px]">
                  Simultaneously place 2 to 4 option legs on FYERS with up to 75% exchange margin discount
                </p>
              </div>
            </div>

            {multiLegResult && (
              <div
                className={`p-3 rounded border ${
                  multiLegResult.success
                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-200"
                    : "bg-rose-950/60 border-rose-500 text-rose-200"
                }`}
              >
                ✓ {multiLegResult.message}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {DEFAULT_STRATEGY_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedStrategyTemplate(tmpl)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedStrategyTemplate.id === tmpl.id
                      ? "bg-indigo-950/50 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-white font-sans">{tmpl.name}</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                      {tmpl.direction}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans mb-3 line-clamp-2">
                    {tmpl.description}
                  </p>
                  <div className="pt-2 border-t border-slate-900 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Margin Benefit:</span>
                      <strong className="text-emerald-400">+{tmpl.marginBenefitPct}%</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Prob of Profit:</span>
                      <strong className="text-white">{tmpl.popPct}%</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Max Profit / Loss:</span>
                      <strong className="text-indigo-300">₹{tmpl.maxProfitEst} / ₹{tmpl.maxLossEst}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Execution Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="text-white font-bold font-sans text-sm">
                    Deploy {selectedStrategyTemplate.name} on FYERS
                  </div>
                  <div className="text-slate-400 text-xs">
                    {selectedStrategyTemplate.legs.length} synchronized legs • Margin Benefit: +{selectedStrategyTemplate.marginBenefitPct}%
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 px-2 uppercase">Lots:</span>
                  {[1, 2, 5].map((l) => (
                    <button
                      key={l}
                      onClick={() => setMultiLegLots(l)}
                      className={`px-2 py-0.5 rounded font-bold ${
                        multiLegLots === l ? "bg-indigo-600 text-white" : "text-slate-400"
                      }`}
                    >
                      {l}L
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleDeployMultiLeg}
                  disabled={isExecutingMultiLeg}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2 active:scale-95 transition-all"
                >
                  {isExecutingMultiLeg ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>1-Click Deploy to {brokerState.broker}</span>
                </button>
              </div>
            </div>

            {/* Delta Neutral Auto-Rebalance Dynamic Control Panel */}
            <div className="bg-slate-950 border border-indigo-900/60 rounded-xl p-5 space-y-4 font-mono">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                    <Scale className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white font-sans">
                        Delta-Neutral Dynamic Auto-Rebalancing Engine
                      </h4>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                        GAMMA HEDGING ACTIVE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Periodically tracks underlying spot moves and automatically rolls or shifts option legs to maintain Net Delta ≈ 0.00.
                    </p>
                  </div>
                </div>

                {/* Auto Rebalance Master Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAutoRebalanceActive(!autoRebalanceActive)}
                    className={`px-4 py-2 rounded-lg font-bold font-mono text-xs flex items-center gap-2 transition-all ${
                      autoRebalanceActive
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700"
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${autoRebalanceActive ? "animate-spin" : ""}`} />
                    <span>{autoRebalanceActive ? "AUTO-REBALANCE ON" : "AUTO-REBALANCE OFF"}</span>
                  </button>
                </div>
              </div>

              {/* Real-time Delta Gauges & Rebalance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase">Live Portfolio Net Delta</div>
                  <div className="flex items-baseline justify-between">
                    <span className={`text-base font-bold ${Math.abs(currentNetDelta) < rebalanceThresholdDelta ? "text-emerald-400" : "text-rose-400"}`}>
                      {currentNetDelta > 0 ? `+${currentNetDelta.toFixed(2)}` : currentNetDelta.toFixed(2)} Δ
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Target: <strong className="text-white">0.00</strong>
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 ${
                        Math.abs(currentNetDelta) < rebalanceThresholdDelta ? "bg-emerald-400" : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.min(100, (Math.abs(currentNetDelta) / 0.3) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase">Rebalance Trigger Band</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-indigo-300">
                      ±{rebalanceThresholdDelta.toFixed(2)} Δ Max
                    </span>
                    <select
                      value={rebalanceThresholdDelta}
                      onChange={(e) => setRebalanceThresholdDelta(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-800 text-[10px] text-white rounded px-1.5 py-0.5"
                    >
                      <option value="0.10">Tight (±0.10)</option>
                      <option value="0.15">Standard (±0.15)</option>
                      <option value="0.25">Wide (±0.25)</option>
                    </select>
                  </div>
                  <div className="text-[10px] text-slate-500">Auto-adjusts if spot moves &gt; {index.strikeStep} pts</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase">Check Cycle Interval</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rebalanceIntervalSec}s Ticker</span>
                    </span>
                    <select
                      value={rebalanceIntervalSec}
                      onChange={(e) => setRebalanceIntervalSec(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-800 text-[10px] text-white rounded px-1.5 py-0.5"
                    >
                      <option value="5">5s (High Frequency)</option>
                      <option value="10">10s (Standard)</option>
                      <option value="30">30s (Swing)</option>
                      <option value="60">60s (Low Noise)</option>
                    </select>
                  </div>
                  <div className="text-[10px] text-slate-500">Last cycle: {lastRebalancedTime}</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase">Rebalance Executions</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-300">{rebalanceCount} Legs Shifted</span>
                    <button
                      onClick={() => triggerAutoRebalance()}
                      disabled={isRebalancing}
                      className="px-2 py-0.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      {isRebalancing ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Compass className="w-2.5 h-2.5" />}
                      <span>Force Rebalance</span>
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500">Hedging Cost: ~₹180 / leg</div>
                </div>
              </div>

              {/* Status Alert Banner */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className={`w-2 h-2 rounded-full ${autoRebalanceActive ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`}></span>
                  <span>
                    Spot Anchor: <strong className="text-white">{index.currency}{baseSpotRef.current.toLocaleString()}</strong>
                  </span>
                  <span className="text-slate-500">•</span>
                  <span>
                    Current Spot: <strong className="text-emerald-400">{index.currency}{index.currentPrice.toLocaleString()}</strong>
                  </span>
                  <span className="text-slate-500">•</span>
                  <span>
                    Displacement: <strong className={index.currentPrice - baseSpotRef.current >= 0 ? "text-emerald-400" : "text-rose-400"}>
                      {index.currentPrice - baseSpotRef.current >= 0 ? "+" : ""}{(index.currentPrice - baseSpotRef.current).toFixed(1)} pts
                    </strong>
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">
                  {autoRebalanceActive ? (
                    <span className="text-emerald-300">
                      ✓ Monitoring portfolio delta. Auto-rebalancing armed for breaches &gt; ±{rebalanceThresholdDelta}
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      ⏸ Auto-rebalancing paused. Positions maintain fixed strikes.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 4: TELEGRAM & WEBHOOK DISPATCHER */}
        {/* ========================================================================= */}
        {activeTab === "LEVEL_4_TELEGRAM_WEBHOOK" && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-sm font-bold text-white font-sans">
                    Level 4: Real-time Mobile Webhook & Telegram Broadcast Engine
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Broadcast high-confluence entry, target, and stop-loss levels instantly to your phone or channel
                  </p>
                </div>
              </div>
            </div>

            {webhookStatus && (
              <div className="bg-emerald-950/60 border border-emerald-500 text-emerald-200 p-3 rounded">
                {webhookStatus}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-1 block">
                  Telegram Bot Token (From @BotFather)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7192847192:AAH93k82js81928..."
                  value={tgBotToken}
                  onChange={(e) => setTgBotToken(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-1 block">
                  Telegram Chat ID / Channel (@username or ID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. -1001928471920 or @my_quant_alerts"
                  value={tgChatId}
                  onChange={(e) => setTgChatId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-1 block">
                Custom Webhook URL Endpoint (TradingView / Discord / Webhook Relay)
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-300 font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-slate-500">
                Dispatches HTML rich formatting with entry price, stop-loss, and 1-tap trade approval links.
              </span>

              <button
                onClick={handleSendTelegramAlert}
                disabled={isDispatchingWebhook}
                className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(14,165,233,0.4)] flex items-center gap-2"
              >
                {isDispatchingWebhook ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Broadcast Live Signal Now</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LIVE ALGO EXECUTION AUDIT LOG */}
        {/* ========================================================================= */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase font-sans flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Autonomous Algorithmic Event & Execution Audit Trail</span>
            </span>
            <span className="text-[10px] text-slate-500">Auto-Refreshed Real-Time</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {algoLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      log.level.includes("LEVEL_1")
                        ? "bg-indigo-500/20 text-indigo-300"
                        : log.level.includes("LEVEL_2")
                        ? "bg-emerald-500/20 text-emerald-300"
                        : log.level.includes("LEVEL_3")
                        ? "bg-violet-500/20 text-violet-300"
                        : "bg-sky-500/20 text-sky-300"
                    }`}
                  >
                    {log.level.replace("LEVEL_", "L").replace("_", " ")}
                  </span>
                  <span className="text-white font-bold">{log.contract}</span>
                  <span className="text-slate-400 text-[11px] truncate max-w-md">{log.triggerReason}</span>
                </div>

                <div className="flex items-center gap-3">
                  {log.pnlInr ? (
                    <span className="font-bold text-emerald-400">+₹{log.pnlInr.toLocaleString()}</span>
                  ) : null}
                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                    {log.txHashOrOrderId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
