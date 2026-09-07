export type IndexSymbol =
  | "NIFTY50"
  | "BANKNIFTY"
  | "SPX500"
  | "NASDAQ100"
  | "DOWJONES"
  | "FINNIFTY"
  | "BTCUSD";

export interface IndexInfo {
  symbol: IndexSymbol;
  name: string;
  category: "Indian Indices" | "US Indices" | "Global / Crypto";
  currentPrice: number;
  change: number;
  changePercent: number;
  lotSize: number;
  strikeStep: number;
  baseIV: number;
  currency: string;
}

export interface Candle {
  timestamp: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
  hftDelta: number; // Buy Vol - Sell Vol
  cumDelta: number; // Cumulative Volume Delta
  rsi: number;
  zigzagType?: "PEAK" | "VALLEY";
  zigzagPrice?: number;
  fvgZone?: {
    type: "BULLISH_FVG" | "BEARISH_FVG";
    top: number;
    bottom: number;
  };
  orderBlock?: {
    type: "BULLISH_OB" | "BEARISH_OB";
    top: number;
    bottom: number;
  };
}

export interface ZigZagPoint {
  index: number;
  time: number;
  timestamp: string;
  price: number;
  type: "PEAK" | "VALLEY";
  label: string; // e.g. "Swing High / Sell Top Zone", "Swing Low / Buy Dip Zone"
  confirmed: boolean;
  fibLevel?: number; // 0.382, 0.5, 0.618, 0.786
}

export interface OrderBookLevel {
  price: number;
  size: number;
  ordersCount: number;
  isIceberg?: boolean;
  totalCum: number;
}

export interface HFTTapePrint {
  id: string;
  time: string;
  price: number;
  size: number;
  side: "BUY" | "SELL";
  type: "AGGRESSIVE_MARKET" | "PASSIVE_ABSORPTION" | "ICEBERG_FILL" | "BLOCK_SWEEP";
}

export interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  iv: number;
  // Phase 4 Higher-Order Greeks (Optional Additive)
  vanna?: number;
  vomma?: number;
  charm?: number;
  veta?: number;
  color?: number;
  speed?: number;
  zomma?: number;
  ultima?: number;
  lot_delta?: number;
  rupee_gamma_1pct?: number;
  rupee_vega_1pct?: number;
  rupee_theta_day?: number;
}

export interface DetailedGreekRecord {
  strike: number;
  iv_pct: number;
  spot: number;
  tau: number;
  vol_pct: number;
  is_call: boolean;
  lot_size: number;
  first_order: {
    delta: number;
    vega: number;
    theta_annual: number;
    theta_daily: number;
    rho: number;
  };
  second_order: {
    gamma: number;
    vanna: number;
    vomma: number;
    charm: number;
    veta: number;
    color: number;
  };
  third_order: {
    speed: number;
    zomma: number;
    ultima: number;
  };
  cash_metrics: {
    lot_delta: number;
    rupee_theta_day: number;
    rupee_vega_1pct: number;
    rupee_gamma_1pct: number;
  };
}

export interface GreeksMatrixExpiry {
  expiry_name: string;
  dte: number;
  tau: number;
  atm_strike: number;
  calls: DetailedGreekRecord[];
  puts: DetailedGreekRecord[];
}

export interface GreeksMatrixState {
  status: string;
  symbol: string;
  spot_price: number;
  atm_strike: number;
  lot_size: number;
  atm_straddle_risk: {
    net_delta: number;
    net_gamma: number;
    net_vega: number;
    net_theta_daily: number;
    net_vanna: number;
    net_vomma: number;
    net_charm: number;
    rupee_theta_day: number;
    rupee_vega_1pct: number;
  };
  expiries: GreeksMatrixExpiry[];
}

// Phase 5 Optimal Execution & TCA Types
export interface ExecutionSlice {
  slice_idx: number;
  time_min: number;
  shares_to_trade: number;
  remaining_shares: number;
  pct_of_order: number;
  participation_rate_adv_pct?: number;
}

export interface AlmgrenChrissTrajectory {
  algorithm: string;
  total_shares: number;
  horizon_minutes: number;
  slices_count: number;
  urgency_parameter_kappa?: number;
  liquidation_half_life_min?: number;
  expected_cost_rupees?: number;
  expected_cost_bps: number;
  timing_risk_std_rupees?: number;
  timing_risk_bps: number;
  permanent_impact_rupees?: number;
  temporary_impact_rupees?: number;
  spread_cost_rupees?: number;
  schedule: ExecutionSlice[];
}

export interface BenchmarkSchedule {
  algorithm: string;
  total_shares: number;
  horizon_minutes?: number;
  slices_count?: number;
  schedule: ExecutionSlice[];
}

export interface ComparativeAlgorithmSummary {
  algorithm: string;
  urgency: string;
  expected_cost_bps: number;
  timing_risk_bps: number;
  max_single_slice_pct: number;
  optimal_for: string;
}

export interface StatutoryTaxBreakdown {
  stt_rupees: number;
  exchange_turnover_rupees: number;
  sebi_charges_rupees: number;
  stamp_duty_rupees: number;
  brokerage_rupees: number;
  gst_18pct_rupees: number;
  total_regulatory_rupees: number;
}

export interface TcaAnalysisResult {
  trade_value_rupees: number;
  market_impact_rupees?: number;
  market_impact_bps: number;
  statutory_taxes?: StatutoryTaxBreakdown;
  total_execution_cost_rupees?: number;
  total_cost_bps: number;
  effective_net_execution_price_impact?: number;
}

export interface OptimalExecutionResponse {
  status: string;
  symbol: string;
  spot_price: number;
  total_shares: number;
  trade_value_rupees: number;
  time_horizon_min: number;
  risk_aversion_lambda: number;
  almgren_chriss: AlmgrenChrissTrajectory;
  twap: BenchmarkSchedule;
  vwap: BenchmarkSchedule;
  comparative_algorithms: ComparativeAlgorithmSummary[];
  tca_analysis: TcaAnalysisResult;
}

// Phase 6 Event-Driven Backtesting & Microstructure Simulation Types
export interface BacktestTradeLog {
  trade_id: string;
  timestamp_ms: number;
  direction: "BUY" | "SELL";
  quantity: number;
  fill_price: number;
  commission: number;
  slippage_bps: number;
  realized_pnl: number;
  net_position: number;
  latency_us: number;
}

