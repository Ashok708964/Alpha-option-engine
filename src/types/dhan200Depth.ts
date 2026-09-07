export interface DepthLevel {
  level: number;
  bidOrders: number;
  bidQty: number;
  bidPrice: number;
  askPrice: number;
  askQty: number;
  askOrders: number;
  bidCumulativeQty: number;
  askCumulativeQty: number;
  depthImbalance: number; // -100 to +100
}

export interface Dhan200DepthSlot {
  slotNumber: number; // 1 to 5
  symbol: string;
  exchange: "NSE_FO" | "NSE_EQ" | "BSE_FO" | "MCX_FO";
  instrumentType: "INDEX_FUT" | "INDEX_OPT" | "STOCK_FUT" | "STOCK_EQ";
  isActive: boolean;
  subscribedAt: string;
  ltp?: number;
  imbalanceRatio?: number;
}

export interface Dhan200DepthStream {
  symbol: string;
  exchange: "NSE_FO" | "NSE_EQ" | "MCX_FO" | "BSE_FO";
  timestamp: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
  totalBuyQty: number;
  totalSellQty: number;
  orderBookImbalanceRatio: number; // Total Buy / Total Sell
  tbtTickSequence: number;
  feedLatencyMicroseconds: number; // TBT sub-millisecond packet latency
  colocatedWorker: "asia-south1-mumbai-hft-01";
  packetProtocol: "DHAN_TBT_BINARY_WEBSOCKET_200_DEPTH";
  activeSlotIndex?: number; // 1 to 5
  totalSlotsUsed?: number; // max 5
  levels: DepthLevel[];
  largeBlockOrders: {
    side: "BUY" | "SELL";
    price: number;
    qty: number;
    time: string;
    level: number;
  }[];
}

export interface DynamicSlotAllocationRule {
  role: "ATM_CE" | "ATM_PE" | "HIGHEST_OI_CE" | "HIGHEST_OI_PE" | "HIGHEST_VOLUME";
  roleLabel: string;
  underlying: "NIFTY50" | "BANKNIFTY" | "FINNIFTY" | "SENSEX";
  strikePrice: number;
  optionType: "CE" | "PE";
  contractSymbol: string;
  metricValue: string; // e.g. "OI: 1.48 Cr" or "Vol: 8.9L"
}

export interface DualBrokerFeedConfig {
  dhan200Depth: {
    enabled: boolean;
    activeSlots: DynamicSlotAllocationRule[];
    mode: "AUTO_DYNAMIC_5_SLOTS" | "CUSTOM_MANUAL";
  };
  companionBroker20Depth: {
    broker: "ZERODHA" | "FYERS" | "UPSTOX" | "ANGELONE" | "ALICEBLUE" | "SHOONYA" | "IIFL" | "KOTAK_NEO";
    enabled: boolean;
    subscribedIndices: ("NIFTY50" | "BANKNIFTY" | "FINNIFTY" | "SENSEX")[];
    depthLevels: 20;
  };
}

export interface Companion20DepthStream {
  broker: string;
  symbol: string;
  underlying: string;
  instrumentType: "INDEX_FUT" | "INDEX_SPOT" | "INDEX_OPT";
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  totalBuyQty: number;
  totalSellQty: number;
  imbalanceRatio: number;
  levels: DepthLevel[];
  timestamp: string;
}


