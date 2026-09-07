"""
OmniAlpha Quant Engine - Institutional Risk & Performance Attribution Suite
Calculates rigorous quantitative performance metrics:
- Annualized Sharpe Ratio (with configurable risk-free rate, e.g. RBI 6.5% repo rate)
- Sortino Ratio (downside semi-deviation)
- Calmar Ratio (CAGR over Maximum Drawdown)
- Omega Ratio (probability weighted ratio of gains over losses)
- Maximum Drawdown (absolute, percentage, peak-to-trough duration)
- Parametric and Historical Value-at-Risk (VaR 95%, 99%)
- Conditional Value-at-Risk / Expected Shortfall (CVaR 95%, 99%)
- Trade statistics: Win Rate, Profit Factor, Expectancy, Payoff Ratio, Max Consecutive Losses
"""

import math
from typing import List, Dict, Any, Optional


def norm_cdf(x: float) -> float:
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def norm_inv(p: float) -> float:
    """Rational approximation of inverse standard normal CDF (Acklam / Winitzki)."""
    if p <= 0.0:
        return -5.0
    if p >= 1.0:
        return 5.0
    if p == 0.5:
        return 0.0

    # Coefficients for approximation
    a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
         1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00]
    b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
         6.680139218774483e+01, -1.328068155288572e+01]
    c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
         -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00]
    d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
         3.754408661907416e+00]

    q = min(p, 1.0 - p)
    if q > 0.02425:
        r = q - 0.5
        r2 = r * r
        num = (((((a[0] * r2 + a[1]) * r2 + a[2]) * r2 + a[3]) * r2 + a[4]) * r2 + a[5]) * r
        den = ((((b[0] * r2 + b[1]) * r2 + b[2]) * r2 + b[3]) * r2 + b[4]) * r2 + 1.0
        x = num / den
    else:
        r = math.sqrt(-math.log(q))
        num = (((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5])
        den = ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1.0)
        x = num / den
        if p < 0.5:
            x = -x

    return x if p > 0.5 else -abs(x)