export interface BacktestEquityPoint {
  timestamp_ms: number;
  equity: number;
  position?: number;
  spot_price?: number;
}

export interface RiskAdjustedRatios {
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  omega_ratio: number;
  risk_free_rate_pct: number;
}

export interface DrawdownMetrics {
  max_drawdown_rupees: number;
  max_drawdown_pct: number;
  max_drawdown_duration_periods: number;
  recovery_factor: number;
}

export interface TailRiskMetrics {
  var_95_daily_pct: number;
  var_99_daily_pct: number;
  cvar_95_expected_shortfall_pct: number;
  cvar_99_expected_shortfall_pct: number;
  var_95_rupees: number;
  var_99_rupees: number;
}

export interface TradeStatistics {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate_pct: number;
  profit_factor: number;
  gross_profit_rupees?: number;
  gross_loss_rupees?: number;
  average_win_rupees: number;
  average_loss_rupees: number;
  payoff_ratio: number;
  expectancy_rupees: number;
  max_consecutive_wins: number;
  max_consecutive_losses: number;
}

export interface InstitutionalPerformanceMetrics {
  initial_capital: number;
  final_capital: number;
  total_pnl_rupees: number;
  total_return_pct: number;
  cagr_pct: number;
  annualized_vol_pct: number;
  risk_adjusted_ratios: RiskAdjustedRatios;
  drawdown: DrawdownMetrics;
  tail_risk: TailRiskMetrics;
  trade_statistics: TradeStatistics;
}

export interface BacktestSimulationResult {
  status: string;
  strategy_name: string;
  strategy_type: string;
  symbol: string;
  lot_size: number;
  total_ticks_processed: number;
  performance_metrics: InstitutionalPerformanceMetrics;
  equity_curve: BacktestEquityPoint[];
  trades_log: BacktestTradeLog[];
  total_trades_count: number;
}

// Phase 7 HFT Colocation & Linux Kernel OS Tuning Types
export interface HftLatencyBudgetStage {
  stage: string;
  subsystem: string;
  median_latency_ns: number;
  p99_latency_ns: number;
  description: string;
}

export interface HftLatencyBudget {
  total_median_tick_to_trade_us: number;
  total_p99_tick_to_trade_us: number;
  colocation_tier: string;
  target_sla_us: number;
  meets_sla: boolean;
  stages: HftLatencyBudgetStage[];
}

export interface HftKernelSysctlParam {
  param: string;
  value: string;
  purpose: string;
}

export interface HftNumaPinningRule {
  role: string;
  cores: string;
  numa_node: number;
  governor: string;
}

export interface HftKernelTuningManifest {
  kernel_version_target: string;
  grub_boot_parameters: string;
  sysctl_parameters: HftKernelSysctlParam[];
  numa_pinning_matrix: HftNumaPinningRule[];
  nic_offload_flags: string[];
}

export interface HftClockBenchmark {
  clock_source: string;
  samples_count: number;
  min_resolution_ns: number;
  median_resolution_ns: number;
  p99_resolution_ns: number;
  is_sub_microsecond: boolean;
  clock_jitter_rating: string;
}

export interface HftSystemProfileResponse {
  status: string;
  host_os: string;
  kernel_release: string;
  available_logical_cpus: number;
  clock_benchmark: HftClockBenchmark;
  tick_to_trade_budget: HftLatencyBudget;
  kernel_tuning_manifest: HftKernelTuningManifest;
  hardware_readiness_score: number;
}

export interface OptionContract {
  strike: number;
  type: "CALL" | "PUT";
  expiry: string;
  ltp: number;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
  oi: number;
  oiChange: number;
  volume: number;
  greeks: OptionGreeks;
  moneyness: "ITM" | "ATM" | "OTM" | "DEEP_ITM" | "DEEP_OTM";
  score: number; // 0-100 Suitability score for current strategy
}

export interface MarketHeadline {
  id: string;
  title: string;
  source: string;
  url?: string;
  snippet?: string;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  impact: "HIGH" | "MEDIUM" | "LOW";
  publishedTime?: string;
  relevance: string;
}

export interface GlobalSentimentData {
  score: number; // 0 - 100
  label: "STRONGLY_BULLISH" | "BULLISH" | "NEUTRAL" | "BEARISH" | "STRONGLY_BEARISH";
  macroSummary: string;
  keyDrivers: string[];
  headlines: MarketHeadline[];
  groundingSources?: Array<{ title: string; uri: string }>;
  lastUpdated: string;
  confidence: number;
  isLiveGrounded: boolean;
}

export interface PaperTradePosition {
  id: string;
  timestamp: string;
  index: IndexSymbol;
  planId: string;
  contract: string;
  optionType: "CE" | "PE" | "SPREAD";
  strike: number;
  entrySpotPrice: number;
  entryPremium: number;
  currentSpotPrice: number;
  currentPremium: number;
  target1: number;
  target2: number;
  stopLoss: number;
  lots: number;
  lotSize: number;
  capitalInvested: number;
  unrealizedPnl: number;
  unrealizedRoi: number;
  status: "ACTIVE" | "TARGET_1_HIT" | "TARGET_2_HIT" | "STOPPED_OUT" | "CLOSED_MANUALLY";
  trailingSlActive: boolean;
  notes: string;
  exitTime?: string;
  exitPremium?: number;
  realizedPnl?: number;
}

export interface MultiTimeframeAlignment {
  tf15m: { trend: "BULLISH" | "BEARISH" | "NEUTRAL"; bias: string; structure: string };
  tf5m: { trend: "BULLISH" | "BEARISH" | "NEUTRAL"; bias: string; structure: string };
  tf1m: { trend: "BULLISH" | "BEARISH" | "NEUTRAL"; bias: string; structure: string };
  isFullyAligned: boolean;
  confluencePercentage: number;
}

export interface MicrostructureVpin {
  vpinScore: number; // 0 - 100 toxicity index
  toxicityLevel: "LOW_BENIGN" | "MODERATE" | "HIGH_TOXIC" | "EXTREME_INSTITUTIONAL_SWEEP";
  gammaSqueezeRisk: "LOW" | "ELEVATED" | "HIGH_GAMMA_PIN" | "SQUEEZE_IMMINENT";
  absorptionRatio: number;
  dealerGammaPosture: "LONG_GAMMA_STABILIZING" | "SHORT_GAMMA_VOLATILE" | "NEUTRAL";
}

