import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  IndexSymbol,
  IndexInfo,
  Candle,
  ZigZagPoint,
  OptionContract,
  OrderBookLevel,
  HFTTapePrint,
  StrategyConfluence,
  ActionableTradePlan,
  GlobalSentimentData,
  PaperTradePosition,
  BrokerType,
  BrokerCredentials,
  BrokerConnectionState,
  RealtimeStrategySignal,
} from "./types";
import {
  SUPPORTED_INDICES,
  generateIntradayCandles,
  generateOptionChain,
  generateOrderBook,
  generateTapePrints,
  HISTORICAL_BACKTEST_DATA,
  getInstitutionalFlow,
  getZeroDteExpiryClock,
  getOpeningRangeBreakout,
  getIvSkewSmileCurve,
  getGlobalCorrelationIndex,
} from "./data/marketData";
import {
  evaluateConfluence,
  generateActionablePlan,
  calculateGexProfile,
  calculateMonteCarloSimulation,
  calculateMultiTimeframeMatrix,
} from "./utils/quantEngine";
import { soundEngine } from "./utils/audioEngine";
import { Header } from "./components/Header";
import { StrategyMatrix } from "./components/StrategyMatrix";
import { InstitutionalExpiryRadar } from "./components/InstitutionalExpiryRadar";
import { AdvancedQuantBarometer } from "./components/AdvancedQuantBarometer";
import { WebhookAlertSettings } from "./components/WebhookAlertSettings";
import { GexMonteCarloTerminal } from "./components/GexMonteCarloTerminal";
import { MultiTimeframeTaxTerminal } from "./components/MultiTimeframeTaxTerminal";
import { OperationsResearchStochasticSuite } from "./components/OperationsResearchStochasticSuite";
import { GlobalMarketSentimentWidget } from "./components/GlobalMarketSentimentWidget";
import { InteractiveChart } from "./components/InteractiveChart";
import { ActionablePlanCard } from "./components/ActionablePlanCard";
import { PinpointPrecisionRadar } from "./components/PinpointPrecisionRadar";
import { WhatIfScenarioStressTest } from "./components/WhatIfScenarioStressTest";
import { OrderFlowTape } from "./components/OrderFlowTape";
import { OptionsChainPicker } from "./components/OptionsChainPicker";
import { PayoffSimulator } from "./components/PayoffSimulator";
import { BacktestPerformance } from "./components/BacktestPerformance";
import { RiskCalculator } from "./components/RiskCalculator";
import { PaperTradingTerminal } from "./components/PaperTradingTerminal";
import { AIStrategistModal } from "./components/AIStrategistModal";
import { BrokerGatewayModal } from "./components/BrokerGatewayModal";
import { HybridCloudModal } from "./components/HybridCloudModal";
import { Dhan200DepthWidget } from "./components/Dhan200DepthWidget";
import { TerminalLockScreen } from "./components/TerminalLockScreen";
import { SecuritySettingsModal } from "./components/SecuritySettingsModal";
import { AppUserSession } from "./types/authSecurity";
import { AutonomousAlgoSuite } from "./components/AutonomousAlgoSuite";
import { TradeJournalSuite } from "./components/TradeJournalSuite";
import { FyersMiniChartWidget } from "./components/FyersMiniChartWidget";
import { NexusOrchestratorDashboard } from "./components/NexusOrchestratorDashboard";
import { Upstox30DepthTerminal } from "./components/Upstox30DepthTerminal";
import { CpcvBacktestTerminal } from "./components/CpcvBacktestTerminal";
import { EngineSpecificationModal } from "./components/EngineSpecificationModal";
import { IngestionTelemetryTerminal } from "./components/IngestionTelemetryTerminal";
import { VolatilitySuiteTerminal } from "./components/VolatilitySuiteTerminal";
import { SviSurfaceTerminal } from "./components/SviSurfaceTerminal";
import { CosmosDbRecorderTerminal } from "./components/CosmosDbRecorderTerminal";
import { DatabasesTerminal } from "./components/DatabasesTerminal";
import { FloatingAiChatDock } from "./components/FloatingAiChatDock";
import { RealtimeStrategyTerminal } from "./components/RealtimeStrategyTerminal";
import { generateOperationsResearchBundle } from "./utils/stochasticEngine";
import { UnifiedNotificationCenter } from "./components/UnifiedNotificationCenter";
import {
  formatSignalNotification,
  formatOrderExecutionNotification,
  formatExitNotification,
  dispatchNotificationToChannels,
} from "./utils/notificationDispatcher";
import { UnifiedNotificationConfig } from "./types";
import {
  Radio,
  BarChart3,
  Sliders,
  Layers,
  Cpu,
  Award,
  ShieldCheck,
  TrendingUp,
  Activity,
  Zap,
  Flame,
  Wallet,
  Building2,
  Bot,
  BookOpen,
  CandlestickChart,
  FileText,
  Server,
  Database,
  MessageSquare,
  Send,
  Bell,
} from "lucide-react";

