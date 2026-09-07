"""
OmniAlpha Quant Engine - Phase 3 SVI Options Surface Bridge
Calibrates and evaluates SVI parametric volatility surfaces for NIFTY 50
across multiple expiries (Current Weekly, Next Weekly, Monthly) spanning +-15 strikes.
"""

import os
import sys
import json
import math
from datetime import datetime
from typing import Dict, List, Any

# Ensure project root in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.svi_surface_model import SVISlice, SVICalibrator, SVISurfaceModel
from engine.skew_analytics import SkewAnalyticsEngine
from engine.stochastic_models import HestonModel, SabrModel, MertonJumpDiffusionModel


def generate_nifty_market_chain(
    spot: float = 24854.20,
    r: float = 0.065,
    q: float = 0.012
) -> List[Dict[str, Any]]:
    """
    Generates NIFTY 50 options chains across 3 expiries:
    - Current Weekly: 4 DTE
    - Next Weekly: 11 DTE
    - Monthly: 25 DTE
    Spanning 25 strikes from 23,600 to 26,000 (step 100).
    """
    expiries = [
        {"name": "Current Weekly (4 DTE)", "dte": 4, "tau": 4.0 / 365.0, "atm_iv": 0.138, "skew": -0.28},
        {"name": "Next Weekly (11 DTE)", "dte": 11, "tau": 11.0 / 365.0, "atm_iv": 0.142, "skew": -0.25},
        {"name": "Monthly Expiry (25 DTE)", "dte": 25, "tau": 25.0 / 365.0, "atm_iv": 0.148, "skew": -0.22}
    ]

    strikes = [float(k) for k in range(23600, 26100, 100)]
    slices_data = []

    for exp in expiries:
        tau = exp["tau"]
        forward = spot * math.exp((r - q) * tau)
        atm_iv = exp["atm_iv"]
        skew_slope = exp["skew"]

        chain = []
        for strike in strikes:
            k = math.log(strike / forward)
            # Market synthetic smile with realistic OTM put wing bid and call wing curvature
            wing_vol = atm_iv + skew_slope * k + 0.35 * (k ** 2)
            # Introduce slight tick noise
            market_iv = max(0.08, min(0.40, wing_vol))
            chain.append({
                "strike": strike,
                "log_moneyness": round(k, 4),
                "market_iv": round(market_iv * 100.0, 2),
                "iv_decimal": market_iv
            })

        slices_data.append({
            "name": exp["name"],
            "dte": exp["dte"],
            "tau": round(tau, 6),
            "forward": round(forward, 2),
            "atm_iv": round(atm_iv * 100.0, 2),
            "chain": chain
        })

    return slices_data


