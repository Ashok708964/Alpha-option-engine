"""
OmniAlpha Quant Engine - Operations Research & Optimal Execution Suite
Implements:
1. Almgren-Chriss (2000) Optimal Liquidation Trajectory (Expectation-Variance Frontier)
2. TWAP (Time-Weighted Average Price with volume randomization & jitter)
3. VWAP (Volume-Weighted Average Price fitted against NSE U-shaped intraday volume curve)
4. Implementation Shortfall (IS) & Full Institutional Transaction Cost Analysis (TCA)
   calibrated for NSE statutory taxes (STT, GST, Exchange charges, Stamp Duty, Slippage).
"""

import math
import random
from typing import Dict, List, Any, Optional, Tuple


class AlmgrenChrissOptimizer:
    """
    Almgren-Chriss (2000) optimal trade execution engine.
    Solves for the optimal liquidation path balancing market impact cost vs. timing risk:
    min { E[x] + lambda * V[x] }
    """

    def __init__(
        self,
        total_shares: float = 10000.0,
        time_horizon_min: float = 60.0,   # Execution window in minutes
        num_intervals: int = 12,          # Slices (e.g. 12 x 5-minute intervals)
        spot_price: float = 24850.0,
        annual_vol: float = 0.15,         # Annual volatility (e.g. 15%)
        daily_volume: float = 5000000.0,  # Average daily volume (ADV)
        bid_ask_spread: float = 1.50,     # Half spread cost
        perm_impact_param: float = 2.5e-7,# Gamma (permanent price impact parameter)
        temp_impact_param: float = 1.2e-6,# Eta (temporary price impact parameter)
        risk_aversion: float = 1e-6       # Lambda (trader risk aversion)
    ):
        self.total_shares = float(total_shares)
        self.time_horizon_min = float(time_horizon_min)
        self.num_intervals = max(2, int(num_intervals))
        self.spot_price = float(spot_price)
        self.annual_vol = float(annual_vol)
        self.daily_volume = float(daily_volume)
        self.bid_ask_spread = float(bid_ask_spread)
        self.gamma = float(perm_impact_param)
        self.eta = float(temp_impact_param)
        self.risk_aversion = float(risk_aversion)

        # Time units: T in days (assuming 6.25 hour trading day = 375 minutes)
        self.T = self.time_horizon_min / 375.0
        self.tau = self.T / float(self.num_intervals)
        self.sigma_daily = self.annual_vol / math.sqrt(252.0)
        self.sigma_spot_daily = self.spot_price * self.sigma_daily

    def compute_optimal_trajectory(self) -> Dict[str, Any]:
        """
        Solves analytical discrete Euler-Lagrange equations for optimal schedule x_j.
        """
        n = self.num_intervals
        x0 = self.total_shares
        tau = self.tau
        lam = self.risk_aversion
        sigma2 = self.sigma_spot_daily ** 2
        eta = self.eta
        gamma = self.gamma

        # Urgency parameter kappa:
        # 0.5 * (kappa * tau)^2 approx lambda * sigma^2 * tau^2 / eta
        if lam <= 1e-12:
            kappa = 1e-6
        else:
            arg = (lam * sigma2) / max(1e-12, eta)
            kappa = math.sqrt(max(0.0, arg))

        # Discrete sinh ratio trajectory
        kappa_T = max(1e-4, kappa * self.T)
        sinh_kappa_T = math.sinh(min(50.0, kappa_T))

        holdings = []
        trade_sizes = []
        times_min = []
        dt_min = self.time_horizon_min / float(n)

        # Current remaining shares
        curr_x = x0
        holdings.append(round(curr_x, 2))
        times_min.append(0.0)

        for j in range(1, n + 1):
            t_j = j * tau
            rem_t = self.T - t_j
            if rem_t <= 1e-7 or j == n:
                x_j = 0.0
            else:
                ratio = math.sinh(min(50.0, kappa * rem_t)) / sinh_kappa_T
                x_j = x0 * ratio

            trade_size = max(0.0, curr_x - x_j)
            trade_sizes.append(round(trade_size, 2))
            curr_x = x_j
            holdings.append(round(curr_x, 2))
            times_min.append(round(j * dt_min, 1))

        # Ensure all shares are executed
        rem = x0 - sum(trade_sizes)
        if abs(rem) > 1e-4 and len(trade_sizes) > 0:
            trade_sizes[-1] += round(rem, 2)
            holdings[-1] = 0.0

        # Calculate Expected Cost E[x] and Variance V[x]
        # Permanent impact cost: 0.5 * gamma * X0^2
        perm_cost = 0.5 * gamma * (x0 ** 2)

        # Temporary impact cost: sum( eta * (n_j / tau) * n_j ) = (eta / tau) * sum(n_j^2)
        temp_cost = (eta / tau) * sum(s ** 2 for s in trade_sizes)

        # Half-spread cost
        spread_cost = 0.5 * self.bid_ask_spread * x0

        expected_total_cost = perm_cost + temp_cost + spread_cost
        expected_cost_bps = (expected_total_cost / max(1.0, x0 * self.spot_price)) * 10000.0

        # Timing risk variance: sigma^2 * tau * sum(x_j^2)
        variance_cost = (self.sigma_spot_daily ** 2) * tau * sum(h ** 2 for h in holdings[1:])
        std_dev_cost = math.sqrt(max(0.0, variance_cost))
        std_dev_bps = (std_dev_cost / max(1.0, x0 * self.spot_price)) * 10000.0

        # Half-life of liquidation: t_half = ln(2) / kappa (in minutes)
        t_half_min = (math.log(2.0) / max(1e-6, kappa)) * 375.0

        return {
            "algorithm": "ALMGREN_CHRISS_OPTIMAL",
            "total_shares": x0,
            "horizon_minutes": self.time_horizon_min,
            "slices_count": n,
            "urgency_parameter_kappa": round(kappa, 6),
            "liquidation_half_life_min": round(min(self.time_horizon_min, t_half_min), 2),
            "expected_cost_rupees": round(expected_total_cost, 2),
            "expected_cost_bps": round(expected_cost_bps, 2),
            "timing_risk_std_rupees": round(std_dev_cost, 2),
            "timing_risk_bps": round(std_dev_bps, 2),
            "permanent_impact_rupees": round(perm_cost, 2),
            "temporary_impact_rupees": round(temp_cost, 2),
            "spread_cost_rupees": round(spread_cost, 2),
            "schedule": [
                {
                    "slice_idx": i + 1,
                    "time_min": times_min[i + 1],
                    "shares_to_trade": trade_sizes[i],
                    "remaining_shares": holdings[i + 1],
                    "pct_of_order": round((trade_sizes[i] / x0) * 100.0, 2),
                    "participation_rate_adv_pct": round((trade_sizes[i] / (self.daily_volume * (self.tau))) * 100.0, 3)
                }
                for i in range(n)
            ]
        }


