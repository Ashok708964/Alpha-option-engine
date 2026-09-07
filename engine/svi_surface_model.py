"""
OmniAlpha Quant Engine - Phase 3 Real-Time SVI (Stochastic Volatility Inspired) Surface Engine
Pure Python implementation (No external dependencies):
1. Raw SVI formulation: w(k) = a + b * (rho * (k - m) + sqrt((k - m)^2 + sigma^2))
2. Total implied variance w(k) to BS Implied Volatility: sigma_bs(k, tau) = sqrt(w(k) / tau)
3. Durrleman's Butterfly Arbitrage Condition (Risk-Neutral Density g(k) >= 0)
4. Calendar Arbitrage validation across multiple expiries (dw/dtau >= 0)
5. Quasi-explicit Levenberg-Marquardt / Nelder-Mead Nelder-Mead simplex calibrator
6. Analytical Greeks: Delta, Gamma, Vega, Theta, Vanna, Volga
"""

import math
from typing import Dict, List, Any, Tuple, Optional


def norm_cdf(x: float) -> float:
    """Standard normal cumulative distribution function (Abramowitz & Stegun approximation)."""
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def norm_pdf(x: float) -> float:
    """Standard normal probability density function."""
    return math.exp(-0.5 * x * x) / math.sqrt(2.0 * math.pi)


class SVISlice:
    """
    Represents a single expiry slice in SVI Raw Parameterization:
    w(k) = a + b * [ rho * (k - m) + sqrt((k - m)^2 + sigma^2) ]
    
    Constraints for Absence of Static Arbitrage:
    - b >= 0
    - |rho| < 1
    - sigma > 0
    - a + b * sigma * sqrt(1 - rho^2) >= 0  (ensures w(k) >= 0 for all k)
    - b * (1 + |rho|) < 4 / tau             (ensures no slope arbitrage at wings)
    """

    def __init__(
        self,
        tau: float,
        forward: float,
        a: float,
        b: float,
        rho: float,
        m: float,
        sigma: float,
    ):
        self.tau = max(1e-4, tau)
        self.forward = forward
        self.a = a
        self.b = max(0.0, b)
        self.rho = max(-0.999, min(0.999, rho))
        self.m = m
        self.sigma = max(1e-4, sigma)

    def total_variance(self, k: float) -> float:
        """Evaluates total implied variance w(k) at log-moneyness k = ln(K / F)."""
        km = k - self.m
        disc = math.sqrt(km * km + self.sigma * self.sigma)
        w = self.a + self.b * (self.rho * km + disc)
        return max(1e-6, w)

    def implied_volatility(self, k: float) -> float:
        """Converts total variance to annualized Black-Scholes implied volatility: sigma = sqrt(w / tau)."""
        w = self.total_variance(k)
        return math.sqrt(w / self.tau)

    def first_derivative(self, k: float) -> float:
        """dw/dk: first derivative of total variance with respect to log-moneyness k."""
        km = k - self.m
        disc = math.sqrt(km * km + self.sigma * self.sigma)
        return self.b * (self.rho + (km / disc))

    def second_derivative(self, k: float) -> float:
        """d2w/dk2: second derivative of total variance with respect to log-moneyness k."""
        km = k - self.m
        disc = math.sqrt(km * km + self.sigma * self.sigma)
        return self.b * (self.sigma * self.sigma) / (disc ** 3)

    def durrleman_density(self, k: float) -> float:
        """
        Durrleman's condition for absence of butterfly arbitrage.
        Risk-neutral density g(k) must be >= 0 everywhere:
        g(k) = (1 - k*w' / (2*w))^2 - (w'^2 / 4) * (1/w + 1/4) + w'' / 2
        """
        w = self.total_variance(k)
        w_p = self.first_derivative(k)
        w_pp = self.second_derivative(k)

        term1 = (1.0 - (k * w_p) / (2.0 * w)) ** 2
        term2 = ((w_p * w_p) / 4.0) * ((1.0 / w) + 0.25)
        term3 = 0.5 * w_pp
        return term1 - term2 + term3

    def check_butterfly_arbitrage(self, k_range: Tuple[float, float] = (-0.4, 0.4), steps: int = 50) -> Dict[str, Any]:
        """Scans moneyness range for butterfly arbitrage violations (g(k) < 0)."""
        min_k, max_k = k_range
        step_sz = (max_k - min_k) / steps
        violations = []
        min_density = 999.0

        for i in range(steps + 1):
            k = min_k + i * step_sz
            g_k = self.durrleman_density(k)
            if g_k < min_density:
                min_density = g_k
            if g_k < 0:
                violations.append({"k": round(k, 4), "density": round(g_k, 5)})

        return {
            "has_butterfly_arbitrage": len(violations) > 0,
            "min_density": round(min_density, 5),
            "violation_count": len(violations),
            "violations": violations[:5]
        }

    def compute_greeks(self, strike: float, is_call: bool = True, r: float = 0.065) -> Dict[str, float]:
        """
        Computes analytical Black-Scholes-Merton Greeks using SVI-interpolated implied volatility.
        """
        k = math.log(strike / self.forward)
        iv = self.implied_volatility(k)
        t = self.tau
        sqrt_t = math.sqrt(t)

        d1 = (math.log(self.forward / strike) + 0.5 * (iv * iv) * t) / (iv * sqrt_t)
        d2 = d1 - iv * sqrt_t
        df = math.exp(-r * t)

        nd1 = norm_cdf(d1)
        nd2 = norm_cdf(d2)
        n_prime_d1 = norm_pdf(d1)

        # Base Black-Scholes Greeks
        if is_call:
            delta = df * nd1
            theta = (
                - (self.forward * df * n_prime_d1 * iv) / (2.0 * sqrt_t)
                - r * strike * df * nd2
            ) / 365.0
        else:
            delta = df * (nd1 - 1.0)
            theta = (
                - (self.forward * df * n_prime_d1 * iv) / (2.0 * sqrt_t)
                + r * strike * df * (1.0 - nd2)
            ) / 365.0

        gamma = (df * n_prime_d1) / (self.forward * iv * sqrt_t)
        vega = (self.forward * df * sqrt_t * n_prime_d1) / 100.0  # 1% vol change

        # Higher-Order Greeks (Vanna & Volga)
        vanna = - df * n_prime_d1 * (d2 / iv) / 100.0
        volga = (vega * d1 * d2) / iv

        return {
            "implied_vol": round(iv * 100.0, 2),
            "delta": round(delta, 4),
            "gamma": round(gamma, 6),
            "vega": round(vega, 4),
            "theta": round(theta, 4),
            "vanna": round(vanna, 6),
            "volga": round(volga, 6)
        }


