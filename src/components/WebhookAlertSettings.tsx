import React from "react";
import { UnifiedNotificationConfig, WebhookConfig } from "../types";
import { UnifiedNotificationCenter } from "./UnifiedNotificationCenter";

interface WebhookAlertSettingsProps {
  config: WebhookConfig | UnifiedNotificationConfig;
  onUpdateConfig: (config: any) => void;
  onTestDispatch?: () => void;
}

export const WebhookAlertSettings: React.FC<WebhookAlertSettingsProps> = ({
  config,
  onUpdateConfig,
  onTestDispatch,
}) => {
  // Normalize config to UnifiedNotificationConfig if legacy format is passed
  const isUnified = "telegram" in config && "whatsapp" in config;

  const normalizedConfig: UnifiedNotificationConfig = isUnified
    ? (config as UnifiedNotificationConfig)
    : {
        enabled: (config as WebhookConfig).enabled,
        telegram: {
          enabled: (config as WebhookConfig).platform === "TELEGRAM" || (config as WebhookConfig).enabled,
          botToken: (config as WebhookConfig).webhookUrl?.includes("bot")
            ? (config as WebhookConfig).webhookUrl.split("bot")[1]?.split("/")[0] || ""
            : "",
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
          minScore: (config as WebhookConfig).minScoreToTrigger || 85,
        },
      };

  const handleUpdate = (updated: UnifiedNotificationConfig) => {
    onUpdateConfig(updated);
  };

  return (
    <UnifiedNotificationCenter
      config={normalizedConfig}
      onUpdateConfig={handleUpdate}
    />
  );
};
