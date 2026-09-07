export interface CloudWorkerNode {
  id: string;
  name: string;
  role: "PRIMARY_FEED_COLOCATED" | "BACKUP_TICK_INGESTION" | "AUTONOMOUS_EXECUTION_BOT";
  zone: string;
  region: "asia-south1 (Mumbai)" | "asia-south2 (Delhi)" | "asia-southeast1 (Singapore)" | "us-central1 (Iowa)";
  ip: string;
  status: "ONLINE" | "CONNECTING" | "STANDBY" | "OFFLINE";
  pingMs: number;
  ticksPerSec: number;
  activeSockets: number;
  uptimeSeconds: number;
  cpuUsagePct: number;
  memoryMb: number;
  strategyBotRunning: boolean;
  activeStopLossCount: number;
  lastHeartbeat: string;
}

export interface HybridCloudStatus {
  cloudRun: {
    status: "HEALTHY" | "DEGRADED";
    region: string;
    trafficSplit: number;
    requestLatencyMs: number;
    activeInstances: number;
    geminiQuotaState: "NOMINAL" | "RATE_LIMITED";
  };
  computeEngineWorkers: CloudWorkerNode[];
  streamState: {
    activeBroker: "DHAN" | "UPSTOX" | "FYERS" | "ZERODHA" | "ANGELONE" | "DIRECT_EXCHANGE";
    feedProtocol: "BINARY_WEBSOCKET_TICK_STREAM" | "HTTP_POLLING_FALLBACK";
    ticksIngestedTotal: number;
    subMillisecondLatencyAvg: number;
    autonomousTrailingSlActive: boolean;
    autoHedgeEnabled: boolean;
  };
  lastSynced: string;
}
