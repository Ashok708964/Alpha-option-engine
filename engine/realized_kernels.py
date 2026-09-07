"""
OmniAlpha Quant Engine - Realized Kernels & Microstructure Noise Filtering
Mathematical Formulation: Barndorff-Nielsen, Hansen, Lunde & Shephard (Econometrica 2008, 2011)
Filters out bid-ask bounce, asynchronous discrete order arrivals, and tick-level toxicity.
"""

import math
from typing import List, Dict, Tuple, Optional

def parzen_kernel(x: float) -> float:
    """
    Parzen kernel function k(x).
    Guarantees positive semi-definiteness of the covariance/variance estimate.
    """
    abs_x = abs(x)
    if abs_x <= 0.5:
        return 1.0 - 6.0 * (abs_x ** 2) + 6.0 * (abs_x ** 3)
    elif abs_x <= 1.0:
        return 2.0 * ((1.0 - abs_x) ** 3)
    else:
        return 0.0

def tukey_hanning_kernel(x: float) -> float:
    """
    Tukey-Hanning kernel of order 2.
    Smooth decay function over normalized lag x in [0, 1].
    """
    abs_x = abs(x)
    if abs_x <= 1.0:
        return 0.5 * (1.0 + math.cos(math.pi * abs_x))
    return 0.0

class RealizedKernelEstimator:
    """
    Continuous Intraday Realized Kernel Variance & Noise Estimator.
    Decouples true continuous price diffusion from microstructure noise.
    """

    def __init__(self, kernel_type: str = "parzen"):
        self.kernel_type = kernel_type.lower()
        self.kernel_fn = parzen_kernel if self.kernel_type == "parzen" else tukey_hanning_kernel

    def compute_returns(self, prices: List[float]) -> List[float]:
        """Computes log returns x_i = ln(P_i / P_{i-1})."""
        returns = []
        for i in range(1, len(prices)):
            if prices[i] > 0 and prices[i - 1] > 0:
                returns.append(math.log(prices[i] / prices[i - 1]))
        return returns

    def compute_autocovariance(self, returns: List[float], lag: int) -> float:
        """
        Computes sample autocovariance:
        gamma_h = sum_{j=1}^n x_j * x_{j-h}
        """
        n = len(returns)
        if lag >= n:
            return 0.0
        
        gamma = 0.0
        for j in range(lag, n):
            gamma += returns[j] * returns[j - lag]
        return gamma

    def estimate_noise_variance(self, returns: List[float]) -> float:
        """
        Estimates microstructure noise variance omega^2:
        omega^2 = (1 / 2n) * sum_{i=1}^n x_i^2
        """
        n = len(returns)
        if n == 0:
            return 0.0
        sum_sq = sum(r * r for r in returns)
        return sum_sq / (2.0 * n)

    def calculate(self, prices: List[float]) -> Dict[str, float]:
        """
        Calculates Realized Variance (Raw), Realized Kernel (Noise-Filtered),
        Microstructure Noise Variance, and Signal-to-Noise Ratio (SNR).
        """
        if len(prices) < 5:
            return {
                "raw_realized_variance": 0.0,
                "realized_kernel_variance": 0.0,
                "annualized_kernel_vol": 0.16,
                "noise_variance": 0.0,
                "noise_ratio_xi": 0.0,
                "snr_db": 0.0,
                "optimal_bandwidth_h": 0,
                "tick_count": len(prices)
            }

        returns = self.compute_returns(prices)
        n = len(returns)
        if n < 4:
            return {
                "raw_realized_variance": 0.0,
                "realized_kernel_variance": 0.0,
                "annualized_kernel_vol": 0.16,
                "noise_variance": 0.0,
                "noise_ratio_xi": 0.0,
                "snr_db": 0.0,
                "optimal_bandwidth_h": 0,
                "tick_count": len(prices)
            }

        # 1. Raw Realized Variance (sum of squared returns)
        gamma_0 = self.compute_autocovariance(returns, 0)
        raw_rv = gamma_0

        # 2. Microstructure Noise Variance omega^2
        omega_sq = self.estimate_noise_variance(returns)

        # 3. Pilot Integrated Variance estimate
        iv_pilot = max(raw_rv - 2.0 * n * omega_sq, 1e-6)

        # 4. Noise-to-Signal Ratio: xi^2 = omega^2 / sqrt(IV)
        xi_sq = omega_sq / math.sqrt(iv_pilot)
        xi = math.sqrt(max(xi_sq, 1e-8))

        # 5. Optimal Bandwidth H* for Parzen Kernel (c* ≈ 3.513)
        c_star = 3.513 if self.kernel_type == "parzen" else 2.18
        h_optimal = max(1, int(c_star * (xi ** 0.8) * (n ** 0.6)))
        h_optimal = min(h_optimal, n - 1, 30)

        # 6. Realized Kernel: K(X) = gamma_0 + 2 * sum_{h=1}^H k((h-1)/H) * gamma_h
        rk = gamma_0
        for h in range(1, h_optimal + 1):
            weight = self.kernel_fn((h - 1) / float(h_optimal))
            gamma_h = self.compute_autocovariance(returns, h)
            rk += 2.0 * weight * gamma_h

        # Enforce non-negativity constraint
        realized_kernel_var = max(rk, 1e-8)

        # Annualize volatility (assuming 252 trading days, ~375 mins/day)
        # Scaled for 1-day variance:
        daily_var = realized_kernel_var
        annualized_vol = math.sqrt(daily_var * 252.0)
        annualized_vol = max(0.05, min(annualized_vol, 1.50))

        # Signal-to-Noise Ratio (dB)
        noise_power = max(omega_sq * 2.0 * n, 1e-9)
        signal_power = max(realized_kernel_var, 1e-9)
        snr_db = 10.0 * math.log10(signal_power / noise_power)

        return {
            "raw_realized_variance": round(raw_rv, 8),
            "realized_kernel_variance": round(realized_kernel_var, 8),
            "annualized_kernel_vol": round(annualized_vol, 4),
            "noise_variance": round(omega_sq, 10),
            "noise_ratio_xi": round(xi, 4),
            "snr_db": round(snr_db, 2),
            "optimal_bandwidth_h": h_optimal,
            "tick_count": len(prices)
        }
