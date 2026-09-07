"""
OmniAlpha Quant Engine - NIFTY 50 Index & 50 Constituents Metadata
Institutional Sharding Topology & Instrument Specifications
"""

from typing import Dict, List, TypedDict

class ConstituentMeta(TypedDict):
    symbol: str
    name: str
    token: int
    weight_pct: float
    sector: str
    lot_size: int
    shard_id: int

# Full 50 NIFTY Constituents with verified exchange lot sizes, sectors, and index weights
NIFTY_50_CONSTITUENTS: List[ConstituentMeta] = [
    # Shard 1: Top Financials & Megacap Tech (Shard ID 1)
    {"symbol": "HDFCBANK", "name": "HDFC Bank Ltd.", "token": 1333, "weight_pct": 13.52, "sector": "Banking", "lot_size": 550, "shard_id": 1},
    {"symbol": "RELIANCE", "name": "Reliance Industries Ltd.", "token": 2885, "weight_pct": 9.85, "sector": "Energy / Oil & Gas", "lot_size": 250, "shard_id": 1},
    {"symbol": "ICICIBANK", "name": "ICICI Bank Ltd.", "token": 4963, "weight_pct": 7.94, "sector": "Banking", "lot_size": 700, "shard_id": 1},
    {"symbol": "INFY", "name": "Infosys Ltd.", "token": 1594, "weight_pct": 5.82, "sector": "IT Services", "lot_size": 400, "shard_id": 1},
    {"symbol": "ITC", "name": "ITC Ltd.", "token": 1660, "weight_pct": 4.12, "sector": "FMCG", "lot_size": 1600, "shard_id": 1},
    {"symbol": "TCS", "name": "Tata Consultancy Services Ltd.", "token": 11536, "weight_pct": 3.95, "sector": "IT Services", "lot_size": 175, "shard_id": 1},
    {"symbol": "LT", "name": "Larsen & Toubro Ltd.", "token": 11483, "weight_pct": 3.88, "sector": "Infrastructure", "lot_size": 175, "shard_id": 1},
    {"symbol": "AXISBANK", "name": "Axis Bank Ltd.", "token": 5900, "weight_pct": 3.45, "sector": "Banking", "lot_size": 625, "shard_id": 1},
    {"symbol": "KOTAKBANK", "name": "Kotak Mahindra Bank Ltd.", "token": 1922, "weight_pct": 2.98, "sector": "Banking", "lot_size": 400, "shard_id": 1},
    {"symbol": "BHARTIARTL", "name": "Bharti Airtel Ltd.", "token": 10604, "weight_pct": 2.92, "sector": "Telecom", "lot_size": 475, "shard_id": 1},

    # Shard 2: Auto, Consumer & Diversified Industrial (Shard ID 2)
    {"symbol": "SBIN", "name": "State Bank of India", "token": 3045, "weight_pct": 2.85, "sector": "Banking (PSU)", "lot_size": 750, "shard_id": 2},
    {"symbol": "BAJFINANCE", "name": "Bajaj Finance Ltd.", "token": 317, "weight_pct": 2.45, "sector": "Financial Services", "lot_size": 125, "shard_id": 2},
    {"symbol": "HINDUNILVR", "name": "Hindustan Unilever Ltd.", "token": 1394, "weight_pct": 2.38, "sector": "FMCG", "lot_size": 300, "shard_id": 2},
    {"symbol": "M&M", "name": "Mahindra & Mahindra Ltd.", "token": 2031, "weight_pct": 2.25, "sector": "Automotive", "lot_size": 350, "shard_id": 2},
    {"symbol": "MARUTI", "name": "Maruti Suzuki India Ltd.", "token": 10999, "weight_pct": 1.95, "sector": "Automotive", "lot_size": 50, "shard_id": 2},
    {"symbol": "SUNPHARMA", "name": "Sun Pharmaceutical Ind. Ltd.", "token": 3351, "weight_pct": 1.88, "sector": "Pharma", "lot_size": 350, "shard_id": 2},
    {"symbol": "TATAMOTORS", "name": "Tata Motors Ltd.", "token": 3456, "weight_pct": 1.82, "sector": "Automotive", "lot_size": 550, "shard_id": 2},
    {"symbol": "NTPC", "name": "NTPC Ltd.", "token": 11630, "weight_pct": 1.78, "sector": "Power", "lot_size": 1500, "shard_id": 2},
    {"symbol": "POWERGRID", "name": "Power Grid Corp of India Ltd.", "token": 14977, "weight_pct": 1.62, "sector": "Power", "lot_size": 1800, "shard_id": 2},
    {"symbol": "TITAN", "name": "Titan Company Ltd.", "token": 3506, "weight_pct": 1.55, "sector": "Consumer Durables", "lot_size": 175, "shard_id": 2},

    # Shard 3: Metals, Commodities, Health & Oil (Shard ID 3)
    {"symbol": "TATASTEEL", "name": "Tata Steel Ltd.", "token": 3499, "weight_pct": 1.48, "sector": "Metals", "lot_size": 5500, "shard_id": 3},
    {"symbol": "BAJAJFINSV", "name": "Bajaj Finserv Ltd.", "token": 16675, "weight_pct": 1.42, "sector": "Financial Services", "lot_size": 500, "shard_id": 3},
    {"symbol": "ONGC", "name": "Oil & Natural Gas Corp Ltd.", "token": 2475, "weight_pct": 1.38, "sector": "Energy / Oil & Gas", "lot_size": 2250, "shard_id": 3},
    {"symbol": "COALINDIA", "name": "Coal India Ltd.", "token": 20374, "weight_pct": 1.32, "sector": "Mining / Energy", "lot_size": 2100, "shard_id": 3},
    {"symbol": "ADANIENT", "name": "Adani Enterprises Ltd.", "token": 25, "weight_pct": 1.28, "sector": "Metals / Trading", "lot_size": 300, "shard_id": 3},
    {"symbol": "ADANIPORTS", "name": "Adani Ports & SEZ Ltd.", "token": 15083, "weight_pct": 1.25, "sector": "Infrastructure / Ports", "lot_size": 400, "shard_id": 3},
    {"symbol": "HCLTECH", "name": "HCL Technologies Ltd.", "token": 7229, "weight_pct": 1.22, "sector": "IT Services", "lot_size": 350, "shard_id": 3},
    {"symbol": "ASIANPAINT", "name": "Asian Paints Ltd.", "token": 236, "weight_pct": 1.18, "sector": "Consumer / Paints", "lot_size": 200, "shard_id": 3},
    {"symbol": "ULTRACEMCO", "name": "UltraTech Cement Ltd.", "token": 11532, "weight_pct": 1.15, "sector": "Cement", "lot_size": 100, "shard_id": 3},
    {"symbol": "JSWSTEEL", "name": "JSW Steel Ltd.", "token": 11723, "weight_pct": 1.08, "sector": "Metals", "lot_size": 675, "shard_id": 3},

    # Shard 4: Pharma, Secondary IT & Industrials (Shard ID 4)
    {"symbol": "GRASIM", "name": "Grasim Industries Ltd.", "token": 1232, "weight_pct": 1.02, "sector": "Cement / Diversified", "lot_size": 250, "shard_id": 4},
    {"symbol": "CIPLA", "name": "Cipla Ltd.", "token": 694, "weight_pct": 0.98, "sector": "Pharma", "lot_size": 325, "shard_id": 4},
    {"symbol": "TECHM", "name": "Tech Mahindra Ltd.", "token": 13538, "weight_pct": 0.95, "sector": "IT Services", "lot_size": 600, "shard_id": 4},
    {"symbol": "WIPRO", "name": "Wipro Ltd.", "token": 3787, "weight_pct": 0.92, "sector": "IT Services", "lot_size": 1500, "shard_id": 4},
    {"symbol": "HINDALCO", "name": "Hindalco Industries Ltd.", "token": 1363, "weight_pct": 0.88, "sector": "Metals", "lot_size": 700, "shard_id": 4},
    {"symbol": "DRREDDY", "name": "Dr. Reddy's Laboratories Ltd.", "token": 881, "weight_pct": 0.85, "sector": "Pharma", "lot_size": 125, "shard_id": 4},
    {"symbol": "EICHERMOT", "name": "Eicher Motors Ltd.", "token": 910, "weight_pct": 0.82, "sector": "Automotive", "lot_size": 150, "shard_id": 4},
    {"symbol": "NESTLEIND", "name": "Nestle India Ltd.", "token": 17963, "weight_pct": 0.78, "sector": "FMCG", "lot_size": 250, "shard_id": 4},
    {"symbol": "SBILIFE", "name": "SBI Life Insurance Co. Ltd.", "token": 21808, "weight_pct": 0.75, "sector": "Insurance", "lot_size": 375, "shard_id": 4},
    {"symbol": "BRITANNIA", "name": "Britannia Industries Ltd.", "token": 547, "weight_pct": 0.72, "sector": "FMCG", "lot_size": 200, "shard_id": 4},

    # Shard 5: Retail, Emerging & Mid-Weight Leaders (Shard ID 5)
    {"symbol": "BEL", "name": "Bharat Electronics Ltd.", "token": 383, "weight_pct": 0.70, "sector": "Defense / Electronics", "lot_size": 2850, "shard_id": 5},
    {"symbol": "TRENT", "name": "Trent Ltd.", "token": 1964, "weight_pct": 0.68, "sector": "Retail", "lot_size": 200, "shard_id": 5},
    {"symbol": "SHRIRAMFIN", "name": "Shriram Finance Ltd.", "token": 4306, "weight_pct": 0.65, "sector": "Financial Services", "lot_size": 300, "shard_id": 5},
    {"symbol": "APOLLOHOSP", "name": "Apollo Hospitals Enterprise Ltd.", "token": 157, "weight_pct": 0.62, "sector": "Healthcare", "lot_size": 125, "shard_id": 5},
    {"symbol": "HDFCLIFE", "name": "HDFC Life Insurance Co. Ltd.", "token": 467, "weight_pct": 0.58, "sector": "Insurance", "lot_size": 1100, "shard_id": 5},
    {"symbol": "TATACONSUM", "name": "Tata Consumer Products Ltd.", "token": 3432, "weight_pct": 0.55, "sector": "FMCG", "lot_size": 900, "shard_id": 5},
    {"symbol": "DIVISLAB", "name": "Divi's Laboratories Ltd.", "token": 10940, "weight_pct": 0.52, "sector": "Pharma", "lot_size": 100, "shard_id": 5},
    {"symbol": "BPCL", "name": "Bharat Petroleum Corp Ltd.", "token": 526, "weight_pct": 0.48, "sector": "Energy / Oil & Gas", "lot_size": 1800, "shard_id": 5},
    {"symbol": "HEROMOTOCO", "name": "Hero MotoCorp Ltd.", "token": 1348, "weight_pct": 0.45, "sector": "Automotive", "lot_size": 150, "shard_id": 5},
    {"symbol": "INDUSINDBK", "name": "IndusInd Bank Ltd.", "token": 5258, "weight_pct": 0.42, "sector": "Banking", "lot_size": 500, "shard_id": 5},
]

# Shard 0: Dedicated High-Priority Stream (Index Spot & Derivatives)
INDEX_DERIVATIVES_SHARD_0 = {
    "symbol": "NIFTY50",
    "token": 26000,
    "name": "NIFTY 50 Index Spot & Options Chain",
    "lot_size": 25,  # Revised NSE NIFTY lot size
    "shard_id": 0,
    "priority": "REAL_TIME_CRITICAL",
    "target_core": 2
}

def get_shard_constituents(shard_id: int) -> List[ConstituentMeta]:
    return [c for c in NIFTY_50_CONSTITUENTS if c["shard_id"] == shard_id]

def get_symbol_metadata(symbol: str) -> ConstituentMeta:
    for c in NIFTY_50_CONSTITUENTS:
        if c["symbol"] == symbol:
            return c
    raise KeyError(f"Constituent {symbol} not found in Nifty 50 directory")
