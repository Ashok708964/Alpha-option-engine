// Black-Scholes Pricing and Greeks Engine for European & American styled Index Options

// Standard Normal Cumulative Distribution Function (CDF)
export function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * absX);
  const erf =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) *
      t *
      Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * erf);
}

// Standard Normal Probability Density Function (PDF)
export function normalPDF(x: number): number {
  return (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

export interface BSGreeksResult {
  price: number;
  delta: number;
  gamma: number;
  theta: number; // Daily theta decay
  vega: number; // 1% change in IV
  rho: number;
  iv: number;
}

/**
 * Calculates theoretical Option Price & Full Greeks using Black-Scholes
 * @param S Current Spot Price of Index
 * @param K Strike Price
 * @param T Time to expiration in years (e.g. 5 days = 5/365)
 * @param r Risk-free interest rate (e.g. 0.06 for 6%)
 * @param sigma Implied Volatility (e.g. 0.15 for 15%)
 * @param isCall true for Call (CE), false for Put (PE)
 */
export function calculateBlackScholes(
  S: number,
  K: number,
  T: number,
  r: number = 0.065,
  sigma: number = 0.16,
  isCall: boolean = true
): BSGreeksResult {
  // Prevent division by zero or invalid time
  const timeToExpiry = Math.max(T, 0.0001);
  const vol = Math.max(sigma, 0.01);
  const sqrtT = Math.sqrt(timeToExpiry);

  const d1 = (Math.log(S / K) + (r + 0.5 * vol * vol) * timeToExpiry) / (vol * sqrtT);
  const d2 = d1 - vol * sqrtT;

  const nd1 = normalCDF(d1);
  const nd2 = normalCDF(d2);
  const n_minus_d1 = normalCDF(-d1);
  const n_minus_d2 = normalCDF(-d2);
  const pdf_d1 = normalPDF(d1);

  let price = 0;
  let delta = 0;
  let theta = 0;
  let rho = 0;

  // Gamma and Vega are identical for Calls & Puts
  const gamma = pdf_d1 / (S * vol * sqrtT);
  const vega = (S * sqrtT * pdf_d1) / 100; // Scaled per 1% change in vol

  if (isCall) {
    price = S * nd1 - K * Math.exp(-r * timeToExpiry) * nd2;
    delta = nd1;
    // Daily Theta for Call
    theta =
      (-(S * pdf_d1 * vol) / (2 * sqrtT) -
        r * K * Math.exp(-r * timeToExpiry) * nd2) /
      365;
    rho = (K * timeToExpiry * Math.exp(-r * timeToExpiry) * nd2) / 100;
  } else {
    price = K * Math.exp(-r * timeToExpiry) * n_minus_d2 - S * n_minus_d1;
    delta = nd1 - 1; // Negative delta for Put
    // Daily Theta for Put
    theta =
      (-(S * pdf_d1 * vol) / (2 * sqrtT) +
        r * K * Math.exp(-r * timeToExpiry) * n_minus_d2) /
      365;
    rho = (-K * timeToExpiry * Math.exp(-r * timeToExpiry) * n_minus_d2) / 100;
  }

  return {
    price: Math.max(price, 0.05),
    delta: Number(delta.toFixed(4)),
    gamma: Number(gamma.toFixed(5)),
    theta: Number(theta.toFixed(2)),
    vega: Number(vega.toFixed(2)),
    rho: Number(rho.toFixed(4)),
    iv: sigma,
  };
}

/**
 * Calculates Payoff for a strategy at Expiry across spot ranges
 */
export function calculateStrategyPayoff(
  spotRange: number[],
  legs: {
    type: "BUY_CALL" | "SELL_CALL" | "BUY_PUT" | "SELL_PUT";
    strike: number;
    premium: number;
    contracts: number;
  }[]
): { spot: number; pnl: number; isProfit: boolean }[] {
  return spotRange.map((spot) => {
    let totalPnl = 0;

    for (const leg of legs) {
      let legPnl = 0;
      if (leg.type === "BUY_CALL") {
        legPnl = Math.max(0, spot - leg.strike) - leg.premium;
      } else if (leg.type === "SELL_CALL") {
        legPnl = leg.premium - Math.max(0, spot - leg.strike);
      } else if (leg.type === "BUY_PUT") {
        legPnl = Math.max(0, leg.strike - spot) - leg.premium;
      } else if (leg.type === "SELL_PUT") {
        legPnl = leg.premium - Math.max(0, leg.strike - spot);
      }
      totalPnl += legPnl * leg.contracts;
    }

    return {
      spot: Math.round(spot),
      pnl: Math.round(totalPnl * 100) / 100,
      isProfit: totalPnl >= 0,
    };
  });
}