class SVICalibrator:
    """
    Calibrates SVI raw parameters (a, b, rho, m, sigma) to market strike IVs
    using coordinate-search and Nelder-Mead simplex with arbitrage penalty functions.
    """

    @staticmethod
    def calibrate_slice(
        strikes: List[float],
        market_ivs: List[float],
        forward: float,
        tau: float,
        initial_params: Optional[Tuple[float, float, float, float, float]] = None
    ) -> SVISlice:
        """
        Calibrates (a, b, rho, m, sigma) minimizing Root Mean Squared Error (RMSE)
        between market total variance and SVI modeled variance.
        """
        # Convert strikes to log-moneyness k and market total variance w_mkt
        data = []
        for K, iv in zip(strikes, market_ivs):
            k = math.log(K / forward)
            w_mkt = (iv * iv) * tau
            data.append((k, w_mkt))

        # Default initial heuristic guess based on ATM vol and skew
        atm_iv = market_ivs[len(market_ivs) // 2]
        atm_w = (atm_iv * atm_iv) * tau

        if initial_params is None:
            # a and b scale directly with total variance w = sigma^2 * tau
            curr = [atm_w * 0.5, atm_w * 1.5, -0.30, 0.002, 0.05]
        else:
            curr = list(initial_params)

        def objective(p: List[float]) -> float:
            a, b, rho, m, sigma = p
            # Penalty for violating static arbitrage constraints
            penalty = 0.0
            if b < 0:
                penalty += 1000.0 * abs(b)
            if abs(rho) >= 1.0:
                penalty += 1000.0 * (abs(rho) - 0.99)
            if sigma <= 0.001:
                penalty += 1000.0 * (0.001 - sigma)
            # a + b * sigma * sqrt(1 - rho^2) >= 0
            rad = math.sqrt(max(0.0, 1.0 - min(0.999, rho * rho)))
            if a + b * sigma * rad < 0:
                penalty += 500.0 * abs(a + b * sigma * rad)

            slice_obj = SVISlice(tau, forward, a, max(0.0, b), max(-0.999, min(0.999, rho)), m, max(0.001, sigma))
            sse = 0.0
            for k, w_mkt in data:
                w_pred = slice_obj.total_variance(k)
                diff = (w_pred - w_mkt) / max(1e-6, w_mkt)  # relative error for balanced fitting
                sse += diff * diff

            # Butterfly density penalty
            bf = slice_obj.check_butterfly_arbitrage()
            if bf["has_butterfly_arbitrage"]:
                penalty += 10.0 * bf["violation_count"]

            return sse + penalty

        # Pattern-search / Simplex optimization iterations
        best_p = list(curr)
        best_loss = objective(best_p)
        step_sizes = [atm_w * 0.1, atm_w * 0.2, 0.05, 0.005, 0.01]

        for iteration in range(120):
            improved = False
            for dim in range(5):
                for direction in [1.0, -1.0]:
                    candidate = list(best_p)
                    candidate[dim] += direction * step_sizes[dim]
                    # Clamp parameter domain
                    if dim == 1:
                        candidate[dim] = max(0.001, candidate[dim])
                    elif dim == 2:
                        candidate[dim] = max(-0.95, min(0.95, candidate[dim]))
                    elif dim == 4:
                        candidate[dim] = max(0.01, candidate[dim])

                    loss = objective(candidate)
                    if loss < best_loss:
                        best_loss = loss
                        best_p = candidate
                        improved = True
            if not improved:
                # Decay step sizes
                step_sizes = [s * 0.75 for s in step_sizes]
                if max(step_sizes) < 1e-4:
                    break

        return SVISlice(tau, forward, best_p[0], best_p[1], best_p[2], best_p[3], best_p[4])


class SVISurfaceModel:
    """
    Manages multi-expiry SVI surface calibration, calendar arbitrage validation,
    and 3D strike-expiry implied volatility interpolation.
    """

    def __init__(self, forward_curve: Dict[float, float]):
        """
        forward_curve: Map of tau (years to expiry) -> forward price F_t
        """
        self.forward_curve = forward_curve
        self.slices: Dict[float, SVISlice] = {}

    def add_calibrated_slice(self, tau: float, slice_model: SVISlice):
        """Adds a calibrated expiry slice to the surface."""
        self.slices[tau] = slice_model

    def check_calendar_arbitrage(self, k_range: Tuple[float, float] = (-0.3, 0.3), steps: int = 30) -> Dict[str, Any]:
        """
        Checks that total variance w(k, tau) is monotonically increasing with tau:
        For tau1 < tau2, w(k, tau1) <= w(k, tau2) for all k.
        """
        taus = sorted(self.slices.keys())
        if len(taus) < 2:
            return {"has_calendar_arbitrage": False, "violations": []}

        min_k, max_k = k_range
        step_sz = (max_k - min_k) / steps
        violations = []

        for i in range(len(taus) - 1):
            t1 = taus[i]
            t2 = taus[i + 1]
            s1 = self.slices[t1]
            s2 = self.slices[t2]

            for s in range(steps + 1):
                k = min_k + s * step_sz
                w1 = s1.total_variance(k)
                w2 = s2.total_variance(k)
                if w1 > w2:
                    violations.append({
                        "tau1": round(t1 * 365, 1),
                        "tau2": round(t2 * 365, 1),
                        "k": round(k, 3),
                        "w1": round(w1, 5),
                        "w2": round(w2, 5),
                        "deficit": round(w1 - w2, 6)
                    })

        return {
            "has_calendar_arbitrage": len(violations) > 0,
            "violation_count": len(violations),
            "violations": violations[:5]
        }

    def interpolate_vol(self, strike: float, target_tau: float) -> float:
        """
        Linear-in-variance time interpolation between neighboring calibrated SVI slices:
        w(k, tau) = (1 - lambda) * w(k, tau1) + lambda * w(k, tau2)
        """
        taus = sorted(self.slices.keys())
        if not taus:
            return 0.15
        if target_tau <= taus[0]:
            s = self.slices[taus[0]]
            k = math.log(strike / s.forward)
            return s.implied_volatility(k)
        if target_tau >= taus[-1]:
            s = self.slices[taus[-1]]
            k = math.log(strike / s.forward)
            return s.implied_volatility(k)

        # Find enclosing brackets
        idx = 0
        while idx < len(taus) - 1 and taus[idx + 1] < target_tau:
            idx += 1
        t1, t2 = taus[idx], taus[idx + 1]
        weight = (target_tau - t1) / (t2 - t1)

        s1 = self.slices[t1]
        s2 = self.slices[t2]
        k1 = math.log(strike / s1.forward)
        k2 = math.log(strike / s2.forward)

        w1 = s1.total_variance(k1)
        w2 = s2.total_variance(k2)
        w_interp = (1.0 - weight) * w1 + weight * w2

        return math.sqrt(w_interp / target_tau)