export interface ConfluenceLockFactor {
  id: string;
  name: string;
  category: "MICROSTRUCTURE" | "MARKET_STRUCTURE" | "GAMMA_GREEKS" | "FRACTAL_TF";
  status: "LOCKED" | "SYNCING" | "NEUTRAL";
  score: number;
  metric: string;
  details: string;
}

export interface PinpointPrecisionVector {
  arrowPiercingScore: number; // 0 - 100
  precisionStatus: "ARMED_PINPOINT_ZONE" | "PIERCING_ENTRY_TRIGGERED" | "ACCELERATING_TO_T1" | "TARGET_1_HIT" | "INVALIDATION_ZONE";
  goldenPocket: {
    fib618: number;
    fib786: number;
    pocPrice: number; // Volume Profile Point of Control
    valueAreaHigh: number;
    valueAreaLow: number;
  };
  entryZoneRange: {
    min: number;
    max: number;
    optimalTick: number;
  };
  invalidationTrigger: number; // Single-tick structural invalidation floor/ceiling
  projectedVelocity: "EXPLOSIVE_GAMMA" | "FAST_DIRECTIONAL" | "STEADY_ACCUMULATION";
  laserTargets: {
    t1_1272: number; // 1.272 Fib-ATR target
    t2_1618: number; // 1.618 Fib-ATR target
    t3_2618: number; // 2.618 Fib-ATR target
  };
  confluenceLocks: ConfluenceLockFactor[];
  strikeAccelerationEdge: string;
}

export interface StrategyConfluence {
  totalScore: number; // 0 - 100
  signal: "CONFIRMED_BUY_DIP" | "CONFIRMED_SELL_TOP" | "WAIT_ACCUMULATION" | "WAIT_DISTRIBUTION";
  hftScore: number; // 0 - 100
  hftDetails: string;
  smcScore: number; // 0 - 100 (Smart Money Concepts)
  smcDetails: string;
  zigzagScore: number; // 0 - 100 (Swing Wave)
  zigzagDetails: string;
  greeksScore: number; // 0 - 100 (Option surface)
  greeksDetails: string;
  oiScore: number; // 0 - 100 (Open Interest Max Pain / PCR)
  oiDetails: string;
  sentimentScore: number; // 0 - 100 (Google Search Grounded Sentiment)
  sentimentDetails: string;
  sentimentBias: "BULLISH" | "BEARISH" | "NEUTRAL";
  status: "CONFIRMED_HIGH_CONVICTION" | "STRONG_SETUP" | "DEVELOPING" | "NEUTRAL";
  timestamp: string;
  // Advanced Quant & Pinpoint Vector Enhancements
  mtfAlignment?: MultiTimeframeAlignment;
  vpinMetrics?: MicrostructureVpin;
  precisionVector?: PinpointPrecisionVector;
  atr14?: number;
  dynamicTarget1?: number;
  dynamicTarget2?: number;
  dynamicStopLoss?: number;
}

export interface ActionableTradePlan {
  id: string;
  index: IndexSymbol;
  action: "BUY_DIP_CALL" | "SELL_TOP_PUT" | "BULL_PUT_SPREAD" | "BEAR_CALL_SPREAD" | "IRON_CONDOR" | "BULL_CALL_SPREAD" | "BEAR_PUT_SPREAD";
  direction: "BULLISH" | "BEARISH" | "NEUTRAL";
  recommendedContract: string; // e.g. "NIFTY 23,500 CE 28-AUG"
  strike: number;
  optionType: "CE" | "PE";
  expiry: string;
  entrySpotPrice: number;
  entryOptionPremium: number;
  target1: number;
  target2: number;
  target3: number;
  stopLoss: number;
  riskReward: string;
  winProbability: number;
  capitalRequired: number;
  maxProfit: number | "UNLIMITED";
  maxLoss: number;
  rationale: string[];
  executionMode: "OPTION_BUYING" | "OPTION_SELLING" | "SPREAD_HEDGE";
  // Direct Option Contract Execution Blueprint
  contractAction: "BUY" | "SELL";
  contractFullName: string; // e.g. "NIFTY 24500 CE (Weekly)"
  lotSize: number;
  lotCapitalCost: number;
  target1OptionPremium: number;
  target2OptionPremium: number;
  target3OptionPremium: number;
  stopLossOptionPremium: number;
  target1LotProfit: number;
  target2LotProfit: number;
  stopLossLotRisk: number;
  // Quant Upgrade & Pinpoint Vector fields
  precisionVector?: PinpointPrecisionVector;
  atrVolatilityBand?: {
    atr: number;
    upperBand: number;
    lowerBand: number;
    volatilityRegime: "EXPANDING_MOMENTUM" | "NORMAL_ORDERLY" | "COMPRESSED_COIL";
  };
  spreadLegs?: {
    buyStrike: number;
    sellStrike: number;
    netDebitOrCredit: number;
    spreadWidth: number;
    breakEvenSpot: number;
  };
  greeksProfile?: {
    delta: number;
    gamma: number;
    theta: number;
    thetaToGammaRatio: number;
    vannaEdge: string;
  };
}

export interface InstitutionalParticipantFlow {
  fiiFuturesNetRatio: number; // e.g. 68% Long
  fiiNetContracts: number; // +24,500 contracts
  diiCashFlowCrores: number; // +1,850 Cr
  fiiCashFlowCrores: number; // +2,340 Cr
  proDeskBias: "CALL_WRITING_CEILING" | "PUT_WRITING_FLOOR" | "NEUTRAL_GAMMA_CAPTURE";
  retailSentiment: "OVER_LEVERAGED_CALLS" | "HEAVY_PUT_BUYING" | "BALANCED";
  smartMoneyDivergence: boolean;
}

export interface ZeroDteExpiryClock {
  isExpiryToday: boolean;
  expiryIndex: IndexSymbol;
  minutesToMarketClose: number;
  currentPhase: "OPENING_DISCOVERY" | "MIDDAY_THETA_CRUSH" | "HERO_ZERO_GAMMA_EXPANSION" | "EXPIRY_PINNING";
  recommendedStrategy: string;
  thetaDecayRatePerHour: number; // e.g. -18.5% / hr
  gammaSpikeProbability: number; // 0 - 100%
  safeStrikesRange: { lower: number; upper: number };
}

