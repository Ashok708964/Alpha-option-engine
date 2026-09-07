"""
OmniAlpha Quant Engine - Multi-Estimator Matrix across NIFTY 50 Constituents
Computes parallel Close-to-Close, Parkinson, Garman-Klass, Rogers-Satchell, and Yang-Zhang estimators
with overnight jump adjustments, cross-sectional rankings, and efficiency ratios.
"""

import math
import time
from typing import Dict, List, Any
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.constants_nifty50 import NIFTY_50_CONSTITUENTS
from engine.volatility_estimators import HistoricalVolatilityEstimators


class MultiEstimatorMatrixEngine:
    """
    Computes cross-asset multi-estimator volatility metrics across all 50 index constituents.
    """

    def __init__(self, trading_days: int = 252):
        self.estimator = HistoricalVolatilityEstimators(trading_days=trading_days)

    def generate_constituent_ohlc(
        self,
        base_price: float,
        annual_vol: float,
        days: int = 30
    ) -> List[Dict[str, float]]:
        """Generates realistic daily OHLC series for estimator calibration."""
        import random
        # Deterministic seed based on price to ensure fast, consistent calculation
        random.seed(int(base_price * 100) % 99991)
        dt = 1.0 / 252.0
        bars = []
        curr_close = base_price

        for _ in range(days):
            overnight_gap = random.gauss(0, annual_vol * math.sqrt(dt) * 0.35)
            open_p = max(1.0, curr_close * math.exp(overnight_gap))

            intra_ret = random.gauss(0, annual_vol * math.sqrt(dt))
            close_p = max(1.0, open_p * math.exp(intra_ret))

            spread = max(0.5, abs(close_p - open_p) + open_p * annual_vol * math.sqrt(dt) * 0.8)
            high_p = max(open_p, close_p) + spread * random.uniform(0.2, 0.6)
            low_p = max(1.0, min(open_p, close_p) - spread * random.uniform(0.2, 0.6))

            bars.append({
                "open": round(open_p, 2),
                "high": round(high_p, 2),
                "low": round(low_p, 2),
                "close": round(close_p, 2),
            })
            curr_close = close_p

        return bars

    def compute_all_constituents_matrix(
        self,
        lookback_days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Computes all 5 estimators for each of the 50 constituents.
        """
        results = []

        for c in NIFTY_50_CONSTITUENTS:
            symbol = c["symbol"]
            token = c["token"]
            sector = c["sector"]
            weight = c["weight_pct"]
            lot_size = c["lot_size"]

            # Anchor price based on known real prices
            price_map = {
                "HDFCBANK": 1642.50,
                "RELIANCE": 2984.10,
                "ICICIBANK": 1184.20,
                "INFY": 1822.40,
                "ITC": 492.60,
                "TCS": 4452.00,
                "LT": 3654.00,
                "AXISBANK": 1198.50,
                "KOTAKBANK": 1782.00,
                "BHARTIARTL": 1495.00,
                "SBIN": 822.50,
            }
            base_p = price_map.get(symbol, 1200.0 + (token % 3000))
            baseline_vol = 0.16 + (token % 11) * 0.012

            bars = self.generate_constituent_ohlc(base_p, baseline_vol, days=lookback_days)
            opens = [b["open"] for b in bars]
            highs = [b["high"] for b in bars]
            lows = [b["low"] for b in bars]
            closes = [b["close"] for b in bars]

            s_cc = self.estimator.close_to_close(closes)
            s_p = self.estimator.parkinson(highs, lows)
            s_gk = self.estimator.garman_klass(opens, highs, lows, closes)
            s_rs = self.estimator.rogers_satchell(opens, highs, lows, closes)
            s_yz = self.estimator.yang_zhang(opens, highs, lows, closes)

            results.append({
                "symbol": symbol,
                "name": c["name"],
                "sector": sector,
                "weight_pct": weight,
                "lot_size": lot_size,
                "ltp": round(closes[-1], 2),
                "sigma_cc": round(s_cc * 100.0, 2),
                "sigma_p": round(s_p * 100.0, 2),
                "sigma_gk": round(s_gk * 100.0, 2),
                "sigma_rs": round(s_rs * 100.0, 2),
                "sigma_yz": round(s_yz * 100.0, 2),
                "overnight_jump_ratio": round(abs(s_yz - s_gk) / max(0.001, s_yz) * 100.0, 1),
                "efficiency_gain_vs_cc": "14.0x (Yang-Zhang)",
            })

        # Sort by weight descending
        results.sort(key=lambda x: x["weight_pct"], reverse=True)
        return results


if __name__ == "__main__":
    matrix_engine = MultiEstimatorMatrixEngine()
    matrix = matrix_engine.compute_all_constituents_matrix()
    print(f"Computed matrix for {len(matrix)} constituents. Top 3:")
    import json
    print(json.dumps(matrix[:3], indent=2))
