/**
 * Currency Conversion Service
 *
 * Handles USD to INR conversion for displaying costs to Indian users.
 * Uses a fixed exchange rate that should be updated periodically.
 */

// ============================================================
// EXCHANGE RATES
// ============================================================

/**
 * USD to INR exchange rate
 * Update this periodically or fetch from an API for real-time rates
 */
export const USD_TO_INR = 84.50

/**
 * Last updated timestamp for the exchange rate
 */
export const EXCHANGE_RATE_UPDATED = '2025-12-05'

// ============================================================
// CONVERSION FUNCTIONS
// ============================================================

/**
 * Convert USD to INR
 */
export function convertToINR(usd: number): number {
  return usd * USD_TO_INR
}

/**
 * Convert INR to USD
 */
export function convertToUSD(inr: number): number {
  return inr / USD_TO_INR
}

// ============================================================
// FORMATTING FUNCTIONS
// ============================================================

/**
 * Format a USD amount with proper precision
 */
export function formatUSD(usd: number, precision: number = 4): string {
  if (usd < 0.0001) {
    return `$${usd.toExponential(2)}`
  }
  if (usd < 0.01) {
    return `$${usd.toFixed(4)}`
  }
  if (usd < 1) {
    return `$${usd.toFixed(precision)}`
  }
  return `$${usd.toFixed(2)}`
}

/**
 * Format an INR amount with proper formatting (commas in Indian style)
 */
export function formatINR(inr: number): string {
  // Indian number formatting: 1,00,000 instead of 100,000
  if (inr < 1) {
    return `₹${inr.toFixed(2)}`
  }

  const formatted = inr.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })

  return `₹${formatted}`
}

/**
 * Format currency in both USD and INR
 */
export function formatDualCurrency(usd: number): {
  usd: string
  inr: string
  usdValue: number
  inrValue: number
} {
  const inrValue = convertToINR(usd)
  return {
    usd: formatUSD(usd),
    inr: formatINR(inrValue),
    usdValue: usd,
    inrValue: inrValue,
  }
}

/**
 * Format currency for display in a compact way
 * e.g., "$0.0123 (₹1.04)"
 */
export function formatCurrencyCompact(usd: number): string {
  const { usd: usdStr, inr: inrStr } = formatDualCurrency(usd)
  return `${usdStr} (${inrStr})`
}

/**
 * Format USD cost as INR only (no USD shown)
 * Converts USD to INR internally and formats with ₹ symbol
 * Use this for INR-only displays in analytics
 */
export function formatCostAsINR(usd: number): string {
  const inr = convertToINR(usd)
  return formatINR(inr)
}

// ============================================================
// SUMMARY HELPERS
// ============================================================

/**
 * Generate a cost summary object for analytics
 */
export function generateCostSummary(totalUsd: number): {
  totalUsd: number
  totalInr: number
  formattedUsd: string
  formattedInr: string
  exchangeRate: number
  rateUpdated: string
} {
  const totalInr = convertToINR(totalUsd)
  return {
    totalUsd,
    totalInr,
    formattedUsd: formatUSD(totalUsd, 2),
    formattedInr: formatINR(totalInr),
    exchangeRate: USD_TO_INR,
    rateUpdated: EXCHANGE_RATE_UPDATED,
  }
}

/**
 * Format token count with commas
 */
export function formatTokenCount(tokens: number): string {
  return tokens.toLocaleString('en-US')
}

/**
 * Format cost per token (useful for analytics)
 */
export function formatCostPerToken(totalCost: number, totalTokens: number): string {
  if (totalTokens === 0) return '$0.00'
  const costPerToken = totalCost / totalTokens
  return `$${(costPerToken * 1000).toFixed(4)}/1K tokens`
}