export interface OrbSetup {
  rangeHigh: number;
  rangeLow: number;
  midpoint: number;
  status: "INSIDE_RANGE" | "BULLISH_EXPANSION" | "BEARISH_BREAKDOWN";
  fibExtensions: {
    fib1618: number;
    fib2618: number;
    fib0618Retest: number;
  };
  breakoutTime?: string;
  volumeConfirmation: boolean;
}

export interface IvSkewPoint {
  strike: number;
  callIv: number;
  putIv: number;
  moneyness: number; // Strike / Spot
  skewSpread: number; // Put IV - Call IV (Volatility Smile tilt)
}

export interface GlobalCorrelationItem {
  asset: string;
  symbol: string;
  price: string;
  changePercent: number;
  correlationWithNifty: number; // -1.0 to +1.0
  sentimentImpact: "BULLISH_TAILWIND" | "BEARISH_HEADWIND" | "NEUTRAL";
}

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  chatId: string;
  parseMode?: "HTML" | "Markdown";
}

export type WhatsAppProvider = "CALLMEBOT" | "TWILIO" | "META" | "WEBHOOK" | "DIRECT_LINK";

export interface WhatsAppConfig {
  enabled: boolean;
  provider: WhatsAppProvider;
  phone: string; // e.g. +919876543210
  apiKey?: string; // For CallMeBot or Custom API
  webhookUrl?: string; // For Custom Webhook gateway
  twilioSid?: string;
  twilioToken?: string;
  twilioFrom?: string;
  metaPhoneId?: string;
  metaToken?: string;
}

export interface NotificationTriggers {
  buySignals: boolean;
  sellSignals: boolean;
  orderExecution: boolean;
  targetAndStopLoss: boolean;
  minScore: number;
}

export interface NotificationDispatchLog {
  id: string;
  timestamp: string;
  eventType: "BUY_SIGNAL" | "SELL_SIGNAL" | "ORDER_EXECUTED" | "TARGET_HIT" | "STOP_LOSS_HIT" | "TEST";
  channel: "TELEGRAM" | "WHATSAPP" | "BOTH";
  status: "DELIVERED" | "FAILED" | "SIMULATED";
  symbol?: string;
  title: string;
  summary: string;
  details?: string;
}

export interface UnifiedNotificationConfig {
  enabled: boolean;
  telegram: TelegramConfig;
  whatsapp: WhatsAppConfig;
  triggers: NotificationTriggers;
  recentLogs?: NotificationDispatchLog[];
}

export interface WebhookConfig {
  enabled: boolean;
  webhookUrl: string;
  platform: "DISCORD" | "TELEGRAM" | "CUSTOM";
  minScoreToTrigger: number;
  lastDispatchedAt?: string;
}

export interface BacktestTrade {
  id: string;
  date: string;
  index: IndexSymbol;
  type: "BUY_DIP" | "SELL_TOP";
  strategy: string;
  entryPrice: number;
  exitPrice: number;
  optionEntry: number;
  optionExit: number;
  pnl: number;
  roiPercent: number;
  status: "WIN" | "LOSS";
  duration: string;
  confluenceScore: number;
  trigger: string;
}

export interface BacktestStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // e.g. 84.5%
  profitFactor: number; // e.g. 3.42
  totalPnl: number;
  maxDrawdown: number; // e.g. 4.2%
  avgRiskReward: string;
  sharpeRatio: number;
  sortinoRatio: number;
  avgWinPnl: number;
  avgLossPnl: number;
}

export interface GexStrikeLevel {
  strike: number;
  callGex: number; // Millions $ / Cr
  putGex: number; // Millions $ / Cr
  netGex: number;
}

export interface GexProfile {
  totalNetGex: number; // Total net gamma
  gammaFlipLevel: number; // The strike where net gamma transitions from positive to negative
  regime: "POSITIVE_GAMMA_STICKY" | "NEGATIVE_GAMMA_ACCELERATOR";
  marketMakerPosture: "MM_BUYING_DIPS_SELLING_RALLIES" | "MM_PANIC_HEDGING_AMPLIFYING_MOVES";
  callWall: number; // Major resistance ceiling
  putWall: number; // Major support floor
  strikeLevels: GexStrikeLevel[];
}

export interface MonteCarloSimulationResult {
  expectedMove1Day: number;
  expectedMoveExpiry: number;
  oneSigmaUpper: number; // 68.2% Probability
  oneSigmaLower: number;
  twoSigmaUpper: number; // 95.4% Probability
  twoSigmaLower: number;
  probabilityOfProfit: number; // e.g. 78.4%
  probabilityOfTouchTarget: number; // e.g. 64.2%
  simulatedPaths: { step: number; p10: number; p50: number; p90: number; p99: number; p01: number }[];
}

export interface TimeframeSignal {
  timeframe: "1m" | "3m" | "5m" | "15m" | "1h" | "1D";
  trend: "STRONG_BULLISH" | "BULLISH" | "NEUTRAL" | "BEARISH" | "STRONG_BEARISH";
  emaRibbon: "BULLISH_STACK" | "BEARISH_STACK" | "CONVERGING";
  vwapRelation: "ABOVE_VWAP" | "TESTING_VWAP" | "BELOW_VWAP";
  supertrend: "GREEN" | "RED";
  rsi: number;
}

export interface MultiTimeframeMatrix {
  overallAlignmentScore: number; // 0-100%
  consensus: "STRONG_BUY" | "BUY" | "RANGE_BOUND" | "SELL" | "STRONG_SELL";
  timeframes: TimeframeSignal[];
}

export interface TaxAndSlippageBreakdown {
  stt: number; // Securities Transaction Tax
  exchangeTurnoverCharges: number;
  sebiTurnoverFee: number;
  gst: number; // 18% on charges + brokerage
  stampDuty: number;
  estimatedSlippage: number;
  totalCharges: number;
  netPnlAfterCharges: number;
}

// -------------------------------------------------------------
// Advanced Operations Research, Stochastic & Predictive Types
// -------------------------------------------------------------

