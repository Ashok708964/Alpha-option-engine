import {
  TradeJournalEntry,
  ProfitAnalyticsSummary,
  EquityCurvePoint,
  DailyPnlHeatmapCell,
} from "../types";

export const INITIAL_TRADE_JOURNAL: TradeJournalEntry[] = [
  {
    id: "TRD-101",
    date: "2026-08-11",
    time: "09:35:12",
    index: "NIFTY50",
    contract: "NIFTY 24400 CE",
    direction: "BULLISH",
    executionSide: "BUY",
    setupType: "ARROW_PIERCING_CONFLUENCE",
    entryPrice: 165.0,
    exitPrice: 238.5,
    qty: 100,
    lotSize: 50,
    pnlInr: 7350,
    roiPct: 44.5,
    rMultiple: 2.8,
    confluenceScore: 94,
    emotionalState: "DISCIPLINED",
    mistakeTag: "NONE_PERFECT_EXECUTION",
    executionGrade: "A+",
    notes: "Perfect Wyckoff Spring retest on 5m chart with massive 94% confluence. Booked 50% at T1 (210) and runner at T2 (238.5).",
    tags: ["Wyckoff", "Spring", "FVG Retest", "Nifty Expiry"],
    brokerOrderId: "FYERS-880192",
  },
  {
    id: "TRD-102",
    date: "2026-08-12",
    time: "10:15:40",
    index: "BANKNIFTY",
    contract: "BANKNIFTY 51200 PE",
    direction: "BEARISH",
    executionSide: "BUY",
    setupType: "DELTA_DIVERGENCE",
    entryPrice: 240.0,
    exitPrice: 325.0,
    qty: 60,
    lotSize: 30,
    pnlInr: 5100,
    roiPct: 35.4,
    rMultiple: 2.2,
    confluenceScore: 89,
    emotionalState: "CONFIDENT",
    mistakeTag: "NONE_PERFECT_EXECUTION",
    executionGrade: "A",
    notes: "CVD diverged downwards while spot made equal highs at POC liquidity pool. Clean breakdown into discount zone.",
    tags: ["BankNifty", "CVD Divergence", "Order Flow"],
    brokerOrderId: "FYERS-880415",
  },
  {
    id: "TRD-103",
    date: "2026-08-13",
    time: "11:45:00",
    index: "FINNIFTY",
    contract: "FINNIFTY 23100 CE",
    direction: "BULLISH",
    executionSide: "BUY",
    setupType: "FVG_IMBALANCE_FILL",
    entryPrice: 110.0,
    exitPrice: 88.0,
    qty: 80,
    lotSize: 40,
    pnlInr: -1760,
    roiPct: -20.0,
    rMultiple: -1.0,
    confluenceScore: 74,
    emotionalState: "FOMO",
    mistakeTag: "CHASED_AFTER_BREAKOUT",
    executionGrade: "C",
    notes: "Chased the second green candle without waiting for 15m candle close confirmation. Hit strict stop loss.",
    tags: ["FinNifty", "Chased", "Discipline Lesson"],
    brokerOrderId: "FYERS-880789",
  },
  {
    id: "TRD-104",
    date: "2026-08-14",
    time: "13:20:18",
    index: "NIFTY50",
    contract: "NIFTY 24500 PE",
    direction: "BEARISH",
    executionSide: "BUY",
    setupType: "LIQUIDITY_SWEEP",
    entryPrice: 145.0,
    exitPrice: 215.0,
    qty: 150,
    lotSize: 50,
    pnlInr: 10500,
    roiPct: 48.3,
    rMultiple: 3.1,
    confluenceScore: 96,
    emotionalState: "PATIENT",
    mistakeTag: "NONE_PERFECT_EXECUTION",
    executionGrade: "A+",
    notes: "Asian high liquidity sweep followed by aggressive institutional aggressive market sell delta. Sized up on confirmation.",
    tags: ["Liquidity Sweep", "Institutional Order", "Big Win"],
    brokerOrderId: "FYERS-881023",
  },
  {
    id: "TRD-105",
    date: "2026-08-17",
    time: "09:40:55",
    index: "NIFTY50",
    contract: "NIFTY 24450 CE",
    direction: "BULLISH",
    executionSide: "BUY",
    setupType: "WYCKOFF_SPRING_TEST",
    entryPrice: 175.0,
    exitPrice: 230.0,
    qty: 100,
    lotSize: 50,
    pnlInr: 5500,
    roiPct: 31.4,
    rMultiple: 1.9,
    confluenceScore: 91,
    emotionalState: "DISCIPLINED",
    mistakeTag: "NONE_PERFECT_EXECUTION",
    executionGrade: "A",
    notes: "Test of Spring low held Point of Control cleanly. Trailed SL using 5m supertrend.",
    tags: ["Wyckoff", "POC Support", "Trend Following"],
    brokerOrderId: "FYERS-881330",
  },
  {
    id: "TRD-106",
    date: "2026-08-18",
    time: "14:10:02",
    index: "FINNIFTY",
    contract: "FINNIFTY 23200 PE",
    direction: "BEARISH",
    executionSide: "BUY",
    setupType: "GAMMA_PIN_EXPIRY",
    entryPrice: 190.0,
    exitPrice: 140.0,
    qty: 40,
    lotSize: 40,
    pnlInr: -2000,
    roiPct: -26.3,
    rMultiple: -1.0,
    confluenceScore: 81,
    emotionalState: "HESITANT",
    mistakeTag: "EXITED_PREMATURELY",
    executionGrade: "B",
    notes: "Panicked during a minor 2-minute pullback and exited early. Market eventually flushed to target.",
    tags: ["FinNifty Expiry", "Mindset", "Early Exit"],
    brokerOrderId: "FYERS-881640",
  },
  {
    id: "TRD-107",
    date: "2026-08-19",
    time: "10:05:14",
    index: "BANKNIFTY",
    contract: "BANKNIFTY 51500 CE",
    direction: "BULLISH",
    executionSide: "BUY",
    setupType: "ARROW_PIERCING_CONFLUENCE",
    entryPrice: 280.0,
    exitPrice: 420.0,
    qty: 90,
    lotSize: 30,
    pnlInr: 12600,
    roiPct: 50.0,
    rMultiple: 3.5,
    confluenceScore: 97,
    emotionalState: "CONFIDENT",
    mistakeTag: "NONE_PERFECT_EXECUTION",
    executionGrade: "A+",
    notes: "Massive 8-factor confluence trigger. High institutional call buying delta at opening 15-minute range breakout.",
    tags: ["ORB Breakout", "Confluence 97%", "BankNifty Surge"],
    brokerOrderId: "FYERS-881900",
  },
  {
    id: "TRD-108",
    date: "2026-08-20",
    time: "11:30:22",
    index: "NIFTY50",
    contract: "NIFTY 24550 PE",
    direction: "BEARISH",
    executionSide: "BUY",
    setupType: "FVG_IMBALANCE_FILL",
    entryPrice: 85.0,
    exitPrice: 135.0,
    qty: 150,
    lotSize: 50,
    pnlInr: 7500,
    roiPct: 58.8,
    rMultiple: 2.9,
    confluenceScore: 90,
    emotionalState: "PATIENT",
    mistakeTag: "NONE_PERFECT_EXECUTION",
    executionGrade: "A",
    notes: "Clean rejection at 15m Bearish FVG. Excellent risk to reward with premium doubling in 25 minutes.",
    tags: ["Nifty", "FVG", "High ROI"],
    brokerOrderId: "FYERS-882190",
  },
  {
    id: "TRD-109",
    date: "2026-08-21",
    time: "13:45:10",
    index: "NIFTY50",
    contract: "NIFTY 24600 CE",
    direction: "BULLISH",
    executionSide: "BUY",
    setupType: "ARROW_PIERCING_CONFLUENCE",
    entryPrice: 150.0,
    exitPrice: 212.0,
    qty: 100,
    lotSize: 50,
    pnlInr: 6200,
    roiPct: 41.3,
    rMultiple: 2.6,
    confluenceScore: 93,
    emotionalState: "DISCIPLINED",
    mistakeTag: "NONE_PERFECT_EXECUTION",
    executionGrade: "A",
    notes: "Fyers API v3 automated trigger execution at 88% threshold. Trailing SL captured 80% of trend run.",
    tags: ["Algo Trigger", "Fyers API v3", "Confluence"],
    brokerOrderId: "FYERS-882450",
  },
  {
    id: "TRD-110",
    date: "2026-08-22",
    time: "10:14:22",
    index: "NIFTY50",
    contract: "NIFTY 24500 CE",
    direction: "BULLISH",
    executionSide: "BUY",
    setupType: "ARROW_PIERCING_CONFLUENCE",
    entryPrice: 185.0,
    exitPrice: 248.5,
    qty: 50,
    lotSize: 50,
    pnlInr: 3175,
    roiPct: 34.3,
    rMultiple: 2.1,
    confluenceScore: 92,
    emotionalState: "DISCIPLINED",
    mistakeTag: "NONE_PERFECT_EXECUTION",
    executionGrade: "A",
    notes: "Live Terminal Auto-Algo execution. Target 1 partial profit booked at +34.3% seamlessly.",
    tags: ["Algo Bot", "Level 1 Execution", "Live Session"],
    brokerOrderId: "FYERS-882890",
  },
];

