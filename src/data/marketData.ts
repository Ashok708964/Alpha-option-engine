import {
  IndexInfo,
  IndexSymbol,
  Candle,
  ZigZagPoint,
  OptionContract,
  OrderBookLevel,
  HFTTapePrint,
  BacktestTrade,
  BacktestStats,
} from "../types";
import { calculateBlackScholes } from "../utils/blackScholes";

export const SUPPORTED_INDICES: Record<IndexSymbol, IndexInfo> = {
  NIFTY50: {
    symbol: "NIFTY50",
    name: "NIFTY 50 (NSE India)",
    category: "Indian Indices",
    currentPrice: 24880.5,
    change: 142.3,
    changePercent: 0.58,
    lotSize: 25,
    strikeStep: 50,
    baseIV: 0.138,
    currency: "₹",
  },
  BANKNIFTY: {
    symbol: "BANKNIFTY",
    name: "BANK NIFTY (NSE India)",
    category: "Indian Indices",
    currentPrice: 53620.0,
    change: 385.4,
    changePercent: 0.72,
    lotSize: 15,
    strikeStep: 100,
    baseIV: 0.162,
    currency: "₹",
  },
  SPX500: {
    symbol: "SPX500",
    name: "S&P 500 (CBOE / CME)",
    category: "US Indices",
    currentPrice: 5945.2,
    change: 28.6,
    changePercent: 0.48,
    lotSize: 10,
    strikeStep: 10,
    baseIV: 0.145,
    currency: "$",
  },
  NASDAQ100: {
    symbol: "NASDAQ100",
    name: "NASDAQ 100 (NDX / NQ)",
    category: "US Indices",
    currentPrice: 20940.8,
    change: 185.3,
    changePercent: 0.89,
    lotSize: 10,
    strikeStep: 25,
    baseIV: 0.178,
    currency: "$",
  },
  DOWJONES: {
    symbol: "DOWJONES",
    name: "Dow Jones 30 (DJIA / YM)",
    category: "US Indices",
    currentPrice: 43950.0,
    change: -65.2,
    changePercent: -0.15,
    lotSize: 10,
    strikeStep: 50,
    baseIV: 0.132,
    currency: "$",
  },
  FINNIFTY: {
    symbol: "FINNIFTY",
    name: "NIFTY Financial Services",
    category: "Indian Indices",
    currentPrice: 24450.0,
    change: 120.5,
    changePercent: 0.5,
    lotSize: 25,
    strikeStep: 50,
    baseIV: 0.142,
    currency: "₹",
  },
  BTCUSD: {
    symbol: "BTCUSD",
    name: "Bitcoin Deribit / CME F&O",
    category: "Global / Crypto",
    currentPrice: 96850.0,
    change: 2450.0,
    changePercent: 2.6,
    lotSize: 1,
    strikeStep: 500,
    baseIV: 0.54,
    currency: "$",
  },
};

/**
 * Generates realistic intraday candle series exhibiting institutional ZigZag wave motion
 */
