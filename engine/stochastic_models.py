"""
OmniAlpha Quant Engine - Stochastic & Jump Volatility Models
Implements:
1. Heston Stochastic Volatility Model (Little Heston Trap characteristic function)
2. SABR Asymptotic Smile Model (Hagan 2002)
3. Dupire Local Volatility Surface Grid (Finite Difference reconstruction)
4. Merton Jump-Diffusion Model (Compound Poisson jumps with analytical series)
"""

import os
import sys
import math
import cmath
from typing import Dict, List, Any, Tuple

# Ensure project root in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class HestonModel:
    """
    Heston (1993) Stochastic Volatility Model:
    dS_t = (r - q) S_t dt + sqrt(v_t) S_t dW_t^S
    dv_t = kappa * (theta - v_t) dt + xi * sqrt(v_t) dW_t^v
    corr(dW_t^S, dW_t^v) = rho
    Implemented using the Albrecher et al. (2007) 'Little Heston Trap' formulation.
    """

    def __init__(
        self,
        v0: float = 0.020,     # Initial instantaneous variance (e.g. 14.1% vol -> 0.020)
        kappa: float = 2.5,     # Mean reversion speed
        theta: float = 0.025,   # Long-term variance (15.8% vol)
        xi: float = 0.45,       # Vol-of-vol
        rho: float = -0.72      # Leverage correlation
    ):
        self.v0 = v0
        self.kappa = kappa
        self.theta = theta
        self.xi = xi
        self.rho = rho

    def check_feller_condition(self) -> Dict[str, Any]:
        """Feller condition: 2 * kappa * theta > xi^2 (ensures variance remains strictly positive)."""
        lhs = 2.0 * self.kappa * self.theta
        rhs = self.xi ** 2
        satisfied = lhs > rhs
        return {
            "satisfied": satisfied,
            "feller_ratio": round(lhs / max(1e-6, rhs), 3),
            "lhs_2_kappa_theta": round(lhs, 5),
            "rhs_xi_squared": round(rhs, 5),
            "boundary_behavior": "Strictly positive process" if satisfied else "Reflecting at zero boundary"
        }

    def characteristic_function(self, u: complex, s0: float, tau: float, r: float = 0.065, q: float = 0.012) -> complex:
        """Computes the Little Heston Trap characteristic function phi(u)."""
        xi = self.xi
        kappa = self.kappa
        theta = self.theta
        rho = self.rho
        v0 = self.v0

        i = complex(0, 1)
        d = cmath.sqrt((rho * xi * u * i - kappa) ** 2 + (xi ** 2) * (u * i + u ** 2))
        g = (kappa - rho * xi * u * i - d) / (kappa - rho * xi * u * i + d)

        exp_neg_d_tau = cmath.exp(-d * tau)
        c = (r - q) * u * i * tau + (kappa * theta / (xi ** 2)) * (
            (kappa - rho * xi * u * i - d) * tau - 2.0 * cmath.log((1.0 - g * exp_neg_d_tau) / (1.0 - g))
        )
        d_val = ((kappa - rho * xi * u * i - d) / (xi ** 2)) * ((1.0 - exp_neg_d_tau) / (1.0 - g * exp_neg_d_tau))

        return cmath.exp(c + d_val * v0 + i * u * math.log(s0))

    def price_call(self, s0: float, k: float, tau: float, r: float = 0.065, q: float = 0.012, n_quad: int = 64) -> float:
        """Prices a European Call option using Gauss-Legendre quadrature integration."""
        if tau <= 0:
            return max(0.0, s0 - k)

        # Integration upper limit
        u_max = 100.0
        du = u_max / float(n_quad)
        accum = 0.0

        for idx in range(1, n_quad):
            u = idx * du
            phi = self.characteristic_function(complex(u, 0), s0, tau, r, q)
            integrand = (cmath.exp(-complex(0, 1) * u * math.log(k)) * phi / (complex(0, 1) * u)).real
            accum += integrand * du

        p2 = 0.5 + (1.0 / math.pi) * accum

        # Complementary probability p1 (shift by -i)
        accum1 = 0.0
        for idx in range(1, n_quad):
            u = idx * du
            phi1 = self.characteristic_function(complex(u, -1), s0, tau, r, q)
            denom_phi = self.characteristic_function(complex(0, -1), s0, tau, r, q)
            integrand1 = (cmath.exp(-complex(0, 1) * u * math.log(k)) * (phi1 / denom_phi) / (complex(0, 1) * u)).real
            accum1 += integrand1 * du

        p1 = 0.5 + (1.0 / math.pi) * accum1
        call_price = s0 * math.exp(-q * tau) * p1 - k * math.exp(-r * tau) * p2
        return max(0.0, call_price.real)