class NseVolumeProfileEngine:
    """
    Empirical intraday volume distribution for the National Stock Exchange of India (NSE).
    Captures the canonical 09:15 - 15:30 IST U-shaped smile:
    - High volume morning auction & opening impulse (09:15 - 10:15) ~28% of ADV
    - Midday European cross-market lull (11:30 - 13:30) ~22% of ADV
    - Institutional squaring-off & closing auction (14:30 - 15:30) ~32% of ADV
    """

    @staticmethod
    def get_u_shaped_weights(num_slices: int = 12) -> List[float]:
        """Returns normalized volume weights for num_slices across the trading day."""
        weights = []
        for i in range(num_slices):
            # normalized progress x in [0, 1]
            x = (i + 0.5) / float(num_slices)
            # Quadratic U-shape smile: 1.0 + 3.2 * (x - 0.5)^2
            w = 1.0 + 3.8 * ((x - 0.5) ** 2)
            # Morning boost (opening 15%)
            if x < 0.15:
                w *= 1.35
            # Closing boost (closing 15%)
            elif x > 0.85:
                w *= 1.45
            weights.append(w)

        total_w = sum(weights)
        return [w / total_w for w in weights]


class ExecutionBenchmarkEngine:
    """
    Computes comparative execution trajectories for TWAP, VWAP, and Almgren-Chriss.
    """

    def __init__(
        self,
        total_shares: float = 10000.0,
        time_horizon_min: float = 60.0,
        num_intervals: int = 12,
        spot_price: float = 24850.0,
        bid_ask_spread: float = 1.50
    ):
        self.total_shares = float(total_shares)
        self.time_horizon_min = float(time_horizon_min)
        self.num_intervals = max(2, int(num_intervals))
        self.spot_price = float(spot_price)
        self.bid_ask_spread = float(bid_ask_spread)

    def compute_twap_schedule(self, randomize_jitter: bool = True) -> Dict[str, Any]:
        """Time-Weighted Average Price with anti-gaming randomized slicing."""
        n = self.num_intervals
        x0 = self.total_shares
        base_slice = x0 / float(n)
        dt_min = self.time_horizon_min / float(n)

        slices = []
        rem = x0

        for i in range(n):
            if i == n - 1:
                sz = max(0.0, rem)
            else:
                jitter = random.uniform(-0.12, 0.12) if randomize_jitter else 0.0
                sz = round(base_slice * (1.0 + jitter), 2)
                sz = min(sz, rem)
            rem -= sz
            slices.append(sz)

        # Build trajectory
        schedule = []
        curr = x0
        for i, sz in enumerate(slices):
            curr -= sz
            schedule.append({
                "slice_idx": i + 1,
                "time_min": round((i + 1) * dt_min, 1),
                "shares_to_trade": round(sz, 2),
                "remaining_shares": max(0.0, round(curr, 2)),
                "pct_of_order": round((sz / x0) * 100.0, 2)
            })

        return {
            "algorithm": "TWAP_RANDOMIZED",
            "total_shares": x0,
            "horizon_minutes": self.time_horizon_min,
            "slices_count": n,
            "schedule": schedule
        }

    def compute_vwap_schedule(self) -> Dict[str, Any]:
        """Volume-Weighted Average Price schedule matched to NSE U-shaped profile."""
        n = self.num_intervals
        x0 = self.total_shares
        weights = NseVolumeProfileEngine.get_u_shaped_weights(n)
        dt_min = self.time_horizon_min / float(n)

        slices = [round(x0 * w, 2) for w in weights]
        diff = x0 - sum(slices)
        slices[-1] += round(diff, 2)

        schedule = []
        curr = x0
        for i, sz in enumerate(slices):
            curr -= sz
            schedule.append({
                "slice_idx": i + 1,
                "time_min": round((i + 1) * dt_min, 1),
                "shares_to_trade": round(sz, 2),
                "remaining_shares": max(0.0, round(curr, 2)),
                "pct_of_order": round((sz / x0) * 100.0, 2)
            })

        return {
            "algorithm": "VWAP_NSE_CURVE",
            "total_shares": x0,
            "horizon_minutes": self.time_horizon_min,
            "slices_count": n,
            "schedule": schedule
        }


