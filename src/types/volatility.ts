/**
 * OmniAlpha Phase 2 Volatility Estimators & Jump Disentanglement Types
 */

export interface EstimatorMetric {
  name: string;
  symbol: string;
  annualized_vol_pct: number;
  relative_efficiency: number;
  description: string;
}

export interface JumpDisentanglement {
  realized_variance: number;
  bipower_variation: number;
  continuous_vol: number;
  jump_vol: number;
  jump_ratio: number;
  z_stat: number;
  has_jump: boolean;
  confidence_level: string;
}

export interface VolatilityConeHorizon {
  horizon_days: number;
  min_vol: number;
  p25_vol: number;
  median_vol: number;
  p75_vol: number;
  max_vol: number;
  current_vol: number;
  iv_percentile: number;
}

export interface VolatilityConeData {
  horizons: VolatilityConeHorizon[];
}

export interface VixTenorPoint {
  tenor: string;
  days: number;
  vix: number;
  ratio_to_1m: number;
}

export interface IndiaVixMetrics {
  vix_spot: number;
  vix_fut_near: number;
  vix_fut_next: number;
  basis_near: number;
  basis_pct: number;
  calendar_spread: number;
  regime: string;
  regime_desc: string;
  vix_rank_1y: number;
  vix_percentile_1y: number;
  vvix?: number;
  tenors?: VixTenorPoint[];
  term_structure_metrics?: {
    contango_slope_1m_1d_pct: number;
    contango_slope_3m_1m_pct: number;
    annualized_roll_yield_pct: number;
    is_contango: boolean;
    vol_of_vol_status: string;
  };
}

export interface CrossAssetComparison {
  symbol: string;
  ltp: number;
  sigma_cc: number;
  sigma_p: number;
  sigma_gk: number;
  sigma_rs: number;
  sigma_yz: number;
  efficiency_gain_vs_cc: string;
  name?: string;
  sector?: string;
  weight_pct?: number;
  lot_size?: number;
  overnight_jump_ratio?: number;
}

export interface VolatilitySuiteState {
  status: string;
  symbol: string;
  current_ltp: number;
  timestamp: string;
  lookback_window_days: number;
  estimators: {
    close_to_close: EstimatorMetric;
    parkinson: EstimatorMetric;
    garman_klass: EstimatorMetric;
    rogers_satchell: EstimatorMetric;
    yang_zhang: EstimatorMetric;
  };
  jump_disentanglement: JumpDisentanglement;
  volatility_cone: VolatilityConeData;
  india_vix: IndiaVixMetrics;
  cross_comparison?: CrossAssetComparison[];
  constituents_vol_matrix?: CrossAssetComparison[];
}
