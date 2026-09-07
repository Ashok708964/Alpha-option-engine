"""
OmniAlpha Quant Engine - HFT Diagnostics Bridge
Provides unified JSON snapshot of low-latency hardware profiling,
clock resolution, and kernel bypass tuning for /api/hft/system-profile.
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.hft_colocation_profiler import HftColocationProfiler


def main():
    profiler = HftColocationProfiler()
    profile = profiler.generate_full_profile()
    print(json.dumps(profile, indent=2))


if __name__ == "__main__":
    main()
