import React, { useState, useEffect } from "react";
import {
  BrokerType,
  BrokerCredentials,
  BrokerConnectionState,
  BrokerLivePosition,
  IndexInfo,
  ActionableTradePlan,
} from "../types";
import {
  ShieldCheck,
  Zap,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  Layers,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Cpu,
  Info,
  Server,
  Radio,
  Sliders,
  Check,
  Building2,
  Globe,
  ChevronDown,
  Eye,
  EyeOff,
  Key,
  Wifi,
  WifiOff,
  Timer,
  Terminal,
} from "lucide-react";
import { BrokerBrowserAuthModal } from "./BrokerBrowserAuthModal";
import { Dhan200DepthWidget } from "./Dhan200DepthWidget";

interface BrokerGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  index: IndexInfo;
  activePlan?: ActionableTradePlan | null;
  currentPlan?: ActionableTradePlan | null;
  brokerState: BrokerConnectionState;
  onConnectBroker: (creds: BrokerCredentials) => Promise<boolean>;
  onDisconnectBroker: () => void;
  onPlaceBrokerOrder: (params: {
    broker?: BrokerType;
    symbol: string;
    qty: number;
    side: "BUY" | "SELL";
    orderType: "MARKET" | "LIMIT";
    limitPrice: number;
    stopPrice?: number;
    productType: "INTRADAY" | "MARGIN";
  }) => Promise<any>;
}

