import { Dhan200DepthStream } from "../types/dhan200Depth";
import { TradeJournalEntry, AlgoExecutionLog } from "../types";

export interface CosmosConnectionConfig {
  endpoint: string;
  primaryKey: string;
  databaseId: string;
  collectionTbt: string;
  collectionTrades: string;
  collectionAuditLogs: string;
  isConfigured: boolean;
  isRecordingActive: boolean;
  bufferFlushIntervalMs: number;
  maxBatchSize: number;
}

export interface CosmosTelemetryStats {
  status: "CONNECTED" | "STANDBY" | "ERROR" | "BUFFERING";
  bufferedTbtTicks: number;
  totalTbtBatchesCommitted: number;
  totalTbtTicksRecorded: number;
  totalTradesRecorded: number;
  totalAuditLogsRecorded: number;
  lastCommittedAt?: string;
  lastErrorMessage?: string;
  activeRecordingSymbols: string[];
  connectedBrokers: ("DHAN" | "UPSTOX" | "FYERS" | "ANGEL_ONE" | "ZERODHA")[];
  activeBrokerSource: "DHAN" | "UPSTOX" | "FYERS" | "ANGEL_ONE" | "ZERODHA" | "MULTI_BROKER";
  estimatedRuPerSecond: number;
  compressionRatio: string;
}

export interface TbtBatchRecord {
  id: string; // e.g. NIFTY50_20260907_091500
  partitionKey: string; // symbol_date e.g. NIFTY50_20260907
  symbol: string;
  broker: "DHAN" | "UPSTOX" | "FYERS" | "ANGEL_ONE" | "ZERODHA";
  recordType: "TBT_STREAM_BATCH";
  timestamp: string;
  epochSecond: number;
  tickCount: number;
  ltp: number;
  vwap: number;
  totalBuyQty: number;
  totalSellQty: number;
  orderBookImbalanceRatio: number;
  feedLatencyMicroseconds: number;
  top20Levels: {
    level: number;
    bidPrice: number;
    bidQty: number;
    askPrice: number;
    askQty: number;
  }[];
  largeBlockOrdersCount: number;
}

export interface CosmosTradeDocument {
  id: string; // tradeId
  partitionKey: string; // index_date e.g. NIFTY50_2026-09-07
  recordType: "TRADE_LEDGER";
  trade: TradeJournalEntry;
  createdAt: string;
  brokerEnvironment: string;
}

export interface CosmosAuditLogDocument {
  id: string;
  partitionKey: string;
  recordType: "ALGO_AUDIT_LOG";
  log: AlgoExecutionLog;
  createdAt: string;
}