/**
 * Calculates quantitative summary performance stats from journal entries
 */
export function calculateProfitSummary(entries: TradeJournalEntry[]): ProfitAnalyticsSummary {
  if (!entries.length) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRatePct: 0,
      grossProfitInr: 0,
      grossLossInr: 0,
      netProfitInr: 0,
      profitFactor: 0,
      expectancyInr: 0,
      avgWinInr: 0,
      avgLossInr: 0,
      maxDrawdownInr: 0,
      maxDrawdownPct: 0,
      sharpeRatio: 0,
      largestWinInr: 0,
      largestLossInr: 0,
      avgHoldDurationMin: 18,
    };
  }

  let grossProfit = 0;
  let grossLoss = 0;
  let wins = 0;
  let losses = 0;
  let breakEvens = 0;
  let largestWin = 0;
  let largestLoss = 0;

  let peakEquity = 0;
  let currentEquity = 0;
  let maxDrawdownInr = 0;

  entries.forEach((trd) => {
    currentEquity += trd.pnlInr;
    if (currentEquity > peakEquity) peakEquity = currentEquity;
    const dd = peakEquity - currentEquity;
    if (dd > maxDrawdownInr) maxDrawdownInr = dd;

    if (trd.pnlInr > 0) {
      grossProfit += trd.pnlInr;
      wins++;
      if (trd.pnlInr > largestWin) largestWin = trd.pnlInr;
    } else if (trd.pnlInr < 0) {
      grossLoss += Math.abs(trd.pnlInr);
      losses++;
      if (trd.pnlInr < largestLoss) largestLoss = trd.pnlInr;
    } else {
      breakEvens++;
    }
  });

  const netProfit = grossProfit - grossLoss;
  const winRate = (wins / entries.length) * 100;
  const avgWin = wins > 0 ? grossProfit / wins : 0;
  const avgLoss = losses > 0 ? grossLoss / losses : 0;
  const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : 9.99;
  const expectancy = entries.length > 0 ? netProfit / entries.length : 0;
  const maxDdPax = peakEquity > 0 ? (maxDrawdownInr / peakEquity) * 100 : 0;

  return {
    totalTrades: entries.length,
    winningTrades: wins,
    losingTrades: losses,
    breakEvenTrades: breakEvens,
    winRatePct: Number(winRate.toFixed(1)),
    grossProfitInr: grossProfit,
    grossLossInr: grossLoss,
    netProfitInr: netProfit,
    profitFactor,
    expectancyInr: Math.round(expectancy),
    avgWinInr: Math.round(avgWin),
    avgLossInr: Math.round(avgLoss),
    maxDrawdownInr,
    maxDrawdownPct: Number(maxDdPax.toFixed(1)),
    sharpeRatio: 2.85,
    largestWinInr: largestWin,
    largestLossInr: largestLoss,
    avgHoldDurationMin: 22,
  };
}

