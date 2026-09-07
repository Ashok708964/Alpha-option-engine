export interface SubsystemSignalMetric {
  name: string;
  category: "CSV_LAYER_1" | "STOCHASTIC_LAYER_2" | "META_LEARNER";
  rawSignal: number;
  orthogonalSignal: number;
  confidence: number;
  weight: number;
  latencyUs: number;
  features: Record<string, number | string>;
}

export interface OrchestratorTelemetryState {
  timestampNs: number;
  symbol: string;
  ltp: number;
  ensembleAlpha: number;
  ensembleConfidence: number;
  csvLayerAlpha: number;
  stochasticLayerAlpha: number;
  detectedRegime: "LOW_VOL_CONSOLIDATION" | "HIGH_VOL_TRENDING" | "BREAKOUT_JUMP" | "EXHAUSTION_REVERT";
  executionVerdict: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  targetInventoryLots: number;
  reservationPrice: number;
  optimalBidQuote: number;
  optimalAskQuote: number;
  halfSpreadBps: number;
  orchestratorLatencyUs: number;
  subsystems: SubsystemSignalMetric[];
}

export interface Upstox30DepthLevel {
  level: number;
  bidPrice: number;
  bidQty: number;
  bidOrders: number;
  askPrice: number;
  askQty: number;
  askOrders: number;
  imbalancePct: number;
}

export interface Upstox30DepthSnapshot {
  symbol: string;
  instrumentKey: string;
  underlyingSpot: number;
  atmStrike: number;
  expiryDate: string;
  totalBidQty: number;
  totalAskQty: number;
  imbalanceRatio: number;
  levels: Upstox30DepthLevel[];
  bracketShiftDetected: boolean;
}

export interface L3QueueOrderNode {
  orderId: string;
  side: "BUY" | "SELL";
  price: number;
  qty: number;
  queuePosition: number;
  participantType: "HFT_MM" | "LATENCY_SNIPER" | "INSTITUTIONAL_ALGO" | "RETAIL";
  timestampMs: number;
}

export interface L3MicrostructureState {
  symbol: string;
  midPrice: number;
  spreadTicks: number;
  queueWaitTimeUs: number;
  sniperWinRatePct: number;
  adverseSelectionMarkoutBps: {
    ms1: number;
    ms5: number;
    ms25: number;
    ms100: number;
  };
  activeQueue: L3QueueOrderNode[];
}

export interface TcaAttributionSummary {
  parentOrderId: string;
  algoType: "ALMGREN_CHRISS_IS" | "BAYESIAN_VWAP" | "POV_CLAMPED";
  side: "BUY" | "SELL";
  totalQty: number;
  filledQty: number;
  arrivalPrice: number;
  avgExecPrice: number;
  marketVwap: number;
  implementationShortfallInr: number;
  implementationShortfallBps: number;
  vwapSlippageBps: number;
  totalFeesInr: number;
  urgencyParameterKappa: number;
  optimalTrajectory: { step: number; targetShares: number; executedShares: number }[];
}

export interface CpcvOverfittingAudit {
  totalCombinatorialPaths: number;
  numModelsAudited: number;
  pboScorePct: number;
  deflatedSharpeRatioPct: number;
  inSampleSharpeMean: number;
  outOfSampleSharpeMean: number;
  status: "NON_OVERFIT_ROBUST" | "MODERATE_SENSITIVITY" | "OVERFIT_REJECTED";
  pathDistributions: { pathId: number; isSharpe: number; oosSharpe: number; pboRank: number }[];
}
