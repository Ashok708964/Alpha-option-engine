import { UnifiedNotificationConfig, RealtimeStrategySignal, PaperTradePosition, ActionableTradePlan, NotificationDispatchLog } from "../types";

export interface DispatchNotificationParams {
  type: "BUY_SIGNAL" | "SELL_SIGNAL" | "ORDER_EXECUTED" | "TARGET_HIT" | "STOP_LOSS_HIT" | "TEST";
  symbol: string;
  title: string;
  message: string;
  htmlMessage?: string;
  config: UnifiedNotificationConfig;
}

export async function dispatchNotificationToChannels(
  params: DispatchNotificationParams
): Promise<{ success: boolean; logEntry?: NotificationDispatchLog; results?: any }> {
  const { type, symbol, title, message, htmlMessage, config } = params;

  if (!config.enabled) {
    return { success: false, results: { note: "Notifications are disabled in settings." } };
  }

  // Check trigger filters
  if (type === "BUY_SIGNAL" && !config.triggers.buySignals) return { success: false };
  if (type === "SELL_SIGNAL" && !config.triggers.sellSignals) return { success: false };
  if (type === "ORDER_EXECUTED" && !config.triggers.orderExecution) return { success: false };
  if ((type === "TARGET_HIT" || type === "STOP_LOSS_HIT") && !config.triggers.targetAndStopLoss) return { success: false };

  try {
    const res = await fetch("/api/notifications/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channels: {
          telegram: config.telegram,
          whatsapp: config.whatsapp,
        },
        event: {
          type,
          symbol,
          title,
          message,
          htmlMessage: htmlMessage || message,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: data.success, logEntry: data.logEntry, results: data.results };
    }
  } catch (err) {
    console.warn("Notification dispatch failed:", err);
  }

  return { success: false };
}

// -------------------------------------------------------------
// Formatters for Trading Signals & Order Executions
// -------------------------------------------------------------

export function formatSignalNotification(
  symbol: string,
  signal: {
    action: string;
    recommendedContract: string;
    entryTriggerPrice: number;
    target1: number;
    target2: number;
    invalidationPrice: number;
    confidenceScore: number;
    primaryDriver?: string;
    rationale?: string;
  }
) {
  const isBuy = signal.action.includes("BUY") || signal.action.includes("LONG") || signal.action.includes("CALL");
  const type = isBuy ? "BUY_SIGNAL" : "SELL_SIGNAL";
  const emoji = isBuy ? "🟢" : "🔴";
  const actionLabel = isBuy ? "BUY SIGNAL (CALL ACCELERATION)" : "SELL SIGNAL (PUT PROTECTION)";

  const plainMessage = 
`${emoji} *${symbol} ${actionLabel}*
━━━━━━━━━━━━━━━━━━━━
🎯 *Contract:* ${signal.recommendedContract}
⚡ *Entry Trigger:* ₹${signal.entryTriggerPrice.toFixed(2)}
📊 *Confidence:* ${signal.confidenceScore}% Confluence
🚀 *Driver:* ${signal.primaryDriver || "Triple Alpha Confluence"}

🎯 *Target 1:* ₹${signal.target1.toFixed(2)}
🏆 *Target 2:* ₹${signal.target2.toFixed(2)}
🛑 *Stop Loss:* ₹${signal.invalidationPrice.toFixed(2)}

⏱ *Time:* ${new Date().toLocaleTimeString()}
🤖 *System:* OmniAlpha F&O Institutional Gateway`;

  const htmlMessage = 
`<b>${emoji} ${symbol} ${actionLabel}</b>
━━━━━━━━━━━━━━━━━━━━
<b>Contract:</b> <code>${signal.recommendedContract}</code>
<b>Entry Trigger:</b> ₹${signal.entryTriggerPrice.toFixed(2)}
<b>Confidence:</b> <b>${signal.confidenceScore}%</b> Confluence
<b>Driver:</b> ${signal.primaryDriver || "Triple Alpha Confluence"}

🎯 <b>Target 1:</b> ₹${signal.target1.toFixed(2)}
🏆 <b>Target 2:</b> ₹${signal.target2.toFixed(2)}
🛑 <b>Stop Loss:</b> ₹${signal.invalidationPrice.toFixed(2)}

<i>Time: ${new Date().toLocaleTimeString()}</i>
<i>System: OmniAlpha F&O Institutional Gateway</i>`;

  return {
    type: type as "BUY_SIGNAL" | "SELL_SIGNAL",
    title: `${emoji} ${symbol} ${signal.action}`,
    plainMessage,
    htmlMessage,
  };
}

