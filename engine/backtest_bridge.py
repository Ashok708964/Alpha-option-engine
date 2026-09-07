"""
OmniAlpha Quant Engine - Backtest Bridge & Microstructure Simulator Interface
Accepts CLI arguments and outputs complete event-driven backtest results
with equity curve, risk attribution, and order execution logs.
"""

import sys
import os
import json
from typing import Dict, Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.backtest_engine import EventDrivenBacktestSimulator, generate_synthetic_nifty_ticks


def run_bridge_backtest(
    symbol: str = "NIFTY 50",
    strategy_type: str = "TREND_FOLLOWING",
    initial_capital: float = 1000000.0,
    lot_size: int = 50,
    num_ticks: int = 500,
    base_latency_us: int = 150
) -> Dict[str, Any]:
    """
    Instantiates the event-driven simulator and executes the full strategy loop.
    """
    spot_map = {
        "NIFTY 50": 24854.20,
        "BANKNIFTY": 51240.00,
        "HDFCBANK": 1642.50,
        "RELIANCE": 2984.10,
        "ICICIBANK": 1184.20,
    }
    start_px = spot_map.get(symbol, 24854.20)

    # Initialize simulator
    sim = EventDrivenBacktestSimulator(
        symbol=symbol,
        initial_capital=initial_capital,
        lot_size=lot_size,
        strategy_name=f"{strategy_type.replace('_', ' ').title()} Strategy"
    )
    sim.matching_engine.base_latency_us = base_latency_us

    # Generate synthetic realistic ticks
    ticks = generate_synthetic_nifty_ticks(num_ticks=num_ticks, start_price=start_px)

    # Run event loop
    results = sim.run_simulation(ticks, strategy_type=strategy_type)
    return results


if __name__ == "__main__":
    sym = sys.argv[1] if len(sys.argv) > 1 else "NIFTY 50"
    strat = sys.argv[2] if len(sys.argv) > 2 else "TREND_FOLLOWING"
    cap = float(sys.argv[3]) if len(sys.argv) > 3 else 1000000.0
    lots = int(sys.argv[4]) if len(sys.argv) > 4 else 50
    ticks_cnt = int(sys.argv[5]) if len(sys.argv) > 5 else 500

    out = run_bridge_backtest(
        symbol=sym,
        strategy_type=strat,
        initial_capital=cap,
        lot_size=lots,
        num_ticks=ticks_cnt
    )
    print(json.dumps(out, indent=2))
