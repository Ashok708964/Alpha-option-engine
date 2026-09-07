"""
OmniAlpha Quant Engine - Phase 2 Historical & Macro Volatility Estimator Suite
Pure Python Standard Library implementations (no external dependencies required):
1. Close-to-Close (CC)
2. Parkinson (High-Low extreme value)
3. Garman-Klass (OHLC)
4. Rogers-Satchell (Drift-independent OHLC)
5. Yang-Zhang (Overnight gap + drift minimum variance unbiased)
6. Bipower Variation (BV) & Barndorff-Nielsen/Shephard Jump Disentanglement
7. Multi-Horizon Volatility Cones (10D, 20D, 30D, 60D, 90D)
8. India VIX Term Structure & Contango/Backwardation Metrics
"""

import math
from typing import Dict, List, Any, Tuple, Optional


def sample_variance(data: List[float]) -> float:
    """Calculates sample variance with Bessel's correction (ddof=1)."""
    n = len(data)
    if n < 2:
        return 0.0
    mean = sum(data) / n
    return sum((x - mean) ** 2 for x in data) / (n - 1)


def percentile(data: List[float], q: float) -> float:
    """Calculates q-th percentile (0 <= q <= 100) using linear interpolation."""
    if not data:
        return 0.0
    sorted_d = sorted(data)
    n = len(sorted_d)
    if n == 1:
        return sorted_d[0]
    idx = (q / 100.0) * (n - 1)
    lower = int(idx)
    upper = min(lower + 1, n - 1)
    weight = idx - lower
    return sorted_d[lower] * (1.0 - weight) + sorted_d[upper] * weight