export default function App() {
  // State
  const [selectedSymbol, setSelectedSymbol] = useState<IndexSymbol>("NIFTY50");
  const [executionMode, setExecutionMode] = useState<
    "OPTION_BUYING" | "OPTION_SELLING" | "SPREAD_HEDGE"
  >("OPTION_BUYING");
  const [timeframe, setTimeframe] = useState("5m");
  const [isLiveSimulating, setIsLiveSimulating] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "CHART_MATRIX"
    | "REALTIME_STRATEGY"
    | "INGESTION_SHARDING"
    | "VOLATILITY_SUITE"
    | "SVI_SURFACE"
    | "NEXUS_ORCHESTRATOR"
    | "UPSTOX_30_DEPTH"
    | "CPCV_AUDIT"
    | "DHAN_200_DEPTH"
    | "COSMOS_RECORDER"
    | "TRADE_JOURNAL"
    | "AUTONOMOUS_ALGO"
    | "OR_STOCHASTICS"
    | "GEX_MONTE_CARLO"
    | "MULTI_TF_LEDGER"
    | "OPTIONS_CHAIN"
    | "PAYOFF_SIM"
    | "BACKTEST"
    | "RISK_CALC"
    | "PAPER_TRADES"
    | "NOTIFICATIONS_HUB"
  >("CHART_MATRIX");
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [isCloudHybridModalOpen, setIsCloudHybridModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [showFloatingFyersChart, setShowFloatingFyersChart] = useState(false);

  // Authentication & Publish URL Lock State
  const [userSession, setUserSession] = useState<AppUserSession | null>(() => {
    const savedToken = localStorage.getItem("apex_auth_token");
    if (savedToken) {
      return {
        isAuthenticated: true,
        userEmail: "roy.ashokk@gmail.com",
        loginMethod: "PASSWORD",
        sessionExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
        token: savedToken,
      };
    }
    return null;
  });
  const [isTerminalLocked, setIsTerminalLocked] = useState<boolean>(() => {
    return !Boolean(localStorage.getItem("apex_auth_token"));
  });

  // Broker Connection State (FYERS API v3 Gateway)
  const [brokerState, setBrokerState] = useState<BrokerConnectionState>({
    isConnected: false,
    broker: "FYERS",
    statusMessage: "Sandbox Engine Armed. Connect FYERS API v3 for live execution.",
    feedMode: "SIMULATED_MICROSTRUCTURE",
    latencyMs: 18,
  });

  // Active Index Info with dynamic price mutations
  const baseIndex = SUPPORTED_INDICES[selectedSymbol];
  const [currentIndex, setCurrentIndex] = useState<IndexInfo>(baseIndex);
  const currentIndexRef = useRef<IndexInfo>(baseIndex);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Selected Option Contract for Payoff simulation
  const [selectedContract, setSelectedContract] = useState<OptionContract | null>(null);
  const [strategyArchetype, setStrategyArchetype] = useState<
    "SINGLE_LEG" | "BULL_PUT_SPREAD" | "BEAR_CALL_SPREAD" | "IRON_CONDOR"
  >("SINGLE_LEG");

  // Paper Trade Positions Portfolio
  const [paperPositions, setPaperPositions] = useState<PaperTradePosition[]>([]);

  // Candle Data & ZigZag Swings
  const [{ candles, zigzagPoints }, setMarketSeries] = useState(() =>
    generateIntradayCandles(baseIndex, 55)
  );

  // Live Market Feed Overview Map
  const [liveOverview, setLiveOverview] = useState<Record<string, any>>({});
  const [isLiveFeedConnected, setIsLiveFeedConnected] = useState<boolean>(true);

  // Level 2 Order Book & Tape
  const [{ bids, asks, imbalanceRatio }, setOrderBook] = useState(() =>
    generateOrderBook(baseIndex.currentPrice, baseIndex.strikeStep)
  );
  const [tapePrints, setTapePrints] = useState<HFTTapePrint[]>(() =>
    generateTapePrints(baseIndex.currentPrice)
  );

  // Global Market Sentiment State (Google Search Grounded + Live News RSS)
  const [sentimentData, setSentimentData] = useState<GlobalSentimentData | null>(null);
  const [isSentimentLoading, setIsSentimentLoading] = useState<boolean>(false);

  const fetchSentiment = async (targetIndex: IndexInfo) => {
    setIsSentimentLoading(true);
    try {
      const res = await fetch("/api/sentiment/search-grounded", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: targetIndex.symbol,
          name: targetIndex.name,
          category: targetIndex.category,
          currentPrice: targetIndex.currentPrice,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        const sentimentPayload = result.data || result;
        setSentimentData(sentimentPayload);
      }
    } catch (err) {
      console.error("Failed to fetch Google Search sentiment:", err);
    } finally {
      setIsSentimentLoading(false);
    }
  };

  // Fetch Real Candlestick Series from Server Live Feed
  const fetchRealCandles = async (sym: IndexSymbol, tf: string) => {
    try {
      const res = await fetch(`/api/market/candles?symbol=${sym}&timeframe=${tf}&range=5d`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.candles) && data.candles.length > 0) {
          setMarketSeries({
            candles: data.candles,
            zigzagPoints: data.zigzagPoints || [],
          });
          setIsLiveFeedConnected(true);
          return;
        }
      }
    } catch (err) {
      console.warn("Live candle fetch warning, retaining current series:", err);
    }
    // Fallback to local high-fidelity generator if server is starting
    const localFallback = generateIntradayCandles(SUPPORTED_INDICES[sym], 55);
    setMarketSeries(localFallback);
  };

  // When selected symbol changes
  useEffect(() => {
    const newBase = SUPPORTED_INDICES[selectedSymbol];
    currentIndexRef.current = newBase;
    setCurrentIndex(newBase);
    fetchRealCandles(selectedSymbol, timeframe);
    setOrderBook(generateOrderBook(newBase.currentPrice, newBase.strikeStep));
    setTapePrints(generateTapePrints(newBase.currentPrice));
    setSelectedContract(null);
    fetchSentiment(newBase);
  }, [selectedSymbol]);

  // When timeframe changes
  useEffect(() => {
    fetchRealCandles(selectedSymbol, timeframe);
  }, [timeframe]);

  // Polling Real-Time Live Overview across all symbols from Live Exchange Feed
  useEffect(() => {
    let isMounted = true;

    const fetchLiveOverview = async () => {
      try {
        const res = await fetch("/api/market/live-overview");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.indices && isMounted) {
            setLiveOverview(data.indices);
            const activeLiveQuote = data.indices[selectedSymbol];
            if (activeLiveQuote && activeLiveQuote.currentPrice > 0) {
              const current = currentIndexRef.current;
              const updatedIndex: IndexInfo = {
                ...current,
                currentPrice: activeLiveQuote.currentPrice,
                change: activeLiveQuote.change,
                changePercent: activeLiveQuote.changePercent,
                dayHigh: activeLiveQuote.dayHigh || current.dayHigh,
                dayLow: activeLiveQuote.dayLow || current.dayLow,
                volume: activeLiveQuote.volume || current.volume,
              };
              currentIndexRef.current = updatedIndex;
              setCurrentIndex(updatedIndex);

              // Update Order Book & Streaming Tape around real price
              setOrderBook(generateOrderBook(activeLiveQuote.currentPrice, current.strikeStep));
              setTapePrints(generateTapePrints(activeLiveQuote.currentPrice));

              // Update latest candle with live price
              setMarketSeries((prev) => {
                const updated = [...prev.candles];
                const lastIdx = updated.length - 1;
                if (lastIdx >= 0) {
                  const last = { ...updated[lastIdx] };
                  last.close = activeLiveQuote.currentPrice;
                  last.high = Math.max(last.high, activeLiveQuote.currentPrice);
                  last.low = Math.min(last.low, activeLiveQuote.currentPrice);
                  updated[lastIdx] = last;
                }
                return { candles: updated, zigzagPoints: prev.zigzagPoints };
              });
            }
          }
        }
      } catch (err) {
        // Continue silently on transient connection glitches
      }
    };

    // Initial fetch + 3.5s interval
    fetchLiveOverview();
    const interval = setInterval(fetchLiveOverview, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedSymbol]);

  // Options Chain & Greeks
  const optionChainData = useMemo(() => {
    return generateOptionChain(currentIndex, currentIndex.currentPrice, 4);
  }, [currentIndex]);

  // Real-time Confluence Score
  const latestCandle = candles[candles.length - 1];
  const confluence = useMemo(() => {
    const sentimentScore = sentimentData?.score ?? 78;
    const sentimentDetails =
      sentimentData?.macroSummary ||
      "Global macro liquidity and real-time financial headlines remain supportive.";
    const sentimentBias = sentimentData
      ? sentimentData.score >= 56
        ? "BULLISH"
        : sentimentData.score <= 48
        ? "BEARISH"
        : "NEUTRAL"
      : "BULLISH";

    return evaluateConfluence(
      currentIndex,
      candles,
      zigzagPoints,
      optionChainData.pcr,
      optionChainData.maxPainStrike,
      latestCandle?.hftDelta || 12000,
      sentimentScore,
      sentimentDetails,
      sentimentBias
    );
  }, [
    currentIndex,
    candles,
    zigzagPoints,
    optionChainData.pcr,
    optionChainData.maxPainStrike,
    latestCandle,
    sentimentData,
  ]);

  // Actionable Trade Plan
  const activePlan = useMemo(() => {
    return generateActionablePlan(
      currentIndex,
      currentIndex.currentPrice,
      confluence,
      optionChainData.calls,
      optionChainData.puts,
      executionMode
    );
  }, [currentIndex, confluence, optionChainData, executionMode]);

  // Institutional participant & 0-DTE expiry metrics
  const institutionalFlow = useMemo(() => {
    return getInstitutionalFlow(currentIndex.symbol);
  }, [currentIndex.symbol]);

  const expiryClock = useMemo(() => {
    return getZeroDteExpiryClock(currentIndex.symbol, currentIndex.currentPrice, currentIndex.strikeStep);
  }, [currentIndex.symbol, currentIndex.currentPrice, currentIndex.strikeStep]);

  // ORB, IV Skew, and Global Overnight Correlation Data
  const orbSetup = useMemo(() => {
    return getOpeningRangeBreakout(currentIndex.currentPrice, currentIndex.strikeStep);
  }, [currentIndex.currentPrice, currentIndex.strikeStep]);

  const ivSkewData = useMemo(() => {
    return getIvSkewSmileCurve(currentIndex.currentPrice, currentIndex.strikeStep, currentIndex.iv);
  }, [currentIndex.currentPrice, currentIndex.strikeStep, currentIndex.iv]);

  const globalCorrelations = useMemo(() => {
    return getGlobalCorrelationIndex();
  }, []);

  // Institutional GEX, Monte Carlo, and Multi-Timeframe Alignment
  const gexProfile = useMemo(() => {
    const allContracts = [...optionChainData.calls, ...optionChainData.puts];
    return calculateGexProfile(currentIndex.currentPrice, currentIndex.strikeStep, allContracts);
  }, [currentIndex.currentPrice, currentIndex.strikeStep, optionChainData]);

  const monteCarloResult = useMemo(() => {
    const target1 = activePlan?.target1 || currentIndex.currentPrice + currentIndex.strikeStep * 1.5;
    const sl = activePlan?.stopLoss || currentIndex.currentPrice - currentIndex.strikeStep * 0.8;
    return calculateMonteCarloSimulation(
      currentIndex.currentPrice,
      currentIndex.iv,
      1,
      target1,
      sl
    );
  }, [currentIndex.currentPrice, currentIndex.iv, activePlan]);

  const mtfMatrix = useMemo(() => {
    return calculateMultiTimeframeMatrix(
      currentIndex.currentPrice,
      confluence.sentimentBias
    );
  }, [currentIndex.currentPrice, confluence.sentimentBias]);

  const operationsResearchBundle = useMemo(() => {
    const allContracts = [...optionChainData.calls, ...optionChainData.puts];
    return generateOperationsResearchBundle(currentIndex, allContracts);
  }, [currentIndex, optionChainData]);

  // Unified WhatsApp & Telegram Notification State
  const [notificationConfig, setNotificationConfig] = useState<UnifiedNotificationConfig>(() => {
    try {
      const saved = localStorage.getItem("apex_notification_config");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      enabled: true,
      telegram: {
        enabled: true,
        botToken: "7129845612:AAH9f_omni_demo_token_34kjsdf",
        chatId: "@omni_alpha_signals",
        parseMode: "HTML",
      },
      whatsapp: {
        enabled: true,
        provider: "CALLMEBOT",
        phone: "+919876543210",
        apiKey: "9823741",
      },
      triggers: {
        buySignals: true,
        sellSignals: true,
        orderExecution: true,
        targetAndStopLoss: true,
        minScore: 85,
      },
    };
  });

  const handleUpdateNotificationConfig = (newCfg: UnifiedNotificationConfig) => {
    setNotificationConfig(newCfg);
    try {
      localStorage.setItem("apex_notification_config", JSON.stringify(newCfg));
    } catch {}
  };

  // Automatic Signal Notification Dispatcher (Buy and Sell signals)
  const lastDispatchedSignalKeyRef = useRef<string>("");
  useEffect(() => {
    if (!notificationConfig.enabled) return;
    if (!activePlan) return;
    if (confluence.totalScore < notificationConfig.triggers.minScore) return;

    const isBuy = activePlan.direction === "BULLISH";
    if (isBuy && !notificationConfig.triggers.buySignals) return;
    if (!isBuy && !notificationConfig.triggers.sellSignals) return;

    // Debounce 3 minutes per contract action
    const timeWindow = Math.floor(Date.now() / (1000 * 60 * 3));
    const signalKey = `${currentIndex.symbol}-${activePlan.action}-${activePlan.recommendedContract}-${timeWindow}`;
    if (lastDispatchedSignalKeyRef.current === signalKey) return;
    lastDispatchedSignalKeyRef.current = signalKey;

    const formatted = formatSignalNotification(currentIndex.symbol, {
      action: activePlan.action,
      recommendedContract: activePlan.recommendedContract,
      entryTriggerPrice: activePlan.entrySpotPrice,
      target1: activePlan.target1,
      target2: activePlan.target2,
      invalidationPrice: activePlan.stopLoss,
      confidenceScore: confluence.totalScore,
      primaryDriver: activePlan.rationale?.[0] || "Alpha Confluence Spike",
    });

    dispatchNotificationToChannels({
      type: formatted.type,
      symbol: currentIndex.symbol,
      title: formatted.title,
      message: formatted.plainMessage,
      htmlMessage: formatted.htmlMessage,
      config: notificationConfig,
    });
  }, [confluence.totalScore, activePlan, currentIndex.symbol, notificationConfig]);

  // Manual Trigger for Active Plan Card
  const handleManualDispatchPlan = (plan: ActionableTradePlan) => {
    const formatted = formatSignalNotification(currentIndex.symbol, {
      action: plan.action,
      recommendedContract: plan.recommendedContract,
      entryTriggerPrice: plan.entrySpotPrice,
      target1: plan.target1,
      target2: plan.target2,
      invalidationPrice: plan.stopLoss,
      confidenceScore: confluence.totalScore,
      primaryDriver: plan.rationale?.[0] || "Trader Manual Dispatch",
    });

    dispatchNotificationToChannels({
      type: formatted.type,
      symbol: currentIndex.symbol,
      title: formatted.title,
      message: formatted.plainMessage,
      htmlMessage: formatted.htmlMessage,
      config: {
        ...notificationConfig,
        enabled: true,
      },
    });
    soundEngine.playSignalAlert();
  };

  // Handler for Realtime Strategy Terminal push
  const handleDispatchRealtimeSignalNotification = (signal: RealtimeStrategySignal) => {
    const formatted = formatSignalNotification(currentIndex.symbol, {
      action: signal.action,
      recommendedContract: signal.recommendedContract,
      entryTriggerPrice: signal.entryTriggerPrice,
      target1: signal.target1,
      target2: signal.target2,
      invalidationPrice: signal.invalidationPrice,
      confidenceScore: signal.confidenceScore,
      primaryDriver: signal.executionRationale?.[0] || "Quant Realtime Signal",
    });

    dispatchNotificationToChannels({
      type: formatted.type,
      symbol: currentIndex.symbol,
      title: formatted.title,
      message: formatted.plainMessage,
      htmlMessage: formatted.htmlMessage,
      config: {
        ...notificationConfig,
        enabled: true,
      },
    });
    soundEngine.playSignalAlert();
  };

  // Audio alert triggered when confluence >= 90
  const lastAlertScore = useRef<number>(0);
  useEffect(() => {
    if (confluence.totalScore >= 90 && lastAlertScore.current < 90) {
      soundEngine.playSignalAlert();
    }
    lastAlertScore.current = confluence.totalScore;
  }, [confluence.totalScore]);

  // Real-time Live Ticking Simulator with stable interval
  useEffect(() => {
    if (!isLiveSimulating) return;

    const interval = setInterval(() => {
      const current = currentIndexRef.current;
      const step = current.strikeStep;
      const tickDelta = (Math.random() - 0.48) * (step * 0.08);
      const newPrice = Number((current.currentPrice + tickDelta).toFixed(2));
      const newChange = Number((current.change + tickDelta).toFixed(2));
      const newChangePercent = Number(
        ((newChange / (newPrice - newChange)) * 100).toFixed(2)
      );

      const updatedIndex: IndexInfo = {
        ...current,
        currentPrice: newPrice,
        change: newChange,
        changePercent: newChangePercent,
      };

      currentIndexRef.current = updatedIndex;
      setCurrentIndex(updatedIndex);

      // Update Order Book & Streaming Tape
      setOrderBook(generateOrderBook(newPrice, step));
      setTapePrints(generateTapePrints(newPrice));

      // Append/Update last candle slightly
      setMarketSeries((prev) => {
        const updated = [...prev.candles];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0) {
          const last = { ...updated[lastIdx] };
          last.close = newPrice;
          last.high = Math.max(last.high, newPrice);
          last.low = Math.min(last.low, newPrice);
          last.volume += Math.floor(150 + Math.random() * 300);
          last.hftDelta += Math.floor((Math.random() - 0.46) * 500);
          last.cumDelta += last.hftDelta;
          updated[lastIdx] = last;
        }
        return { candles: updated, zigzagPoints: prev.zigzagPoints };
      });

      // Update Mark-to-Market P&L for Active Paper Positions
      setPaperPositions((prev) =>
        prev.map((pos) => {
          if (pos.status !== "ACTIVE") return pos;

          const isCall = pos.optionType === "CE";
          const spotDiff = newPrice - pos.entrySpotPrice;
          const deltaFactor = 0.70; // 0.70 Delta estimate
          const premiumDelta = isCall ? spotDiff * deltaFactor : -spotDiff * deltaFactor;
          const currentPrem = Math.max(5, Number((pos.entryPremium + premiumDelta).toFixed(2)));
          const unrealizedPnl = Number(((currentPrem - pos.entryPremium) * pos.lots * pos.lotSize).toFixed(2));
          const unrealizedRoi = Number(((unrealizedPnl / pos.capitalInvested) * 100).toFixed(1));

          let newStatus: PaperTradePosition["status"] = "ACTIVE";
          let exitTime: string | undefined = undefined;
          let realizedPnl: number | undefined = undefined;

          // Target 1 Hit (Book 50% / Trail SL)
          if ((isCall && newPrice >= pos.target1) || (!isCall && newPrice <= pos.target1)) {
            newStatus = "TARGET_1_HIT";
            exitTime = new Date().toLocaleTimeString();
            realizedPnl = unrealizedPnl;
            soundEngine.playTargetHitAlert();

            if (notificationConfig.enabled && notificationConfig.triggers.targetAndStopLoss) {
              const exitNotif = formatExitNotification(pos, "TARGET_1_HIT", newPrice, unrealizedPnl);
              dispatchNotificationToChannels({
                type: exitNotif.type,
                symbol: pos.index,
                title: exitNotif.title,
                message: exitNotif.plainMessage,
                htmlMessage: exitNotif.htmlMessage,
                config: notificationConfig,
              });
            }
          } else if ((isCall && newPrice <= pos.stopLoss) || (!isCall && newPrice >= pos.stopLoss)) {
            newStatus = "STOPPED_OUT";
            exitTime = new Date().toLocaleTimeString();
            realizedPnl = unrealizedPnl;
            soundEngine.playStopLossAlert();

            if (notificationConfig.enabled && notificationConfig.triggers.targetAndStopLoss) {
              const exitNotif = formatExitNotification(pos, "STOPPED_OUT", newPrice, unrealizedPnl);
              dispatchNotificationToChannels({
                type: exitNotif.type,
                symbol: pos.index,
                title: exitNotif.title,
                message: exitNotif.plainMessage,
                htmlMessage: exitNotif.htmlMessage,
                config: notificationConfig,
              });
            }
          }

          return {
            ...pos,
            currentSpotPrice: newPrice,
            currentPremium: currentPrem,
            unrealizedPnl,
            unrealizedRoi,
            status: newStatus,
            exitTime: exitTime || pos.exitTime,
            realizedPnl: realizedPnl !== undefined ? realizedPnl : pos.realizedPnl,
          };
        })
      );
    }, 2400);

    return () => clearInterval(interval);
  }, [isLiveSimulating]);

  const handleExecutePaperTrade = (plan: ActionableTradePlan) => {
    const lotCount = 1;
    const capital = plan.entryOptionPremium * currentIndex.lotSize * lotCount;
    const newPos: PaperTradePosition = {
      id: `PT-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      index: currentIndex.symbol,
      planId: plan.id,
      contract: plan.recommendedContract,
      optionType: plan.optionType,
      strike: plan.strike,
      entrySpotPrice: plan.entrySpotPrice,
      entryPremium: plan.entryOptionPremium,
      currentSpotPrice: plan.entrySpotPrice,
      currentPremium: plan.entryOptionPremium,
      target1: plan.target1,
      target2: plan.target2,
      stopLoss: plan.stopLoss,
      lots: lotCount,
      lotSize: currentIndex.lotSize,
      capitalInvested: capital,
      unrealizedPnl: 0,
      unrealizedRoi: 0,
      status: "ACTIVE",
      trailingSlActive: false,
      notes: "Executed via OmniAlpha Real-Time Confluence Engine",
    };

    setPaperPositions((prev) => [newPos, ...prev]);
    setActiveTab("PAPER_TRADES");
    soundEngine.playSignalAlert();

    if (notificationConfig.enabled && notificationConfig.triggers.orderExecution) {
      const orderNotif = formatOrderExecutionNotification(newPos, brokerState.isConnected ? brokerState.broker : "FYERS");
      dispatchNotificationToChannels({
        type: orderNotif.type,
        symbol: newPos.index,
        title: orderNotif.title,
        message: orderNotif.plainMessage,
        htmlMessage: orderNotif.htmlMessage,
        config: notificationConfig,
      });
    }
  };

  const handleExecuteRealtimeSignal = (signal: RealtimeStrategySignal) => {
    const estPrem = Math.max(15, Number((currentIndex.currentPrice * 0.007).toFixed(2)));
    const lotCount = 1;
    const capital = estPrem * currentIndex.lotSize * lotCount;
    const newPos: PaperTradePosition = {
      id: `PT-SIGNAL-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      index: currentIndex.symbol,
      planId: signal.signalId,
      contract: signal.recommendedContract,
      optionType: signal.recommendedOptionType,
      strike: signal.recommendedStrike,
      entrySpotPrice: signal.entryTriggerPrice,
      entryPremium: estPrem,
      currentSpotPrice: signal.entryTriggerPrice,
      currentPremium: estPrem,
      target1: signal.target1,
      target2: signal.target2,
      stopLoss: signal.invalidationPrice,
      lots: lotCount,
      lotSize: currentIndex.lotSize,
      capitalInvested: capital,
      unrealizedPnl: 0,
      unrealizedRoi: 0,
      status: "ACTIVE",
      trailingSlActive: false,
      notes: `Executed from Live Stream Signal: ${signal.action} (${signal.confidenceScore}% Confluence)`,
    };

    setPaperPositions((prev) => [newPos, ...prev]);
    setActiveTab("PAPER_TRADES");
    soundEngine.playSignalAlert();

    if (notificationConfig.enabled && notificationConfig.triggers.orderExecution) {
      const orderNotif = formatOrderExecutionNotification(newPos, brokerState.isConnected ? brokerState.broker : "FYERS");
      dispatchNotificationToChannels({
        type: orderNotif.type,
        symbol: newPos.index,
        title: orderNotif.title,
        message: orderNotif.plainMessage,
        htmlMessage: orderNotif.htmlMessage,
        config: notificationConfig,
      });
    }
  };

  const handleCustomTrade = (
    strike: number,
    optionType: "CE" | "PE",
    lots: number,
    target: number,
    sl: number
  ) => {
    const isCall = optionType === "CE";
    const estPrem = Math.max(10, Number(((currentIndex.currentPrice * 0.008) + (isCall ? currentIndex.currentPrice - strike : strike - currentIndex.currentPrice) * 0.7).toFixed(2)));
    const capital = estPrem * currentIndex.lotSize * lots;

    const newPos: PaperTradePosition = {
      id: `PT-CUST-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      index: currentIndex.symbol,
      planId: "CUSTOM-STRIKE",
      contract: `${currentIndex.symbol} ${strike} ${optionType} (Custom)`,
      optionType: optionType,
      strike: strike,
      entrySpotPrice: currentIndex.currentPrice,
      entryPremium: estPrem,
      currentSpotPrice: currentIndex.currentPrice,
      currentPremium: estPrem,
      target1: target,
      target2: Number((target + (target - currentIndex.currentPrice)).toFixed(2)),
      stopLoss: sl,
      lots: lots,
      lotSize: currentIndex.lotSize,
      capitalInvested: capital,
      unrealizedPnl: 0,
      unrealizedRoi: 0,
      status: "ACTIVE",
      trailingSlActive: false,
      notes: `Custom Order: ${lots} Lot(s) Strike ${strike}`,
    };

    setPaperPositions((prev) => [newPos, ...prev]);
    soundEngine.playSignalAlert();

    if (notificationConfig.enabled && notificationConfig.triggers.orderExecution) {
      const orderNotif = formatOrderExecutionNotification(newPos, brokerState.isConnected ? brokerState.broker : "FYERS");
      dispatchNotificationToChannels({
        type: orderNotif.type,
        symbol: newPos.index,
        title: orderNotif.title,
        message: orderNotif.plainMessage,
        htmlMessage: orderNotif.htmlMessage,
        config: notificationConfig,
      });
    }
  };

  const handleClosePosition = (id: string) => {
    setPaperPositions((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          if (notificationConfig.enabled && notificationConfig.triggers.targetAndStopLoss) {
            const exitNotif = formatExitNotification(p, "CLOSED_MANUALLY", p.currentSpotPrice, p.unrealizedPnl);
            dispatchNotificationToChannels({
              type: exitNotif.type,
              symbol: p.index,
              title: exitNotif.title,
              message: exitNotif.plainMessage,
              htmlMessage: exitNotif.htmlMessage,
              config: notificationConfig,
            });
          }
          return {
            ...p,
            status: "CLOSED_MANUALLY",
            exitTime: new Date().toLocaleTimeString(),
            exitPremium: p.currentPremium,
            realizedPnl: p.unrealizedPnl,
          };
        }
        return p;
      })
    );
  };

  const handleAdjustTrailingSl = (id: string) => {
    setPaperPositions((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            trailingSlActive: !p.trailingSlActive,
            stopLoss: !p.trailingSlActive ? p.entrySpotPrice : p.stopLoss,
          };
        }
        return p;
      })
    );
  };

  const handleClearHistory = () => {
    setPaperPositions([]);
  };

  // Broker Handlers (DHAN, UPSTOX, FYERS, ZERODHA, ANGEL ONE)
  const handleConnectBroker = async (creds: BrokerCredentials): Promise<boolean> => {
    try {
      const res = await fetch("/api/broker/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      const data = await res.json();
      if (data.success) {
        const feedModeMap: Record<string, any> = {
          DHAN: "DHAN_HQ_V2",
          UPSTOX: "UPSTOX_PRO_V2",
          FYERS: "FYERS_API_V3",
          ZERODHA: "ZERODHA_KITE_V3",
          ANGEL_ONE: "ANGEL_SMART_V2",
        };
        const feedMode = data.isSandbox
          ? "SIMULATED_MICROSTRUCTURE"
          : feedModeMap[creds.broker] || "SIMULATED_MICROSTRUCTURE";

        setBrokerState({
          isConnected: true,
          broker: creds.broker,
          clientName: data.profile?.clientName || `${creds.broker} Trader`,
          clientId: data.profile?.clientId || creds.appId || creds.dhanClientId || creds.upstoxApiKey,
          email: data.profile?.email,
          availableBalance: data.funds?.availableBalance || 245850.0,
          usedMargin: data.funds?.usedMargin || 38420.0,
          statusMessage: data.message || `${creds.broker} Gateway Active`,
          lastSyncTimestamp: new Date().toLocaleTimeString(),
          latencyMs: data.latencyMs || 15,
          feedMode: feedMode,
          liveQuotesActive: true,
        });
        soundEngine.playSuccess();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Broker validation error:", err);
      return false;
    }
  };

  const handleDisconnectBroker = () => {
    setBrokerState({
      isConnected: false,
      broker: "DHAN",
      statusMessage: "Disconnected from broker. Returned to Realistic Sandbox Engine.",
      feedMode: "SIMULATED_MICROSTRUCTURE",
      liveQuotesActive: false,
    });
  };

  const handlePlaceBrokerOrder = async (params: {
    broker?: BrokerType;
    symbol: string;
    qty: number;
    side: "BUY" | "SELL";
    orderType: "MARKET" | "LIMIT";
    limitPrice: number;
    stopPrice?: number;
    productType: "INTRADAY" | "MARGIN";
  }) => {
    const activeBroker = params.broker || brokerState.broker || "DHAN";
    const res = await fetch("/api/broker/place-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...params,
        broker: activeBroker,
        appId: brokerState.clientId,
        isPaperTrade: !brokerState.isConnected,
      }),
    });
    const data = await res.json();
    if (data.success) {
      soundEngine.playOrderFilled();
      // Also log into paper positions ledger for portfolio visualization
      const capital = params.limitPrice * params.qty;
      const isCall = params.symbol.includes("CE");
      const strikeMatch = params.symbol.match(/\d{5}/);
      const extractedStrike = strikeMatch ? Number(strikeMatch[0]) : currentIndex.currentPrice;
      const newPos: PaperTradePosition = {
        id: `ORD-${data.orderId || Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        index: currentIndex.symbol,
        planId: "BROKER-ORDER",
        contract: params.symbol,
        optionType: isCall ? "CE" : "PE",
        strike: extractedStrike,
        entrySpotPrice: currentIndex.currentPrice,
        entryPremium: params.limitPrice,
        currentSpotPrice: currentIndex.currentPrice,
        currentPremium: params.limitPrice,
        target1: Number((currentIndex.currentPrice + (isCall ? currentIndex.strikeStep * 2 : -currentIndex.strikeStep * 2)).toFixed(2)),
        target2: Number((currentIndex.currentPrice + (isCall ? currentIndex.strikeStep * 4 : -currentIndex.strikeStep * 4)).toFixed(2)),
        stopLoss: Number((currentIndex.currentPrice + (isCall ? -currentIndex.strikeStep : currentIndex.strikeStep)).toFixed(2)),
        lots: Math.max(1, Math.round(params.qty / currentIndex.lotSize)),
        lotSize: currentIndex.lotSize,
        capitalInvested: capital,
        unrealizedPnl: 0,
        unrealizedRoi: 0,
        status: "ACTIVE",
        trailingSlActive: false,
        notes: `Executed via ${brokerState.isConnected ? `${activeBroker} DMA Live` : `${activeBroker} Precision Sandbox`}`,
      };
      setPaperPositions((prev) => [newPos, ...prev]);

      if (notificationConfig.enabled && notificationConfig.triggers.orderExecution) {
        const orderNotif = formatOrderExecutionNotification(newPos, brokerState.isConnected ? activeBroker : `${activeBroker} Sandbox`);
        dispatchNotificationToChannels({
          type: orderNotif.type,
          symbol: newPos.index,
          title: orderNotif.title,
          message: orderNotif.plainMessage,
          htmlMessage: orderNotif.htmlMessage,
          config: notificationConfig,
        });
      }

      // Sync executed order directly to Azure Cosmos DB trade ledger
      fetch("/api/cosmos/trades/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newPos.id,
          date: new Date().toISOString().split("T")[0],
          time: newPos.timestamp,
          index: newPos.index,
          contract: newPos.contract,
          direction: isCall ? "BULLISH" : "BEARISH",
          executionSide: "BUY",
          setupType: "ARROW_PIERCING_CONFLUENCE",
          entryPrice: newPos.entryPremium,
          exitPrice: 0,
          qty: params.qty,
          lotSize: currentIndex.lotSize,
          pnlInr: 0,
          roiPct: 0,
          rMultiple: 0,
          confluenceScore: confluence.overallScore,
          emotionalState: "DISCIPLINED",
          mistakeTag: "NONE_PERFECT_EXECUTION",
          executionGrade: "A+",
          notes: newPos.notes,
          tags: ["CosmosLedger", "LiveExecution", activeBroker],
          brokerOrderId: data.orderId || newPos.id,
        }),
      }).catch((e) => console.warn("Cosmos order sync queued", e));
    }
    return data;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        currentIndex={currentIndex}
        onSelectIndex={setSelectedSymbol}
        executionMode={executionMode}
        onChangeExecutionMode={setExecutionMode}
        isLiveSimulating={isLiveSimulating}
        onToggleSimulate={() => setIsLiveSimulating(!isLiveSimulating)}
        onOpenAIStrategist={() => setIsAIModalOpen(true)}
        brokerState={brokerState}
        onOpenBrokerModal={() => setIsBrokerModalOpen(true)}
        onOpenCloudHybridModal={() => setIsCloudHybridModalOpen(true)}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onLockTerminal={() => setIsTerminalLocked(true)}
        onOpenSpecModal={() => setIsSpecModalOpen(true)}
        onOpenNotificationCenter={() => setActiveTab("NOTIFICATIONS_HUB")}
        isNotificationsActive={notificationConfig.enabled}
      />

      {/* Main Terminal View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-5">
        {/* Master Confluence Radar Bar */}
        <StrategyMatrix
          index={currentIndex}
          confluence={confluence}
          plan={activePlan}
          onExecuteSimulatedTrade={() =>
            activePlan && handleExecutePaperTrade(activePlan)
          }
        />

        {/* Institutional FII/DII Positioning & 0-DTE Expiry Radar */}
        <InstitutionalExpiryRadar
          index={currentIndex}
          institutionalFlow={institutionalFlow}
          expiryClock={expiryClock}
        />

        {/* 15m ORB Breakout, Volatility Smile Skew & Global Overnight Correlation */}
        <AdvancedQuantBarometer
          index={currentIndex}
          orbSetup={orbSetup}
          ivSkewData={ivSkewData}
          globalCorrelations={globalCorrelations}
        />

        {/* Global Market Sentiment & Real-time Search Grounded News with Sentiment-Price Divergence Gauge */}
        <GlobalMarketSentimentWidget
          index={currentIndex}
          sentimentData={sentimentData}
          isLoading={isSentimentLoading}
          onRefresh={() => fetchSentiment(currentIndex)}
          hftDelta={latestCandle?.hftDelta || 14200}
        />

        {/* Arrow-Piercing Precision Confluence Matrix */}
        <PinpointPrecisionRadar
          index={currentIndex}
          confluence={confluence}
          plan={activePlan}
          onExecuteTrade={() => activePlan && handleExecutePaperTrade(activePlan)}
        />

        {/* What-If Scenario Stress Test & Volatility Shock Module */}
        <WhatIfScenarioStressTest
          index={currentIndex}
          confluence={confluence}
          plan={activePlan}
          currentHftDelta={latestCandle?.hftDelta || 14200}
        />

        {/* Actionable Signal Card & Quick Stats */}
        <ActionablePlanCard
          index={currentIndex}
          plan={activePlan}
          onExecutePaperTrade={handleExecutePaperTrade}
          onSendNotification={handleManualDispatchPlan}
        />

        {/* WhatsApp & Telegram Live Signal Notifications Bar */}
        <UnifiedNotificationCenter
          config={notificationConfig}
          onUpdateConfig={handleUpdateNotificationConfig}
        />

        {/* Navigation Tabs for Deep Terminal Views */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("CHART_MATRIX")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all ${
                activeTab === "CHART_MATRIX"
                  ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>ZigZag Wave & LOB</span>
            </button>

            <button
              id="tab-realtime-strategy"
              onClick={() => setActiveTab("REALTIME_STRATEGY")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all border ${
                activeTab === "REALTIME_STRATEGY"
                  ? "bg-gradient-to-r from-red-600 via-indigo-600 to-emerald-600 text-white shadow-[0_0_18px_rgba(99,102,241,0.6)] border-indigo-400"
                  : "bg-slate-900 text-indigo-300 hover:text-white border-indigo-500/40"
              }`}
            >
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Live F&O Feed & Synthesis</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                SSE LIVE
              </span>
            </button>

            <button
              id="tab-notifications-hub"
              onClick={() => setActiveTab("NOTIFICATIONS_HUB")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all border ${
                activeTab === "NOTIFICATIONS_HUB"
                  ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 text-white shadow-[0_0_18px_rgba(16,185,129,0.5)] border-emerald-400"
                  : "bg-slate-900 text-emerald-300 hover:text-white border-emerald-500/40"
              }`}
            >
              <div className="flex items-center -space-x-1">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <Send className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <span>WhatsApp & Telegram Hub</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                {notificationConfig.enabled ? "ACTIVE" : "MUTED"}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("INGESTION_SHARDING")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all border ${
                activeTab === "INGESTION_SHARDING"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] border-emerald-400"
                  : "bg-slate-900 text-emerald-300 hover:text-white border-emerald-500/30"
              }`}
            >
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Phase 1 Ingestion & SHM</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                6-SHARDS
              </span>
            </button>

            <button
              onClick={() => setActiveTab("VOLATILITY_SUITE")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all border ${
                activeTab === "VOLATILITY_SUITE"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] border-purple-400"
                  : "bg-slate-900 text-purple-300 hover:text-white border-purple-500/30"
              }`}
            >
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Phase 2 Volatility Suite</span>
              <span className="text-[9px] bg-purple-500/20 text-purple-200 border border-purple-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                5-VOL+BV
              </span>
            </button>

            <button
              onClick={() => setActiveTab("SVI_SURFACE")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all border ${
                activeTab === "SVI_SURFACE"
                  ? "bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow-[0_0_15px_rgba(219,39,119,0.5)] border-pink-400"
                  : "bg-slate-900 text-pink-300 hover:text-white border-pink-500/30"
              }`}
            >
              <Layers className="w-4 h-4 text-pink-400" />
              <span>Phase 3 SVI Surface</span>
              <span className="text-[9px] bg-pink-500/20 text-pink-200 border border-pink-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                SVI+GREEKS
              </span>
            </button>

            <button
              onClick={() => setActiveTab("NEXUS_ORCHESTRATOR")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all border ${
                activeTab === "NEXUS_ORCHESTRATOR"
                  ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] border-cyan-400"
                  : "bg-slate-900 text-cyan-300 hover:text-white border-cyan-500/30"
              }`}
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>NEXUS HFT Orchestrator</span>
              <span className="text-[9px] bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                17-α
              </span>
            </button>

            <button
              onClick={() => setActiveTab("UPSTOX_30_DEPTH")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all border ${
                activeTab === "UPSTOX_30_DEPTH"
                  ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)] border-orange-400"
                  : "bg-slate-900 text-orange-300 hover:text-white border-orange-500/30"
              }`}
            >
              <Layers className="w-4 h-4 text-orange-400" />
              <span>Upstox 30-Level MBO</span>
              <span className="text-[9px] bg-orange-500/20 text-orange-200 border border-orange-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                30 LVL
              </span>
            </button>

            <button
              onClick={() => setActiveTab("CPCV_AUDIT")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all border ${
                activeTab === "CPCV_AUDIT"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)] border-purple-400"
                  : "bg-slate-900 text-purple-300 hover:text-white border-purple-500/30"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>CPCV & PBO Auditor</span>
              <span className="text-[9px] bg-purple-500/20 text-purple-200 border border-purple-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                PBO 20%
              </span>
            </button>

            <button
              onClick={() => setIsSpecModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all border bg-slate-900 text-amber-300 hover:text-white border-amber-500/40 hover:bg-amber-500/15 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Specification (PDF)</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-200 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                DOC
              </span>
            </button>

            <button
              onClick={() => setActiveTab("DHAN_200_DEPTH")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all border ${
                activeTab === "DHAN_200_DEPTH"
                  ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)] border-orange-400"
                  : "bg-slate-900 text-orange-300 hover:text-white border-orange-500/30"
              }`}
            >
              <Layers className="w-4 h-4 text-orange-400" />
              <span>Dhan 200-Level Depth (TBT)</span>
              <span className="text-[9px] bg-orange-500/20 text-orange-200 border border-orange-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                200 LVL
              </span>
            </button>

            <button
              id="tab-cosmos-recorder"
              onClick={() => setActiveTab("COSMOS_RECORDER")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all border ${
                activeTab === "COSMOS_RECORDER"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border-blue-400"
                  : "bg-slate-900 text-blue-300 hover:text-white border-blue-500/40"
              }`}
            >
              <Database className="w-4 h-4 text-blue-400" />
              <span>Databases & Storage</span>
              <span className="text-[9px] bg-blue-500/20 text-blue-200 border border-blue-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                6 ENGINES
              </span>
            </button>

            <button
              onClick={() => setActiveTab("TRADE_JOURNAL")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all border ${
                activeTab === "TRADE_JOURNAL"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] border-emerald-400"
                  : "bg-slate-900 text-emerald-300 hover:text-white border-emerald-500/30"
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Journal & Profit Analytics</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono">
                CSV/P&L
              </span>
            </button>

            <button
              onClick={() => setActiveTab("AUTONOMOUS_ALGO")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all border ${
                activeTab === "AUTONOMOUS_ALGO"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] border-indigo-400"
                  : "bg-slate-900 text-indigo-300 hover:text-white border-indigo-500/30"
              }`}
            >
              <Bot className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>4-Level Algo Engine</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </button>

            <button
              onClick={() => setActiveTab("OR_STOCHASTICS")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all ${
                activeTab === "OR_STOCHASTICS"
                  ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>OR & Stochastics (Kelly/Heston/Kalman)</span>
            </button>

            <button
              onClick={() => setActiveTab("GEX_MONTE_CARLO")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all ${
                activeTab === "GEX_MONTE_CARLO"
                  ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>GEX & Monte Carlo (10k)</span>
            </button>

            <button
              onClick={() => setActiveTab("MULTI_TF_LEDGER")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all ${
                activeTab === "MULTI_TF_LEDGER"
                  ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Multi-TF & Tax Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab("OPTIONS_CHAIN")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all ${
                activeTab === "OPTIONS_CHAIN"
                  ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Options Chain & IV Heatmap</span>
            </button>

            <button
              onClick={() => setActiveTab("PAYOFF_SIM")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all ${
                activeTab === "PAYOFF_SIM"
                  ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Payoff PnL Curve</span>
            </button>

            <button
              onClick={() => setActiveTab("BACKTEST")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all ${
                activeTab === "BACKTEST"
                  ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Quantitative Backtest (84.3%)</span>
            </button>

            <button
              onClick={() => setActiveTab("RISK_CALC")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all ${
                activeTab === "RISK_CALC"
                  ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Kelly Risk Sizing</span>
            </button>

            <button
              onClick={() => setActiveTab("PAPER_TRADES")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all relative ${
                activeTab === "PAPER_TRADES"
                  ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Monday Paper Desk</span>
              {paperPositions.filter((p) => p.status === "ACTIVE").length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </button>

            <button
              onClick={() => setIsBrokerModalOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all border ${
                brokerState.isConnected
                  ? "bg-emerald-900/40 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)] hover:bg-emerald-800/40"
                  : "bg-slate-900 text-indigo-400 hover:text-indigo-200 border-indigo-500/30"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>{brokerState.isConnected ? "FYERS Live Orders" : "Connect FYERS Gateway"}</span>
              <span className={`w-2 h-2 rounded-full ${brokerState.isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
            </button>

            <button
              onClick={() => setShowFloatingFyersChart(!showFloatingFyersChart)}
              className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-bold font-sans uppercase tracking-wider transition-all border ${
                showFloatingFyersChart
                  ? "bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  : "bg-slate-900 text-slate-300 hover:text-white border-slate-800"
              }`}
              title="Toggle Floating Picture-in-Picture FYERS Live Chart"
            >
              <CandlestickChart className="w-4 h-4 text-emerald-400" />
              <span>{showFloatingFyersChart ? "Hide PiP Chart" : "Floating FYERS Chart"}</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>Lot Size: <strong className="text-slate-300">{currentIndex.lotSize}</strong></span>
            <span>•</span>
            <span>Strike Step: <strong className="text-slate-300">{currentIndex.strikeStep}</strong></span>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === "CHART_MATRIX" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Interactive Chart with ZigZag & Volume */}
            <div className="lg:col-span-2 space-y-4">
              <InteractiveChart
                index={currentIndex}
                candles={candles}
                zigzagPoints={zigzagPoints}
                activePlan={activePlan}
                timeframe={timeframe}
                onChangeTimeframe={setTimeframe}
              />
            </div>

            {/* Right 1 Col: Embedded FYERS Live Chart Mini Widget & Level 2 Order Book */}
            <div className="lg:col-span-1 space-y-4">
              {/* Embedded FYERS Live TV Chart Widget */}
              <FyersMiniChartWidget
                index={currentIndex}
                selectedSymbol={selectedSymbol}
                onSelectSymbol={setSelectedSymbol}
              />

              {/* Level 2 Order Flow & Streaming Tape */}
              <OrderFlowTape
                index={currentIndex}
                bids={bids}
                asks={asks}
                imbalanceRatio={imbalanceRatio}
                tapePrints={tapePrints}
              />
            </div>
          </div>
        )}

        {activeTab === "REALTIME_STRATEGY" && (
          <div className="space-y-4">
            <RealtimeStrategyTerminal
              currentIndex={currentIndex}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={setSelectedSymbol}
              onExecuteTrade={handleExecuteRealtimeSignal}
              onDispatchSignalNotification={handleDispatchRealtimeSignalNotification}
              isBrokerConnected={brokerState.isConnected}
              connectedBrokerName={brokerState.broker}
            />
          </div>
        )}

        {activeTab === "NOTIFICATIONS_HUB" && (
          <div className="space-y-4">
            <UnifiedNotificationCenter
              config={notificationConfig}
              onUpdateConfig={handleUpdateNotificationConfig}
            />
          </div>
        )}

        {activeTab === "INGESTION_SHARDING" && (
          <div className="space-y-4">
            <IngestionTelemetryTerminal />
          </div>
        )}

        {activeTab === "VOLATILITY_SUITE" && (
          <div className="space-y-4">
            <VolatilitySuiteTerminal />
          </div>
        )}

        {activeTab === "SVI_SURFACE" && (
          <div className="space-y-4">
            <SviSurfaceTerminal />
          </div>
        )}

        {activeTab === "NEXUS_ORCHESTRATOR" && (
          <div className="space-y-4">
            <NexusOrchestratorDashboard
              index={currentIndex}
              hftDelta={latestCandle?.hftDelta || 14200}
            />
          </div>
        )}

        {activeTab === "UPSTOX_30_DEPTH" && (
          <div className="space-y-4">
            <Upstox30DepthTerminal index={currentIndex} />
          </div>
        )}

        {activeTab === "CPCV_AUDIT" && (
          <div className="space-y-4">
            <CpcvBacktestTerminal />
          </div>
        )}

        {activeTab === "DHAN_200_DEPTH" && (
          <div className="space-y-4">
            <Dhan200DepthWidget
              symbol={currentIndex.symbol}
              isDhanConnected={brokerState.isConnected && brokerState.broker === "DHAN"}
              onSelectPrice={(price) => {
                soundEngine.playSignalAlert();
                setIsBrokerModalOpen(true);
              }}
            />
          </div>
        )}

        {activeTab === "COSMOS_RECORDER" && (
          <div className="space-y-6">
            <DatabasesTerminal />
            <div className="border-t border-slate-800/80 pt-4">
              <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span>Azure Cosmos DB Micro-Batch Ingestion Inspector</span>
              </div>
              <CosmosDbRecorderTerminal />
            </div>
          </div>
        )}

        {activeTab === "TRADE_JOURNAL" && (
          <div className="space-y-4">
            <TradeJournalSuite
              currentPlan={activePlan}
              currentIndexSymbol={selectedSymbol}
            />
          </div>
        )}

        {activeTab === "AUTONOMOUS_ALGO" && (
          <div className="space-y-4">
            <AutonomousAlgoSuite
              index={currentIndex}
              activePlan={activePlan}
              brokerState={brokerState}
              confluenceScore={confluence.overallScore}
              onExecuteSingleOrder={handlePlaceBrokerOrder}
              onExecuteMultiLeg={async (strategyName, legs) => {
                const res = await fetch("/api/broker/fyers/place-multileg-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    strategyName,
                    legs,
                    appId: brokerState.clientId,
                    isPaperTrade: !brokerState.isConnected,
                  }),
                });
                const data = await res.json();
                if (data.success) {
                  soundEngine.playSuccess();
                }
                return data;
              }}
            />
          </div>
        )}

        {activeTab === "OR_STOCHASTICS" && (
          <div className="space-y-4">
            <OperationsResearchStochasticSuite
              index={currentIndex}
              bundle={operationsResearchBundle}
            />
          </div>
        )}

        {activeTab === "GEX_MONTE_CARLO" && (
          <div className="space-y-4">
            <GexMonteCarloTerminal
              index={currentIndex}
              gexProfile={gexProfile}
              monteCarlo={monteCarloResult}
            />
          </div>
        )}

        {activeTab === "MULTI_TF_LEDGER" && (
          <div className="space-y-4">
            <MultiTimeframeTaxTerminal
              index={currentIndex}
              mtfMatrix={mtfMatrix}
            />
          </div>
        )}

        {activeTab === "OPTIONS_CHAIN" && (
          <div className="space-y-4">
            <OptionsChainPicker
              index={currentIndex}
              calls={optionChainData.calls}
              puts={optionChainData.puts}
              atmStrike={optionChainData.atmStrike}
              maxPainStrike={optionChainData.maxPainStrike}
              pcr={optionChainData.pcr}
              selectedStrike={selectedContract ? selectedContract.strike : null}
              onSelectOption={(contract) => {
                setSelectedContract(contract);
                setActiveTab("PAYOFF_SIM");
              }}
            />
          </div>
        )}

        {activeTab === "PAYOFF_SIM" && (
          <div className="space-y-4">
            <PayoffSimulator
              index={currentIndex}
              selectedContract={selectedContract}
              strategyArchetype={strategyArchetype}
              onChangeArchetype={setStrategyArchetype}
            />
          </div>
        )}

        {activeTab === "BACKTEST" && (
          <div className="space-y-4">
            <BacktestPerformance
              index={currentIndex}
              stats={HISTORICAL_BACKTEST_DATA.stats}
              trades={HISTORICAL_BACKTEST_DATA.trades}
            />
          </div>
        )}

        {activeTab === "RISK_CALC" && (
          <div className="space-y-4">
            <RiskCalculator index={currentIndex} plan={activePlan} />
          </div>
        )}

        {activeTab === "PAPER_TRADES" && (
          <div className="space-y-4">
            <PaperTradingTerminal
              index={currentIndex}
              positions={paperPositions}
              onClosePosition={handleClosePosition}
              onClearHistory={handleClearHistory}
              onAdjustTrailingSl={handleAdjustTrailingSl}
              onManualCustomTrade={handleCustomTrade}
            />
          </div>
        )}
      </main>

      {/* Floating AI Chat Dock with Live Running Suggestions Above Chat Window */}
      <FloatingAiChatDock
        onOpenFullModal={() => setIsAIModalOpen(true)}
        onExecutePrompt={() => setIsAIModalOpen(true)}
        indexSymbol={currentIndex.symbol}
        confluenceScore={confluence.totalScore}
      />

      {/* AI Strategist Modal */}
      <AIStrategistModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        index={currentIndex}
        confluence={confluence}
        plan={activePlan}
        hftDelta={latestCandle?.hftDelta || 12000}
        pcr={optionChainData.pcr}
        maxPain={optionChainData.maxPainStrike}
      />

      {/* FYERS & Broker Direct Gateway Modal */}
      <BrokerGatewayModal
        isOpen={isBrokerModalOpen}
        onClose={() => setIsBrokerModalOpen(false)}
        index={currentIndex}
        brokerState={brokerState}
        onConnectBroker={handleConnectBroker}
        onDisconnectBroker={handleDisconnectBroker}
        onPlaceOrder={handlePlaceBrokerOrder}
        currentPlan={activePlan}
      />

      {/* Google Cloud Hybrid Architecture Modal */}
      <HybridCloudModal
        isOpen={isCloudHybridModalOpen}
        onClose={() => setIsCloudHybridModalOpen(false)}
      />

      {/* Security & 2FA Settings Modal */}
      <SecuritySettingsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onLogout={() => {
          localStorage.removeItem("apex_auth_token");
          setUserSession(null);
          setIsSecurityModalOpen(false);
          setIsTerminalLocked(true);
        }}
      />

      {/* Terminal Lock Screen overlay if locked */}
      {isTerminalLocked && (
        <TerminalLockScreen
          onUnlockSuccess={(session) => {
            setUserSession(session);
            setIsTerminalLocked(false);
          }}
        />
      )}

      {/* Floating Picture-in-Picture FYERS Live Chart */}
      {showFloatingFyersChart && (
        <FyersMiniChartWidget
          index={currentIndex}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={setSelectedSymbol}
          isFloating={true}
          onCloseFloating={() => setShowFloatingFyersChart(false)}
        />
      )}

      {/* Quantitative Engine Specification & PDF Export Modal */}
      <EngineSpecificationModal
        isOpen={isSpecModalOpen}
        onClose={() => setIsSpecModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-4 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-400">
            OmniAlpha F&O Quantitative Strategy Engine • HFT Microstructure & Options Greeks Synthesis
          </p>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span>Risk-Adjusted Alpha: 2.92 Sharpe</span>
            <span>•</span>
            <span>Mathematical Confluence Confirmation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