class SabrModel:
    """
    SABR (Stochastic Alpha Beta Rho) Model (Hagan et al. 2002):
    dF_t = sigma_t F_t^beta dW_t^F
    dsigma_t = nu * sigma_t dW_t^sigma
    corr(dW_t^F, dW_t^sigma) = rho
    """

    def __init__(self, alpha: float = 0.14, beta: float = 0.70, rho: float = -0.35, nu: float = 0.45):
        self.alpha = alpha
        self.beta = beta
        self.rho = rho
        self.nu = nu

    def implied_volatility(self, f: float, k: float, tau: float) -> float:
        """Hagan's 2002 asymptotic implied volatility formula."""
        if tau <= 0 or f <= 0 or k <= 0:
            return self.alpha

        # If alpha is provided as lognormal ATM vol (e.g. 0.14), scale to CEV backbone: alpha_eff = alpha * f^(1 - beta)
        alpha = self.alpha if (self.alpha > 1.0 or self.beta == 1.0) else self.alpha * (f ** (1.0 - self.beta))
        beta = self.beta
        rho = self.rho
        nu = self.nu

        if abs(f - k) < 1e-4:
            # ATM Volatility
            f_beta = f ** (1.0 - beta)
            term1 = alpha / f_beta
            term2 = (
                ((1.0 - beta) ** 2 / 24.0) * (alpha ** 2 / (f ** (2.0 - 2.0 * beta)))
                + 0.25 * (rho * beta * nu * alpha / f_beta)
                + ((2.0 - 3.0 * rho ** 2) / 24.0) * (nu ** 2)
            ) * tau
            return term1 * (1.0 + term2)

        # Non-ATM Volatility
        log_fk = math.log(f / k)
        f_mid = math.sqrt(f * k)
        f_mid_beta = f_mid ** (1.0 - beta)

        z = (nu / alpha) * f_mid_beta * log_fk
        chi_z = math.log((math.sqrt(1.0 - 2.0 * rho * z + z * z) + z - rho) / (1.0 - rho)) if abs(z) > 1e-6 else 1.0

        numer = alpha * (1.0 + (
            ((1.0 - beta) ** 2 / 24.0) * (alpha ** 2 / (f_mid ** (2.0 - 2.0 * beta)))
            + 0.25 * (rho * beta * nu * alpha / f_mid_beta)
            + ((2.0 - 3.0 * rho ** 2) / 24.0) * (nu ** 2)
        ) * tau)

        denom = f_mid_beta * (1.0 + ((1.0 - beta) ** 2 / 24.0) * (log_fk ** 2) + ((1.0 - beta) ** 4 / 1920.0) * (log_fk ** 4))

        z_ratio = (z / chi_z) if (abs(z) > 1e-6 and abs(chi_z) > 1e-6) else 1.0
        return (numer / denom) * z_ratio