export interface KellyOptimizationResult {
  winRate: number; // p
  lossRate: number; // q
  winLossRatio: number; // b (avg win / avg loss)
  fullKellyFraction: number; // f*
  halfKellyFraction: number;
  quarterKellyFraction: number;
  recommendedLots: number;
  optimalCapitalAllocation: number; // Currency amount
  maxDrawdownRisk: number; // %
  sharpeRatioExpected: number;
}

export interface KnapsackStrikeAllocation {
  strike: number;
  type: "CALL" | "PUT";
  premium: number;
  marginRequired: number;
  expectedPnl: number;
  roiScore: number;
  allocatedLots: number;
  totalCost: number;
  totalExpectedPnl: number;
  status: "ALLOCATED" | "SKIPPED_CAPITAL_LIMIT" | "HEDGE_LEG";
}

export interface RiskNeutralDensityPoint {
  strike: number;
  impliedDensity: number; // q(K) = e^(rT) * d^2C/dK^2
  logReturn: number;
  normalDensity: number; // Comparison with Gaussian bell curve
  cdfProbability: number;
  isItm: boolean;
}

export interface RiskMetricsStats {
  skewness: number; // Negative = fat left tail (crash risk)
  excessKurtosis: number; // >0 = Leptokurtic fat tails
  var95: number; // Value at Risk 95%
  var99: number; // Value at Risk 99%
  cvar95: number; // Conditional VaR / Expected Shortfall
  cvar99: number;
}

export interface SentimentPriceDivergenceMetrics {
  divergenceType: "BULLISH_EXHAUSTION_DIVERGENCE" | "BEARISH_EXHAUSTION_DIVERGENCE" | "CONFIRMING_MOMENTUM" | "EQUILIBRIUM_SYNC";
  divergenceIntensity: number; // 0 - 100
  hftNormalizedDelta: number; // -100 to +100
  groundedSentimentNormalized: number; // -100 to +100
  exhaustionRisk: "CRITICAL_EXHAUSTION" | "ELEVATED_DIVERGENCE" | "NORMAL_FLOW";
  divergenceSignal: string;
  smartMoneyAction: string;
}

export interface StochasticSimulationPath {
  timeStep: number;
  gbmPrice: number; // Geometric Brownian Motion
  hestonPrice: number; // Heston Stochastic Volatility
  mertonJumpPrice: number; // Poisson Jump-Diffusion
  ouSpread: number; // Ornstein-Uhlenbeck Mean-Reverting Spread
}

export interface HestonParams {
  kappa: number; // Mean reversion speed of volatility (e.g. 2.5)
  theta: number; // Long-term volatility variance (e.g. 0.04)
  xi: number; // Vol-of-vol (e.g. 0.35)
  rho: number; // Correlation between spot & vol (e.g. -0.72)
  v0: number; // Initial variance
}

export interface OrnsteinUhlenbeckParams {
  theta: number; // Speed of mean reversion
  mu: number; // Long-term mean equilibrium price
  sigma: number; // Volatility of spread
  halfLife: number; // Half-life of mean reversion in minutes (ln(2)/theta)
  currentZScore: number; // Standard deviations from equilibrium
}

export interface KalmanFilterState {
  rawPrice: number;
  filteredState: number; // Denoised true underlying price
  velocityTrend: number; // State velocity slope (dx/dt)
  kalmanGain: number; // Adaptive innovation weighting (0 to 1)
  errorCovariance: number;
  noiseReducedPercent: number;
}

export interface HmmRegimeClassification {
  currentRegime: "LOW_VOL_BULL" | "HIGH_VOL_BEAR" | "CHOPPY_MEAN_REVERTING";
  regimeProbabilities: {
    lowVolBull: number; // e.g. 0.68
    highVolBear: number; // e.g. 0.08
    choppyRange: number; // e.g. 0.24
  };
  transitionMatrix: number[][]; // 3x3 Markov transition probability
  expectedDurationBars: number;
  regimeColor: string;
  recommendedPlaybook: string;
}

export interface GarchVolForecast {
  currentVol: number;
  omega: number; // Constant variance drift (e.g. 0.000004)
  alpha: number; // ARCH parameter (reaction to market shock: alpha * e_{t-1}^2)
  beta: number; // GARCH parameter (persistence of past variance: beta * sigma_{t-1}^2)
  persistence: number; // alpha + beta (< 1 for stationarity)
  halfLifeDays: number; // ln(0.5) / ln(alpha + beta)
  longRunVol: number; // sqrt(omega / (1 - alpha - beta)) * 100
  annualizedForecastVol: number;
  volatilityRegime: "VOLATILITY_EXPANSION" | "VOLATILITY_CONTRACTION" | "EQUILIBRIUM";
  shockResidual: number; // e_{t-1} standard deviations
  forecastVol1Day: number;
  forecastVol5Day: number;
  termStructure: { day: number; forecastIv: number; lowerCi: number; upperCi: number }[];
  historicalVolComparison: { time: string; realizedVol: number; garchConditionalVol: number }[];
  
  // Dynamic Pinpoint Precision Risk Adjustments derived from GARCH(1,1)
  pinpointRiskAdjustments: {
    volatilityMultiplier: number; // e.g. 1.15x for elevated conditional variance
    dynamicStopMultiplier: number; // Dynamic ATR/POC buffer multiplier (e.g. 1.25x in high vol, 0.85x in low vol)
    dynamicTargetExtension: number; // Dynamic Fib target extension (e.g. 1.35x for vol expansion)
    recommendedPositionSizing: number; // % of standard Kelly lots (e.g. 80% if vol spikes to preserve capital)
    maxRiskPerTradeAdjustedInr: number;
    recommendedOptionStrategy: string;
    volClusterRiskWarning: string;
  };
}

export interface BayesianPosteriorEstimate {
  priorMean: number; // Prior belief (e.g. historical drift)
  priorVariance: number; // Uncertainty in prior
  observedEvidenceMean: number; // Intraday sample return
  observedVariance: number; // Sample noise
  posteriorMean: number; // Updated Bayesian expectation: (μ0/σ0^2 + x̄/(σ^2/n)) / (1/σ0^2 + n/σ^2)
  posteriorVariance: number;
  credibleInterval95: [number, number]; // 95% Bayesian Credible Interval [Lower, Upper]
  bullProbabilityUpdated: number; // P(Bull | Orderflow + Greeks Evidence)
  distributionPoints: { x: number; prior: number; likelihood: number; posterior: number }[];
}