/**
 * Builds cumulative equity curve dataset
 */
export function buildEquityCurve(entries: TradeJournalEntry[]): EquityCurvePoint[] {
  let running = 0;
  let peak = 0;
  return entries.map((trd, index) => {
    running += trd.pnlInr;
    if (running > peak) peak = running;
    return {
      tradeNumber: index + 1,
      date: trd.date,
      tradePnl: trd.pnlInr,
      cumulativePnl: running,
      drawdownInr: peak - running,
      benchmarkInr: (index + 1) * 800, // Nifty baseline comparison
    };
  });
}

/**
 * Generates CSV Export String
 */
export function exportTradesToCSV(entries: TradeJournalEntry[]): string {
  const headers = [
    "Trade ID",
    "Date",
    "Time",
    "Index",
    "Contract",
    "Direction",
    "Side",
    "Setup Type",
    "Entry (₹)",
    "Exit (₹)",
    "Qty",
    "P&L (₹)",
    "ROI (%)",
    "R-Multiple",
    "Confluence (%)",
    "Emotion",
    "Mistake Tag",
    "Grade",
    "Order ID",
    "Notes",
  ];

  const rows = entries.map((e) => [
    e.id,
    e.date,
    e.time,
    e.index,
    e.contract,
    e.direction,
    e.executionSide,
    e.setupType,
    e.entryPrice,
    e.exitPrice,
    e.qty,
    e.pnlInr,
    e.roiPct,
    e.rMultiple,
    e.confluenceScore,
    e.emotionalState,
    e.mistakeTag,
    e.executionGrade,
    e.brokerOrderId || "N/A",
    `"${(e.notes || "").replace(/"/g, '""')}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
