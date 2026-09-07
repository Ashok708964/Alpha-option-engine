"""
OmniAlpha Quant Engine - Higher-Order Greeks Surface Bridge
Aggregates 1st, 2nd, and 3rd-order Greeks across strikes and expiries.
Outputs JSON snapshot for /api/options/greeks-matrix.
"""

import sys
import os
import json
from typing import Dict, List, Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.greeks_matrix import AnalyticalGreeksEngine


def build_greeks_matrix(
    symbol: str = "NIFTY 50",
    spot_price: float = 24854.20,
    base_iv: float = 0.138,
    lot_size: int = 50,
    strike_step: float = 50.0
) -> Dict[str, Any]:
    """
    Constructs a complete matrix of 1st, 2nd, and 3rd-order Greeks
    for calls and puts across current weekly, next weekly, and monthly tenors.
    """
    engine = AnalyticalGreeksEngine(r=0.065, q=0.012)

    expiries = [
        {"name": "Current Weekly (4 DTE)", "dte": 4, "tau": 4.0 / 365.0, "iv_multiplier": 1.00},
        {"name": "Next Weekly (11 DTE)", "dte": 11, "tau": 11.0 / 365.0, "iv_multiplier": 1.03},
        {"name": "Monthly (25 DTE)", "dte": 25, "tau": 25.0 / 365.0, "iv_multiplier": 1.07},
    ]

    atm_strike = round(spot_price / strike_step) * strike_step
    strikes = [atm_strike + (i * strike_step) for i in range(-8, 9)]

    expiry_matrices = []

    for exp in expiries:
        tau = exp["tau"]
        eff_iv = base_iv * exp["iv_multiplier"]
        calls_data = []
        puts_data = []

        for k in strikes:
            # Skew adjustment: OTM puts get higher IV, OTM calls get lower IV
            moneyness = k / spot_price
            skew_adj = 1.0 - 0.35 * (moneyness - 1.0)
            vol_k = max(0.06, min(0.40, eff_iv * skew_adj))

            call_greeks = engine.compute_all_greeks(
                spot=spot_price,
                strike=k,
                tau=tau,
                vol=vol_k,
                is_call=True,
                lot_size=lot_size
            )
            put_greeks = engine.compute_all_greeks(
                spot=spot_price,
                strike=k,
                tau=tau,
                vol=vol_k,
                is_call=False,
                lot_size=lot_size
            )

            calls_data.append({"strike": k, "iv_pct": round(vol_k * 100.0, 2), **call_greeks})
            puts_data.append({"strike": k, "iv_pct": round(vol_k * 100.0, 2), **put_greeks})

        expiry_matrices.append({
            "expiry_name": exp["name"],
            "dte": exp["dte"],
            "tau": round(tau, 5),
            "atm_strike": atm_strike,
            "calls": calls_data,
            "puts": puts_data
        })

    # Portfolio sensitivity snapshot (ATM straddle benchmark)
    atm_call = engine.compute_all_greeks(spot_price, atm_strike, 4.0 / 365.0, base_iv, is_call=True, lot_size=lot_size)
    atm_put = engine.compute_all_greeks(spot_price, atm_strike, 4.0 / 365.0, base_iv, is_call=False, lot_size=lot_size)

    net_straddle = {
        "net_delta": round(atm_call["first_order"]["delta"] + atm_put["first_order"]["delta"], 4),
        "net_gamma": round(atm_call["second_order"]["gamma"] + atm_put["second_order"]["gamma"], 6),
        "net_vega": round(atm_call["first_order"]["vega"] + atm_put["first_order"]["vega"], 2),
        "net_theta_daily": round(atm_call["first_order"]["theta_daily"] + atm_put["first_order"]["theta_daily"], 2),
        "net_vanna": round(atm_call["second_order"]["vanna"] + atm_put["second_order"]["vanna"], 6),
        "net_vomma": round(atm_call["second_order"]["vomma"] + atm_put["second_order"]["vomma"], 4),
        "net_charm": round(atm_call["second_order"]["charm"] + atm_put["second_order"]["charm"], 6),
        "rupee_theta_day": round(atm_call["cash_metrics"]["rupee_theta_day"] + atm_put["cash_metrics"]["rupee_theta_day"], 2),
        "rupee_vega_1pct": round(atm_call["cash_metrics"]["rupee_vega_1pct"] + atm_put["cash_metrics"]["rupee_vega_1pct"], 2),
    }

    return {
        "status": "OPERATIONAL",
        "symbol": symbol,
        "spot_price": spot_price,
        "atm_strike": atm_strike,
        "lot_size": lot_size,
        "atm_straddle_risk": net_straddle,
        "expiries": expiry_matrices,
    }


if __name__ == "__main__":
    sym = sys.argv[1] if len(sys.argv) > 1 else "NIFTY 50"
    matrix = build_greeks_matrix(symbol=sym)
    print(json.dumps(matrix, indent=2))