export interface HurstExponentAnalysis {
  hurstValue: number; // H ∈ [0, 1]
  interpretation: "MEAN_REVERTING" | "RANDOM_WALK" | "PERSISTENT_TRENDING";
  confidenceLevel: number; // %
  rsValues: { lag: number; logLag: number; logRS: number }[];
  recommendedStrategy: string;
  fractalDimension: number; // D = 2 - H
}

export interface AutocorrelationPoint {
  lag: number; // Time lag (e.g. 1m, 2m, 3m... 15m)
  acfValue: number; // Autocorrelation function ρ(k) ∈ [-1, 1]
  pacfValue: number; // Partial Autocorrelation function
  statisticallySignificant: boolean; // Beyond Bartlett 95% confidence bands ±1.96 / sqrt(N)
  confidenceBandUpper: number;
  confidenceBandLower: number;
  marketMemoryType: "MOMENTUM_MEMORY" | "MEAN_REVERSION_MEMORY" | "NOISE";
}

export interface ScenarioStressTestResult {
  id: string;
  scenarioName: string;
  category: "BLACK_SWAN" | "RBN_RATE_SHOCK" | "FLASH_CRASH" | "GAP_VOL_SPIKE" | "LIQUIDITY_FREEZE";
  underlyingPriceShiftPct: number; // e.g. -4.5%
  ivShiftPct: number; // e.g. +85% IV spike
  liquiditySpreadMult: number; // e.g. 3.5x bid-ask widen
  estimatedPortfolioLoss: number;
  estimatedLossPct: number;
  deltaExposureChange: number;
  vegaExposureChange: number;
  gammaRiskSeverity: "LOW" | "MODERATE" | "HIGH" | "CATASTROPHIC";
  marginCallRisk: boolean;
  protectiveAction: string;
}

export interface AdvancedQuantMethodsBundle {
  bayesian: BayesianPosteriorEstimate;
  hurst: HurstExponentAnalysis;
  autocorrelation: AutocorrelationPoint[];
  stressTests: ScenarioStressTestResult[];
}

export interface OperationsResearchStochasticBundle {
  kelly: KellyOptimizationResult;
  knapsackAllocations: KnapsackStrikeAllocation[];
  riskNeutralDensity: RiskNeutralDensityPoint[];
  riskMetrics: RiskMetricsStats;
  stochasticPaths: StochasticSimulationPath[];
  hestonParams: HestonParams;
  ouParams: OrnsteinUhlenbeckParams;
  kalmanFilter: KalmanFilterState;
  hmmRegime: HmmRegimeClassification;
  garchForecast: GarchVolForecast;
  advancedMethods: AdvancedQuantMethodsBundle;
}

export interface WhatIfStressScenario {
  id: string;
  name: string;
  category: "VOLATILITY_SURGE" | "CENTRAL_BANK_RATE_SURPRISE" | "MACRO_INFLATION_SHOCK" | "GEOPOLITICAL_ESCALATION" | "EARNINGS_SURPRISE" | "LIQUIDITY_FLASH_FREEZE" | "FII_BLOCK_INJECTION" | "CUSTOM";
  description: string;
  timeHorizonMinutes: number; // e.g. 30 minutes
  volatilityShockPct: number; // e.g. +35% (IV increase) or -20% (IV crush)
  spotPriceShockPct: number; // e.g. -1.8% or +2.4%
  orderFlowCvdShock: number; // e.g. -45,000 lots or +35,000 lots
  groundedSentimentShift: number; // e.g. -40 points or +35 points
  liquiditySpreadMultiplier: number; // e.g. 2.5x spread widening
}

export interface WhatIfSimulationResult {
  scenario: WhatIfStressScenario;
  baselineConfluenceScore: number;
  simulatedConfluenceScore: number;
  confluenceDelta: number;
  baselineSignal: string;
  simulatedSignal: string;
  simulatedStatus: "STRONG_BUY_DIP" | "CONFIRMED_SELL_TOP" | "DEFENSIVE_HEDGE_REQUIRED" | "INVALIDATION_STOP_OUT" | "WAIT_ACCUMULATION";
  
  factorShifts: {
    hftDeltaScore: { before: number; after: number; delta: number; rationale: string };
    smcStructureScore: { before: number; after: number; delta: number; rationale: string };
    zigzagMomentumScore: { before: number; after: number; delta: number; rationale: string };
    greeksVegaGammaScore: { before: number; after: number; delta: number; rationale: string };
    oiMaxPainScore: { before: number; after: number; delta: number; rationale: string };
    macroSentimentScore: { before: number; after: number; delta: number; rationale: string };
  };

  baselineOptionPremium: number;
  simulatedSpotPrice: number;
  simulatedOptionPremium: number;
  optionPremiumDeltaPct: number;
  simulatedEstimatedPnl: number;
  isStopLossTriggered: boolean;
  isTarget1Triggered: boolean;
  
  simulatedIv: number;
  simulatedDelta: number;
  simulatedGammaRisk: "LOW" | "ELEVATED" | "HIGH_GAMMA_CLIFF" | "CATASTROPHIC";
  simulatedVegaPnlImpact: number;
  
  institutionalActionAdvice: string;
  recommendedDefensiveHedge: string;
  confluenceResilienceRating: "HIGH_RESILIENCE" | "MODERATE_SENSITIVITY" | "FRAGILE_TO_VOLATILITY";
}

// -------------------------------------------------------------
// Multi-Broker Gateway Types (FYERS, DHAN, UPSTOX, ZERODHA, ANGEL ONE)
// -------------------------------------------------------------

export type BrokerType = "FYERS" | "DHAN" | "UPSTOX" | "ZERODHA" | "ANGEL_ONE" | "SIMULATED";

