"""
OmniAlpha Quant Engine - Volatility Suite Bridge
Computes comprehensive historical volatility estimates, bipower variation jump stats,
volatility cones (10D-90D), and India VIX term structure for NIFTY 50 and top equities.
"""

import os
import sys
import json
import math
import random
import time
from datetime import datetime
from typing import Dict, List, Any

# Ensure project root in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.volatility_estimators import HistoricalVolatilityEstimators
from engine.constants_nifty50 import NIFTY_50_CONSTITUENTS
from engine.vix_term_structure import IndiaVixTermStructureEngine
from engine.volatility_matrix import MultiEstimatorMatrixEngine


def generate_synthetic_ohlc_bars(
    base_price: float,
    drift: float = 0.0004,
    vol: float = 0.14,
    days: int = 120
) -> List[Dict[str, float]]:
    """
    Generates realistic geometric Brownian motion daily OHLC bars
    with intraday volatility and occasional overnight jump gaps.
    """
    random.seed(42 + int(base_price))
    dt = 1.0 / 252.0
    bars = []
    curr_close = base_price

    for day_idx in range(days):
        # Overnight return with occasional jump
        gap_shock = random.gauss(0, vol * math.sqrt(dt) * 0.4)
        if random.random() < 0.05:  # 5% chance of macroeconomic overnight gap
            gap_shock += random.choice([-1, 1]) * vol * math.sqrt(dt) * 2.0

        open_p = max(1.0, curr_close * math.exp(gap_shock))

        # Intraday drift & diffusion
        intra_ret = drift * dt + random.gauss(0, vol * math.sqrt(dt))
        close_p = max(1.0, open_p * math.exp(intra_ret))

        # High and Low extremes
        intra_range = max(0.5, abs(close_p - open_p) + open_p * (vol * math.sqrt(dt) * abs(random.gauss(0.8, 0.3))))
        high_p = max(open_p, close_p) + random.uniform(0.1, 0.6) * intra_range
        low_p = max(1.0, min(open_p, close_p) - random.uniform(0.1, 0.6) * intra_range)

        bars.append({
            "open": round(open_p, 2),
            "high": round(high_p, 2),
            "low": round(low_p, 2),
            "close": round(close_p, 2),
            "volume": int(random.uniform(500000, 4000000))
        })
        curr_close = close_p

    return bars


def generate_intraday_tick_returns(n_ticks: int = 100, vol_ann: float = 0.15) -> List[float]:
    """Generates intraday log returns with both Gaussian diffusion and jump shocks."""
    random.seed(1337)
    dt = 1.0 / (252.0 * 375.0)  # ~1-minute frequency
    rets = []
    for _ in range(n_ticks):
        # Continuous diffusion
        r = random.gauss(0, vol_ann * math.sqrt(dt))
        # Rare jump arrival (Poisson compound shock)
        if random.random() < 0.03:
            r += random.choice([-1, 1]) * vol_ann * math.sqrt(dt) * 3.5
        rets.append(r)
    return rets