class PerformanceAnalyticsEngine:
    """
    Computes rigorous portfolio risk and return performance attribution.
    """

    def __init__(self, risk_free_rate: float = 0.065, periods_per_year: int = 252):
        self.rf = risk_free_rate
        self.ppy = periods_per_year
        self.rf_daily = ((1.0 + self.rf) ** (1.0 / float(self.ppy))) - 1.0

    def compute_all_metrics(
        self,
        equity_curve: List[float],
        returns: Optional[List[float]] = None,
        trade_pnls: Optional[List[float]] = None
    ) -> Dict[str, Any]:
        """
        Takes an equity curve (e.g. [100000, 100500, ...]) and trade PnLs to generate
        complete institutional risk & return metrics.
        """
        if len(equity_curve) < 2:
            return self._empty_metrics()

        # Derive returns if not supplied
        if returns is None or len(returns) == 0:
            returns = []
            for i in range(1, len(equity_curve)):
                prev = equity_curve[i - 1]
                curr = equity_curve[i]
                r = (curr - prev) / max(1.0, prev)
                returns.append(r)

        n = len(returns)
        if n == 0:
            return self._empty_metrics()

        initial_capital = equity_curve[0]
        final_capital = equity_curve[-1]
        total_pnl = final_capital - initial_capital
        total_return_pct = (total_pnl / max(1.0, initial_capital)) * 100.0

        # Annualized Compound Return (CAGR)
        years = n / float(self.ppy)
        if years > 0 and final_capital > 0 and initial_capital > 0:
            cagr = ((final_capital / initial_capital) ** (1.0 / years)) - 1.0
        else:
            cagr = total_return_pct / 100.0

        mean_daily_return = sum(returns) / float(n)
        variance = sum((r - mean_daily_return) ** 2 for r in returns) / max(1, n - 1)
        std_daily = math.sqrt(variance)
        annualized_vol = std_daily * math.sqrt(self.ppy)

        # 1. Sharpe Ratio
        excess_daily_return = mean_daily_return - self.rf_daily
        sharpe_ratio = (excess_daily_return / max(1e-8, std_daily)) * math.sqrt(self.ppy)

        # 2. Sortino Ratio (Downside Semi-Deviation)
        downside_diffs = [min(0.0, r - self.rf_daily) ** 2 for r in returns]
        downside_variance = sum(downside_diffs) / max(1, n - 1)
        downside_std = math.sqrt(downside_variance)
        sortino_ratio = (excess_daily_return / max(1e-8, downside_std)) * math.sqrt(self.ppy)

        # 3. Maximum Drawdown & Drawdown Series
        peak = equity_curve[0]
        max_dd_amount = 0.0
        max_dd_pct = 0.0
        current_dd_duration = 0
        max_dd_duration = 0

        for eq in equity_curve:
            if eq > peak:
                peak = eq
                current_dd_duration = 0
            else:
                dd_amt = peak - eq
                dd_pct = (dd_amt / peak) * 100.0 if peak > 0 else 0.0
                if dd_amt > max_dd_amount:
                    max_dd_amount = dd_amt
                if dd_pct > max_dd_pct:
                    max_dd_pct = dd_pct
                current_dd_duration += 1
                if current_dd_duration > max_dd_duration:
                    max_dd_duration = current_dd_duration

        # 4. Calmar Ratio
        calmar_ratio = (cagr * 100.0) / max(0.01, max_dd_pct)

        # 5. Omega Ratio (Threshold = 0)
        gains = sum(r for r in returns if r > 0.0)
        losses = sum(abs(r) for r in returns if r < 0.0)
        omega_ratio = (gains / losses) if losses > 1e-8 else (10.0 if gains > 0 else 1.0)

        # 6. Value-at-Risk (VaR) & Conditional VaR (CVaR)
        sorted_returns = sorted(returns)
        # 95% Parametric VaR (z = 1.645)
        var_95_param_pct = (1.645 * std_daily - mean_daily_return) * 100.0
        var_99_param_pct = (2.326 * std_daily - mean_daily_return) * 100.0

        # 95% Historical VaR
        idx_95 = int(0.05 * n)
        var_95_hist_pct = abs(min(0.0, sorted_returns[idx_95])) * 100.0 if n > 10 else var_95_param_pct

        # 99% Historical VaR
        idx_99 = int(0.01 * n)
        var_99_hist_pct = abs(min(0.0, sorted_returns[idx_99])) * 100.0 if n > 20 else var_99_param_pct

        # Expected Shortfall (CVaR) - average of returns worse than VaR threshold
        tail_95 = sorted_returns[:max(1, idx_95)]
        cvar_95_pct = abs(sum(tail_95) / float(len(tail_95))) * 100.0 if len(tail_95) > 0 else var_95_hist_pct

        tail_99 = sorted_returns[:max(1, idx_99)]
        cvar_99_pct = abs(sum(tail_99) / float(len(tail_99))) * 100.0 if len(tail_99) > 0 else var_99_hist_pct

        # 7. Trade Statistics (if trade PnLs provided)
        trade_stats = self._compute_trade_stats(trade_pnls)

        return {
            "initial_capital": round(initial_capital, 2),
            "final_capital": round(final_capital, 2),
            "total_pnl_rupees": round(total_pnl, 2),
            "total_return_pct": round(total_return_pct, 2),
            "cagr_pct": round(cagr * 100.0, 2),
            "annualized_vol_pct": round(annualized_vol * 100.0, 2),
            "risk_adjusted_ratios": {
                "sharpe_ratio": round(sharpe_ratio, 2),
                "sortino_ratio": round(sortino_ratio, 2),
                "calmar_ratio": round(calmar_ratio, 2),
                "omega_ratio": round(omega_ratio, 2),
                "risk_free_rate_pct": round(self.rf * 100.0, 2)
            },
            "drawdown": {
                "max_drawdown_rupees": round(max_dd_amount, 2),
                "max_drawdown_pct": round(max_dd_pct, 2),
                "max_drawdown_duration_periods": max_dd_duration,
                "recovery_factor": round(total_pnl / max(1.0, max_dd_amount), 2) if max_dd_amount > 0 else 10.0
            },
            "tail_risk": {
                "var_95_daily_pct": round(max(0.0, var_95_hist_pct), 2),
                "var_99_daily_pct": round(max(0.0, var_99_hist_pct), 2),
                "cvar_95_expected_shortfall_pct": round(max(0.0, cvar_95_pct), 2),
                "cvar_99_expected_shortfall_pct": round(max(0.0, cvar_99_pct), 2),
                "var_95_rupees": round(final_capital * (var_95_hist_pct / 100.0), 2),
                "var_99_rupees": round(final_capital * (var_99_hist_pct / 100.0), 2)
            },
            "trade_statistics": trade_stats
        }

    def _compute_trade_stats(self, trade_pnls: Optional[List[float]]) -> Dict[str, Any]:
        if not trade_pnls or len(trade_pnls) == 0:
            return {
                "total_trades": 0,
                "winning_trades": 0,
                "losing_trades": 0,
                "win_rate_pct": 0.0,
                "profit_factor": 0.0,
                "average_win_rupees": 0.0,
                "average_loss_rupees": 0.0,
                "payoff_ratio": 0.0,
                "expectancy_rupees": 0.0,
                "max_consecutive_wins": 0,
                "max_consecutive_losses": 0
            }

        total_trades = len(trade_pnls)
        wins = [p for p in trade_pnls if p > 0.0]
        losses = [p for p in trade_pnls if p < 0.0]

        win_count = len(wins)
        loss_count = len(losses)
        win_rate = (win_count / float(total_trades)) * 100.0

        gross_profit = sum(wins)
        gross_loss = abs(sum(losses))
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (10.0 if gross_profit > 0 else 1.0)

        avg_win = (gross_profit / win_count) if win_count > 0 else 0.0
        avg_loss = (gross_loss / loss_count) if loss_count > 0 else 0.0
        payoff_ratio = (avg_win / avg_loss) if avg_loss > 0 else 0.0

        expectancy = (win_rate / 100.0) * avg_win - ((100.0 - win_rate) / 100.0) * avg_loss

        # Consecutive runs
        max_consec_w = 0
        curr_w = 0
        max_consec_l = 0
        curr_l = 0

        for p in trade_pnls:
            if p > 0:
                curr_w += 1
                curr_l = 0
                if curr_w > max_consec_w:
                    max_consec_w = curr_w
            elif p < 0:
                curr_l += 1
                curr_w = 0
                if curr_l > max_consec_l:
                    max_consec_l = curr_l

        return {
            "total_trades": total_trades,
            "winning_trades": win_count,
            "losing_trades": loss_count,
            "win_rate_pct": round(win_rate, 2),
            "profit_factor": round(profit_factor, 2),
            "gross_profit_rupees": round(gross_profit, 2),
            "gross_loss_rupees": round(gross_loss, 2),
            "average_win_rupees": round(avg_win, 2),
            "average_loss_rupees": round(avg_loss, 2),
            "payoff_ratio": round(payoff_ratio, 2),
            "expectancy_rupees": round(expectancy, 2),
            "max_consecutive_wins": max_consec_w,
            "max_consecutive_losses": max_consec_l
        }

    def _empty_metrics(self) -> Dict[str, Any]:
        return {
            "initial_capital": 0.0,
            "final_capital": 0.0,
            "total_pnl_rupees": 0.0,
            "total_return_pct": 0.0,
            "cagr_pct": 0.0,
            "annualized_vol_pct": 0.0,
            "risk_adjusted_ratios": {"sharpe_ratio": 0.0, "sortino_ratio": 0.0, "calmar_ratio": 0.0, "omega_ratio": 0.0, "risk_free_rate_pct": self.rf * 100},
            "drawdown": {"max_drawdown_rupees": 0.0, "max_drawdown_pct": 0.0, "max_drawdown_duration_periods": 0, "recovery_factor": 0.0},
            "tail_risk": {"var_95_daily_pct": 0.0, "var_99_daily_pct": 0.0, "cvar_95_expected_shortfall_pct": 0.0, "cvar_99_expected_shortfall_pct": 0.0, "var_95_rupees": 0.0, "var_99_rupees": 0.0},
            "trade_statistics": self._compute_trade_stats([])
        }


if __name__ == "__main__":
    engine = PerformanceAnalyticsEngine(risk_free_rate=0.065)
    # Synthetic equity curve with steady upward drift and realistic drawdowns
    equity = [1000000.0]
    import random
    random.seed(42)
    trades = []
    for _ in range(120):
        ret = random.gauss(0.0012, 0.011)
        equity.append(equity[-1] * (1.0 + ret))
        trades.append(equity[-1] - equity[-2])

    metrics = engine.compute_all_metrics(equity, trade_pnls=trades)
    import json
    print(json.dumps(metrics, indent=2))
