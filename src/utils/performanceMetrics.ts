import { PaperTradePosition } from "../types";

export interface SessionPerformanceMetrics {
  totalTrades: number;
  closedTrades: number;
  activeTrades: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number; // percentage (0-100)
  lossRate: number;
  totalRealizedPnl: number;
  totalUnrealizedPnl: number;
  totalPnl: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  winLossRatio: number; // Payoff ratio (avgWin / avgLoss)
  expectancyPerTrade: number;
  
  // Risk-adjusted performance metrics
  sortinoRatio: number;
  sharpeRatio: number;
  calmarRatio: number;
  maxDrawdownAmount: number;
  maxDrawdownPct: number;
  downsideDeviationPct: number;
  totalVolatilityPct: number;

  // Streaks & Consistency
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  currentStreak: { count: number; type: "WIN" | "LOSS" | "NONE" };
  consistencyScore: number; // 0 - 100

  // Equity Curve Data
  equityCurve: {
    tradeIndex: number;
    timestamp: string;
    tradePnl: number;
    cumulativePnl: number;
    drawdownAmount: number;
    drawdownPct: number;
    peakEquity: number;
    label: string;
  }[];
}

export function computeSessionPerformanceMetrics(
  positions: PaperTradePosition[],
  initialCapital: number = 500000,
  riskFreeRateAnnual: number = 0.065
): SessionPerformanceMetrics {
  const closedPositions = positions.filter((p) => p.status !== "ACTIVE");
  const activePositions = positions.filter((p) => p.status === "ACTIVE");

  const totalRealizedPnl = closedPositions.reduce((s, p) => s + (p.realizedPnl || 0), 0);
  const totalUnrealizedPnl = activePositions.reduce((s, p) => s + p.unrealizedPnl, 0);
  const totalPnl = totalRealizedPnl + totalUnrealizedPnl;

  // Extract individual returns per trade
  const tradeReturns: { pnl: number; roiPct: number; timestamp: string; label: string }[] = [];
  
  // Sort positions chronologically if needed
  const allPositionsChronological = [...positions];

  let grossProfit = 0;
  let grossLoss = 0;
  let winCount = 0;
  let lossCount = 0;
  let breakevenCount = 0;

  for (const pos of allPositionsChronological) {
    const pnl = pos.status === "ACTIVE" ? pos.unrealizedPnl : (pos.realizedPnl || 0);
    const roiPct = pos.capitalInvested > 0 ? (pnl / pos.capitalInvested) * 100 : 0;
    tradeReturns.push({
      pnl,
      roiPct,
      timestamp: pos.timestamp,
      label: `${pos.strike} ${pos.optionType}`,
    });

    if (pnl > 0.01) {
      winCount++;
      grossProfit += pnl;
    } else if (pnl < -0.01) {
      lossCount++;
      grossLoss += Math.abs(pnl);
    } else {
      breakevenCount++;
    }
  }

  const totalTrades = positions.length;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
  const lossRate = totalTrades > 0 ? (lossCount / totalTrades) * 100 : 0;

  const avgWin = winCount > 0 ? grossProfit / winCount : 0;
  const avgLoss = lossCount > 0 ? grossLoss / lossCount : 0;
  const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 3.5 : 1.0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 9.99 : 1.0;

  // Expectancy = (WinRate * AvgWin) - (LossRate * AvgLoss)
  const p = winRate / 100;
  const q = lossRate / 100;
  const expectancyPerTrade = p * avgWin - q * avgLoss;

  // Build Cumulative Equity Curve & Maximum Drawdown Calculation
  let runningCumulativePnl = 0;
  let peakEquity = 0;
  let maxDrawdownAmount = 0;
  let maxDrawdownPct = 0;

  const equityCurve: SessionPerformanceMetrics["equityCurve"] = [
    {
      tradeIndex: 0,
      timestamp: "Session Start",
      tradePnl: 0,
      cumulativePnl: 0,
      drawdownAmount: 0,
      drawdownPct: 0,
      peakEquity: 0,
      label: "Baseline",
    },
  ];

  let currentStreakCount = 0;
  let currentStreakType: "WIN" | "LOSS" | "NONE" = "NONE";
  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let tempWins = 0;
  let tempLosses = 0;

  for (let i = 0; i < tradeReturns.length; i++) {
    const item = tradeReturns[i];
    runningCumulativePnl += item.pnl;

    if (runningCumulativePnl > peakEquity) {
      peakEquity = runningCumulativePnl;
    }

    const currentDrawdownAmount = peakEquity - runningCumulativePnl;
    const currentDrawdownPct = initialCapital + peakEquity > 0
      ? (currentDrawdownAmount / (initialCapital + peakEquity)) * 100
      : 0;

    if (currentDrawdownAmount > maxDrawdownAmount) {
      maxDrawdownAmount = currentDrawdownAmount;
    }
    if (currentDrawdownPct > maxDrawdownPct) {
      maxDrawdownPct = currentDrawdownPct;
    }

    equityCurve.push({
      tradeIndex: i + 1,
      timestamp: item.timestamp,
      tradePnl: item.pnl,
      cumulativePnl: runningCumulativePnl,
      drawdownAmount: currentDrawdownAmount,
      drawdownPct: Number(currentDrawdownPct.toFixed(2)),
      peakEquity,
      label: item.label,
    });

    // Consecutive streaks
    if (item.pnl > 0.01) {
      tempWins++;
      tempLosses = 0;
      if (tempWins > maxConsecutiveWins) maxConsecutiveWins = tempWins;
      currentStreakType = "WIN";
      currentStreakCount = tempWins;
    } else if (item.pnl < -0.01) {
      tempLosses++;
      tempWins = 0;
      if (tempLosses > maxConsecutiveLosses) maxConsecutiveLosses = tempLosses;
      currentStreakType = "LOSS";
      currentStreakCount = tempLosses;
    }
  }

  // -------------------------------------------------------------
  // Statistical Calculations: Volatility, Downside Deviation, Sortino, Sharpe
  // -------------------------------------------------------------
  const returnsArray = tradeReturns.map((t) => t.roiPct);
  const n = returnsArray.length;

  let meanReturn = 0;
  let totalVariance = 0;
  let downsideVariance = 0;
  const targetReturn = 0; // MAR (Minimum Acceptable Return) = 0% per trade

  if (n > 0) {
    meanReturn = returnsArray.reduce((a, b) => a + b, 0) / n;
    
    for (const ret of returnsArray) {
      totalVariance += Math.pow(ret - meanReturn, 2);
      if (ret < targetReturn) {
        downsideVariance += Math.pow(ret - targetReturn, 2);
      }
    }
    totalVariance = n > 1 ? totalVariance / (n - 1) : 0.0001;
    downsideVariance = n > 0 ? downsideVariance / n : 0.0001;
  }

  const totalVolatilityPct = Number(Math.sqrt(totalVariance).toFixed(2));
  const downsideDeviationPct = Number(Math.sqrt(downsideVariance).toFixed(2));

  // Sortino Ratio = (Mean Return - Target) / Downside Deviation
  let sortinoRatio = 0;
  if (downsideDeviationPct > 0.001) {
    sortinoRatio = Number(((meanReturn - targetReturn) / downsideDeviationPct).toFixed(2));
  } else if (meanReturn > 0) {
    sortinoRatio = 4.5; // High capped when zero downside losses
  }

  // Sharpe Ratio = Mean Return / Total Standard Deviation
  let sharpeRatio = 0;
  if (totalVolatilityPct > 0.001) {
    sharpeRatio = Number((meanReturn / totalVolatilityPct).toFixed(2));
  }

  // Calmar Ratio = Annualized/Total Return % / Max Drawdown %
  let calmarRatio = 0;
  if (maxDrawdownPct > 0.01) {
    calmarRatio = Number(((runningCumulativePnl / initialCapital) * 100 / maxDrawdownPct).toFixed(2));
  } else if (runningCumulativePnl > 0) {
    calmarRatio = 5.0;
  }

  // Consistency Score (0 to 100) based on Win Rate, Profit Factor, Sortino, and Drawdown
  let consistencyScore = 50;
  if (totalTrades > 0) {
    const wrScore = Math.min(30, (winRate / 100) * 30);
    const pfScore = Math.min(25, (profitFactor / 3) * 25);
    const sortinoScore = Math.min(25, (Math.max(0, sortinoRatio) / 2.5) * 25);
    const ddPenalty = Math.min(20, (maxDrawdownPct / 5) * 20);
    consistencyScore = Math.round(Math.max(5, Math.min(100, wrScore + pfScore + sortinoScore + 20 - ddPenalty)));
  }

  return {
    totalTrades,
    closedTrades: closedPositions.length,
    activeTrades: activePositions.length,
    winCount,
    lossCount,
    breakevenCount,
    winRate: Number(winRate.toFixed(1)),
    lossRate: Number(lossRate.toFixed(1)),
    totalRealizedPnl: Number(totalRealizedPnl.toFixed(2)),
    totalUnrealizedPnl: Number(totalUnrealizedPnl.toFixed(2)),
    totalPnl: Number(totalPnl.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    avgWin: Number(avgWin.toFixed(2)),
    avgLoss: Number(avgLoss.toFixed(2)),
    winLossRatio: Number(winLossRatio.toFixed(2)),
    expectancyPerTrade: Number(expectancyPerTrade.toFixed(2)),
    sortinoRatio,
    sharpeRatio,
    calmarRatio,
    maxDrawdownAmount: Number(maxDrawdownAmount.toFixed(2)),
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
    downsideDeviationPct,
    totalVolatilityPct,
    maxConsecutiveWins,
    maxConsecutiveLosses,
    currentStreak: { count: currentStreakCount, type: currentStreakType },
    consistencyScore,
    equityCurve,
  };
}