class DupireLocalVolModel:
    """
    Dupire (1994) Continuous Local Volatility Engine:
    sigma_loc^2(K, T) = (dC/dT + (r-q) * K * dC/dK) / (0.5 * K^2 * d2C/dK2)
    Reconstructs the non-parametric state-dependent diffusion grid.
    """

    @staticmethod
    def compute_local_vol(
        c_grid: List[List[float]],
        strikes: List[float],
        taus: List[float],
        r: float = 0.065,
        q: float = 0.012
    ) -> List[List[float]]:
        """Computes local volatility grid from call price matrix using finite differences."""
        n_t = len(taus)
        n_k = len(strikes)
        loc_vol_grid = [[0.14 for _ in range(n_k)] for _ in range(n_t)]

        for t_idx in range(n_t - 1):
            dt = max(1e-4, taus[t_idx + 1] - taus[t_idx])
            for k_idx in range(1, n_k - 1):
                k = strikes[k_idx]
                dk = max(1.0, (strikes[k_idx + 1] - strikes[k_idx - 1]) / 2.0)
                dk2 = max(1.0, (strikes[k_idx + 1] - strikes[k_idx]) * (strikes[k_idx] - strikes[k_idx - 1]))

                c_curr = c_grid[t_idx][k_idx]
                c_next = c_grid[t_idx + 1][k_idx]

                # dC/dT
                dC_dT = (c_next - c_curr) / dt

                # dC/dK
                dC_dK = (c_grid[t_idx][k_idx + 1] - c_grid[t_idx][k_idx - 1]) / (2.0 * dk)

                # d2C/dK2
                d2C_dK2 = (c_grid[t_idx][k_idx + 1] - 2.0 * c_curr + c_grid[t_idx][k_idx - 1]) / dk2

                # Avoid zero or negative density
                if d2C_dK2 > 1e-7:
                    numerator = dC_dT + (r - q) * k * dC_dK
                    denominator = 0.5 * (k ** 2) * d2C_dK2
                    if numerator > 0 and denominator > 0:
                        loc_vol = math.sqrt(numerator / denominator)
                        loc_vol_grid[t_idx][k_idx] = max(0.05, min(0.60, loc_vol))
                    else:
                        loc_vol_grid[t_idx][k_idx] = 0.14
                else:
                    loc_vol_grid[t_idx][k_idx] = 0.14

        # Replicate last row
        loc_vol_grid[-1] = loc_vol_grid[-2]
        return loc_vol_grid


class MertonJumpDiffusionModel:
    """
    Merton (1976) Jump-Diffusion Model:
    dS_t / S_t = (r - q - lambda * k_jump) dt + sigma dW_t + J_t dN_t
    ln(1 + J) ~ N(mu_J, sigma_J^2)
    """

    def __init__(
        self,
        sigma: float = 0.12,       # Diffusion volatility
        lam: float = 0.35,         # Jump intensity (expected jumps per year)
        mu_j: float = -0.08,       # Mean log jump size (negative = crash bias)
        sigma_j: float = 0.15      # Jump size volatility
    ):
        self.sigma = sigma
        self.lam = lam
        self.mu_j = mu_j
        self.sigma_j = sigma_j
        # Expected relative price change k_jump = E[J] = exp(mu_j + 0.5 * sigma_j^2) - 1
        self.k_jump = math.exp(mu_j + 0.5 * (sigma_j ** 2)) - 1.0

    def price_call(
        self,
        s0: float,
        k: float,
        tau: float,
        r: float = 0.065,
        q: float = 0.012,
        max_n: int = 15
    ) -> float:
        """Evaluates Merton analytical series sum over Poisson jump distribution."""
        from engine.iv_solver import black_scholes_price

        if tau <= 0:
            return max(0.0, s0 - k)

        lam_prime = self.lam * (1.0 + self.k_jump)
        gamma = self.mu_j + 0.5 * (self.sigma_j ** 2)

        total_price = 0.0
        poisson_prob = math.exp(-lam_prime * tau)

        for n in range(max_n):
            # Variance for n jumps
            sigma_n = math.sqrt(self.sigma ** 2 + (n * (self.sigma_j ** 2)) / tau)
            # Drift adjustment
            r_n = r - self.lam * self.k_jump + (n * gamma) / tau

            bs_p = black_scholes_price(
                spot=s0,
                strike=k,
                tau=tau,
                vol=sigma_n,
                r=r_n,
                q=q,
                is_call=True
            )
            total_price += poisson_prob * bs_p

            # Update Poisson probability iteratively: P(n+1) = P(n) * (lam_prime * tau) / (n + 1)
            poisson_prob *= (lam_prime * tau) / float(n + 1)

        return total_price


if __name__ == "__main__":
    heston = HestonModel()
    print("Heston Feller check:", heston.check_feller_condition())
    call_heston = heston.price_call(24850.0, 24850.0, 30.0 / 365.0)
    print(f"Heston ATM 30D Call Price: {call_heston:.2f}")

    sabr = SabrModel()
    sabr_iv = sabr.implied_volatility(24850.0, 24850.0, 30.0 / 365.0)
    print(f"SABR ATM 30D IV: {sabr_iv * 100:.2f}%")

    merton = MertonJumpDiffusionModel()
    merton_call = merton.price_call(24850.0, 24850.0, 30.0 / 365.0)
    print(f"Merton ATM 30D Call Price: {merton_call:.2f}")