class InstitutionalTcaEngine:
    """
    Full Indian Market Transaction Cost Analysis (TCA) & Implementation Shortfall.
    Computes statutory exchange dues, STT, SEBI fees, GST, Stamp duty, and slippage.
    """

    @staticmethod
    def calculate_tca_breakdown(
        trade_value_rupees: float,
        is_derivative: bool = True,
        is_options: bool = True,
        is_buy: bool = True,
        slippage_bps: float = 3.5
    ) -> Dict[str, Any]:
        """
        Computes statutory Indian regulatory taxes + exchange turnover + slippage.
        """
        val = max(1.0, float(trade_value_rupees))

        # 1. Securities Transaction Tax (STT):
        # Options Sell: 0.0625% on premium (or 0.125% post-budget hike)
        # Options Buy: 0.0% (STT levied only on sell)
        # Futures: 0.0125% on turnover
        # Equity Delivery: 0.1% on buy & sell
        if is_options:
            stt_rate = 0.000625 if not is_buy else 0.0
        elif is_derivative:
            stt_rate = 0.000125
        else:
            stt_rate = 0.001

        stt_rupees = val * stt_rate

        # 2. NSE Exchange Turnover Charges:
        # Options: 0.05% on premium turnover
        # Futures: 0.0019%
        # Equity: 0.00345%
        exch_rate = 0.0005 if is_options else (0.000019 if is_derivative else 0.0000345)
        exch_turnover_rupees = val * exch_rate

        # 3. SEBI Turnover Charges: ₹10 per crore = 0.0001%
        sebi_charges_rupees = val * 0.000001

        # 4. Stamp Duty (levied on buy orders only):
        # Options: 0.003%
        # Futures: 0.002%
        # Equity: 0.015%
        stamp_rate = (0.00003 if is_options else (0.00002 if is_derivative else 0.00015)) if is_buy else 0.0
        stamp_duty_rupees = val * stamp_rate

        # 5. Brokerage: Institutional flat ₹20 or 0.01%
        brokerage_rupees = min(20.0, val * 0.0001)

        # 6. GST (18% on Brokerage + Exchange charges + SEBI charges)
        taxable_services = brokerage_rupees + exch_turnover_rupees + sebi_charges_rupees
        gst_rupees = taxable_services * 0.18

        # 7. Slippage & Market Impact Cost
        market_impact_rupees = val * (slippage_bps / 10000.0)

        total_statutory_rupees = stt_rupees + exch_turnover_rupees + sebi_charges_rupees + stamp_duty_rupees + gst_rupees
        total_execution_cost = total_statutory_rupees + brokerage_rupees + market_impact_rupees
        total_cost_bps = (total_execution_cost / val) * 10000.0

        return {
            "trade_value_rupees": round(val, 2),
            "market_impact_rupees": round(market_impact_rupees, 2),
            "market_impact_bps": round(slippage_bps, 2),
            "statutory_taxes": {
                "stt_rupees": round(stt_rupees, 2),
                "exchange_turnover_rupees": round(exch_turnover_rupees, 2),
                "sebi_charges_rupees": round(sebi_charges_rupees, 2),
                "stamp_duty_rupees": round(stamp_duty_rupees, 2),
                "brokerage_rupees": round(brokerage_rupees, 2),
                "gst_18pct_rupees": round(gst_rupees, 2),
                "total_regulatory_rupees": round(total_statutory_rupees + brokerage_rupees, 2)
            },
            "total_execution_cost_rupees": round(total_execution_cost, 2),
            "total_cost_bps": round(total_cost_bps, 2),
            "effective_net_execution_price_impact": round(market_impact_rupees + total_statutory_rupees, 2)
        }


if __name__ == "__main__":
    optimizer = AlmgrenChrissOptimizer(
        total_shares=5000,
        time_horizon_min=60,
        num_intervals=12,
        spot_price=24850.0,
        risk_aversion=1e-6
    )
    result = optimizer.compute_optimal_trajectory()
    print("Almgren-Chriss Optimal Execution Schedule:")
    import json
    print(json.dumps(result, indent=2))

    tca = InstitutionalTcaEngine.calculate_tca_breakdown(
        trade_value_rupees=5000 * 24850.0,
        is_derivative=True,
        is_options=False,
        is_buy=True
    )
    print("\nTCA Breakdown:")
    print(json.dumps(tca, indent=2))
