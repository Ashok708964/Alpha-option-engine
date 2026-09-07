"""
OmniAlpha Quant Engine - High-Order Analytical Greeks Engine
Calculates exact closed-form 1st, 2nd, and 3rd-order cross-Greeks:
- 1st Order: Delta, Vega, Theta, Rho
- 2nd Order: Gamma, Vanna, Volga (Vomma), Veta, Charm, Color
- 3rd Order: Speed, Zomma, Ultima
Includes exact NSE Rupee / Lot sizing conversions for Indian options markets.
"""

import math
from typing import Dict, Any, Optional


def norm_cdf(x: float) -> float:
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def norm_pdf(x: float) -> float:
    return 0.3989422804014327 * math.exp(-0.5 * x * x)


class AnalyticalGreeksEngine:
    """
    Computes comprehensive 1st, 2nd, and 3rd-order Black-Scholes/Black-76 Greeks.
    """

    def __init__(self, r: float = 0.065, q: float = 0.012):
        self.r = r
        self.q = q

    def compute_all_greeks(
        self,
        spot: float,
        strike: float,
        tau: float,
        vol: float,
        is_call: bool = True,
        lot_size: int = 50
    ) -> Dict[str, Any]:
        """
        Computes the complete Greeks hierarchy for an option.
        """
        r = self.r
        q = self.q

        if tau <= 1e-6 or vol <= 1e-6 or spot <= 0 or strike <= 0:
            return self._boundary_greeks(spot, strike, is_call, lot_size)

        v_sqrt_t = vol * math.sqrt(tau)
        fwd = spot * math.exp((r - q) * tau)
        d1 = (math.log(fwd / strike) + 0.5 * (vol ** 2) * tau) / v_sqrt_t
        d2 = d1 - v_sqrt_t

        df = math.exp(-r * tau)
        df_div = math.exp(-q * tau)
        phi_d1 = norm_pdf(d1)
        phi_d2 = norm_pdf(d2)
        n_d1 = norm_cdf(d1)
        n_d2 = norm_cdf(d2)

        # 1st Order Greeks
        if is_call:
            delta = df_div * n_d1
            theta = (
                -(spot * df_div * phi_d1 * vol) / (2.0 * math.sqrt(tau))
                - r * strike * df * n_d2
                + q * spot * df_div * n_d1
            )
            rho = strike * tau * df * n_d2
        else:
            delta = df_div * (n_d1 - 1.0)
            theta = (
                -(spot * df_div * phi_d1 * vol) / (2.0 * math.sqrt(tau))
                + r * strike * df * (1.0 - n_d2)
                - q * spot * df_div * (1.0 - n_d1)
            )
            rho = -strike * tau * df * (1.0 - n_d2)

        vega = spot * df_div * math.sqrt(tau) * phi_d1

        # 2nd Order Greeks
        gamma = (df_div * phi_d1) / (spot * v_sqrt_t)
        vanna = (vega / spot) * (1.0 - d1 / v_sqrt_t)
        vomma = (vega * d1 * d2) / vol  # Also Volga

        # Charm (Delta decay dDelta / dt)
        if is_call:
            charm = q * df_div * n_d1 - df_div * phi_d1 * (
                2.0 * (r - q) * tau - d2 * v_sqrt_t
            ) / (2.0 * tau * v_sqrt_t)
        else:
            charm = -q * df_div * (1.0 - n_d1) - df_div * phi_d1 * (
                2.0 * (r - q) * tau - d2 * v_sqrt_t
            ) / (2.0 * tau * v_sqrt_t)

        # Veta (Vega decay dVega / dt)
        veta = -spot * df_div * phi_d1 * math.sqrt(tau) * (
            q + ((r - q) * d1) / v_sqrt_t - (1.0 + d1 * d2) / (2.0 * tau)
        )

        # Color (Gamma decay dGamma / dt)
        color = -gamma * (
            q + ((r - q) * d1) / v_sqrt_t + (1.0 - d1 * d2) / (2.0 * tau)
        )

        # 3rd Order Greeks
        # Speed (dGamma / dS)
        speed = -(gamma / spot) * (d1 / v_sqrt_t + 1.0)

        # Zomma (dGamma / dVol)
        zomma = gamma * ((d1 * d2 - 1.0) / vol)

        # Ultima (dVomma / dVol)
        ultima = -(vega / (vol ** 2)) * (
            d1 * d2 * (1.0 - d1 * d2) + (d1 ** 2) + (d2 ** 2)
        )

        # Indian Market Rupee & Lot Sizing
        lot_delta = delta * lot_size
        daily_theta = theta / 365.0
        rupee_theta_day = daily_theta * lot_size
        rupee_vega_1pct = (vega / 100.0) * lot_size
        rupee_gamma_1pct = 0.5 * gamma * (spot ** 2) * (0.01 ** 2) * lot_size

        return {
            "spot": spot,
            "strike": strike,
            "tau": round(tau, 5),
            "vol_pct": round(vol * 100.0, 2),
            "is_call": is_call,
            "lot_size": lot_size,
            "first_order": {
                "delta": round(delta, 4),
                "vega": round(vega, 4),
                "theta_annual": round(theta, 4),
                "theta_daily": round(daily_theta, 4),
                "rho": round(rho, 4),
            },
            "second_order": {
                "gamma": round(gamma, 6),
                "vanna": round(vanna, 6),
                "vomma": round(vomma, 6),
                "charm": round(charm, 6),
                "veta": round(veta, 6),
                "color": round(color, 6),
            },
            "third_order": {
                "speed": round(speed, 8),
                "zomma": round(zomma, 6),
                "ultima": round(ultima, 6),
            },
            "cash_metrics": {
                "lot_delta": round(lot_delta, 2),
                "rupee_theta_day": round(rupee_theta_day, 2),
                "rupee_vega_1pct": round(rupee_vega_1pct, 2),
                "rupee_gamma_1pct": round(rupee_gamma_1pct, 2),
            }
        }

    def _boundary_greeks(self, spot: float, strike: float, is_call: bool, lot_size: int) -> Dict[str, Any]:
        delta = (1.0 if spot > strike else 0.0) if is_call else (-1.0 if spot < strike else 0.0)
        return {
            "spot": spot,
            "strike": strike,
            "tau": 0.0,
            "vol_pct": 0.0,
            "is_call": is_call,
            "lot_size": lot_size,
            "first_order": {"delta": delta, "vega": 0.0, "theta_annual": 0.0, "theta_daily": 0.0, "rho": 0.0},
            "second_order": {"gamma": 0.0, "vanna": 0.0, "vomma": 0.0, "charm": 0.0, "veta": 0.0, "color": 0.0},
            "third_order": {"speed": 0.0, "zomma": 0.0, "ultima": 0.0},
            "cash_metrics": {"lot_delta": delta * lot_size, "rupee_theta_day": 0.0, "rupee_vega_1pct": 0.0, "rupee_gamma_1pct": 0.0}
        }


if __name__ == "__main__":
    engine = AnalyticalGreeksEngine()
    res = engine.compute_all_greeks(
        spot=24850.0,
        strike=24850.0,
        tau=4.0 / 365.0,
        vol=0.138,
        is_call=True,
        lot_size=50
    )
    import json
    print("ATM Call 4 DTE Greeks:")
    print(json.dumps(res, indent=2))
