/**
 * OmniAlpha Phase 3 - SVI (Stochastic Volatility Inspired) Surface Types
 */

export interface SVIParams {
  a: number;
  b: number;
  rho: number;
  m: number;
  sigma: number;
}

export interface DurrlemanViolation {
  k: number;
  density: number;
}

export interface ButterflyArbitrageCheck {
  has_butterfly_arbitrage: boolean;
  min_density: number;
  violation_count: number;
  violations: DurrlemanViolation[];
}

export interface SVIStrikePoint {
  strike: number;
  log_moneyness: number;
  market_iv: number;
  svi_iv: number;
  residual_bps: number;
  durrleman_density: number;
  call_delta: number;
  put_delta: number;
  gamma: number;
  vega: number;
  theta: number;
  vanna: number;
  volga: number;
}

export interface SVISliceData {
  name: string;
  dte: number;
  tau: number;
  forward: number;
  atm_iv: number;
  rmse_bps: number;
  svi_params: SVIParams;
  butterfly_arbitrage: ButterflyArbitrageCheck;
  points: SVIStrikePoint[];
}

export interface CalendarArbitrageViolation {
  tau1: number;
  tau2: number;
  k: number;
  w1: number;
  w2: number;
  deficit: number;
}

export interface CalendarArbitrageCheck {
  has_calendar_arbitrage: boolean;
  violation_count: number;
  violations: CalendarArbitrageViolation[];
}

export interface SurfaceGridRow {
  dte: number;
  [strike: string]: number;
}

export interface SkewSliceMetric {
  expiry_name: string;
  dte: number;
  tau: number;
  atm_iv: number;
  rr25: number;
  fly25: number;
  vol_25c: number;
  vol_25p: number;
  sentiment: string;
  interpretation: string;
}

export interface SkewAnalyticsData {
  slices_skew: SkewSliceMetric[];
  term_spread_atm_pct: number;
  term_structure_slope: string;
  mean_rr25: number;
  mean_fly25: number;
}

export interface StochasticModelsSuite {
  heston?: {
    params: { v0: number; kappa: number; theta: number; xi: number; rho: number };
    feller_check: { satisfied: boolean; feller_ratio: number; boundary_behavior: string };
    sample_call_30d: number;
  };
  sabr?: {
    params: { alpha: number; beta: number; rho: number; nu: number };
    sample_atm_iv_pct: number;
    sample_otm_put_iv_pct: number;
  };
  merton_jump?: {
    params: { sigma: number; lambda_jump: number; mu_jump: number; sigma_jump: number };
    sample_call_30d: number;
  };
}

export interface SVISurfaceState {
  status: string;
  symbol: string;
  spot_price: number;
  timestamp: string;
  total_expiries: number;
  calendar_arbitrage: CalendarArbitrageCheck;
  slices: SVISliceData[];
  surface_grid: SurfaceGridRow[];
  skew_analytics?: SkewAnalyticsData;
  stochastic_models?: StochasticModelsSuite;
}