export interface BrokerCredentials {
  broker: BrokerType;
  appId: string; // App ID / Client ID / API Key
  secretKey?: string; // App Secret / Secret Key
  accessToken: string; // Access Token / JWT Token
  refreshToken?: string;
  redirectUri?: string;
  pinOrTotp?: string;
  dhanClientId?: string;
  dhanAccessToken?: string;
  upstoxApiKey?: string;
  upstoxApiSecret?: string;
  upstoxAccessToken?: string;
  zerodhaApiKey?: string;
  zerodhaApiSecret?: string;
  zerodhaAccessToken?: string;
  zerodhaClientId?: string;
  zerodhaRequestToken?: string;
  angelOneApiKey?: string;
  angelOneClientCode?: string;
  angelOnePin?: string;
  angelOneTotpSecret?: string;
  angelAccessToken?: string;
  environment: "LIVE" | "SANDBOX";
  autoSyncQuotes: boolean;
  autoSyncPositions: boolean;
  isPaperTradingBridgeActive?: boolean;
}

export interface BrokerConnectionState {
  isConnected: boolean;
  broker: BrokerType;
  clientName?: string;
  clientId?: string;
  email?: string;
  availableBalance?: number;
  usedMargin?: number;
  statusMessage: string;
  lastSyncTimestamp?: string;
  latencyMs?: number;
  feedMode: "FYERS_API_V3" | "DHAN_HQ_V2" | "UPSTOX_PRO_V2" | "ZERODHA_KITE_V3" | "ANGEL_SMART_V2" | "SIMULATED_MICROSTRUCTURE";
  liveQuotesActive?: boolean;
}

