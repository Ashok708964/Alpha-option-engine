import React, { useState, useEffect } from "react";
import {
  UnifiedNotificationConfig,
  NotificationDispatchLog,
  WhatsAppProvider,
} from "../types";
import {
  formatSignalNotification,
  formatOrderExecutionNotification,
  dispatchNotificationToChannels,
} from "../utils/notificationDispatcher";
import {
  Bell,
  Send,
  Radio,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Shield,
  Phone,
  Smartphone,
  Zap,
  ExternalLink,
  RefreshCw,
  Sliders,
  Check,
  Eye,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface UnifiedNotificationCenterProps {
  config: UnifiedNotificationConfig;
  onUpdateConfig: (config: UnifiedNotificationConfig) => void;
  onSendTestNotification?: (channel: "TELEGRAM" | "WHATSAPP" | "BOTH") => void;
}

export const UnifiedNotificationCenter: React.FC<UnifiedNotificationCenterProps> = ({
  config,
  onUpdateConfig,
  onSendTestNotification,
}) => {
  const [activeTab, setActiveTab] = useState<"TELEGRAM" | "WHATSAPP" | "TRIGGERS" | "LOGS">("TELEGRAM");
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    channel?: string;
    message?: string;
    success?: boolean;
    directLink?: string | null;
  } | null>(null);

  const [recentLogs, setRecentLogs] = useState<NotificationDispatchLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [previewType, setPreviewType] = useState<"BUY" | "SELL" | "ORDER">("BUY");

  // Fetch recent dispatch logs from backend
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/notifications/logs");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.logs) {
          setRecentLogs(data.logs);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch notification logs:", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Handle live test dispatch
  const handleTestDispatch = async (targetChannel: "TELEGRAM" | "WHATSAPP" | "BOTH") => {
    setTestStatus({ loading: true, channel: targetChannel, message: "Dispatching live test alert..." });

    try {
      let samplePayload;
      if (previewType === "ORDER") {
        samplePayload = formatOrderExecutionNotification(
          {
            id: `PT-TEST-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            index: "NIFTY50",
            planId: "PLAN-1",
            contract: "NIFTY 24500 CE",
            optionType: "CE",
            strike: 24500,
            entrySpotPrice: 24520.5,
            entryPremium: 145.0,
            currentSpotPrice: 24520.5,
            currentPremium: 145.0,
            target1: 24580.0,
            target2: 24640.0,
            stopLoss: 24470.0,
            lots: 2,
            lotSize: 25,
            capitalInvested: 7250,
            unrealizedPnl: 0,
            unrealizedRoi: 0,
            status: "ACTIVE",
            trailingSlActive: false,
            notes: "Test paper order execution notification",
          },
          "FYERS"
        );
      } else {
        samplePayload = formatSignalNotification("NIFTY50", {
          action: previewType === "BUY" ? "STRONG_BUY_CALL" : "SELL_TOP_PUT",
          recommendedContract: previewType === "BUY" ? "NIFTY 24550 CE" : "NIFTY 24450 PE",
          entryTriggerPrice: 24525.0,
          target1: previewType === "BUY" ? 24590.0 : 24460.0,
          target2: previewType === "BUY" ? 24650.0 : 24400.0,
          invalidationPrice: previewType === "BUY" ? 24480.0 : 24570.0,
          confidenceScore: 92,
          primaryDriver: "Triple Alpha Confluence & HFT Gamma Surge",
        });
      }

      const res = await fetch("/api/notifications/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channels: {
            telegram: {
              ...config.telegram,
              enabled: targetChannel === "TELEGRAM" || targetChannel === "BOTH",
            },
            whatsapp: {
              ...config.whatsapp,
              enabled: targetChannel === "WHATSAPP" || targetChannel === "BOTH",
            },
          },
          event: {
            type: samplePayload.type,
            symbol: "NIFTY50",
            title: samplePayload.title,
            message: samplePayload.plainMessage,
            htmlMessage: samplePayload.htmlMessage,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        const directUrl = data.results?.whatsapp?.directClickUrl || null;
        setTestStatus({
          loading: false,
          channel: targetChannel,
          success: true,
          message: `Alert dispatched successfully to ${targetChannel}! Mode: ${data.status}`,
          directLink: directUrl,
        });
        fetchLogs();
      } else {
        setTestStatus({
          loading: false,
          channel: targetChannel,
          success: false,
          message: data.message || "Dispatch returned warning (check credentials)",
        });
      }
    } catch (e: any) {
      setTestStatus({
        loading: false,
        channel: targetChannel,
        success: false,
        message: e.message || "Failed to reach notification server",
      });
    }

    setTimeout(() => {
      setTestStatus((prev) => (prev ? { ...prev, loading: false } : null));
    }, 6000);
  };

  // Sample preview text
  const previewData =
    previewType === "ORDER"
      ? formatOrderExecutionNotification(
          {
            id: "PT-PREVIEW",
            timestamp: new Date().toLocaleTimeString(),
            index: "NIFTY50",
            planId: "DEMO",
            contract: "NIFTY 24500 CE",
            optionType: "CE",
            strike: 24500,
            entrySpotPrice: 24520.0,
            entryPremium: 142.5,
            currentSpotPrice: 24520.0,
            currentPremium: 142.5,
            target1: 24580.0,
            target2: 24640.0,
            stopLoss: 24470.0,
            lots: 2,
            lotSize: 25,
            capitalInvested: 7125,
            unrealizedPnl: 0,
            unrealizedRoi: 0,
            status: "ACTIVE",
            trailingSlActive: false,
            notes: "Preview order execution notification",
          },
          "FYERS"
        )
      : formatSignalNotification("NIFTY50", {
          action: previewType === "BUY" ? "STRONG_BUY_CALL" : "SELL_TOP_PUT",
          recommendedContract: previewType === "BUY" ? "NIFTY 24500 CE" : "NIFTY 24500 PE",
          entryTriggerPrice: 24520.0,
          target1: previewType === "BUY" ? 24580.0 : 24460.0,
          target2: previewType === "BUY" ? 24640.0 : 24400.0,
          invalidationPrice: previewType === "BUY" ? 24475.0 : 24565.0,
          confidenceScore: 92,
          primaryDriver: "Real-time CVD Sweep + Bid Queue Imbalance",
        });

  return (
    <div id="unified-notification-center" className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-xl font-mono text-xs space-y-4">
      {/* Top Header: Title, Global Status & Master Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              WhatsApp & Telegram Signal Dispatch Gateway
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                MULTI-CHANNEL
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Instant mobile push notifications for Buy/Sell signals and live Order execution fills
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Telegram Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700 text-[11px]">
            <Send className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-300">Telegram:</span>
            <span
              className={`font-bold ${
                config.telegram.enabled ? "text-emerald-400" : "text-slate-500"
              }`}
            >
              {config.telegram.enabled ? "ACTIVE" : "OFF"}
            </span>
          </div>

          {/* WhatsApp Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700 text-[11px]">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300">WhatsApp:</span>
            <span
              className={`font-bold ${
                config.whatsapp.enabled ? "text-emerald-400" : "text-slate-500"
              }`}
            >
              {config.whatsapp.enabled ? "ACTIVE" : "OFF"}
            </span>
          </div>

          {/* Master Enable Switch */}
          <label className="cursor-pointer flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => onUpdateConfig({ ...config, enabled: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span
              className={`text-xs font-bold font-sans ${
                config.enabled ? "text-emerald-400" : "text-slate-500"
              }`}
            >
              {config.enabled ? "GATEWAY ARMED" : "GATEWAY MUTED"}
            </span>
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("TELEGRAM")}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === "TELEGRAM"
                ? "bg-sky-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram Bot Setup</span>
          </button>

          <button
            onClick={() => setActiveTab("WHATSAPP")}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === "WHATSAPP"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Gateway Setup</span>
          </button>

          <button
            onClick={() => setActiveTab("TRIGGERS")}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === "TRIGGERS"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Signal & Execution Triggers</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("LOGS");
              fetchLogs();
            }}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === "LOGS"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Dispatch History Logs ({recentLogs.length})</span>
          </button>
        </div>

        {/* Quick Test Alert Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTestDispatch("TELEGRAM")}
            disabled={testStatus?.loading}
            className="px-2.5 py-1 rounded bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-800/80 text-[11px] font-bold flex items-center gap-1 transition-colors"
          >
            <Send className="w-3 h-3" />
            <span>Test Telegram</span>
          </button>

          <button
            onClick={() => handleTestDispatch("WHATSAPP")}
            disabled={testStatus?.loading}
            className="px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 text-[11px] font-bold flex items-center gap-1 transition-colors"
          >
            <MessageSquare className="w-3 h-3" />
            <span>Test WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Test Status Banner */}
      {testStatus && (
        <div
          className={`p-2.5 rounded border flex items-center justify-between gap-2 text-xs font-mono ${
            testStatus.loading
              ? "bg-indigo-950/60 border-indigo-700/60 text-indigo-300 animate-pulse"
              : testStatus.success
              ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-300"
              : "bg-rose-950/60 border-rose-700/60 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {testStatus.loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : testStatus.success ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span>{testStatus.message}</span>
          </div>

          {testStatus.directLink && (
            <a
              href={testStatus.directLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 text-[11px]"
            >
              <span>Open in WhatsApp Web</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Main Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 cols: Active Configuration Editor */}
        <div className="lg:col-span-7 space-y-4">
          {/* TAB 1: TELEGRAM */}
          {activeTab === "TELEGRAM" && (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-white text-xs font-sans">
                    Telegram Bot Notification Channel
                  </span>
                </div>
                <label className="flex items-center gap-1.5 text-slate-300 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.telegram.enabled}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        telegram: { ...config.telegram, enabled: e.target.checked },
                      })
                    }
                    className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
                  />
                  <span>Enable Telegram Alerts</span>
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Telegram Bot Token
                  </label>
                  <input
                    type="password"
                    placeholder="e.g. 7123456789:AAFlkjhsdf897sdf_kjh234..."
                    value={config.telegram.botToken}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        telegram: { ...config.telegram, botToken: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 font-mono text-xs focus:border-sky-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block font-sans">
                    Obtain free in 30 seconds from @BotFather on Telegram (type /newbot)
                  </span>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Chat ID or Channel Username
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. @my_alpha_signals or 987654321 or -100123456789"
                    value={config.telegram.chatId}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        telegram: { ...config.telegram, chatId: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 font-mono text-xs focus:border-sky-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block font-sans">
                    Your personal Telegram user ID (from @userinfobot) or your private/public channel ID
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                      Message Formatting Mode
                    </label>
                    <select
                      value={config.telegram.parseMode || "HTML"}
                      onChange={(e) =>
                        onUpdateConfig({
                          ...config,
                          telegram: { ...config.telegram, parseMode: e.target.value as any },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 font-mono text-xs"
                    >
                      <option value="HTML">HTML (Formatted Bold/Italic)</option>
                      <option value="Markdown">Markdown</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => handleTestDispatch("TELEGRAM")}
                      className="w-full px-3 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Test Alert</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Guide Card */}
              <div className="mt-3 p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 font-sans space-y-1">
                <div className="font-bold text-sky-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> 3-Step Telegram Setup:
                </div>
                <div>1. Open Telegram and search <strong>@BotFather</strong>. Send <code>/newbot</code> and copy HTTP API Token.</div>
                <div>2. Send a message to <strong>@userinfobot</strong> to get your Chat ID (or add your bot to a channel as Admin).</div>
                <div>3. Paste Token & Chat ID above and click <strong>Send Test Alert</strong>!</div>
              </div>
            </div>
          )}

          {/* TAB 2: WHATSAPP */}
          {activeTab === "WHATSAPP" && (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-xs font-sans">
                    WhatsApp Gateway Configuration
                  </span>
                </div>
                <label className="flex items-center gap-1.5 text-slate-300 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.whatsapp.enabled}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        whatsapp: { ...config.whatsapp, enabled: e.target.checked },
                      })
                    }
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span>Enable WhatsApp Alerts</span>
                </label>
              </div>

              <div className="space-y-3">
                {/* Provider Selector */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    WhatsApp Gateway Provider
                  </label>
                  <select
                    value={config.whatsapp.provider}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        whatsapp: {
                          ...config.whatsapp,
                          provider: e.target.value as WhatsAppProvider,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-bold text-xs"
                  >
                    <option value="CALLMEBOT">CallMeBot (Free, Instant API - Recommended for Traders)</option>
                    <option value="TWILIO">Twilio WhatsApp Business API</option>
                    <option value="META">Meta WhatsApp Cloud API (Graph v20)</option>
                    <option value="WEBHOOK">Custom WhatsApp Webhook (Green API / Waboxapp)</option>
                    <option value="DIRECT_LINK">Click-to-Chat Direct Share Link (wa.me)</option>
                  </select>
                </div>

                {/* Recipient Phone Number */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Recipient WhatsApp Phone (with Country Code)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. +919876543210 or +14155552671"
                      value={config.whatsapp.phone}
                      onChange={(e) =>
                        onUpdateConfig({
                          ...config,
                          whatsapp: { ...config.whatsapp, phone: e.target.value },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded py-2 pl-9 pr-3 text-slate-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block font-sans">
                    Must include international code (+91 for India, +1 for USA, etc.)
                  </span>
                </div>

                {/* Provider Specific Inputs */}
                {config.whatsapp.provider === "CALLMEBOT" && (
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                      CallMeBot WhatsApp API Key
                    </label>
                    <input
                      type="password"
                      placeholder="e.g. 1234567"
                      value={config.whatsapp.apiKey || ""}
                      onChange={(e) =>
                        onUpdateConfig({
                          ...config,
                          whatsapp: { ...config.whatsapp, apiKey: e.target.value },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                    />
                    <div className="mt-2 p-2 rounded bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 font-sans space-y-0.5">
                      <div className="font-bold text-emerald-400">Instant Free Key Activation:</div>
                      <div>1. Add phone <strong>+34 644 44 22 24</strong> to your phone contacts as &quot;CallMeBot&quot;.</div>
                      <div>2. Send this exact WhatsApp message: <code>I allow callmebot to send me messages</code></div>
                      <div>3. It replies in 5 seconds with your API key. Paste it here!</div>
                    </div>
                  </div>
                )}

                {config.whatsapp.provider === "TWILIO" && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Twilio Account SID</label>
                      <input
                        type="text"
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={config.whatsapp.twilioSid || ""}
                        onChange={(e) =>
                          onUpdateConfig({
                            ...config,
                            whatsapp: { ...config.whatsapp, twilioSid: e.target.value },
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 font-mono text-xs mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Twilio Auth Token</label>
                      <input
                        type="password"
                        placeholder="Auth Token"
                        value={config.whatsapp.twilioToken || ""}
                        onChange={(e) =>
                          onUpdateConfig({
                            ...config,
                            whatsapp: { ...config.whatsapp, twilioToken: e.target.value },
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 font-mono text-xs mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Twilio From Number</label>
                      <input
                        type="text"
                        placeholder="+14155238886 (Twilio Sandbox Number)"
                        value={config.whatsapp.twilioFrom || "+14155238886"}
                        onChange={(e) =>
                          onUpdateConfig({
                            ...config,
                            whatsapp: { ...config.whatsapp, twilioFrom: e.target.value },
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 font-mono text-xs mt-1"
                      />
                    </div>
                  </div>
                )}

                {config.whatsapp.provider === "META" && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Meta Phone Number ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 104598273618293"
                        value={config.whatsapp.metaPhoneId || ""}
                        onChange={(e) =>
                          onUpdateConfig({
                            ...config,
                            whatsapp: { ...config.whatsapp, metaPhoneId: e.target.value },
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 font-mono text-xs mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Meta System Access Token</label>
                      <input
                        type="password"
                        placeholder="EAABwz..."
                        value={config.whatsapp.metaToken || ""}
                        onChange={(e) =>
                          onUpdateConfig({
                            ...config,
                            whatsapp: { ...config.whatsapp, metaToken: e.target.value },
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 font-mono text-xs mt-1"
                      />
                    </div>
                  </div>
                )}

                {config.whatsapp.provider === "WEBHOOK" && (
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                      Custom Webhook / Green-API URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://api.green-api.com/waInstance... or your webhook URL"
                      value={config.whatsapp.webhookUrl || ""}
                      onChange={(e) =>
                        onUpdateConfig({
                          ...config,
                          whatsapp: { ...config.whatsapp, webhookUrl: e.target.value },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 font-mono text-xs"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => handleTestDispatch("WHATSAPP")}
                    className="w-full px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send Test WhatsApp Alert</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRIGGERS */}
          {activeTab === "TRIGGERS" && (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4">
              <div className="pb-2 border-b border-slate-800">
                <span className="font-bold text-white text-xs font-sans">
                  Automated Signal & Order Dispatch Filters
                </span>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Select which automated market events will trigger WhatsApp & Telegram alerts
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Buy Signals Toggle */}
                <label className="flex items-center justify-between p-2.5 rounded bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <div>
                      <div className="font-bold text-white text-xs font-sans">
                        Buy Signals (Call Momentum / Dip Buy)
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        Alerts when Confluence, ORB, or Real-time Tick CVD triggers a Call entry
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.triggers.buySignals}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        triggers: { ...config.triggers, buySignals: e.target.checked },
                      })
                    }
                    className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 h-4 w-4"
                  />
                </label>

                {/* Sell Signals Toggle */}
                <label className="flex items-center justify-between p-2.5 rounded bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                    <div>
                      <div className="font-bold text-white text-xs font-sans">
                        Sell Signals (Put Protection / Top Sell)
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        Alerts when Bearish Breakdown or Heavy Ask Overhang triggers Put entry
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.triggers.sellSignals}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        triggers: { ...config.triggers, sellSignals: e.target.checked },
                      })
                    }
                    className="rounded bg-slate-950 border-slate-700 text-rose-500 focus:ring-0 h-4 w-4"
                  />
                </label>

                {/* Order Executed Toggle */}
                <label className="flex items-center justify-between p-2.5 rounded bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <div>
                      <div className="font-bold text-white text-xs font-sans">
                        Order Execution Signals (Fill Confirmations)
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        Sends instantaneous receipt with Fill Price, Lots, Invested Capital & Targets
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.triggers.orderExecution}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        triggers: { ...config.triggers, orderExecution: e.target.checked },
                      })
                    }
                    className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 h-4 w-4"
                  />
                </label>

                {/* Target & Stop Loss Hits Toggle */}
                <label className="flex items-center justify-between p-2.5 rounded bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <div>
                      <div className="font-bold text-white text-xs font-sans">
                        Target & Stop-Loss Notifications (Profit Booking)
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        Alerts immediately when Target 1, Target 2, or Hard SL is hit with realized P&L
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.triggers.targetAndStopLoss}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        triggers: { ...config.triggers, targetAndStopLoss: e.target.checked },
                      })
                    }
                    className="rounded bg-slate-950 border-slate-700 text-indigo-500 focus:ring-0 h-4 w-4"
                  />
                </label>

                {/* Minimum Confluence Threshold */}
                <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-sans">
                      Minimum Signal Score Threshold
                    </span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {config.triggers.minScore}% Confluence
                    </span>
                  </div>
                  <input
                    type="range"
                    min={65}
                    max={98}
                    step={1}
                    value={config.triggers.minScore}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        triggers: { ...config.triggers, minScore: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>65% (More Alerts)</span>
                    <span>85% (Optimal Institutional)</span>
                    <span>95% (Extreme Confluence Only)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DISPATCH LOGS */}
          {activeTab === "LOGS" && (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-white text-xs font-sans">
                  Notification Dispatch Audit Log (Last 50 Events)
                </span>
                <button
                  onClick={fetchLogs}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingLogs ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {recentLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No alerts dispatched yet. Click &quot;Send Test Alert&quot; to test your setup!
                </div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px] mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold ${
                              log.eventType.includes("BUY")
                                ? "bg-emerald-950 text-emerald-300"
                                : log.eventType.includes("SELL")
                                ? "bg-rose-950 text-rose-300"
                                : "bg-indigo-950 text-indigo-300"
                            }`}
                          >
                            {log.eventType}
                          </span>
                          <span className="text-slate-400 font-bold">{log.symbol || "F&O"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">{log.timestamp}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold ${
                              log.status === "DELIVERED"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                : log.status === "SIMULATED"
                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                : "bg-rose-950 text-rose-300 border border-rose-800"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                      </div>

                      <div className="text-white text-xs font-bold leading-tight">{log.title}</div>
                      <div className="text-slate-400 text-[10px] mt-1 line-clamp-2">{log.summary}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 5 cols: Live Message Preview Box */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white font-sans flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                Live Message Appearance
              </span>

              {/* Preview Type Selector */}
              <div className="flex items-center bg-slate-900 p-0.5 rounded text-[10px]">
                <button
                  onClick={() => setPreviewType("BUY")}
                  className={`px-2 py-0.5 rounded ${
                    previewType === "BUY" ? "bg-emerald-600 text-white font-bold" : "text-slate-400"
                  }`}
                >
                  Buy Signal
                </button>
                <button
                  onClick={() => setPreviewType("SELL")}
                  className={`px-2 py-0.5 rounded ${
                    previewType === "SELL" ? "bg-rose-600 text-white font-bold" : "text-slate-400"
                  }`}
                >
                  Sell Signal
                </button>
                <button
                  onClick={() => setPreviewType("ORDER")}
                  className={`px-2 py-0.5 rounded ${
                    previewType === "ORDER" ? "bg-amber-600 text-white font-bold" : "text-slate-400"
                  }`}
                >
                  Execution
                </button>
              </div>
            </div>

            {/* Simulated Phone Notification Mockup */}
            <div className="mt-3 space-y-2">
              {/* WhatsApp Bubble Preview */}
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-xs">
                <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-emerald-800/30">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    <MessageSquare className="w-3 h-3" /> WhatsApp Preview
                  </span>
                  <span className="text-[9px] text-slate-400">Just now</span>
                </div>
                <div className="whitespace-pre-wrap font-mono text-[11px] text-emerald-200 leading-relaxed">
                  {previewData.plainMessage}
                </div>
              </div>

              {/* Telegram Bubble Preview */}
              <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-800/40 text-xs">
                <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-sky-800/30">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                    <Send className="w-3 h-3" /> Telegram Bot Preview
                  </span>
                  <span className="text-[9px] text-slate-400">Just now</span>
                </div>
                <div
                  className="whitespace-pre-wrap font-mono text-[11px] text-sky-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: previewData.htmlMessage }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-sans flex items-center justify-between">
            <span>Payload automatically synthesized from live market feeds</span>
            <span className="text-emerald-400 font-bold font-mono">0.02s latency</span>
          </div>
        </div>
      </div>
    </div>
  );
};