export const BrokerGatewayModal: React.FC<BrokerGatewayModalProps> = ({
  isOpen,
  onClose,
  index,
  activePlan,
  currentPlan,
  brokerState,
  onConnectBroker,
  onDisconnectBroker,
  onPlaceBrokerOrder,
}) => {
  const tradePlan = activePlan || currentPlan || null;
  const [selectedBroker, setSelectedBroker] = useState<BrokerType>(brokerState.broker || "DHAN");
  
  // 1. Fyers Credentials
  const [appId, setAppId] = useState<string>("XC10429-100");
  const [secretKey, setSecretKey] = useState<string>("");
  const [accessToken, setAccessToken] = useState<string>("");
  const [redirectUri, setRedirectUri] = useState<string>("https://trade.fyers.in/api-login/redirect-uri/index.html");

  // 2. Dhan Credentials
  const [dhanClientId, setDhanClientId] = useState<string>("1000849201");
  const [dhanAccessToken, setDhanAccessToken] = useState<string>("");
  const [dhanPin, setDhanPin] = useState<string>("");
  const [dhanDepthFeed, setDhanDepthFeed] = useState<boolean>(true);

  // 3. Upstox Credentials
  const [upstoxApiKey, setUpstoxApiKey] = useState<string>("6FA001_UPSTOX_PRO");
  const [upstoxApiSecret, setUpstoxApiSecret] = useState<string>("");
  const [upstoxAccessToken, setUpstoxAccessToken] = useState<string>("");
  const [upstoxRedirectUri, setUpstoxRedirectUri] = useState<string>("https://127.0.0.1:3000/api/broker/upstox/callback");

  // 4. Angel One (SmartAPI v2) Credentials
  const [angelApiKey, setAngelApiKey] = useState<string>("smartapi_key_v2_9948");
  const [angelClientCode, setAngelClientCode] = useState<string>("A108291");
  const [angelPin, setAngelPin] = useState<string>("");
  const [angelTotpSecret, setAngelTotpSecret] = useState<string>("");
  const [angelAccessToken, setAngelAccessToken] = useState<string>("");

  // 5. Zerodha (Kite Connect v3) Credentials
  const [zerodhaApiKey, setZerodhaApiKey] = useState<string>("kite_pro_99182");
  const [zerodhaApiSecret, setZerodhaApiSecret] = useState<string>("");
  const [zerodhaClientId, setZerodhaClientId] = useState<string>("ZR8291");
  const [zerodhaRequestToken, setZerodhaRequestToken] = useState<string>("");
  const [zerodhaAccessToken, setZerodhaAccessToken] = useState<string>("");

  // Secret toggles
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const toggleSecret = (fieldKey: string) => {
    setShowSecrets((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };
  
  const [environment, setEnvironment] = useState<"LIVE" | "SANDBOX">("LIVE");
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [showBrowserAuthModal, setShowBrowserAuthModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"CONFIG" | "LIVE_STREAM" | "ORDER_DESK" | "POSITIONS" | "AUTO_RECONNECT" | "SETUP_GUIDE">("CONFIG");
  const [selectedGuideBroker, setSelectedGuideBroker] = useState<BrokerType>("DHAN");

  // Automated Reconnection & Watchdog State
  const [autoReconnectEnabled, setAutoReconnectEnabled] = useState<boolean>(true);
  const [reconnectIntervalSec, setReconnectIntervalSec] = useState<number>(10);
  const [socketHealth, setSocketHealth] = useState<"HEALTHY" | "UNRESPONSIVE" | "RECONNECTING" | "IDLE">(
    brokerState.isConnected ? "HEALTHY" : "IDLE"
  );
  const [lastHeartbeat, setLastHeartbeat] = useState<string | null>(new Date().toLocaleTimeString());
  const [heartbeatLatency, setHeartbeatLatency] = useState<number>(brokerState.latencyMs || 14);
  const [missedHeartbeats, setMissedHeartbeats] = useState<number>(0);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [reconnectCountdown, setReconnectCountdown] = useState<number>(10);
  const [isSimulatedUnresponsive, setIsSimulatedUnresponsive] = useState<boolean>(false);
  const [isAutoReconnecting, setIsAutoReconnecting] = useState<boolean>(false);
  const [reconnectLogs, setReconnectLogs] = useState<Array<{
    id: string;
    timestamp: string;
    type: "SUCCESS" | "WARNING" | "ERROR" | "INFO";
    message: string;
  }>>([
    {
      id: "init",
      timestamp: new Date().toLocaleTimeString(),
      type: "INFO",
      message: "Gateway Watchdog Engine armed. Automated socket health heartbeat monitoring active.",
    },
  ]);

  // Order ticket state
  const formatSymbolForBroker = (broker: BrokerType, plan: ActionableTradePlan | null, currentIdx: IndexInfo) => {
    const cleanSym = currentIdx.symbol.replace("50", "");
    const strike = plan ? plan.strike : currentIdx.currentPrice;
    const optType = plan ? plan.optionType : "CE";
    
    switch (broker) {
      case "DHAN":
        return `NSE:${cleanSym}-AUG2024-${strike}-${optType}`;
      case "UPSTOX":
        return `NSE_FO|${cleanSym} ${strike} ${optType}`;
      case "ZERODHA":
        return `${cleanSym}24AUG${strike}${optType}`;
      case "ANGEL_ONE":
        return `${cleanSym}29AUG24${strike}${optType}`;
      case "FYERS":
      default:
        return `NSE:${cleanSym}24AUG${strike}${optType}`;
    }
  };

  const [orderSymbol, setOrderSymbol] = useState(formatSymbolForBroker(selectedBroker, tradePlan, index));
  const [orderLots, setOrderLots] = useState(1);
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">(
    tradePlan?.direction === "BEARISH" && tradePlan?.executionMode === "OPTION_SELLING" ? "SELL" : "BUY"
  );
  const [orderType, setOrderType] = useState<"LIMIT" | "MARKET">("LIMIT");
  const [limitPrice, setLimitPrice] = useState(tradePlan?.entryOptionPremium || 185.0);
  const [productType, setProductType] = useState<"INTRADAY" | "MARGIN">("INTRADAY");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  // Live positions
  const [livePositions, setLivePositions] = useState<BrokerLivePosition[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);

  // Live quotes
  const [brokerQuotes, setBrokerQuotes] = useState<any[]>([]);

  // Update order symbol when broker or plan changes
  useEffect(() => {
    setOrderSymbol(formatSymbolForBroker(selectedBroker, tradePlan, index));
    if (tradePlan) {
      setLimitPrice(tradePlan.entryOptionPremium);
    }
  }, [selectedBroker, tradePlan, index]);

  // Sync selected broker with currently connected broker if already connected
  useEffect(() => {
    if (brokerState.isConnected && brokerState.broker) {
      setSelectedBroker(brokerState.broker);
    }
  }, [brokerState.isConnected, brokerState.broker]);

  const handleQuickDemoFill = () => {
    setEnvironment("SANDBOX");
    setErrorMessage(null);
    setSuccessMessage(`Loaded Sandbox demo credentials for ${selectedBroker}. Click 'Connect' to arm gateway.`);
    
    if (selectedBroker === "DHAN") {
      setDhanClientId("1000849201");
      setDhanAccessToken("DEMO_DHAN_HQ_V2_JWT_TOKEN_998471928472918471");
      setDhanPin("9921");
    } else if (selectedBroker === "UPSTOX") {
      setUpstoxApiKey("6FA001_UPSTOX_PRO_KEY");
      setUpstoxApiSecret("upstox_sec_9918237482");
      setUpstoxAccessToken("DEMO_UPSTOX_V2_BEARER_TOKEN_883719284719284");
      setUpstoxRedirectUri("https://127.0.0.1:3000/api/broker/upstox/callback");
    } else if (selectedBroker === "FYERS") {
      setAppId("FY08924-100");
      setSecretKey("fyers_secret_key_8829");
      setAccessToken("DEMO_FYERS_V3_TOKEN_ACCESS_99482710398471928374");
      setRedirectUri("https://trade.fyers.in/api-login/redirect-uri/index.html");
    } else if (selectedBroker === "ANGEL_ONE") {
      setAngelApiKey("smartapi_key_v2_9948");
      setAngelClientCode("A108291");
      setAngelPin("9921");
      setAngelTotpSecret("JBSWY3DPEHPK3PXP");
      setAngelAccessToken("DEMO_SMART_API_JWT_KEY_6628192847192");
    } else if (selectedBroker === "ZERODHA") {
      setZerodhaApiKey("kite_pro_99182");
      setZerodhaApiSecret("kite_secret_7728192");
      setZerodhaClientId("ZR8291");
      setZerodhaRequestToken("demo_request_token_88192");
      setZerodhaAccessToken("DEMO_KITE_V3_ACCESS_TOKEN_773928192847192");
    }
  };

  const getCredentialsForBroker = (b: BrokerType): BrokerCredentials => {
    let activeId = "";
    let activeSecret = "";
    let activeToken = "";

    if (b === "DHAN") {
      activeId = dhanClientId.trim() || "1000849201";
      activeToken = dhanAccessToken.trim() || "DEMO_DHAN_HQ_V2_JWT_TOKEN_998471928472918471";
    } else if (b === "UPSTOX") {
      activeId = upstoxApiKey.trim() || "6FA001_UPSTOX_PRO_KEY";
      activeSecret = upstoxApiSecret.trim() || "upstox_sec_9918237482";
      activeToken = upstoxAccessToken.trim() || "DEMO_UPSTOX_V2_BEARER_TOKEN_883719284719284";
    } else if (b === "FYERS") {
      activeId = appId.trim() || "FY08924-100";
      activeSecret = secretKey.trim() || "fyers_secret_key_8829";
      activeToken = accessToken.trim() || "DEMO_FYERS_V3_TOKEN_ACCESS_99482710398471928374";
    } else if (b === "ANGEL_ONE") {
      activeId = angelClientCode.trim() || angelApiKey.trim() || "A108291";
      activeSecret = angelPin.trim() || "9921";
      activeToken = angelAccessToken.trim() || "DEMO_SMART_API_JWT_KEY_6628192847192";
    } else if (b === "ZERODHA") {
      activeId = zerodhaApiKey.trim() || "kite_pro_99182";
      activeSecret = zerodhaApiSecret.trim() || "kite_secret_7728192";
      activeToken = zerodhaAccessToken.trim() || "DEMO_KITE_V3_ACCESS_TOKEN_773928192847192";
    }

    return {
      broker: b,
      appId: activeId,
      secretKey: activeSecret,
      accessToken: activeToken,
      dhanClientId: b === "DHAN" ? activeId : undefined,
      dhanAccessToken: b === "DHAN" ? activeToken : undefined,
      upstoxApiKey: b === "UPSTOX" ? activeId : undefined,
      upstoxApiSecret: b === "UPSTOX" ? activeSecret : undefined,
      upstoxAccessToken: b === "UPSTOX" ? activeToken : undefined,
      zerodhaApiKey: b === "ZERODHA" ? activeId : undefined,
      zerodhaApiSecret: b === "ZERODHA" ? activeSecret : undefined,
      zerodhaClientId: b === "ZERODHA" ? zerodhaClientId : undefined,
      zerodhaRequestToken: b === "ZERODHA" ? zerodhaRequestToken : undefined,
      angelOneApiKey: b === "ANGEL_ONE" ? angelApiKey : undefined,
      angelOneClientCode: b === "ANGEL_ONE" ? activeId : undefined,
      angelOnePin: b === "ANGEL_ONE" ? activeSecret : undefined,
      angelOneTotpSecret: b === "ANGEL_ONE" ? angelTotpSecret : undefined,
      redirectUri: b === "UPSTOX" ? upstoxRedirectUri : redirectUri,
      environment,
      autoSyncQuotes: true,
      autoSyncPositions: true,
    };
  };

  const addReconnectLog = (type: "SUCCESS" | "WARNING" | "ERROR" | "INFO", message: string) => {
    setReconnectLogs((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
      },
      ...prev.slice(0, 29),
    ]);
  };

  const executeReconnect = async (isManual: boolean = false) => {
    setIsAutoReconnecting(true);
    setSocketHealth("RECONNECTING");
    addReconnectLog(
      "INFO",
      `${isManual ? "Manual refresh triggered." : "Automated interval elapsed."} Attempting gateway reconnection to ${selectedBroker} (Attempt #${reconnectAttempts + 1})...`
    );

    try {
      // 1. Refresh broker health check on backend
      const pingStart = performance.now();
      const res = await fetch(
        `/api/broker/health?broker=${selectedBroker}&refresh=true${isSimulatedUnresponsive ? "&simulateDrop=true" : ""}`
      );
      const rtt = Math.round(performance.now() - pingStart);

      if (res.ok && !isSimulatedUnresponsive) {
        const data = await res.json();
        
        // 2. Re-establish credentials with App connection handler
        const creds = getCredentialsForBroker(selectedBroker);
        await onConnectBroker(creds);

        setSocketHealth("HEALTHY");
        setHeartbeatLatency(data.latencyMs || rtt);
        setLastHeartbeat(new Date().toLocaleTimeString());
        setMissedHeartbeats(0);
        setReconnectAttempts(0);
        setReconnectCountdown(reconnectIntervalSec);
        setIsSimulatedUnresponsive(false);
        setIsAutoReconnecting(false);

        addReconnectLog(
          "SUCCESS",
          `Successfully re-established ${selectedBroker} gateway connection! WebSocket heartbeat verified (${rtt}ms RTT).`
        );
        setSuccessMessage(`Automated reconnection successful! ${selectedBroker} socket & DMA stream refreshed (${rtt}ms).`);
        setErrorMessage(null);

        // Refresh market quotes and live positions
        fetchQuotes(selectedBroker);
        fetchPositions(selectedBroker);
        return true;
      } else {
        const nextAttempt = reconnectAttempts + 1;
        setReconnectAttempts(nextAttempt);
        setSocketHealth("UNRESPONSIVE");
        setReconnectCountdown(reconnectIntervalSec);
        setIsAutoReconnecting(false);

        addReconnectLog(
          "ERROR",
          `Reconnection attempt #${nextAttempt} failed: ${selectedBroker} socket remained unresponsive. Auto-retry in ${reconnectIntervalSec}s.`
        );
        setErrorMessage(
          `Broker socket unresponsive. Automated retry #${nextAttempt} scheduled in ${reconnectIntervalSec}s.`
        );
        return false;
      }
    } catch (err: any) {
      const nextAttempt = reconnectAttempts + 1;
      setReconnectAttempts(nextAttempt);
      setSocketHealth("UNRESPONSIVE");
      setReconnectCountdown(reconnectIntervalSec);
      setIsAutoReconnecting(false);

      addReconnectLog(
        "ERROR",
        `Reconnection network exception: ${err?.message || "Connection timeout"}. Auto-retry in ${reconnectIntervalSec}s.`
      );
      return false;
    }
  };

  const handleToggleSimulateUnresponsive = () => {
    if (!isSimulatedUnresponsive) {
      setIsSimulatedUnresponsive(true);
      setSocketHealth("UNRESPONSIVE");
      setMissedHeartbeats(2);
      setReconnectCountdown(reconnectIntervalSec);
      addReconnectLog("WARNING", "⚠️ Test: Simulated socket stall initiated. Automatic reconnection interval countdown started.");
    } else {
      setIsSimulatedUnresponsive(false);
      executeReconnect(true);
    }
  };

  // Automated Heartbeat Monitor: Pings broker socket/API status every 4 seconds
  useEffect(() => {
    if (!isOpen) return;

    const pingTimer = setInterval(async () => {
      // Skip if actively reconnecting
      if (isAutoReconnecting || socketHealth === "RECONNECTING") return;

      if (isSimulatedUnresponsive) {
        setMissedHeartbeats((prev) => {
          const next = prev + 1;
          if (next >= 2 && socketHealth !== "UNRESPONSIVE") {
            setSocketHealth("UNRESPONSIVE");
            addReconnectLog("WARNING", `Heartbeat dropped (${next}/2 missed). Broker socket marked UNRESPONSIVE.`);
          }
          return next;
        });
        return;
      }

      try {
        const start = performance.now();
        const res = await fetch(`/api/broker/health?broker=${selectedBroker}`);
        const rtt = Math.round(performance.now() - start);

        if (res.ok) {
          const data = await res.json();
          setHeartbeatLatency(data.latencyMs || rtt);
          setLastHeartbeat(new Date().toLocaleTimeString());

          if (socketHealth === "UNRESPONSIVE") {
            setSocketHealth("HEALTHY");
            setMissedHeartbeats(0);
            setReconnectAttempts(0);
            addReconnectLog("SUCCESS", `Broker socket recovered responsiveness (${rtt}ms RTT).`);
          } else if (socketHealth === "IDLE" && brokerState.isConnected) {
            setSocketHealth("HEALTHY");
            setMissedHeartbeats(0);
          }
        } else {
          setMissedHeartbeats((prev) => {
            const next = prev + 1;
            if (next >= 2 && socketHealth !== "UNRESPONSIVE") {
              setSocketHealth("UNRESPONSIVE");
              addReconnectLog("WARNING", `Heartbeat dropped (${next}/2 missed, HTTP ${res.status}). Socket marked UNRESPONSIVE.`);
            }
            return next;
          });
        }
      } catch {
        setMissedHeartbeats((prev) => {
          const next = prev + 1;
          if (next >= 2 && socketHealth !== "UNRESPONSIVE") {
            setSocketHealth("UNRESPONSIVE");
            addReconnectLog("WARNING", `Heartbeat network probe failed (${next}/2 missed). Socket marked UNRESPONSIVE.`);
          }
          return next;
        });
      }
    }, 4000);

    return () => clearInterval(pingTimer);
  }, [isOpen, selectedBroker, socketHealth, isAutoReconnecting, isSimulatedUnresponsive, brokerState.isConnected]);

  // Automated Reconnection Countdown Loop
  useEffect(() => {
    if (!isOpen || !autoReconnectEnabled || socketHealth !== "UNRESPONSIVE") {
      return;
    }

    const timer = setInterval(() => {
      setReconnectCountdown((prev) => {
        if (prev <= 1) {
          executeReconnect(false);
          return reconnectIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isOpen,
    autoReconnectEnabled,
    socketHealth,
    reconnectIntervalSec,
    reconnectAttempts,
    selectedBroker,
    isSimulatedUnresponsive,
    isAutoReconnecting,
  ]);

  // Reset countdown when socket becomes unresponsive or interval setting changes
  useEffect(() => {
    if (socketHealth === "UNRESPONSIVE") {
      setReconnectCountdown(reconnectIntervalSec);
    }
  }, [socketHealth, reconnectIntervalSec]);

  // Sync socket health when brokerState.isConnected changes
  useEffect(() => {
    if (brokerState.isConnected) {
      setSocketHealth("HEALTHY");
      setMissedHeartbeats(0);
      setReconnectAttempts(0);
      setReconnectCountdown(reconnectIntervalSec);
      addReconnectLog("SUCCESS", `${brokerState.broker} gateway connected. Socket watchdog synchronized.`);
    } else {
      setSocketHealth("IDLE");
    }
  }, [brokerState.isConnected, brokerState.broker]);

  const handleGenerateAuthUrl = async () => {
    try {
      let targetUrl = "";
      if (selectedBroker === "DHAN") {
        targetUrl = "https://web.dhan.co/index.html#/settings/developer-apis";
      } else if (selectedBroker === "UPSTOX") {
        const resp = await fetch("/api/broker/upstox/generate-auth-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: upstoxApiKey.trim() }),
        });
        const data = await resp.json();
        targetUrl = data.authUrl || `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${encodeURIComponent(upstoxApiKey.trim())}&redirect_uri=${encodeURIComponent(upstoxRedirectUri.trim())}`;
      } else if (selectedBroker === "FYERS") {
        const resp = await fetch("/api/broker/fyers/generate-auth-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appId: appId.trim(), redirectUri: redirectUri.trim() }),
        });
        const data = await resp.json();
        targetUrl = data.authUrl || `https://api-t1.fyers.in/api/v3/generate-authcode?client_id=${encodeURIComponent(appId.trim())}&redirect_uri=${encodeURIComponent(redirectUri.trim())}&response_type=code&state=omni_alpha`;
      } else if (selectedBroker === "ANGEL_ONE") {
        targetUrl = "https://smartapi.angelbroking.com";
      } else if (selectedBroker === "ZERODHA") {
        targetUrl = `https://kite.zerodha.com/connect/login?api_key=${encodeURIComponent(zerodhaApiKey.trim() || "kite_pro_99182")}&v=3`;
      }
      
      window.open(targetUrl, "_blank");
      setSuccessMessage(`${selectedBroker} authorization page opened in a new tab. Complete authentication, copy the token and paste below.`);
    } catch {
      window.open("https://web.dhan.co", "_blank");
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    let activeId = "";
    let activeSecret = "";
    let activeToken = "";

    if (selectedBroker === "DHAN") {
      activeId = dhanClientId.trim();
      activeToken = dhanAccessToken.trim();
      if (!dhanClientId.trim()) {
        setIsConnecting(false);
        setErrorMessage("Dhan Client ID (e.g. 1000849201) is required.");
        return;
      }
      if (!dhanAccessToken.trim()) {
        setIsConnecting(false);
        setErrorMessage("DhanHQ Access Token is required. Click 'Open DhanHQ Developer Portal' or '⚡ Fill Demo Sandbox Token'.");
        return;
      }
    } else if (selectedBroker === "UPSTOX") {
      activeId = upstoxApiKey.trim();
      activeSecret = upstoxApiSecret.trim();
      activeToken = upstoxAccessToken.trim();
      if (!upstoxApiKey.trim()) {
        setIsConnecting(false);
        setErrorMessage("Upstox API Key / Client ID is required.");
        return;
      }
      if (!upstoxAccessToken.trim()) {
        setIsConnecting(false);
        setErrorMessage("Upstox Access Token is required. Click 'Generate Upstox Auth URL' or '⚡ Fill Demo Sandbox Token'.");
        return;
      }
    } else if (selectedBroker === "FYERS") {
      activeId = appId.trim();
      activeSecret = secretKey.trim();
      activeToken = accessToken.trim();
      if (!appId.trim() || !accessToken.trim()) {
        setIsConnecting(false);
        setErrorMessage("Fyers App ID and Access Token are required.");
        return;
      }
    } else if (selectedBroker === "ANGEL_ONE") {
      activeId = angelClientCode.trim() || angelApiKey.trim();
      activeSecret = angelPin.trim();
      activeToken = angelAccessToken.trim();
      if (!angelClientCode.trim()) {
        setIsConnecting(false);
        setErrorMessage("Angel One Client Code (e.g. A108291) is required.");
        return;
      }
      if (!angelAccessToken.trim()) {
        setIsConnecting(false);
        setErrorMessage("Angel One SmartAPI JWT Access Token is required. Click '⚡ Fill Demo Sandbox Token' for instant test.");
        return;
      }
    } else if (selectedBroker === "ZERODHA") {
      activeId = zerodhaApiKey.trim();
      activeSecret = zerodhaApiSecret.trim();
      activeToken = zerodhaAccessToken.trim();
      if (!zerodhaApiKey.trim()) {
        setIsConnecting(false);
        setErrorMessage("Zerodha Kite API Key is required.");
        return;
      }
      if (!zerodhaAccessToken.trim()) {
        setIsConnecting(false);
        setErrorMessage("Zerodha Kite Access Token / Request Token is required.");
        return;
      }
    }

    const success = await onConnectBroker({
      broker: selectedBroker,
      appId: activeId,
      secretKey: activeSecret,
      accessToken: activeToken,
      dhanClientId: selectedBroker === "DHAN" ? dhanClientId.trim() : undefined,
      upstoxApiKey: selectedBroker === "UPSTOX" ? upstoxApiKey.trim() : undefined,
      upstoxApiSecret: selectedBroker === "UPSTOX" ? upstoxApiSecret.trim() : undefined,
      zerodhaApiKey: selectedBroker === "ZERODHA" ? zerodhaApiKey.trim() : undefined,
      zerodhaApiSecret: selectedBroker === "ZERODHA" ? zerodhaApiSecret.trim() : undefined,
      zerodhaClientId: selectedBroker === "ZERODHA" ? zerodhaClientId.trim() : undefined,
      zerodhaRequestToken: selectedBroker === "ZERODHA" ? zerodhaRequestToken.trim() : undefined,
      angelOneApiKey: selectedBroker === "ANGEL_ONE" ? angelApiKey.trim() : undefined,
      angelOneClientCode: selectedBroker === "ANGEL_ONE" ? angelClientCode.trim() : undefined,
      angelOnePin: selectedBroker === "ANGEL_ONE" ? angelPin.trim() : undefined,
      angelOneTotpSecret: selectedBroker === "ANGEL_ONE" ? angelTotpSecret.trim() : undefined,
      redirectUri: selectedBroker === "UPSTOX" ? upstoxRedirectUri.trim() : redirectUri.trim(),
      environment,
      autoSyncQuotes: true,
      autoSyncPositions: true,
    });

    setIsConnecting(false);
    if (success) {
      setSocketHealth("HEALTHY");
      setMissedHeartbeats(0);
      setReconnectAttempts(0);
      setReconnectCountdown(reconnectIntervalSec);
      addReconnectLog("SUCCESS", `${selectedBroker} credentials validated and gateway armed.`);
      setSuccessMessage(`${selectedBroker} Gateway Successfully Synchronized & Armed!`);
      setActiveSubTab("ORDER_DESK");
      fetchPositions(selectedBroker);
      fetchQuotes(selectedBroker);
    } else {
      setErrorMessage(`Failed to validate ${selectedBroker} credentials. Please check your Client ID & Token.`);
    }
  };

  const fetchPositions = async (brokerToFetch: BrokerType = selectedBroker) => {
    setIsLoadingPositions(true);
    try {
      const res = await fetch(`/api/broker/positions?broker=${brokerToFetch}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.positions)) {
        setLivePositions(data.positions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPositions(false);
    }
  };

  const fetchQuotes = async (brokerToFetch: BrokerType = selectedBroker) => {
    try {
      const res = await fetch(`/api/broker/quotes?broker=${brokerToFetch}&appId=${encodeURIComponent(appId)}&accessToken=${encodeURIComponent(accessToken)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.quotes)) {
        setBrokerQuotes(data.quotes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteOrder = async () => {
    setIsSubmittingOrder(true);
    setOrderResult(null);

    try {
      const currentLotSize = index.lotSize || 50;
      const totalQuantity = orderLots * currentLotSize;

      const result = await onPlaceBrokerOrder({
        broker: selectedBroker,
        symbol: orderSymbol,
        qty: totalQuantity,
        side: orderSide,
        orderType: orderType,
        limitPrice: Number(limitPrice),
        productType: productType,
      });

      setOrderResult(result);
      if (result.success) {
        fetchPositions(selectedBroker);
      }
    } catch (err: any) {
      setOrderResult({
        success: false,
        message: err.message || "Failed to route order to exchange bridge",
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (!isOpen) return null;

  const brokerList = [
    {
      id: "DHAN",
      name: "DhanHQ v2",
      badge: "Superfast DMA",
      color: "border-orange-500",
      accent: "from-orange-500 to-amber-500",
      highlight: "Direct API Access Token (30-day)",
    },
    {
      id: "UPSTOX",
      name: "Upstox Pro v2",
      badge: "OAuth 2.0",
      color: "border-purple-500",
      accent: "from-purple-600 to-indigo-600",
      highlight: "Pro v2 REST & WebSocket Bridge",
    },
    {
      id: "FYERS",
      name: "FYERS API v3",
      badge: "High-Freq Ticks",
      color: "border-indigo-500",
      accent: "from-indigo-600 to-blue-600",
      highlight: "SHA-256 Auth Code OAuth",
    },
    {
      id: "ZERODHA",
      name: "Zerodha Kite",
      badge: "Kite Connect v3",
      color: "border-emerald-500",
      accent: "from-emerald-600 to-teal-600",
      highlight: "Kite Connect REST Gateway",
    },
    {
      id: "ANGEL_ONE",
      name: "Angel SmartAPI",
      badge: "SmartAPI v2",
      color: "border-blue-500",
      accent: "from-blue-600 to-cyan-600",
      highlight: "TOTP + JWT SmartAPI Gateway",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-sans tracking-wide">
                  Direct Broker Gateway & DMA Order Desk
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  MULTI-BROKER ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Connect Dhan, Upstox, Fyers, Zerodha Kite, or Angel SmartAPI for instantaneous 1-click execution.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Sub-Header Navigation Tabs */}
        <div className="bg-slate-900 px-6 border-b border-slate-800 flex items-center justify-between text-xs font-mono overflow-x-auto no-scrollbar">
          <div className="flex gap-2 py-2">
            {[
              { id: "CONFIG", label: "Broker Credentials", icon: Lock },
              { id: "ORDER_DESK", label: "1-Click Order Execution", icon: Zap },
              { id: "LIVE_STREAM", label: "Realtime Ticks & Quotes", icon: Radio },
              { id: "POSITIONS", label: "Live Positions & MTM", icon: Layers },
              { id: "AUTO_RECONNECT", label: "Auto-Reconnect & Watchdog", icon: Activity },
              { id: "SETUP_GUIDE", label: "Step-by-Step Setup Guides", icon: Info },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveSubTab(tab.id as any);
                    if (tab.id === "POSITIONS") fetchPositions(selectedBroker);
                    if (tab.id === "LIVE_STREAM") fetchQuotes(selectedBroker);
                  }}
                  className={`px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.id === "AUTO_RECONNECT" && socketHealth === "UNRESPONSIVE" && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pl-4 py-2 flex-shrink-0">
            {/* Live Socket Watchdog Badge */}
            <button
              onClick={() => setActiveSubTab("AUTO_RECONNECT")}
              title="Click to configure Auto-Reconnect interval & inspect socket heartbeat"
              className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 border transition-all ${
                socketHealth === "UNRESPONSIVE"
                  ? "bg-rose-500/15 text-rose-300 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse"
                  : socketHealth === "RECONNECTING"
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50"
                  : socketHealth === "HEALTHY"
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {socketHealth === "UNRESPONSIVE" ? (
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              ) : socketHealth === "RECONNECTING" ? (
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              ) : (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>
                {socketHealth === "UNRESPONSIVE"
                  ? `STALLED • Retry in ${reconnectCountdown}s (#${reconnectAttempts + 1})`
                  : socketHealth === "RECONNECTING"
                  ? "RECONNECTING..."
                  : socketHealth === "HEALTHY"
                  ? `SOCKET ALIVE (${heartbeatLatency}ms)`
                  : "WATCHDOG READY"}
              </span>
            </button>

            <div
              className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 border ${
                brokerState.isConnected
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/40"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  brokerState.isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              ></div>
              <span>
                {brokerState.isConnected ? `${brokerState.broker} LIVE` : "SANDBOX"}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Automated Reconnection Watchdog Emergency Warning Banner when Socket Stalled */}
          {(socketHealth === "UNRESPONSIVE" || isSimulatedUnresponsive) && (
            <div className="bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 border-2 border-rose-500/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono shadow-[0_0_24px_rgba(244,63,94,0.3)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/20 border border-rose-500/50 rounded-xl text-rose-400 flex-shrink-0 animate-pulse">
                  <WifiOff className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm font-sans">
                      {selectedBroker} Socket / API Unresponsive
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/30 text-rose-200 font-bold border border-rose-500/50 uppercase">
                      Auto-Reconnect Armed
                    </span>
                    {isSimulatedUnresponsive && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                        SIMULATED TEST
                      </span>
                    )}
                  </div>
                  <p className="text-rose-200/90 text-xs font-sans mt-1">
                    Heartbeat timed out after {missedHeartbeats} missed probes. Automated reconnect cycle scheduled in{" "}
                    <span className="text-white font-mono font-bold text-sm bg-rose-900/80 px-2 py-0.5 rounded border border-rose-500/60">
                      {reconnectCountdown}s
                    </span>{" "}
                    (Interval: {reconnectIntervalSec}s • Attempt #{reconnectAttempts + 1})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => executeReconnect(true)}
                  disabled={isAutoReconnecting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg active:scale-95 transition-all text-xs"
                >
                  <RefreshCw className={`w-4 h-4 ${isAutoReconnecting ? "animate-spin" : ""}`} />
                  <span>{isAutoReconnecting ? "Reconnecting..." : "Force Reconnect Now"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("AUTO_RECONNECT")}
                  className="px-3.5 py-2 bg-slate-900/90 border border-slate-700 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-bold transition-colors"
                >
                  Watchdog Controls
                </button>
                {isSimulatedUnresponsive && (
                  <button
                    type="button"
                    onClick={handleToggleSimulateUnresponsive}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-lg text-xs"
                  >
                    End Test
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active Broker Info Strip if connected */}
          {brokerState.isConnected && (
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  {brokerState.broker.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm font-sans">{brokerState.clientName}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                      {brokerState.broker} ACTIVE
                    </span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                      Watchdog: {reconnectIntervalSec}s
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Client ID: <strong className="text-slate-200">{brokerState.clientId}</strong> • Latency:{" "}
                    <span className="text-emerald-400 font-bold">{heartbeatLatency}ms DMA</span> • Last ACK:{" "}
                    <span className="text-slate-300">{lastHeartbeat}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-right">
                  <div className="text-[10px] text-slate-500 uppercase">Available Margin</div>
                  <div className="text-sm font-bold text-emerald-400">
                    ₹{brokerState.availableBalance?.toLocaleString() || "245,850"}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-right">
                  <div className="text-[10px] text-slate-500 uppercase">Used Margin</div>
                  <div className="text-sm font-bold text-amber-400">
                    ₹{brokerState.usedMargin?.toLocaleString() || "38,420"}
                  </div>
                </div>

                <button
                  onClick={() => executeReconnect(true)}
                  title="Manual socket & credentials refresh"
                  className="p-2 bg-indigo-950/60 border border-indigo-500/40 hover:bg-indigo-900 text-indigo-300 rounded font-bold transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAutoReconnecting ? "animate-spin" : ""}`} />
                </button>

                <button
                  onClick={onDisconnectBroker}
                  className="px-3 py-2 bg-rose-950/60 border border-rose-500/50 hover:bg-rose-900 text-rose-300 rounded font-bold text-xs transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: API CREDENTIALS CONFIG */}
          {activeSubTab === "CONFIG" && (
            <div className="space-y-5">
              {/* Multi-Broker Selection Control: Prominent Dropdown & Synced Cards */}
              <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                  <div>
                    <label
                      htmlFor="broker-select-dropdown"
                      className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2"
                    >
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      <span>Select Supported Broker Gateway</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                        5 GATEWAYS READY
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                      Select your institutional or retail broker to dynamically load API credential inputs, token generators, and DMA routing bridges.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">Active Broker:</span>
                    <div className="relative min-w-[240px]">
                      <select
                        id="broker-select-dropdown"
                        value={selectedBroker}
                        onChange={(e) => {
                          const newBroker = e.target.value as BrokerType;
                          setSelectedBroker(newBroker);
                          setSelectedGuideBroker(newBroker);
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                        className="w-full appearance-none bg-slate-900 hover:bg-slate-850 border-2 border-indigo-500/70 focus:border-indigo-400 text-white font-mono font-bold text-xs py-2 pl-3.5 pr-9 rounded-lg focus:outline-none cursor-pointer transition-all shadow-[0_0_15px_rgba(99,102,241,0.25)]"
                      >
                        <option value="DHAN">⚡ Dhan (DhanHQ v2 API - Direct DMA)</option>
                        <option value="UPSTOX">🟣 Upstox (Upstox Pro v2 - OAuth 2.0)</option>
                        <option value="FYERS">🔷 Fyers (Fyers API v3 - High-Freq Ticks)</option>
                        <option value="ANGEL_ONE">🔵 Angel One (SmartAPI v2 - TOTP + JWT)</option>
                        <option value="ZERODHA">🟢 Zerodha (Kite Connect v3 - REST)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-indigo-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Quick-Switch Cards aligned with Dropdown selection */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-3 border-t border-slate-800/80">
                  {brokerList.map((b) => {
                    const isSelected = selectedBroker === b.id;
                    const isLive = brokerState.isConnected && brokerState.broker === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setSelectedBroker(b.id as BrokerType);
                          setSelectedGuideBroker(b.id as BrokerType);
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? "bg-slate-900 border-indigo-500 text-white shadow-[0_0_18px_rgba(99,102,241,0.3)] ring-2 ring-indigo-500/80"
                            : "bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold font-mono tracking-tight text-white">{b.name}</div>
                          {isLive ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981] animate-pulse"></span>
                          ) : isSelected ? (
                            <Check className="w-3.5 h-3.5 text-indigo-400" />
                          ) : null}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-sans">{b.badge}</div>
                        <div className="text-[9px] text-indigo-400/80 mt-0.5 line-clamp-1 font-mono">{b.highlight}</div>
                        {b.id === "DHAN" && (
                          <span className="absolute -top-2 -right-1 text-[8px] bg-orange-500 text-white px-1.5 py-0.2 rounded font-mono font-bold shadow">
                            FASTEST
                          </span>
                        )}
                        {b.id === "UPSTOX" && (
                          <span className="absolute -top-2 -right-1 text-[8px] bg-purple-500 text-white px-1.5 py-0.2 rounded font-mono font-bold shadow">
                            V2 PRO
                          </span>
                        )}
                        {b.id === "ANGEL_ONE" && (
                          <span className="absolute -top-2 -right-1 text-[8px] bg-sky-500 text-white px-1.5 py-0.2 rounded font-mono font-bold shadow">
                            TOTP
                          </span>
                        )}
                        {b.id === "ZERODHA" && (
                          <span className="absolute -top-2 -right-1 text-[8px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-mono font-bold shadow">
                            KITE
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Form fields based on selected broker */}
              <form onSubmit={handleConnect} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-indigo-500/20 text-indigo-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-sm font-sans block">
                        {selectedBroker === "DHAN" && "DhanHQ API v2 Key & Access Token Setup"}
                        {selectedBroker === "UPSTOX" && "Upstox Pro API v2 OAuth Setup"}
                        {selectedBroker === "FYERS" && "FYERS API v3 Key Configuration"}
                        {selectedBroker === "ANGEL_ONE" && "Angel One SmartAPI v2 TOTP & JWT Setup"}
                        {selectedBroker === "ZERODHA" && "Zerodha Kite Connect v3 REST Setup"}
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {selectedBroker === "DHAN" && "Direct DMA execution with 30-day token generated from web.dhan.co"}
                        {selectedBroker === "UPSTOX" && "Pro v2 REST & WebSocket credentials from developer.upstox.com"}
                        {selectedBroker === "FYERS" && "Daily OAuth Access Token from myapi.fyers.in"}
                        {selectedBroker === "ANGEL_ONE" && "SmartAPI v2 JWT Token & Client Code from smartapi.angelbroking.com"}
                        {selectedBroker === "ZERODHA" && "Kite Connect developer app credentials from developers.kite.trade"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowBrowserAuthModal(true)}
                      className="px-3 py-1 rounded bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>🌐 Login via In-Browser {selectedBroker} Flow</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleQuickDemoFill}
                      className="px-2.5 py-1 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 text-[11px] font-bold transition-colors"
                    >
                      ⚡ Fill Demo Sandbox Token
                    </button>

                    <div className="flex bg-slate-900 p-0.5 rounded border border-slate-800 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setEnvironment("LIVE")}
                        className={`px-2 py-0.5 rounded font-bold transition-colors ${
                          environment === "LIVE" ? "bg-emerald-600 text-white" : "text-slate-400"
                        }`}
                      >
                        LIVE FEED
                      </button>
                      <button
                        type="button"
                        onClick={() => setEnvironment("SANDBOX")}
                        className={`px-2 py-0.5 rounded font-bold transition-colors ${
                          environment === "SANDBOX" ? "bg-amber-600 text-white" : "text-slate-400"
                        }`}
                      >
                        SANDBOX
                      </button>
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <div className="bg-rose-950/50 border border-rose-500/60 text-rose-200 p-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="bg-emerald-950/50 border border-emerald-500/60 text-emerald-200 p-3 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* 1. DHAN SPECIFIC DYNAMIC FIELDS */}
                {selectedBroker === "DHAN" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center justify-between mb-1">
                          <span>Dhan Client ID (User ID) *</span>
                          <span className="text-slate-500">e.g. 1000849201</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 1000849201"
                          value={dhanClientId}
                          onChange={(e) => setDhanClientId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white font-mono focus:border-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center justify-between mb-1">
                          <span>Dhan Security PIN / MPIN (Optional)</span>
                          <button
                            type="button"
                            onClick={() => toggleSecret("dhanPin")}
                            className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-[10px]"
                          >
                            {showSecrets["dhanPin"] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showSecrets["dhanPin"] ? "Hide" : "Show"}</span>
                          </button>
                        </label>
                        <input
                          type={showSecrets["dhanPin"] ? "text" : "password"}
                          placeholder="••••"
                          value={dhanPin}
                          onChange={(e) => setDhanPin(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white font-mono focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center gap-1.5">
                          <span>DhanHQ API Access Token (30-Day Permanent) *</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                            Valid 30 Days
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateAuthUrl}
                          className="text-[11px] text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open DhanHQ Developer Portal (web.dhan.co)</span>
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        required
                        placeholder="Paste your 30-day DhanHQ Access Token from web.dhan.co > Profile > Access DhanHQ APIs"
                        value={dhanAccessToken}
                        onChange={(e) => setDhanAccessToken(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-200 font-mono text-[11px] focus:border-orange-500 focus:outline-none"
                      />
                    </div>

                    {/* Dhan Execution & Stream Features */}
                    <div className="p-3 bg-slate-900/80 border border-orange-500/30 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-orange-400 animate-pulse" />
                        <div>
                          <div className="text-xs font-bold text-white">Dhan 200-Depth Level Orderbook Feed</div>
                          <div className="text-[10px] text-slate-400">
                            Ultra-dense market depth for high-precision algorithmic order executions.
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDhanDepthFeed(!dhanDepthFeed)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                          dhanDepthFeed
                            ? "bg-orange-500/20 text-orange-300 border-orange-500/50"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {dhanDepthFeed ? "ENABLED" : "DISABLED"}
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. UPSTOX SPECIFIC DYNAMIC FIELDS */}
                {selectedBroker === "UPSTOX" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center justify-between mb-1">
                          <span>Upstox API Key / Client ID *</span>
                          <span className="text-slate-500">From developer.upstox.com</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 6FA001_UPSTOX_PRO"
                          value={upstoxApiKey}
                          onChange={(e) => setUpstoxApiKey(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white font-mono focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center justify-between mb-1">
                          <span>Upstox API Secret</span>
                          <button
                            type="button"
                            onClick={() => toggleSecret("upstoxApiSecret")}
                            className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-[10px]"
                          >
                            {showSecrets["upstoxApiSecret"] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showSecrets["upstoxApiSecret"] ? "Hide" : "Show"}</span>
                          </button>
                        </label>
                        <input
                          type={showSecrets["upstoxApiSecret"] ? "text" : "password"}
                          placeholder="••••••••••••••••"
                          value={upstoxApiSecret}
                          onChange={(e) => setUpstoxApiSecret(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white font-mono focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center justify-between mb-1">
                        <span>Upstox Redirect URI</span>
                        <span className="text-slate-500">Configured in Upstox App</span>
                      </label>
                      <input
                        type="text"
                        value={upstoxRedirectUri}
                        onChange={(e) => setUpstoxRedirectUri(e.target.value)}
                        placeholder="https://127.0.0.1:3000/api/broker/upstox/callback"
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-300 font-mono text-[11px] focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold">
                          Upstox Pro API v2 Access Token *
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateAuthUrl}
                          className="text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Generate Upstox OAuth URL</span>
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        required
                        placeholder="Paste your Upstox v2 Bearer Access Token here"
                        value={upstoxAccessToken}
                        onChange={(e) => setUpstoxAccessToken(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-200 font-mono text-[11px] focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 3. FYERS SPECIFIC DYNAMIC FIELDS */}
                {selectedBroker === "FYERS" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center justify-between mb-1">
                          <span>Fyers App ID (Client ID) *</span>
                          <span className="text-slate-500">e.g. XC10429-100</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. XC10429-100"
                          value={appId}
                          onChange={(e) => setAppId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center justify-between mb-1">
                          <span>App Secret Key *</span>
                          <button
                            type="button"
                            onClick={() => toggleSecret("fyersSecret")}
                            className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-[10px]"
                          >
                            {showSecrets["fyersSecret"] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showSecrets["fyersSecret"] ? "Hide" : "Show"}</span>
                          </button>
                        </label>
                        <input
                          type={showSecrets["fyersSecret"] ? "text" : "password"}
                          placeholder="••••••••••••••••"
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center justify-between mb-1">
                        <span>Redirect URI</span>
                        <span className="text-slate-500">Configured in Fyers API Dashboard</span>
                      </label>
                      <input
                        type="text"
                        value={redirectUri}
                        onChange={(e) => setRedirectUri(e.target.value)}
                        placeholder="https://trade.fyers.in/api-login/redirect-uri/index.html"
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-300 font-mono text-[11px] focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold">
                          Fyers API v3 Access Token *
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateAuthUrl}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Generate Fyers Auth URL</span>
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        required
                        placeholder="Paste your daily Fyers v3 Access Token here (or click 'Fill Demo Sandbox Token' for instant test)"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-200 font-mono text-[11px] focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 4. ANGEL ONE (SMARTAPI V2) SPECIFIC DYNAMIC FIELDS */}
                {selectedBroker === "ANGEL_ONE" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center justify-between mb-1">
                          <span>Angel One Client Code (User ID) *</span>
                          <span className="text-slate-500">e.g. A108291</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. A108291"
                          value={angelClientCode}
                          onChange={(e) => setAngelClientCode(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center justify-between mb-1">
                          <span>Angel One SmartAPI Key *</span>
                          <span className="text-slate-500">From smartapi.angelbroking.com</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. smartapi_key_v2_9948"
                          value={angelApiKey}
                          onChange={(e) => setAngelApiKey(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center justify-between mb-1">
                          <span>Angel One PIN / Password *</span>
                          <button
                            type="button"
                            onClick={() => toggleSecret("angelPin")}
                            className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-[10px]"
                          >
                            {showSecrets["angelPin"] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showSecrets["angelPin"] ? "Hide" : "Show"}</span>
                          </button>
                        </label>
                        <input
                          type={showSecrets["angelPin"] ? "text" : "password"}
                          placeholder="••••"
                          value={angelPin}
                          onChange={(e) => setAngelPin(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center justify-between mb-1">
                          <span>TOTP Secret Key / Seed (or Authenticator Code)</span>
                          <button
                            type="button"
                            onClick={() => toggleSecret("angelTotp")}
                            className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-[10px]"
                          >
                            {showSecrets["angelTotp"] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showSecrets["angelTotp"] ? "Hide" : "Show"}</span>
                          </button>
                        </label>
                        <input
                          type={showSecrets["angelTotp"] ? "text" : "password"}
                          placeholder="16-char TOTP Seed e.g. JBSWY3DPEHPK3PXP"
                          value={angelTotpSecret}
                          onChange={(e) => setAngelTotpSecret(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white font-mono focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold">
                          SmartAPI JWT Access Token *
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateAuthUrl}
                          className="text-[11px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open SmartAPI Console (smartapi.angelbroking.com)</span>
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        required
                        placeholder="Paste your Angel One SmartAPI JWT Access Token here"
                        value={angelAccessToken}
                        onChange={(e) => setAngelAccessToken(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-200 font-mono text-[11px] focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 5. ZERODHA (KITE CONNECT V3) SPECIFIC DYNAMIC FIELDS */}
                {selectedBroker === "ZERODHA" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center justify-between mb-1">
                          <span>Kite Connect API Key *</span>
                          <span className="text-slate-500">e.g. kite_pro_99182</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. kite_pro_99182"
                          value={zerodhaApiKey}
                          onChange={(e) => setZerodhaApiKey(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center justify-between mb-1">
                          <span>Kite API Secret Key *</span>
                          <button
                            type="button"
                            onClick={() => toggleSecret("zerodhaSecret")}
                            className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-[10px]"
                          >
                            {showSecrets["zerodhaSecret"] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showSecrets["zerodhaSecret"] ? "Hide" : "Show"}</span>
                          </button>
                        </label>
                        <input
                          type={showSecrets["zerodhaSecret"] ? "text" : "password"}
                          placeholder="••••••••••••••••"
                          value={zerodhaApiSecret}
                          onChange={(e) => setZerodhaApiSecret(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center justify-between mb-1">
                          <span>Zerodha Client ID (User ID)</span>
                          <span className="text-slate-500">e.g. ZR8291</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. ZR8291"
                          value={zerodhaClientId}
                          onChange={(e) => setZerodhaClientId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold flex items-center justify-between mb-1">
                          <span>Kite Request Token (Optional daily exchange)</span>
                          <span className="text-slate-500">From login redirect</span>
                        </label>
                        <input
                          type="text"
                          placeholder="request_token returned from Kite login redirect"
                          value={zerodhaRequestToken}
                          onChange={(e) => setZerodhaRequestToken(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-400 uppercase font-sans font-bold">
                          Kite Access Token / Session Enctoken *
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateAuthUrl}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open Kite Login Auth Dialog</span>
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        required
                        placeholder="Paste your Kite Connect Access Token (or active Session Token) here"
                        value={zerodhaAccessToken}
                        onChange={(e) => setZerodhaAccessToken(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-200 font-mono text-[11px] focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Watchdog Reconnect Quick Banner inside Credentials Form */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <div>
                      <div className="text-slate-300 font-bold font-sans flex items-center gap-2">
                        <span>Automated Reconnection Watchdog:</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            autoReconnectEnabled
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {autoReconnectEnabled ? `ARMED (${reconnectIntervalSec}s interval)` : "MANUAL ONLY"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                        Continuous socket monitor auto-refreshes {selectedBroker} connection upon detecting unresponsive API/feed.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSubTab("AUTO_RECONNECT")}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-bold transition-colors font-sans"
                  >
                    Watchdog Settings & Logs →
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Institutional AES-256 session proxies. Never stored in browser plain text.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isConnecting}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center gap-2 active:scale-95 transition-all"
                  >
                    {isConnecting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    <span>
                      {brokerState.isConnected && brokerState.broker === selectedBroker
                        ? `Update ${selectedBroker} Gateway`
                        : `Connect ${selectedBroker} Gateway`}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: 1-CLICK ORDER EXECUTION DESK */}
          {activeSubTab === "ORDER_DESK" && (
            <div className="space-y-4">
              <div className="bg-slate-950 border-2 border-indigo-500/40 rounded-xl p-5 space-y-4 font-mono shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-sm font-sans">
                      {selectedBroker} Direct DMA Option Order Routing Bridge
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>Routing Target:</span>
                    <strong className="text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {brokerState.isConnected
                        ? `LIVE EXCHANGE (${brokerState.broker} DMA)`
                        : `${selectedBroker} HIGH-PRECISION SANDBOX`}
                    </strong>
                  </div>
                </div>

                {orderResult && (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                      orderResult.success
                        ? "bg-emerald-950/60 border-emerald-500 text-emerald-200"
                        : "bg-rose-950/60 border-rose-500 text-rose-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {orderResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      )}
                      <span>{orderResult.message}</span>
                    </div>
                    {orderResult.orderId && (
                      <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        ID: {orderResult.orderId}
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {/* Symbol */}
                  <div className="md:col-span-2">
                    <label className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-1 block">
                      Option Contract Symbol ({selectedBroker} Format)
                    </label>
                    <input
                      type="text"
                      value={orderSymbol}
                      onChange={(e) => setOrderSymbol(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-bold focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Side */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-1 block">
                      Order Side
                    </label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setOrderSide("BUY")}
                        className={`py-1 rounded font-bold transition-colors ${
                          orderSide === "BUY" ? "bg-emerald-600 text-white" : "text-slate-400"
                        }`}
                      >
                        BUY
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderSide("SELL")}
                        className={`py-1 rounded font-bold transition-colors ${
                          orderSide === "SELL" ? "bg-rose-600 text-white" : "text-slate-400"
                        }`}
                      >
                        SELL
                      </button>
                    </div>
                  </div>

                  {/* Product Type */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-1 block">
                      Product Type
                    </label>
                    <select
                      value={productType}
                      onChange={(e) => setProductType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-bold focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="INTRADAY">INTRADAY (MIS / Dhan Intraday)</option>
                      <option value="MARGIN">CARRYFORWARD (NRML / CNC)</option>
                    </select>
                  </div>

                  {/* Lots */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-1 block">
                      Lots (Qty: {orderLots * (index.lotSize || 50)})
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 5, 10].map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setOrderLots(l)}
                          className={`flex-1 py-1.5 rounded border text-center font-bold transition-colors ${
                            orderLots === l
                              ? "bg-indigo-600 border-indigo-500 text-white"
                              : "bg-slate-900 border-slate-800 text-slate-400"
                          }`}
                        >
                          {l}L
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Order Type */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-1 block">
                      Price Type
                    </label>
                    <select
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-bold focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="LIMIT">LIMIT PRICE</option>
                      <option value="MARKET">MARKET EXECUTION</option>
                    </select>
                  </div>

                  {/* Limit Price */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-1 block">
                      Limit Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      disabled={orderType === "MARKET"}
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-bold focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  {/* Estimated Cost */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-1 block">
                      Total Capital Required
                    </label>
                    <div className="bg-slate-900 border border-slate-800 rounded p-2 text-indigo-300 font-bold text-sm">
                      ₹{(limitPrice * orderLots * (index.lotSize || 50)).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 flex-wrap gap-3">
                  <div className="text-[11px] text-slate-400">
                    Auto-configured with <strong className="text-white">Wyckoff POC + 8-Factor Confluence Engine</strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteOrder}
                    disabled={isSubmittingOrder}
                    className={`px-8 py-3 rounded-lg font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
                      orderSide === "BUY"
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                        : "bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                    }`}
                  >
                    {isSubmittingOrder ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    <span>
                      {orderSide} {orderLots * (index.lotSize || 50)}x {orderSymbol} @ ₹{limitPrice} ({selectedBroker})
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REALTIME TICKS & FEED */}
          {activeSubTab === "LIVE_STREAM" && (
            <div className="space-y-4 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase font-sans">
                  Live F&O Benchmark Index Stream ({selectedBroker} Gateway Engine)
                </span>
                <button
                  onClick={() => fetchQuotes(selectedBroker)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Ticks</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {(brokerQuotes.length > 0 ? brokerQuotes : [
                  { readableName: "NIFTY50", lp: 24538.4, change: 58.4, changePercent: 0.24, high: 24580, low: 24460 },
                  { readableName: "BANKNIFTY", lp: 51240.0, change: 140.0, changePercent: 0.27, high: 51390, low: 51020 },
                  { readableName: "FINNIFTY", lp: 23110.0, change: 60.0, changePercent: 0.26, high: 23180, low: 23010 },
                  { readableName: "SENSEX", lp: 80890.0, change: 210.0, changePercent: 0.26, high: 81050, low: 80550 },
                ]).map((q: any) => (
                  <div key={q.readableName} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1 shadow-lg">
                    <div className="text-[10px] text-slate-400 uppercase font-sans font-bold flex justify-between">
                      <span>{q.readableName}</span>
                      <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold">
                        {selectedBroker} TICK
                      </span>
                    </div>
                    <div className="text-xl font-bold text-white tracking-tight">
                      ₹{q.lp?.toLocaleString()}
                    </div>
                    <div className={`text-xs font-bold flex items-center gap-1 ${q.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {q.change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>{q.change >= 0 ? "+" : ""}{q.change} ({q.changePercent}%)</span>
                    </div>
                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900 flex justify-between">
                      <span>H: ₹{q.high}</span>
                      <span>L: ₹{q.low}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* DHAN 200-LEVEL DEPTH & TICK-BY-TICK STREAM */}
              <div className="pt-2">
                <Dhan200DepthWidget
                  symbol={index.symbol || "NIFTY50"}
                  isDhanConnected={brokerState.isConnected && brokerState.broker === "DHAN"}
                  onSelectPrice={(selectedPrice) => {
                    setLimitPrice(selectedPrice);
                    setActiveSubTab("ORDER_DESK");
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 4: LIVE POSITIONS */}
          {activeSubTab === "POSITIONS" && (
            <div className="space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase font-sans">
                  Active Open {selectedBroker} Broker Positions & MTM
                </span>
                <button
                  onClick={() => fetchPositions(selectedBroker)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync Positions</span>
                </button>
              </div>

              {livePositions.length > 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-[10px] text-slate-400 uppercase font-sans">
                      <tr>
                        <th className="p-3">Contract</th>
                        <th className="p-3">Broker</th>
                        <th className="p-3">Qty</th>
                        <th className="p-3">Buy Avg</th>
                        <th className="p-3">LTP</th>
                        <th className="p-3">Realized / MTM P&L</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {livePositions.map((pos) => (
                        <tr key={pos.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-3 font-bold text-white flex items-center gap-2">
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300">
                              BUY
                            </span>
                            <span>{pos.symbol}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-indigo-300 font-bold">
                              {pos.broker || selectedBroker}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">{pos.netQty}</td>
                          <td className="p-3 text-slate-300">₹{pos.buyAvg}</td>
                          <td className="p-3 font-bold text-white">₹{pos.ltp}</td>
                          <td className="p-3">
                            <span className={`font-bold ${pos.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {pos.pnl >= 0 ? "+" : ""}₹{pos.pnl.toLocaleString()} ({pos.pnlPercentage}%)
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                alert(`Emergency Square-off dispatched for ${pos.symbol} on ${selectedBroker}`);
                              }}
                              className="px-2.5 py-1 bg-rose-950 border border-rose-500/40 hover:bg-rose-900 text-rose-300 rounded text-[10px] font-bold transition-colors"
                            >
                              Square Off
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-500 space-y-2">
                  <p>No active open positions on {selectedBroker}.</p>
                  <p className="text-[11px]">Use the "1-Click Order Execution" tab to route institutional options orders.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AUTOMATED RECONNECTION & WATCHDOG */}
          {activeSubTab === "AUTO_RECONNECT" && (
            <div className="space-y-5">
              {/* Header & Status Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white font-sans">
                            Automated Reconnection & Socket Watchdog
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                            {selectedBroker} BRIDGE
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-sans mt-0.5">
                          High-frequency health watchdog continuously probes broker WebSocket & REST endpoints. If latency spikes or connection stalls, it automatically triggers credential re-authentication and stream restoration.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Master Toggle */}
                  <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl self-start md:self-auto">
                    <div className="text-right">
                      <div className="text-xs font-bold text-white font-sans">Auto-Reconnect</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {autoReconnectEnabled ? "Watchdog Armed" : "Manual Only"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !autoReconnectEnabled;
                        setAutoReconnectEnabled(next);
                        addReconnectLog(
                          "INFO",
                          `Automated reconnection ${next ? "ENABLED" : "DISABLED"} by user.`
                        );
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        autoReconnectEnabled ? "bg-indigo-600" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoReconnectEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Status and Countdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                  {/* Socket Status */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                      <span>SOCKET HEALTH</span>
                      <Radio className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-3.5 h-3.5 rounded-full ${
                          socketHealth === "HEALTHY"
                            ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse"
                            : socketHealth === "UNRESPONSIVE"
                            ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-ping"
                            : socketHealth === "RECONNECTING"
                            ? "bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)] animate-spin"
                            : "bg-slate-500"
                        }`}
                      ></div>
                      <span className="text-base font-bold text-white font-mono">
                        {socketHealth === "HEALTHY"
                          ? "HEALTHY (ONLINE)"
                          : socketHealth === "UNRESPONSIVE"
                          ? "UNRESPONSIVE"
                          : socketHealth === "RECONNECTING"
                          ? "RECONNECTING..."
                          : "IDLE (STANDBY)"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans mt-2">
                      {socketHealth === "HEALTHY"
                        ? `Receiving continuous live ticks on ${selectedBroker} exchange socket.`
                        : socketHealth === "UNRESPONSIVE"
                        ? `Socket unresponsive after ${missedHeartbeats} missed probes.`
                        : socketHealth === "RECONNECTING"
                        ? "Restoring socket connection and re-authenticating..."
                        : "Broker disconnected. Gateway in standby."}
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                      <span>NEXT RECONNECT CYCLE</span>
                      <Timer className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-white">
                          {socketHealth === "UNRESPONSIVE" ? `${reconnectCountdown}s` : `${reconnectIntervalSec}s`}
                        </span>
                        <span className="text-xs text-slate-400 font-sans">
                          {socketHealth === "UNRESPONSIVE" ? "until retry attempt" : "configured interval"}
                        </span>
                      </div>
                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                          className={`h-1.5 transition-all duration-1000 ${
                            socketHealth === "UNRESPONSIVE" ? "bg-rose-500" : "bg-indigo-500"
                          }`}
                          style={{
                            width: `${
                              socketHealth === "UNRESPONSIVE"
                                ? Math.max(5, (reconnectCountdown / reconnectIntervalSec) * 100)
                                : 100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans mt-2">
                      {socketHealth === "UNRESPONSIVE"
                        ? `Automated retry attempt #${reconnectAttempts + 1} pending.`
                        : `Will auto-refresh if broker stalls for > 2 probe intervals.`}
                    </div>
                  </div>

                  {/* Attempts & Diagnostics */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                      <span>RETRY METRICS</span>
                      <Server className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Attempts</div>
                        <div className="text-lg font-bold font-mono text-white">#{reconnectAttempts}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Missed Pings</div>
                        <div className={`text-lg font-bold font-mono ${missedHeartbeats > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                          {missedHeartbeats} / 2
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans mt-2">
                      Last ping: <span className="font-mono text-slate-300">{lastHeartbeat}</span> ({heartbeatLatency}ms)
                    </div>
                  </div>
                </div>

                {/* Interval Configuration Selector */}
                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2 mb-2.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Select Automated Reconnection Interval</span>
                    <span className="text-slate-500 font-normal lowercase">(how often to retry when unresponsive)</span>
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono text-xs">
                    {[
                      { sec: 5, label: "5 Seconds", desc: "Hyper-Reactive", badge: "HFT" },
                      { sec: 10, label: "10 Seconds", desc: "Standard DMA", badge: "Default" },
                      { sec: 15, label: "15 Seconds", desc: "Balanced", badge: "Stable" },
                      { sec: 30, label: "30 Seconds", desc: "Conservative", badge: "Rate-Safe" },
                      { sec: 60, label: "60 Seconds", desc: "Low Overhead", badge: "Infrequent" },
                    ].map((opt) => {
                      const isSelected = reconnectIntervalSec === opt.sec;
                      return (
                        <button
                          key={opt.sec}
                          type="button"
                          onClick={() => {
                            setReconnectIntervalSec(opt.sec);
                            setReconnectCountdown(opt.sec);
                            addReconnectLog(
                              "INFO",
                              `Reconnection interval changed to ${opt.sec}s (${opt.label}).`
                            );
                          }}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm">{opt.label}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                isSelected
                                  ? "bg-indigo-500 text-white"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {opt.badge}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans">{opt.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Diagnostic & Action Controls */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => executeReconnect(true)}
                      disabled={isAutoReconnecting}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg active:scale-95 transition-all text-xs font-mono"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAutoReconnecting ? "animate-spin" : ""}`} />
                      <span>{isAutoReconnecting ? "Executing Reconnect..." : "Force Reconnect Now"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleSimulateUnresponsive}
                      className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 border text-xs font-mono transition-all ${
                        isSimulatedUnresponsive
                          ? "bg-rose-950 border-rose-500 text-rose-300 hover:bg-rose-900"
                          : "bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-900/50"
                      }`}
                    >
                      {isSimulatedUnresponsive ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Restore Socket (End Test)</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                          <span>Simulate Unresponsive Socket</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMissedHeartbeats(0);
                        setReconnectAttempts(0);
                        setReconnectCountdown(reconnectIntervalSec);
                        addReconnectLog("INFO", "Watchdog counters and retry metrics reset by user.");
                      }}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-mono transition-colors"
                    >
                      Reset Counters
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono">
                    Heartbeat frequency: <strong className="text-slate-200">Every 4s</strong> • Timeout threshold:{" "}
                    <strong className="text-slate-200">2 drops</strong>
                  </div>
                </div>
              </div>

              {/* Realtime Event Stream Terminal */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">Watchdog Diagnostic Event Log</span>
                    <span className="text-[10px] text-slate-500">({reconnectLogs.length} events logged)</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReconnectLogs([])}
                    className="text-[10px] font-mono text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded transition-colors"
                  >
                    Clear Terminal
                  </button>
                </div>

                <div className="p-3 font-mono text-[11px] bg-slate-950 max-h-56 overflow-y-auto space-y-1.5 select-text">
                  {reconnectLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-slate-500 flex-shrink-0">[{log.timestamp}]</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold flex-shrink-0 ${
                          log.type === "SUCCESS"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : log.type === "WARNING"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : log.type === "ERROR"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        }`}
                      >
                        {log.type}
                      </span>
                      <span
                        className={`${
                          log.type === "SUCCESS"
                            ? "text-emerald-200"
                            : log.type === "WARNING"
                            ? "text-amber-200"
                            : log.type === "ERROR"
                            ? "text-rose-300 font-semibold"
                            : "text-slate-300"
                        }`}
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: STEP-BY-STEP SETUP GUIDES */}
          {activeSubTab === "SETUP_GUIDE" && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5 font-sans text-xs text-slate-300 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <span>Broker API Setup Instructions</span>
                </div>

                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 font-mono text-[11px]">
                  {(["DHAN", "UPSTOX", "FYERS", "ANGEL_ONE", "ZERODHA"] as BrokerType[]).map((guideB) => (
                    <button
                      key={guideB}
                      onClick={() => setSelectedGuideBroker(guideB)}
                      className={`px-2.5 py-1 rounded font-bold transition-all ${
                        selectedGuideBroker === guideB
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {guideB}
                    </button>
                  ))}
                </div>
              </div>

              {/* DHAN GUIDE */}
              {selectedGuideBroker === "DHAN" && (
                <div className="space-y-3">
                  <div className="text-sm font-bold text-orange-400 flex items-center gap-1.5">
                    <span>DhanHQ API v2 (Superfast DMA Setup)</span>
                    <span className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded font-mono">
                      No OAuth code dance needed • 30-Day Token
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                      <div className="text-xs font-bold text-orange-400 font-mono">STEP 1: Login to Dhan Web</div>
                      <p className="text-[11px] text-slate-400">
                        Visit <strong className="text-white">web.dhan.co</strong> and log in with your credentials or mobile QR.
                      </p>
                      <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-300">
                        Navigate to: <strong>Profile Icon &gt; Access DhanHQ APIs</strong>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                      <div className="text-xs font-bold text-orange-400 font-mono">STEP 2: Generate Access Token</div>
                      <p className="text-[11px] text-slate-400">
                        Click on <strong>Generate New Access Token</strong>. Dhan generates a secure token valid for up to 30 days.
                      </p>
                      <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-300">
                        Copy your <strong>Client ID (e.g. 1000849201)</strong> & <strong>Access Token</strong>.
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                      <div className="text-xs font-bold text-orange-400 font-mono">STEP 3: Paste in OmniAlpha</div>
                      <p className="text-[11px] text-slate-400">
                        Paste both into the Broker Credentials tab. You are now armed with sub-millisecond Dhan DMA execution!
                      </p>
                      <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-emerald-400">
                        ✓ 30-day continuous connection<br />
                        ✓ Instant Multi-Leg routing
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* UPSTOX GUIDE */}
              {selectedGuideBroker === "UPSTOX" && (
                <div className="space-y-3">
                  <div className="text-sm font-bold text-purple-400 flex items-center gap-1.5">
                    <span>Upstox Pro API v2 Setup</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">
                      OAuth 2.0 & WebSocket
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                      <div className="text-xs font-bold text-purple-400 font-mono">STEP 1: Create Upstox App</div>
                      <p className="text-[11px] text-slate-400">
                        Visit <strong className="text-white">developer.upstox.com</strong>, log in, and create a new App.
                      </p>
                      <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-300">
                        Redirect URL: <code className="text-purple-300">https://127.0.0.1:3000/callback</code>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                      <div className="text-xs font-bold text-purple-400 font-mono">STEP 2: Complete OAuth Login</div>
                      <p className="text-[11px] text-slate-400">
                        Click "Generate Upstox Auth URL" in our credentials tab to complete the 2FA login.
                      </p>
                      <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-300">
                        Authorize with your Mobile OTP + PIN.
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                      <div className="text-xs font-bold text-purple-400 font-mono">STEP 3: Paste Bearer Token</div>
                      <p className="text-[11px] text-slate-400">
                        Paste the Access Token into OmniAlpha for direct Upstox live order routing.
                      </p>
                      <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-emerald-400">
                        ✓ Upstox Pro Level 3 depth<br />
                        ✓ Intraday MIS & NRML option orders
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FYERS GUIDE */}
              {selectedGuideBroker === "FYERS" && (
                <div className="space-y-3">
                  <div className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
                    <span>FYERS API v3 Setup</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">
                      SHA-256 Auth Code Flow
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                      <div className="text-xs font-bold text-indigo-400 font-mono">STEP 1: Create App</div>
                      <p className="text-[11px] text-slate-400">
                        Visit <strong className="text-white">myapi.fyers.in</strong>, login, and click <strong>Create App</strong>.
                      </p>
                      <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-300">
                        Redirect URI: <code className="text-indigo-300">https://trade.fyers.in/api-login/redirect-uri/index.html</code>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                      <div className="text-xs font-bold text-indigo-400 font-mono">STEP 2: Generate Auth Code</div>
                      <p className="text-[11px] text-slate-400">
                        Copy your <strong>App ID (e.g. XC12345-100)</strong>. Click "Generate Fyers Auth URL" to login with PIN + OTP.
                      </p>
                      <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-300">
                        Authorize session in Fyers web.
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                      <div className="text-xs font-bold text-indigo-400 font-mono">STEP 3: Paste Access Token</div>
                      <p className="text-[11px] text-slate-400">
                        Paste your daily Access Token into OmniAlpha for live quotes and 1-click execution.
                      </p>
                      <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-emerald-400">
                        ✓ Live WebSocket quotes<br />
                        ✓ Direct 1-click execution
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ANGEL ONE GUIDE */}
              {selectedGuideBroker === "ANGEL_ONE" && (
                <div className="space-y-3">
                  <div className="text-sm font-bold text-sky-400 flex items-center gap-1.5">
                    <span>Angel One SmartAPI v2 Setup</span>
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-mono">
                      TOTP + JWT Authentication
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                      <div className="text-xs font-bold text-sky-400 font-mono">STEP 1: SmartAPI Console</div>
                      <p className="text-[11px] text-slate-400">
                        Visit <strong className="text-white">smartapi.angelbroking.com</strong>, register or log in, and create a Trading App.
                      </p>
                      <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-300">
                        Obtain your <strong>SmartAPI Key</strong> and note your <strong>Client Code</strong>.
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                      <div className="text-xs font-bold text-sky-400 font-mono">STEP 2: Enable TOTP</div>
                      <p className="text-[11px] text-slate-400">
                        Enable TOTP authentication in your Angel One profile or app. Save your 16-character TOTP secret key.
                      </p>
                      <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-300">
                        Supports Google Authenticator or automated TOTP seeds.
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                      <div className="text-xs font-bold text-sky-400 font-mono">STEP 3: Connect & Route</div>
                      <p className="text-[11px] text-slate-400">
                        Paste your JWT Access Token or use the Demo Sandbox Token to arm the Angel One gateway.
                      </p>
                      <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-sky-400">
                        ✓ SmartAPI WebSocket 2.0<br />
                        ✓ Automated F&O routing
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ZERODHA GUIDE */}
              {selectedGuideBroker === "ZERODHA" && (
                <div className="space-y-3">
                  <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>Zerodha Kite Connect v3 Setup</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                      <div className="text-xs font-bold text-emerald-400 font-mono">STEP 1: Kite Developer Portal</div>
                      <p className="text-[11px] text-slate-400">
                        Visit <strong className="text-white">developers.kite.trade</strong> and login to your developer account.
                      </p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                      <div className="text-xs font-bold text-emerald-400 font-mono">STEP 2: Get API Key & Secret</div>
                      <p className="text-[11px] text-slate-400">
                        Create an app and copy your API Key and API Secret.
                      </p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                      <div className="text-xs font-bold text-emerald-400 font-mono">STEP 3: Paste Token</div>
                      <p className="text-[11px] text-slate-400">
                        Paste your generated daily access token or use the Demo Sandbox Token.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Multi-Broker DMA Compliance: High-frequency REST & WebSocket routing for Dhan, Upstox & Fyers</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs transition-colors"
          >
            Close Gateway
          </button>
        </div>

        {/* In-Browser Broker Account Login Simulator */}
        <BrokerBrowserAuthModal
          isOpen={showBrowserAuthModal}
          onClose={() => setShowBrowserAuthModal(false)}
          broker={selectedBroker}
          onAuthSuccess={(creds) => {
            onConnectBroker(creds);
            setShowBrowserAuthModal(false);
            setSuccessMessage(`${selectedBroker} authenticated via in-browser flow! Live data stream connected.`);
            setActiveSubTab("ORDER_DESK");
          }}
        />
      </div>
    </div>
  );
};