class HistoricalVolatilityEstimators:
    """
    Mathematical suite for high-frequency and daily volatility estimation.
    All annualized figures use trading_days_per_year (default 252).
    """

    def __init__(self, trading_days: int = 252):
        self.trading_days = trading_days

    def close_to_close(self, closes: List[float]) -> float:
        """
        Classic Close-to-Close realized volatility estimator.
        sigma_cc = sqrt( 252 / (N - 1) * sum((r_i - r_bar)^2) )
        """
        if len(closes) < 2:
            return 0.0
        log_rets = [math.log(closes[i] / closes[i - 1]) for i in range(1, len(closes))]
        var = sample_variance(log_rets)
        return math.sqrt(var * self.trading_days)

    def parkinson(self, highs: List[float], lows: List[float]) -> float:
        """
        Parkinson extreme-value volatility estimator (1980).
        Uses High and Low prices; ~5x more efficient than Close-to-Close.
        sigma_p = sqrt( 252 / (4 * ln(2) * N) * sum( (ln(H_i / L_i))^2 ) )
        """
        n = min(len(highs), len(lows))
        if n < 2:
            return 0.0
        term = 0.0
        for i in range(n):
            if highs[i] > 0 and lows[i] > 0:
                hl = math.log(highs[i] / lows[i])
                term += hl * hl
        var = term / (4.0 * math.log(2.0) * n)
        return math.sqrt(max(0.0, var) * self.trading_days)

    def garman_klass(
        self, opens: List[float], highs: List[float], lows: List[float], closes: List[float]
    ) -> float:
        """
        Garman-Klass volatility estimator (1980).
        Incorporates Open, High, Low, and Close; ~8x more efficient than Close-to-Close.
        sigma_gk = sqrt( 252 / N * sum( 0.5 * ln(H/L)^2 - (2*ln(2) - 1) * ln(C/O)^2 ) )
        """
        n = min(len(opens), len(highs), len(lows), len(closes))
        if n < 2:
            return 0.0

        co_factor = 2.0 * math.log(2.0) - 1.0
        total_term = 0.0
        for i in range(n):
            if opens[i] > 0 and highs[i] > 0 and lows[i] > 0 and closes[i] > 0:
                hl = math.log(highs[i] / lows[i])
                co = math.log(closes[i] / opens[i])
                total_term += 0.5 * (hl ** 2) - co_factor * (co ** 2)

        var = total_term / n
        return math.sqrt(max(0.0, var) * self.trading_days)

    def rogers_satchell(
        self, opens: List[float], highs: List[float], lows: List[float], closes: List[float]
    ) -> float:
        """
        Rogers-Satchell volatility estimator (1991).
        Drift-independent, ideal for trending markets with non-zero mean return.
        sigma_rs = sqrt( 252 / N * sum( ln(H/C)*ln(H/O) + ln(L/C)*ln(L/O) ) )
        """
        n = min(len(opens), len(highs), len(lows), len(closes))
        if n < 2:
            return 0.0

        total_rs = 0.0
        for i in range(n):
            if opens[i] > 0 and highs[i] > 0 and lows[i] > 0 and closes[i] > 0:
                u = math.log(highs[i] / opens[i])
                d = math.log(lows[i] / opens[i])
                c = math.log(closes[i] / opens[i])
                total_rs += u * (u - c) + d * (d - c)

        var = total_rs / n
        return math.sqrt(max(0.0, var) * self.trading_days)

    def yang_zhang(
        self, opens: List[float], highs: List[float], lows: List[float], closes: List[float]
    ) -> float:
        """
        Yang-Zhang volatility estimator (2000).
        Minimum-variance unbiased estimator incorporating opening overnight jumps and drift.
        sigma_yz^2 = sigma_o^2 + k * sigma_c^2 + (1 - k) * sigma_rs^2
        """
        n = min(len(opens), len(highs), len(lows), len(closes))
        if n < 3:
            return self.garman_klass(opens, highs, lows, closes)

        # Overnight returns: ln(Open_i / Close_{i-1})
        log_open_prev_close = [
            math.log(opens[i] / closes[i - 1])
            for i in range(1, n)
            if opens[i] > 0 and closes[i - 1] > 0
        ]
        sigma_o_sq = sample_variance(log_open_prev_close)

        # Open-to-close returns: ln(Close_i / Open_i)
        log_close_open = [
            math.log(closes[i] / opens[i])
            for i in range(1, n)
            if closes[i] > 0 and opens[i] > 0
        ]
        sigma_c_sq = sample_variance(log_close_open)

        # Rogers-Satchell on day 1 to n
        sub_o = opens[1:n]
        sub_h = highs[1:n]
        sub_l = lows[1:n]
        sub_c = closes[1:n]
        rs_sq = (self.rogers_satchell(sub_o, sub_h, sub_l, sub_c) ** 2) / self.trading_days

        k = 0.34 / (1.34 + (n + 1) / (n - 1))
        var = sigma_o_sq + k * sigma_c_sq + (1.0 - k) * rs_sq
        return math.sqrt(max(0.0, var) * self.trading_days)

    def bipower_variation_jump_test(
        self, intraday_returns: List[float], alpha_crit: float = 0.01
    ) -> Dict[str, Any]:
        """
        Barndorff-Nielsen and Shephard (2004, 2006) Bipower Variation (BV)
        Disentangles continuous Brownian diffusion from discrete jump shocks.
        BV = (pi / 2) * sum(|r_t| * |r_{t-1}|)
        Relative Jump Share: J = max(0, (RV - BV) / RV)
        Z-statistic for asymptotic normal jump significance test.
        """
        n = len(intraday_returns)
        if n < 5:
            return {
                "realized_variance": 0.0,
                "bipower_variation": 0.0,
                "continuous_vol": 0.0,
                "jump_vol": 0.0,
                "jump_ratio": 0.0,
                "z_stat": 0.0,
                "has_jump": False,
                "confidence_level": "99%"
            }

        # Realized Variance
        rv = sum(r * r for r in intraday_returns)

        # Bipower Variation
        abs_rets = [abs(r) for r in intraday_returns]
        mu1 = math.sqrt(2.0 / math.pi)  # ~ 0.79788456
        bv_sum = sum(abs_rets[i] * abs_rets[i - 1] for i in range(1, n))
        bv = (1.0 / (mu1 ** 2)) * bv_sum

        # Tri-power quarticity (for jump test denominator standard error)
        # mu_{4/3} = 2^(2/3) * Gamma(7/6) / sqrt(pi) ~ 0.8309
        mu4_3 = 0.83088
        tp_sum = sum(
            (abs_rets[i] ** (4.0 / 3.0)) * (abs_rets[i - 1] ** (4.0 / 3.0)) * (abs_rets[i - 2] ** (4.0 / 3.0))
            for i in range(2, n)
        )
        tp = n * (mu4_3 ** -3) * tp_sum

        jump_comp = max(0.0, rv - bv)
        jump_ratio = jump_comp / (rv + 1e-12)

        # Z-test statistic for jump significance
        denom = math.sqrt(max(1e-12, ((math.pi ** 2) / 4 + math.pi - 5) * max(1e-12, tp) / ((bv ** 2) + 1e-12)))
        z_stat = (rv - bv) / (rv * (denom / math.sqrt(n)) + 1e-12)

        crit_value = 2.576  # for 99% confidence (alpha = 0.01)
        has_jump = bool(z_stat > crit_value)

        # Annualized values (assuming 252 days, intraday scale)
        ann_factor = math.sqrt(self.trading_days * max(1, n))
        cont_vol = math.sqrt(max(0.0, bv)) * ann_factor
        jump_vol = math.sqrt(max(0.0, jump_comp)) * ann_factor

        return {
            "realized_variance": float(rv),
            "bipower_variation": float(bv),
            "continuous_vol": float(cont_vol),
            "jump_vol": float(jump_vol),
            "jump_ratio": float(jump_ratio),
            "z_stat": float(z_stat),
            "has_jump": has_jump,
            "confidence_level": "99% (Z > 2.58)"
        }

    def compute_volatility_cone(
        self, daily_bars: List[Dict[str, float]], horizons: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """
        Computes rolling volatility cones across multiple horizons (10D, 20D, 30D, 60D, 90D).
        Returns min, 25th percentile, median, 75th percentile, and max realized Yang-Zhang volatility.
        """
        if horizons is None:
            horizons = [10, 20, 30, 60, 90]

        closes = [b["close"] for b in daily_bars]
        opens = [b["open"] for b in daily_bars]
        highs = [b["high"] for b in daily_bars]
        lows = [b["low"] for b in daily_bars]

        total_bars = len(closes)
        cone_data = []

        for h in horizons:
            if total_bars < h + 2:
                # Baseline quantile
                cone_data.append({
                    "horizon_days": h,
                    "min_vol": 0.10,
                    "p25_vol": 0.12,
                    "median_vol": 0.145,
                    "p75_vol": 0.18,
                    "max_vol": 0.25,
                    "current_vol": 0.145,
                    "iv_percentile": 50.0
                })
                continue

            # Rolling Yang-Zhang volatility calculations for window h
            rolling_vols = []
            for i in range(h, total_bars + 1):
                sub_o = opens[i - h : i]
                sub_h = highs[i - h : i]
                sub_l = lows[i - h : i]
                sub_c = closes[i - h : i]
                v = self.yang_zhang(sub_o, sub_h, sub_l, sub_c)
                if not math.isnan(v) and v > 0:
                    rolling_vols.append(v)

            if not rolling_vols:
                rolling_vols = [0.145]

            min_v = min(rolling_vols)
            p25 = percentile(rolling_vols, 25)
            med = percentile(rolling_vols, 50)
            p75 = percentile(rolling_vols, 75)
            max_v = max(rolling_vols)
            curr = rolling_vols[-1]

            # IV percentile position
            denom = max_v - min_v if max_v > min_v else 0.01
            pct = max(0.0, min(100.0, ((curr - min_v) / denom) * 100.0))

            cone_data.append({
                "horizon_days": h,
                "min_vol": round(min_v, 4),
                "p25_vol": round(p25, 4),
                "median_vol": round(med, 4),
                "p75_vol": round(p75, 4),
                "max_vol": round(max_v, 4),
                "current_vol": round(curr, 4),
                "iv_percentile": round(pct, 1)
            })

        return {"horizons": cone_data}

    def compute_india_vix_metrics(
        self, vix_spot: float, vix_fut_near: float, vix_fut_next: float, historical_vix: List[float]
    ) -> Dict[str, Any]:
        """
        Analyzes India VIX term structure, Basis (Spot vs Future), and Contango/Backwardation state.
        """
        basis_near = vix_fut_near - vix_spot
        basis_pct = (basis_near / vix_spot) * 100.0 if vix_spot > 0 else 0.0

        # Term structure roll yield / calendar spread
        calendar_spread = vix_fut_next - vix_fut_near

        # Contango/Backwardation detection
        if basis_near > 0.15:
            regime = "CONTANGO_NORMAL"
            regime_desc = "Futures trade at a premium to spot. Favorable for systematic premium selling."
        elif basis_near < -0.15:
            regime = "BACKWARDATION_INVERTED"
            regime_desc = "Spot spikes above futures. Elevated market fear, protective put bid elevated."
        else:
            regime = "FLAT_EQUILIBRIUM"
            regime_desc = "Basis within normal friction band."

        # VIX Percentile and Rank over provided history
        vix_arr = historical_vix if len(historical_vix) > 0 else [12.0, 14.5, 18.0]
        vix_min = min(vix_arr)
        vix_max = max(vix_arr)
        vix_rank = ((vix_spot - vix_min) / max(0.01, vix_max - vix_min)) * 100.0
        vix_percentile = (sum(1 for x in vix_arr if x < vix_spot) / max(1, len(vix_arr))) * 100.0

        return {
            "vix_spot": round(vix_spot, 2),
            "vix_fut_near": round(vix_fut_near, 2),
            "vix_fut_next": round(vix_fut_next, 2),
            "basis_near": round(basis_near, 2),
            "basis_pct": round(basis_pct, 2),
            "calendar_spread": round(calendar_spread, 2),
            "regime": regime,
            "regime_desc": regime_desc,
            "vix_rank_1y": round(max(0.0, min(100.0, vix_rank)), 1),
            "vix_percentile_1y": round(max(0.0, min(100.0, vix_percentile)), 1)
        }