def get_svi_surface_snapshot(symbol: str = "NIFTY 50") -> Dict[str, Any]:
    """
    Calibrates SVI model for all expiries and compiles comprehensive surface telemetry.
    """
    spot = 24854.20
    slices_raw = generate_nifty_market_chain(spot)

    forward_map = {s["tau"]: s["forward"] for s in slices_raw}
    surface_model = SVISurfaceModel(forward_map)

    calibrated_slices = []

    for s_raw in slices_raw:
        tau = s_raw["tau"]
        forward = s_raw["forward"]
        strikes = [item["strike"] for item in s_raw["chain"]]
        ivs = [item["iv_decimal"] for item in s_raw["chain"]]

        # Calibrate SVI slice
        calibrated_slice = SVICalibrator.calibrate_slice(strikes, ivs, forward, tau)
        surface_model.add_calibrated_slice(tau, calibrated_slice)

        # Evaluate fitted curve vs market
        fitted_points = []
        sum_sq_err = 0.0

        for item in s_raw["chain"]:
            strike = item["strike"]
            k = item["log_moneyness"]
            mkt_iv = item["market_iv"]
            svi_iv = calibrated_slice.implied_volatility(k) * 100.0
            density_gk = calibrated_slice.durrleman_density(k)

            greeks_call = calibrated_slice.compute_greeks(strike, is_call=True)
            greeks_put = calibrated_slice.compute_greeks(strike, is_call=False)

            err = svi_iv - mkt_iv
            sum_sq_err += err * err

            fitted_points.append({
                "strike": strike,
                "log_moneyness": k,
                "market_iv": mkt_iv,
                "svi_iv": round(svi_iv, 2),
                "residual_bps": round(err * 100.0, 1),
                "durrleman_density": round(density_gk, 4),
                "call_delta": greeks_call["delta"],
                "put_delta": greeks_put["delta"],
                "gamma": greeks_call["gamma"],
                "vega": greeks_call["vega"],
                "theta": greeks_call["theta"],
                "vanna": greeks_call["vanna"],
                "volga": greeks_call["volga"]
            })

        rmse_bps = round(math.sqrt(sum_sq_err / len(strikes)) * 100.0, 2)
        butterfly_check = calibrated_slice.check_butterfly_arbitrage()

        calibrated_slices.append({
            "name": s_raw["name"],
            "dte": s_raw["dte"],
            "tau": tau,
            "forward": forward,
            "atm_iv": s_raw["atm_iv"],
            "rmse_bps": rmse_bps,
            "svi_params": {
                "a": round(calibrated_slice.a, 6),
                "b": round(calibrated_slice.b, 6),
                "rho": round(calibrated_slice.rho, 4),
                "m": round(calibrated_slice.m, 4),
                "sigma": round(calibrated_slice.sigma, 4),
            },
            "butterfly_arbitrage": butterfly_check,
            "points": fitted_points
        })

    # Calendar Arbitrage across the surface
    calendar_check = surface_model.check_calendar_arbitrage()

    # 3D Grid interpolation (Strikes: 23800 to 25800, Expiries: 4 to 25 DTE)
    grid_strikes = [23800, 24200, 24600, 24850, 25200, 25600]
    grid_dtes = [4, 7, 11, 18, 25]
    surface_grid = []

    for dte in grid_dtes:
        t_yr = dte / 365.0
        row = {"dte": dte}
        for st in grid_strikes:
            iv = surface_model.interpolate_vol(st, t_yr)
            row[str(st)] = round(iv * 100.0, 2)
        surface_grid.append(row)

    # Skew & Term Structure Analytics
    skew_engine = SkewAnalyticsEngine()
    skew_matrix = skew_engine.compute_surface_term_skew_matrix(calibrated_slices)

    # Stochastic & Jump Volatility Models
    heston = HestonModel(v0=0.020, kappa=2.5, theta=0.025, xi=0.45, rho=-0.72)
    sabr = SabrModel(alpha=0.14, beta=0.70, rho=-0.35, nu=0.45)
    merton = MertonJumpDiffusionModel(sigma=0.12, lam=0.35, mu_j=-0.08, sigma_j=0.15)

    stochastic_suite = {
        "heston": {
            "params": {"v0": 0.020, "kappa": 2.5, "theta": 0.025, "xi": 0.45, "rho": -0.72},
            "feller_check": heston.check_feller_condition(),
            "sample_call_30d": round(heston.price_call(spot, spot, 30.0 / 365.0), 2)
        },
        "sabr": {
            "params": {"alpha": 0.14, "beta": 0.70, "rho": -0.35, "nu": 0.45},
            "sample_atm_iv_pct": round(sabr.implied_volatility(spot, spot, 30.0 / 365.0) * 100.0, 2),
            "sample_otm_put_iv_pct": round(sabr.implied_volatility(spot, spot * 0.95, 30.0 / 365.0) * 100.0, 2)
        },
        "merton_jump": {
            "params": {"sigma": 0.12, "lambda_jump": 0.35, "mu_jump": -0.08, "sigma_jump": 0.15},
            "sample_call_30d": round(merton.price_call(spot, spot, 30.0 / 365.0), 2)
        }
    }

    return {
        "status": "CALIBRATED_OPERATIONAL",
        "symbol": symbol,
        "spot_price": spot,
        "timestamp": datetime.now().isoformat(),
        "total_expiries": len(calibrated_slices),
        "calendar_arbitrage": calendar_check,
        "slices": calibrated_slices,
        "surface_grid": surface_grid,
        "skew_analytics": skew_matrix,
        "stochastic_models": stochastic_suite
    }


if __name__ == "__main__":
    sym = sys.argv[1] if len(sys.argv) > 1 else "NIFTY 50"
    snapshot = get_svi_surface_snapshot(sym)
    print(json.dumps(snapshot, indent=2))