def get_volatility_suite_snapshot(symbol: str = "NIFTY 50") -> Dict[str, Any]:
    """
    Computes all 5 estimators, Jump Disentanglement, Cones, and VIX structure for a given asset.
    """
    estimator = HistoricalVolatilityEstimators(trading_days=252)

    # Base price map
    base_prices = {
        "NIFTY 50": 24854.20,
        "HDFCBANK": 1642.50,
        "RELIANCE": 2984.10,
        "ICICIBANK": 1184.20,
        "INFY": 1822.40,
        "TCS": 4452.00,
        "LT": 3654.00,
        "SBIN": 822.50
    }
    price = base_prices.get(symbol, 24854.20)
    asset_vol = 0.138 if symbol == "NIFTY 50" else 0.195

    bars = generate_synthetic_ohlc_bars(price, vol=asset_vol, days=120)

    # 30-day window for estimator comparison
    window_bars = bars[-30:]
    opens = [b["open"] for b in window_bars]
    highs = [b["high"] for b in window_bars]
    lows = [b["low"] for b in window_bars]
    closes = [b["close"] for b in window_bars]

    sigma_cc = estimator.close_to_close(closes)
    sigma_p = estimator.parkinson(highs, lows)
    sigma_gk = estimator.garman_klass(opens, highs, lows, closes)
    sigma_rs = estimator.rogers_satchell(opens, highs, lows, closes)
    sigma_yz = estimator.yang_zhang(opens, highs, lows, closes)

    # Intraday Jump Disentanglement
    intraday_rets = generate_intraday_tick_returns(n_ticks=120, vol_ann=asset_vol)
    jump_metrics = estimator.bipower_variation_jump_test(intraday_rets)

    # Multi-Horizon Volatility Cone
    cone = estimator.compute_volatility_cone(bars, horizons=[10, 20, 30, 60, 90])

    # India VIX & Term Structure (NSE India VIX spot vs near & next month futures)
    hist_vix = [11.2, 11.8, 12.4, 13.1, 12.9, 13.5, 14.2, 13.8, 13.4, 13.6, 14.0, 13.45]
    vix_metrics = estimator.compute_india_vix_metrics(
        vix_spot=13.45,
        vix_fut_near=13.85,
        vix_fut_next=14.15,
        historical_vix=hist_vix
    )

    # Macro & Term Structure Model (1D, 1W, 1M, 3M, 1Y + VVIX + Roll Yield)
    vix_term_engine = IndiaVixTermStructureEngine()
    term_snapshot = vix_term_engine.compute_term_structure_snapshot(headline_vix=13.45)
    vix_metrics["tenors"] = term_snapshot["tenors"]
    vix_metrics["vvix"] = term_snapshot["vvix"]
    vix_metrics["term_structure_metrics"] = term_snapshot["metrics"]

    # Parallel 50-Constituent Multi-Estimator Matrix
    matrix_engine = MultiEstimatorMatrixEngine(trading_days=252)
    constituents_vol_matrix = matrix_engine.compute_all_constituents_matrix(lookback_days=30)

    # Cross-asset comparison table (top benchmark symbols)
    cross_comparison = constituents_vol_matrix[:8]

    return {
        "status": "OPERATIONAL",
        "symbol": symbol,
        "current_ltp": round(closes[-1], 2),
        "timestamp": datetime.now().isoformat(),
        "lookback_window_days": 30,
        "estimators": {
            "close_to_close": {
                "name": "Close-to-Close (CC)",
                "symbol": "σ_CC",
                "annualized_vol_pct": round(sigma_cc * 100.0, 2),
                "relative_efficiency": 1.0,
                "description": "Standard benchmark. Ignores intraday highs/lows and overnight drift."
            },
            "parkinson": {
                "name": "Parkinson Extreme Value",
                "symbol": "σ_P",
                "annualized_vol_pct": round(sigma_p * 100.0, 2),
                "relative_efficiency": 5.2,
                "description": "Uses High/Low extremes. ~5x more efficient than CC, assumes zero drift."
            },
            "garman_klass": {
                "name": "Garman-Klass (OHLC)",
                "symbol": "σ_GK",
                "annualized_vol_pct": round(sigma_gk * 100.0, 2),
                "relative_efficiency": 7.4,
                "description": "Incorporates Open, High, Low, Close. ~7.4x efficiency over CC."
            },
            "rogers_satchell": {
                "name": "Rogers-Satchell (Non-Zero Drift)",
                "symbol": "σ_RS",
                "annualized_vol_pct": round(sigma_rs * 100.0, 2),
                "relative_efficiency": 7.8,
                "description": "Drift-independent formulation. Robust during strong trending intraday sessions."
            },
            "yang_zhang": {
                "name": "Yang-Zhang Minimum Variance",
                "symbol": "σ_YZ",
                "annualized_vol_pct": round(sigma_yz * 100.0, 2),
                "relative_efficiency": 14.0,
                "description": "Gold standard. Continuous drift + overnight opening gap minimum-variance unbiased."
            }
        },
        "jump_disentanglement": jump_metrics,
        "volatility_cone": cone,
        "india_vix": vix_metrics,
        "cross_comparison": cross_comparison,
        "constituents_vol_matrix": constituents_vol_matrix
    }


if __name__ == "__main__":
    sym = sys.argv[1] if len(sys.argv) > 1 else "NIFTY 50"
    snapshot = get_volatility_suite_snapshot(sym)
    print(json.dumps(snapshot, indent=2))