export function formatOrderExecutionNotification(
  position: PaperTradePosition,
  brokerName: string = "FYERS"
) {
  const isBuy = position.optionType === "CE";
  const emoji = "⚡";

  const plainMessage = 
`${emoji} *ORDER EXECUTED - ${position.index}*
━━━━━━━━━━━━━━━━━━━━
📦 *Contract:* ${position.contract}
🛒 *Action:* BUY ${position.lots} Lots (${position.lotSize * position.lots} Qty)
💰 *Fill Premium:* ₹${position.entryPremium.toFixed(2)}
💵 *Capital Invested:* ₹${position.capitalInvested.toLocaleString()}
📍 *Spot at Entry:* ₹${position.entrySpotPrice.toFixed(2)}

🎯 *Target 1:* ₹${position.target1.toFixed(2)}
🏆 *Target 2:* ₹${position.target2.toFixed(2)}
🛑 *Hard SL:* ₹${position.stopLoss.toFixed(2)}

🏛 *Routing:* ${brokerName} Direct Market Gateway
⏱ *Executed At:* ${position.timestamp || new Date().toLocaleTimeString()}`;

  const htmlMessage = 
`<b>${emoji} ORDER EXECUTED - ${position.index}</b>
━━━━━━━━━━━━━━━━━━━━
<b>Contract:</b> <code>${position.contract}</code>
<b>Action:</b> BUY <b>${position.lots} Lots</b> (${position.lotSize * position.lots} Qty)
<b>Fill Premium:</b> ₹${position.entryPremium.toFixed(2)}
<b>Capital Invested:</b> ₹${position.capitalInvested.toLocaleString()}
<b>Spot at Entry:</b> ₹${position.entrySpotPrice.toFixed(2)}

🎯 <b>Target 1:</b> ₹${position.target1.toFixed(2)}
🏆 <b>Target 2:</b> ₹${position.target2.toFixed(2)}
🛑 <b>Hard SL:</b> ₹${position.stopLoss.toFixed(2)}

<i>Routing: ${brokerName} Direct Market Gateway</i>
<i>Executed At: ${position.timestamp || new Date().toLocaleTimeString()}</i>`;

  return {
    type: "ORDER_EXECUTED" as const,
    title: `⚡ Order Executed: ${position.contract}`,
    plainMessage,
    htmlMessage,
  };
}

export function formatExitNotification(
  position: PaperTradePosition,
  exitType: "TARGET_HIT" | "STOP_LOSS_HIT" | "MANUAL_EXIT" | "TARGET_1_HIT" | "STOPPED_OUT" | "CLOSED_MANUALLY",
  pnl: number,
  roi: number
) {
  const isWin = pnl >= 0;
  const isTarget = exitType === "TARGET_HIT" || exitType === "TARGET_1_HIT";
  const isSL = exitType === "STOP_LOSS_HIT" || exitType === "STOPPED_OUT";
  const emoji = isTarget ? "🎯" : isSL ? "🛑" : "💼";
  const titleText = isTarget ? "TARGET REACHED - PROFIT SECURED" : isSL ? "STOP-LOSS TRIGGERED - RISK PROTECTED" : "POSITION CLOSED";

  const plainMessage = 
`${emoji} *${titleText}*
━━━━━━━━━━━━━━━━━━━━
📦 *Contract:* ${position.contract}
📈 *Realized P&L:* ${isWin ? "+" : ""}₹${Math.round(pnl).toLocaleString()} (${roi.toFixed(1)}%)
💰 *Exit Premium:* ₹${position.currentPremium.toFixed(2)}
📍 *Exit Spot:* ₹${position.currentSpotPrice.toFixed(2)}
⏱ *Close Time:* ${new Date().toLocaleTimeString()}

🤖 *Status:* Position Fully Settled`;

  const htmlMessage = 
`<b>${emoji} ${titleText}</b>
━━━━━━━━━━━━━━━━━━━━
<b>Contract:</b> <code>${position.contract}</code>
<b>Realized P&L:</b> <b>${isWin ? "+" : ""}₹${Math.round(pnl).toLocaleString()} (${roi.toFixed(1)}%)</b>
<b>Exit Premium:</b> ₹${position.currentPremium.toFixed(2)}
<b>Exit Spot:</b> ₹${position.currentSpotPrice.toFixed(2)}
<i>Close Time: ${new Date().toLocaleTimeString()}</i>

<i>Status: Position Fully Settled</i>`;

  return {
    type: (exitType === "TARGET_HIT" ? "TARGET_HIT" : "STOP_LOSS_HIT") as "TARGET_HIT" | "STOP_LOSS_HIT",
    title: `${emoji} ${titleText}: ${position.contract}`,
    plainMessage,
    htmlMessage,
  };
}