export interface FyersLiveQuote {
  symbol: string; // e.g. "NSE:NIFTY50-INDEX"
  readableName: string;
  lp: number; // Last Traded Price
  open: number;
  high: number;
  low: number;
  prevClose: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

export interface BrokerLivePosition {
  id: string;
  symbol: string; // e.g. "NSE:NIFTY24AUG24500CE"
  buyQty: number;
  sellQty: number;
  netQty: number;
  buyAvg: number;
  sellAvg: number;
  ltp: number;
  pnl: number;
  pnlPercentage: number;
  productType: string;
  broker: BrokerType;
}

export interface BrokerOrderRequest {
  broker: BrokerType;
  symbol: string; // e.g. "NSE:NIFTY24AUG24500CE"
  indexSymbol?: IndexSymbol;
  optionType?: "CE" | "PE" | "FUT";
  strike?: number;
  qty: number;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT" | "STOP_LIMIT";
  limitPrice?: number;
  stopPrice?: number;
  targetPrice?: number;
  productType: "INTRADAY" | "MARGIN" | "CNC";
  tag?: string;
}

export interface BrokerOrderResponse {
  success: boolean;
  orderId: string;
  broker: BrokerType;
  message: string;
  executedPrice?: number;
  status: "SUBMITTED" | "FILLED" | "REJECTED" | "SIMULATED";
  timestamp: string;
}

// -------------------------------------------------------------
// 4-Level Autonomous Algorithmic Engine & Auto-Upgrader
// -------------------------------------------------------------

export type AlgoLevel = 
  | "LEVEL_1_CONFLUENCE_BOT"      // Auto-trigger on >= 88% Arrow-Piercing Confluence
  | "LEVEL_2_DYNAMIC_BRACKET"     // Dynamic Trailing SL & Step-up Bookers
  | "LEVEL_3_MULTI_LEG_BUNDLER"   // Bull Spreads, Iron Condors & Delta-Neutral Hedging
  | "LEVEL_4_TELEGRAM_WEBHOOK";   // Real-time mobile webhook dispatcher & 1-tap remote execution

export interface AlgoBotConfig {
  id: string;
  name: string;
  level: AlgoLevel;
  isActive: boolean;
  minConfluenceThreshold: number; // e.g. 88%
  maxRiskPerTradeInr: number;    // e.g. 5000
  lotSizeMultiplier: number;     // e.g. 1-5 lots
  stopLossMode: "POC_INVALIDATION" | "FIXED_PERCENT" | "VOLATILITY_ATR";
  stopLossPercent: number;        // e.g. 15%
  target1ExitRatio: number;       // e.g. 0.50 (Book 50% at T1)
  target2ExitRatio: number;       // e.g. 0.50 (Runner)
  trailingSlStepPercent: number;  // e.g. 5% trail once T1 hit
  autoHedgeWithCreditSpread: boolean;
  enableTelegramWebhook: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  webhookUrl?: string;
  cooldownPeriodSeconds: number;  // e.g. 180s
  lastTriggerTimestamp?: string;
  totalTriggerCount: number;
  totalPnlRealizedInr: number;
  winRate: number;
}

export interface MultiLegStrategyTemplate {
  id: string;
  name: string;
  description: string;
  direction: "BULLISH" | "BEARISH" | "NEUTRAL" | "HIGH_VOLATILITY";
  legs: {
    side: "BUY" | "SELL";
    optionType: "CE" | "PE";
    strikeOffset: number; // e.g. 0 for ATM, +100 for OTM
    lotRatio: number;     // e.g. 1
  }[];
  marginBenefitPct: number;
  maxProfitEst: number;
  maxLossEst: number;
  popPct: number; // Probability of Profit
}

export interface AlgoExecutionLog {
  id: string;
  timestamp: string;
  level: AlgoLevel;
  triggerReason: string;
  contract: string;
  index: IndexSymbol;
  side: "BUY" | "SELL";
  price: number;
  qty: number;
  status: "FILLED" | "TRAILING_TRIGGERED" | "TARGET_BOOKED" | "DISPATCHED";
  pnlInr?: number;
  txHashOrOrderId?: string;
  rawDetails?: string;
}

// -------------------------------------------------------------
// Trade Journal, Profit Visualization & Export Suite
// -------------------------------------------------------------

export type EmotionalState = 
  | "DISCIPLINED" 
  | "CONFIDENT" 
  | "FOMO" 
  | "HESITANT" 
  | "REVENGE_TRADING" 
  | "GREEDY" 
  | "PATIENT";

export type TradeMistakeTag = 
  | "NONE_PERFECT_EXECUTION"
  | "CHASED_AFTER_BREAKOUT"
  | "MOVED_STOP_LOSS"
  | "EXITED_PREMATURELY"
  | "OVERSIZED_POSITION"
  | "IGNORED_HTF_BIAS"
  | "FOUGHT_TREND";

export type StrategySetupType = 
  | "ARROW_PIERCING_CONFLUENCE"
  | "WYCKOFF_SPRING_TEST"
  | "FVG_IMBALANCE_FILL"
  | "DELTA_DIVERGENCE"
  | "GAMMA_PIN_EXPIRY"
  | "LIQUIDITY_SWEEP";

export interface TradeJournalEntry {
  id: string;
  date: string;              // YYYY-MM-DD
  time: string;              // HH:MM:SS
  index: IndexSymbol;
  contract: string;          // e.g. NIFTY 24500 CE
  direction: "BULLISH" | "BEARISH";
  executionSide: "BUY" | "SELL";
  setupType: StrategySetupType;
  entryPrice: number;
  exitPrice: number;
  qty: number;
  lotSize: number;
  pnlInr: number;
  roiPct: number;
  rMultiple: number;          // e.g. +2.4R or -1.0R
  confluenceScore: number;    // e.g. 92%
  emotionalState: EmotionalState;
  mistakeTag: TradeMistakeTag;
  executionGrade: "A+" | "A" | "B" | "C" | "F";
  notes: string;
  tags: string[];
  brokerOrderId?: string;
  chartSnapshotUrl?: string;
}

export interface ProfitAnalyticsSummary {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRatePct: number;
  grossProfitInr: number;
  grossLossInr: number;
  netProfitInr: number;
  profitFactor: number;
  expectancyInr: number;
  avgWinInr: number;
  avgLossInr: number;
  maxDrawdownInr: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  largestWinInr: number;
  largestLossInr: number;
  avgHoldDurationMin: number;
}

export interface EquityCurvePoint {
  tradeNumber: number;
  date: string;
  tradePnl: number;
  cumulativePnl: number;
  drawdownInr: number;
  benchmarkInr: number;
}

export interface DailyPnlHeatmapCell {
  date: string;
  dayOfWeek: number; // 0-6
  pnlInr: number;
  tradeCount: number;
  winRatePct: number;
}

// -------------------------------------------------------------
// Real-Time Market Data Feed, Ticks, Order Book & Strategy Engine
// -------------------------------------------------------------

export interface FuturesTick {
  tickId: string;
  timestamp: number;
  formattedTime: string;
  contract: string; // e.g. "NIFTY-FUT-NEAR"
  price: number;
  qty: number;
  side: "BUY" | "SELL";
  tickDirection: "UPTICK" | "DOWNTICK" | "ZERO_UPTICK" | "ZERO_DOWNTICK";
  basisToSpot: number; // Futures Price - Spot Price
  basisBps: number;
  cumulativeDelta: number;
  microPrice: number;
  tradeType: "SWEEP" | "REGULAR" | "BLOCK" | "ICEBERG";
}

export interface OptionsTick {
  tickId: string;
  timestamp: number;
  formattedTime: string;
  contract: string; // e.g. "NIFTY 24500 CE"
  strike: number;
  optionType: "CE" | "PE";
  expiry: string;
  price: number;
  qty: number;
  side: "BUY" | "SELL";
  iv: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  oi: number;
  oiChange: number;
  tickMomentum: number; // -100 to +100
  tradeType: "SWEEP" | "REGULAR" | "BLOCK" | "ICEBERG";
}

export interface LiveDepthOfMarket {
  timestamp: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  totalBidQty: number;
  totalAskQty: number;
  imbalanceRatio: number; // totalBidQty / (totalBidQty + totalAskQty)
  spread: number;
  spreadBps: number;
  weightedMidPrice: number;
  microPrice: number;
  topBidWall: { price: number; size: number; ordersCount: number };
  topAskWall: { price: number; size: number; ordersCount: number };
  queuePressure: "HEAVY_BUY_PRESSURE" | "BALANCED" | "HEAVY_SELL_PRESSURE";
}

export interface MarketNewsItem {
  id: string;
  timestamp: number;
  timeStr: string;
  title: string;
  source: string;
  url?: string;
  category: "MACRO" | "DERIVATIVES" | "CENTRAL_BANK" | "EARNINGS" | "GEOPOLITICAL";
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  sentimentScore: number; // 0 to 100
  impact: "HIGH" | "MEDIUM" | "LOW";
  strategyInfluence: string; // Specific F&O insight on how this news shifts options/futures bias
  targetInstruments: string[];
}

export interface RealtimeStrategySignal {
  signalId: string;
  generatedAt: string;
  timestamp: number;
  symbol: IndexSymbol;
  action: 
    | "STRONG_BUY_CALL" 
    | "BUY_DIP_CALL" 
    | "STRONG_SELL_PUT" 
    | "SELL_TOP_PUT" 
    | "GAMMA_SQUEEZE_LONG" 
    | "ORDER_BOOK_SQUEEZE_SHORT" 
    | "DELTA_NEUTRAL_HEDGE" 
    | "WAIT_ACCUMULATION";
  confidenceScore: number; // 0 to 100
  primaryDriver: "TICK_MOMENTUM" | "ORDER_BOOK_IMBALANCE" | "NEWS_CATALYST" | "TRIPLE_CONFLUENCE";
  tickDeltaBias: "AGGRESSIVE_BUYERS" | "AGGRESSIVE_SELLERS" | "BALANCED";
  orderBookPressure: "STRONG_BID_SUPPORT" | "STRONG_ASK_OVERHANG" | "NEUTRAL";
  newsCatalystBias: "BULLISH_TAILWIND" | "BEARISH_HEADWIND" | "MUTED";
  recommendedContract: string;
  recommendedStrike: number;
  recommendedOptionType: "CE" | "PE";
  entryTriggerPrice: number;
  target1: number;
  target2: number;
  invalidationPrice: number; // Hard stop-loss
  expectedRiskReward: string;
  slippageEstimateBps: number;
  executionRationale: string[];
  liveFeedStatus: "STREAMING" | "PAUSED" | "RECONNECTING";
}

export interface RealtimeMarketFeedState {
  symbol: IndexSymbol;
  spotPrice: number;
  futuresLtp: number;
  basisPoints: number;
  basisPercent: number;
  futuresTicks: FuturesTick[];
  optionsTicks: OptionsTick[];
  depthOfMarket: LiveDepthOfMarket;
  newsFeed: MarketNewsItem[];
  strategySignal: RealtimeStrategySignal;
  ticksPerSecond: number;
  totalTicksIngested: number;
  cumulativeVolumeDelta: number;
  connectionState: "CONNECTED" | "CONNECTING" | "STREAMING" | "RECONNECTING" | "DISCONNECTED";
  lastPacketTimestamp: string;
  feedLatencyMs: number;
}