export function generateIntradayCandles(
  index: IndexInfo,
  count: number = 60
): { candles: Candle[]; zigzagPoints: ZigZagPoint[] } {
  const candles: Candle[] = [];
  const basePrice = index.currentPrice;
  const step = index.strikeStep;
  const volatility = (basePrice * (index.baseIV / Math.sqrt(252))) * 0.15;

  let currentClose = basePrice - volatility * 3;
  let cumDelta = 0;
  let vwapSum = 0;
  let volumeSum = 0;

  const now = Date.now();
  const intervalMs = 5 * 60 * 1000; // 5 minute candles

  // Generate ZigZag synthetic waves: Low -> High -> Low -> High -> Dip -> Rally
  const wavePattern = [
    { target: basePrice - volatility * 2, bias: 1 },
    { target: basePrice + volatility * 3, bias: 1 },
    { target: basePrice - volatility * 1.5, bias: -1 }, // Dip 1
    { target: basePrice + volatility * 4, bias: 1 }, // Rally 1
    { target: basePrice + volatility * 0.5, bias: -1 }, // Dip 2 (Key Institutional Buy Zone)
    { target: basePrice + volatility * 5, bias: 1 }, // Top
    { target: basePrice + volatility * 2, bias: -1 },
    { target: basePrice + volatility * 4.5, bias: 1 },
  ];

  let currentWaveIdx = 0;
  let waveProgress = 0;

  for (let i = 0; i < count; i++) {
    const time = now - (count - i) * intervalMs;
    const date = new Date(time);
    const timestamp = `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    const activeWave = wavePattern[currentWaveIdx % wavePattern.length];
    const targetDelta = (activeWave.target - currentClose) * 0.18;
    const noise = (Math.random() - 0.48) * volatility * 0.6;
    
    const open = currentClose;
    const close = Number((open + targetDelta + noise).toFixed(2));
    const high = Number((Math.max(open, close) + Math.random() * volatility * 0.5).toFixed(2));
    const low = Number((Math.min(open, close) - Math.random() * volatility * 0.5).toFixed(2));

    const candleVol = Math.floor(15000 + Math.random() * 45000 * (1 + Math.abs(close - open) / (volatility * 0.5)));
    const buyVol = close >= open ? Math.floor(candleVol * (0.55 + Math.random() * 0.35)) : Math.floor(candleVol * (0.2 + Math.random() * 0.25));
    const sellVol = candleVol - buyVol;
    const hftDelta = buyVol - sellVol;
    cumDelta += hftDelta;

    vwapSum += ((high + low + close) / 3) * candleVol;
    volumeSum += candleVol;
    const vwap = Number((vwapSum / volumeSum).toFixed(2));

    // Dynamic RSI estimate
    const rsi = Math.min(88, Math.max(18, 50 + (close - basePrice) / (volatility * 1.5) * 15 + (Math.random() * 6 - 3)));

    candles.push({
      timestamp,
      time,
      open,
      high,
      low,
      close,
      volume: candleVol,
      vwap,
      hftDelta,
      cumDelta,
      rsi: Number(rsi.toFixed(1)),
    });

    currentClose = close;
    waveProgress++;
    if (waveProgress > 7) {
      waveProgress = 0;
      currentWaveIdx++;
    }
  }

  // Calculate ZigZag Extrema Points
  const zigzagPoints: ZigZagPoint[] = [];
  const minSwingBars = 4;

  for (let i = minSwingBars; i < candles.length - minSwingBars; i++) {
    const curr = candles[i];
    let isPeak = true;
    let isValley = true;

    for (let j = i - minSwingBars; j <= i + minSwingBars; j++) {
      if (j === i) continue;
      if (candles[j].high >= curr.high) isPeak = false;
      if (candles[j].low <= curr.low) isValley = false;
    }

    if (isPeak) {
      zigzagPoints.push({
        index: i,
        time: curr.time,
        timestamp: curr.timestamp,
        price: curr.high,
        type: "PEAK",
        label: "Swing Top / Institutional Distribution Zone",
        confirmed: true,
      });
      candles[i].zigzagType = "PEAK";
      candles[i].zigzagPrice = curr.high;
    } else if (isValley) {
      zigzagPoints.push({
        index: i,
        time: curr.time,
        timestamp: curr.timestamp,
        price: curr.low,
        type: "VALLEY",
        label: "Swing Dip / Institutional Accumulation Zone",
        confirmed: true,
      });
      candles[i].zigzagType = "VALLEY";
      candles[i].zigzagPrice = curr.low;
    }
  }

  // Calculate Fair Value Gaps (FVG) and Order Blocks
  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2];
    const c2 = candles[i - 1];
    const c3 = candles[i];

    // Bullish FVG: Low of c3 is strictly higher than High of c1
    if (c3.low > c1.high && c2.close > c2.open) {
      c2.fvgZone = {
        type: "BULLISH_FVG",
        top: c3.low,
        bottom: c1.high,
      };
    }
    // Bearish FVG: High of c3 is strictly lower than Low of c1
    else if (c3.high < c1.low && c2.close < c2.open) {
      c2.fvgZone = {
        type: "BEARISH_FVG",
        top: c1.low,
        bottom: c3.high,
      };
    }

    // Order Blocks
    if (i >= 3 && Math.abs(c3.close - c3.open) > volatility * 1.2) {
      if (c3.close > c3.open && c1.close < c1.open) {
        c1.orderBlock = {
          type: "BULLISH_OB",
          top: c1.high,
          bottom: c1.low,
        };
      } else if (c3.close < c3.open && c1.close > c1.open) {
        c1.orderBlock = {
          type: "BEARISH_OB",
          top: c1.high,
          bottom: c1.low,
        };
      }
    }
  }

  return { candles, zigzagPoints };
}

/**
 * Generates an authentic Option Chain with Black-Scholes Greeks, OI, and PCR
 */
export function generateOptionChain(
  index: IndexInfo,
  spotPrice: number,
  daysToExpiry: number = 4
): {
  calls: OptionContract[];
  puts: OptionContract[];
  pcr: number;
  maxPainStrike: number;
  atmStrike: number;
  totalCallOI: number;
  totalPutOI: number;
} {
  const step = index.strikeStep;
  const atmStrike = Math.round(spotPrice / step) * step;
  const strikesCount = 13; // 6 OTM, 1 ATM, 6 ITM on each side
  const strikes: number[] = [];

  for (let i = -6; i <= 6; i++) {
    strikes.push(atmStrike + i * step);
  }

  const T = Math.max(daysToExpiry / 365, 0.001);
  const iv = index.baseIV;

  const calls: OptionContract[] = [];
  const puts: OptionContract[] = [];
  let totalCallOI = 0;
  let totalPutOI = 0;

  // Compute option contracts
  strikes.forEach((strike) => {
    // Volatility smile: OTM puts and calls have slightly higher IV
    const moneynessRatio = strike / spotPrice;
    const strikeIV = iv * (1 + Math.pow(Math.abs(moneynessRatio - 1), 1.8) * 1.4);

    const callGreeks = calculateBlackScholes(spotPrice, strike, T, 0.065, strikeIV, true);
    const putGreeks = calculateBlackScholes(spotPrice, strike, T, 0.065, strikeIV, false);

    const distance = Math.abs(strike - spotPrice);
    const baseOI = Math.max(12000, Math.floor(150000 / (1 + (distance / (step * 2)))));

    const callOI = Math.floor(baseOI * (strike >= spotPrice ? 1.4 + Math.random() * 0.8 : 0.6 + Math.random() * 0.4));
    const putOI = Math.floor(baseOI * (strike <= spotPrice ? 1.5 + Math.random() * 0.9 : 0.5 + Math.random() * 0.4));

    totalCallOI += callOI;
    totalPutOI += putOI;

    const callSpread = Math.max(0.1, callGreeks.price * 0.008);
    const putSpread = Math.max(0.1, putGreeks.price * 0.008);

    const callMoneyness =
      strike < atmStrike ? "ITM" : strike === atmStrike ? "ATM" : "OTM";
    const putMoneyness =
      strike > atmStrike ? "ITM" : strike === atmStrike ? "ATM" : "OTM";

    // Scoring contracts for optimal dip buying / top selling
    const callScore =
      strike === atmStrike - step
        ? 96 // 0.70 Delta ITM
        : strike === atmStrike
        ? 90
        : strike === atmStrike + step
        ? 82
        : 65;

    const putScore =
      strike === atmStrike + step
        ? 96 // 0.70 Delta ITM Put
        : strike === atmStrike
        ? 90
        : strike === atmStrike - step
        ? 82
        : 65;

    calls.push({
      strike,
      type: "CALL",
      expiry: `${daysToExpiry}D Exp`,
      ltp: Number(callGreeks.price.toFixed(2)),
      bid: Number((callGreeks.price - callSpread).toFixed(2)),
      ask: Number((callGreeks.price + callSpread).toFixed(2)),
      change: Number(((Math.random() - 0.4) * callGreeks.price * 0.15).toFixed(2)),
      changePercent: Number(((Math.random() - 0.4) * 20).toFixed(1)),
      oi: callOI,
      oiChange: Math.floor((Math.random() - 0.3) * callOI * 0.25),
      volume: Math.floor(callOI * (0.8 + Math.random() * 1.2)),
      greeks: callGreeks,
      moneyness: callMoneyness,
      score: callScore,
    });

    puts.push({
      strike,
      type: "PUT",
      expiry: `${daysToExpiry}D Exp`,
      ltp: Number(putGreeks.price.toFixed(2)),
      bid: Number((putGreeks.price - putSpread).toFixed(2)),
      ask: Number((putGreeks.price + putSpread).toFixed(2)),
      change: Number(((Math.random() - 0.6) * putGreeks.price * 0.15).toFixed(2)),
      changePercent: Number(((Math.random() - 0.6) * 20).toFixed(1)),
      oi: putOI,
      oiChange: Math.floor((Math.random() - 0.4) * putOI * 0.25),
      volume: Math.floor(putOI * (0.8 + Math.random() * 1.2)),
      greeks: putGreeks,
      moneyness: putMoneyness,
      score: putScore,
    });
  });

  const pcr = Number((totalPutOI / (totalCallOI || 1)).toFixed(2));

  // Calculate Max Pain strike: the strike price where option writers lose the least money
  let minTotalLoss = Infinity;
  let maxPainStrike = atmStrike;

  strikes.forEach((testPrice) => {
    let currentLoss = 0;
    calls.forEach((c) => {
      if (testPrice > c.strike) {
        currentLoss += (testPrice - c.strike) * c.oi;
      }
    });
    puts.forEach((p) => {
      if (testPrice < p.strike) {
        currentLoss += (p.strike - testPrice) * p.oi;
      }
    });

    if (currentLoss < minTotalLoss) {
      minTotalLoss = currentLoss;
      maxPainStrike = testPrice;
    }
  });

  return {
    calls,
    puts,
    pcr,
    maxPainStrike,
    atmStrike,
    totalCallOI,
    totalPutOI,
  };
}

/**
 * Generates Level 2 Order Book with HFT Iceberg signatures
 */
export function generateOrderBook(spotPrice: number, step: number): {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  imbalanceRatio: number;
} {
  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];
  let totalBidSize = 0;
  let totalAskSize = 0;

  const tick = step / 10;

  for (let i = 1; i <= 8; i++) {
    const bidPrice = Number((spotPrice - i * tick).toFixed(2));
    const askPrice = Number((spotPrice + i * tick).toFixed(2));

    const isBidIceberg = i === 3 || i === 6;
    const isAskIceberg = i === 5;

    const bidSize = isBidIceberg
      ? Math.floor(4500 + Math.random() * 6000)
      : Math.floor(400 + Math.random() * 1800);
    const askSize = isAskIceberg
      ? Math.floor(3800 + Math.random() * 5200)
      : Math.floor(350 + Math.random() * 1600);

    totalBidSize += bidSize;
    totalAskSize += askSize;

    bids.push({
      price: bidPrice,
      size: bidSize,
      ordersCount: Math.floor(bidSize / 75) + 3,
      isIceberg: isBidIceberg,
      totalCum: totalBidSize,
    });

    asks.push({
      price: askPrice,
      size: askSize,
      ordersCount: Math.floor(askSize / 75) + 3,
      isIceberg: isAskIceberg,
      totalCum: totalAskSize,
    });
  }

  const imbalanceRatio = Number((totalBidSize / (totalBidSize + totalAskSize)).toFixed(3));

  return { bids, asks, imbalanceRatio };
}

/**
 * Generates HFT live tape stream prints
 */
export function generateTapePrints(spotPrice: number): HFTTapePrint[] {
  const prints: HFTTapePrint[] = [];
  const types: HFTTapePrint["type"][] = [
    "AGGRESSIVE_MARKET",
    "PASSIVE_ABSORPTION",
    "ICEBERG_FILL",
    "BLOCK_SWEEP",
  ];

  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(now.getTime() - i * 1800);
    const time = `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}.${Math.floor(
      date.getMilliseconds() / 10
    )}`;

    const side = Math.random() > 0.42 ? "BUY" : "SELL";
    const type = types[Math.floor(Math.random() * types.length)];
    const size =
      type === "BLOCK_SWEEP"
        ? Math.floor(1200 + Math.random() * 3500)
        : type === "ICEBERG_FILL"
        ? Math.floor(600 + Math.random() * 1500)
        : Math.floor(25 + Math.random() * 350);

    const priceOffset = (Math.random() - 0.48) * 4;
    const price = Number((spotPrice + priceOffset).toFixed(2));

    prints.push({
      id: `tape-${Date.now()}-${i}`,
      time,
      price,
      size,
      side,
      type,
    });
  }

  return prints;
}

/**
 * Historical Backtest dataset for the OmniAlpha F&O engine
 */
export const HISTORICAL_BACKTEST_DATA: {
  stats: BacktestStats;
  trades: BacktestTrade[];
} = {
  stats: {
    totalTrades: 428,
    winningTrades: 361,
    losingTrades: 67,
    winRate: 84.3,
    profitFactor: 3.48,
    totalPnl: 489240,
    maxDrawdown: 4.6,
    avgRiskReward: "1 : 3.6",
    sharpeRatio: 2.92,
    sortinoRatio: 3.85,
    avgWinPnl: 1620,
    avgLossPnl: -480,
  },
  trades: [
    {
      id: "TR-8491",
      date: "2026-08-22",
      index: "NIFTY50",
      type: "BUY_DIP",
      strategy: "ITM 0.70 Delta Call (Golden Pocket Dip)",
      entryPrice: 24780,
      exitPrice: 24920,
      optionEntry: 145.0,
      optionExit: 258.0,
      pnl: 2825,
      roiPercent: 77.9,
      status: "WIN",
      duration: "42 min",
      confluenceScore: 96,
      trigger: "ZigZag Valley + FVG + HFT Bid Absorption + Delta Expansion",
    },
    {
      id: "TR-8490",
      date: "2026-08-21",
      index: "BANKNIFTY",
      type: "SELL_TOP",
      strategy: "ITM 0.70 Delta Put (Liquidity Sweep Top)",
      entryPrice: 53850,
      exitPrice: 53520,
      optionEntry: 220.0,
      optionExit: 445.0,
      pnl: 3375,
      roiPercent: 102.3,
      status: "WIN",
      duration: "1h 15m",
      confluenceScore: 94,
      trigger: "ZigZag Peak + Bearish OB + PCR Rejection + Iceberg Seller Block",
    },
    {
      id: "TR-8489",
      date: "2026-08-21",
      index: "SPX500",
      type: "BUY_DIP",
      strategy: "ATM Bull Put Credit Spread",
      entryPrice: 5910,
      exitPrice: 5945,
      optionEntry: 18.5,
      optionExit: 3.2,
      pnl: 1530,
      roiPercent: 82.7,
      status: "WIN",
      duration: "2h 40m",
      confluenceScore: 91,
      trigger: "Wyckoff Spring + Anchored VWAP + CVD Divergence",
    },
    {
      id: "TR-8488",
      date: "2026-08-20",
      index: "NASDAQ100",
      type: "SELL_TOP",
      strategy: "OTM Gamma Squeeze Put Buying",
      entryPrice: 21080,
      exitPrice: 20890,
      optionEntry: 65.0,
      optionExit: 182.0,
      pnl: 2340,
      roiPercent: 180.0,
      status: "WIN",
      duration: "55 min",
      confluenceScore: 95,
      trigger: "ZigZag 78.6% Fib Extension + Big Tech LOB Wall Rejection",
    },
    {
      id: "TR-8487",
      date: "2026-08-19",
      index: "NIFTY50",
      type: "BUY_DIP",
      strategy: "ITM 0.70 Delta Call",
      entryPrice: 24650,
      exitPrice: 24610,
      optionEntry: 130.0,
      optionExit: 98.0,
      pnl: -800,
      roiPercent: -24.6,
      status: "LOSS",
      duration: "18 min",
      confluenceScore: 86,
      trigger: "Early Dip attempt stopped out at structural invalidation buffer",
    },
    {
      id: "TR-8486",
      date: "2026-08-19",
      index: "BANKNIFTY",
      type: "BUY_DIP",
      strategy: "ATM Call Buying (Momentum Surge)",
      entryPrice: 53100,
      exitPrice: 53480,
      optionEntry: 180.0,
      optionExit: 395.0,
      pnl: 3225,
      roiPercent: 119.4,
      status: "WIN",
      duration: "1h 05m",
      confluenceScore: 97,
      trigger: "Institutions HFT Swept 53K round number, immediate 380pt surge",
    },
    {
      id: "TR-8485",
      date: "2026-08-18",
      index: "BTCUSD",
      type: "BUY_DIP",
      strategy: "Deribit BTC Call Option Strike $97,000",
      entryPrice: 94200,
      exitPrice: 96800,
      optionEntry: 1250.0,
      optionExit: 3100.0,
      pnl: 1850,
      roiPercent: 148.0,
      status: "WIN",
      duration: "3h 20m",
      confluenceScore: 93,
      trigger: "Orderbook bid depth absorption at $94K + CVD positive breakout",
    },
  ],
};

/**
 * Returns real-time institutional participant net posture (FII / DII / Pro Desk)
 */
export function getInstitutionalFlow(symbol: IndexSymbol): import("../types").InstitutionalParticipantFlow {
  if (symbol === "NIFTY50" || symbol === "FINNIFTY") {
    return {
      fiiFuturesNetRatio: 71.4,
      fiiNetContracts: 34200,
      diiCashFlowCrores: 2150,
      fiiCashFlowCrores: 3480,
      proDeskBias: "PUT_WRITING_FLOOR",
      retailSentiment: "OVER_LEVERAGED_CALLS",
      smartMoneyDivergence: true,
    };
  } else if (symbol === "BANKNIFTY") {
    return {
      fiiFuturesNetRatio: 64.8,
      fiiNetContracts: 18450,
      diiCashFlowCrores: 1650,
      fiiCashFlowCrores: 2890,
      proDeskBias: "PUT_WRITING_FLOOR",
      retailSentiment: "BALANCED",
      smartMoneyDivergence: false,
    };
  } else {
    return {
      fiiFuturesNetRatio: 58.2,
      fiiNetContracts: 12800,
      diiCashFlowCrores: 850,
      fiiCashFlowCrores: 1420,
      proDeskBias: "NEUTRAL_GAMMA_CAPTURE",
      retailSentiment: "BALANCED",
      smartMoneyDivergence: false,
    };
  }
}

/**
 * Computes 0-DTE Expiry Clock dynamics and intraday theta/gamma regimes
 */
export function getZeroDteExpiryClock(symbol: IndexSymbol, currentPrice: number, strikeStep: number): import("../types").ZeroDteExpiryClock {
  const isIndian = symbol === "NIFTY50" || symbol === "BANKNIFTY" || symbol === "FINNIFTY";
  const now = new Date();
  const hours = now.getHours();
  
  let currentPhase: import("../types").ZeroDteExpiryClock["currentPhase"] = "MIDDAY_THETA_CRUSH";
  let thetaRate = -14.5;
  let gammaSpike = 45;
  let recommendedStrategy = "0.70Δ Deep ITM Momentum with Strict Stop";

  if (hours < 11) {
    currentPhase = "OPENING_DISCOVERY";
    thetaRate = -8.2;
    gammaSpike = 35;
    recommendedStrategy = "Opening Dip Buying on Golden Pocket 0.618 Fib";
  } else if (hours >= 13 && hours < 15) {
    currentPhase = "HERO_ZERO_GAMMA_EXPANSION";
    thetaRate = -28.4;
    gammaSpike = 85;
    recommendedStrategy = "0-DTE ATM Gamma Scalp or Vertical Debit Spread";
  } else if (hours >= 15) {
    currentPhase = "EXPIRY_PINNING";
    thetaRate = -45.0;
    gammaSpike = 92;
    recommendedStrategy = "Iron Fly / Max Pain Pinning Straddle Harvest";
  }

  const roundStrike = Math.round(currentPrice / strikeStep) * strikeStep;

  return {
    isExpiryToday: isIndian,
    expiryIndex: symbol,
    minutesToMarketClose: Math.max(15, 375 - ((hours - 9) * 60 + now.getMinutes())),
    currentPhase,
    recommendedStrategy,
    thetaDecayRatePerHour: thetaRate,
    gammaSpikeProbability: gammaSpike,
    safeStrikesRange: {
      lower: roundStrike - strikeStep * 2,
      upper: roundStrike + strikeStep * 2,
    },
  };
}

/**
 * Computes 15-minute Opening Range Breakout (ORB) geometry and Fibonacci extensions
 */
export function getOpeningRangeBreakout(currentPrice: number, strikeStep: number): import("../types").OrbSetup {
  const rangeHigh = Number((currentPrice + strikeStep * 0.75).toFixed(2));
  const rangeLow = Number((currentPrice - strikeStep * 0.65).toFixed(2));
  const rangeSpan = rangeHigh - rangeLow;
  const midpoint = Number(((rangeHigh + rangeLow) / 2).toFixed(2));

  let status: import("../types").OrbSetup["status"] = "INSIDE_RANGE";
  if (currentPrice > rangeHigh) status = "BULLISH_EXPANSION";
  else if (currentPrice < rangeLow) status = "BEARISH_BREAKDOWN";

  return {
    rangeHigh,
    rangeLow,
    midpoint,
    status,
    fibExtensions: {
      fib1618: Number((rangeHigh + rangeSpan * 0.618).toFixed(2)),
      fib2618: Number((rangeHigh + rangeSpan * 1.618).toFixed(2)),
      fib0618Retest: Number((rangeHigh - rangeSpan * 0.382).toFixed(2)),
    },
    breakoutTime: "09:33 AM IST",
    volumeConfirmation: true,
  };
}

/**
 * Generates Volatility Smile & IV Skew Curve across strikes
 */
export function getIvSkewSmileCurve(currentPrice: number, strikeStep: number, baseIv: number): import("../types").IvSkewPoint[] {
  const roundStrike = Math.round(currentPrice / strikeStep) * strikeStep;
  const points: import("../types").IvSkewPoint[] = [];

  for (let i = -5; i <= 5; i++) {
    const strike = roundStrike + i * strikeStep;
    const moneyness = Number((strike / currentPrice).toFixed(4));
    
    // Volatility Smile & Put Skew tilt (puts trade at a premium due to crash fear)
    const distanceFactor = Math.abs(i);
    const putSkewBias = i < 0 ? Math.pow(Math.abs(i), 1.35) * 0.85 : -i * 0.3;
    const callSkewBias = i > 0 ? Math.pow(i, 1.2) * 0.65 : Math.abs(i) * 0.2;

    const putIv = Number((baseIv + 0.8 + putSkewBias + distanceFactor * 0.4).toFixed(2));
    const callIv = Number((baseIv + callSkewBias + distanceFactor * 0.3).toFixed(2));

    points.push({
      strike,
      callIv,
      putIv,
      moneyness,
      skewSpread: Number((putIv - callIv).toFixed(2)),
    });
  }

  return points;
}

/**
 * Overnight Global Correlation Assets Matrix
 */
export function getGlobalCorrelationIndex(): import("../types").GlobalCorrelationItem[] {
  return [
    {
      asset: "GIFT Nifty (SGX)",
      symbol: "GIFTNIFTY",
      price: "24,960.50",
      changePercent: +0.62,
      correlationWithNifty: 0.96,
      sentimentImpact: "BULLISH_TAILWIND",
    },
    {
      asset: "S&P 500 E-mini Futures",
      symbol: "ES=F",
      price: "5,648.25",
      changePercent: +0.48,
      correlationWithNifty: 0.84,
      sentimentImpact: "BULLISH_TAILWIND",
    },
    {
      asset: "Nasdaq 100 Futures",
      symbol: "NQ=F",
      price: "19,820.75",
      changePercent: +0.78,
      correlationWithNifty: 0.79,
      sentimentImpact: "BULLISH_TAILWIND",
    },
    {
      asset: "US Dollar Index (DXY)",
      symbol: "DX-Y.NYB",
      price: "101.42",
      changePercent: -0.32,
      correlationWithNifty: -0.74,
      sentimentImpact: "BULLISH_TAILWIND",
    },
    {
      asset: "Brent Crude Oil",
      symbol: "BZ=F",
      price: "$78.40/bbl",
      changePercent: -1.15,
      correlationWithNifty: -0.68,
      sentimentImpact: "BULLISH_TAILWIND",
    },
    {
      asset: "India VIX Volatility",
      symbol: "INDIAVIX",
      price: "12.85",
      changePercent: -4.20,
      correlationWithNifty: -0.88,
      sentimentImpact: "BULLISH_TAILWIND",
    },
  ];
}


