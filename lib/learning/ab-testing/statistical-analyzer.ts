/**
 * Statistical Analyzer for A/B Testing
 *
 * Implements Welch's t-test for comparing two sample means with potentially
 * unequal variances. Used to determine statistical significance of A/B tests.
 *
 * Key metrics:
 * - p-value: Probability that observed difference is due to chance
 * - Effect size (Cohen's d): Magnitude of the difference
 * - Confidence interval: Range of likely true difference
 */

import type {
  StatisticalTestResult,
  ExperimentResults,
} from '@/types/learning.types'
import { getAssignmentStats } from './traffic-router'

// Significance threshold
const ALPHA = 0.05

/**
 * Analyze an experiment and return statistical results
 */
export async function analyzeExperiment(experimentId: string): Promise<ExperimentResults | null> {
  try {
    const stats = await getAssignmentStats(experimentId)

    if (stats.controlWithFeedback < 2 || stats.treatmentWithFeedback < 2) {
      console.log('[StatAnalyzer] Insufficient samples for analysis')
      return null
    }

    const controlMean = stats.controlAvgRating
    const treatmentMean = stats.treatmentAvgRating
    const controlStdDev = calculateStdDev(stats.controlRatings, controlMean)
    const treatmentStdDev = calculateStdDev(stats.treatmentRatings, treatmentMean)

    // Run Welch's t-test
    const testResult = welchsTTest(
      stats.controlRatings,
      stats.treatmentRatings
    )

    // Calculate effect size (Cohen's d)
    const pooledStdDev = Math.sqrt(
      (controlStdDev ** 2 + treatmentStdDev ** 2) / 2
    )
    const effectSize = pooledStdDev > 0
      ? (treatmentMean - controlMean) / pooledStdDev
      : 0

    // Calculate confidence interval
    const ci = calculateConfidenceInterval(
      stats.controlRatings,
      stats.treatmentRatings,
      0.95
    )

    // Power analysis
    const power = calculatePower(
      stats.controlWithFeedback,
      stats.treatmentWithFeedback,
      effectSize
    )

    const isSignificant = testResult.pValue < ALPHA

    const results: ExperimentResults = {
      controlSamples: stats.controlWithFeedback,
      treatmentSamples: stats.treatmentWithFeedback,
      controlMean,
      treatmentMean,
      controlStdDev,
      treatmentStdDev,
      effectSize,
      pValue: testResult.pValue,
      isSignificant,
      confidenceInterval: ci,
      powerAnalysis: {
        currentPower: power,
        requiredSamples: estimateRequiredSamples(effectSize, 0.8),
      },
    }

    return results
  } catch (error) {
    console.error('[StatAnalyzer] Error analyzing experiment:', error)
    return null
  }
}

/**
 * Get statistical test result with recommendation
 */
export async function getTestResult(experimentId: string): Promise<StatisticalTestResult | null> {
  const results = await analyzeExperiment(experimentId)
  if (!results) return null

  const isSignificant = results.pValue < ALPHA
  const treatmentBetter = results.treatmentMean > results.controlMean

  let recommendation: 'promote' | 'deprecate' | 'continue' | 'inconclusive'

  if (!isSignificant) {
    // Check if we have enough samples
    const totalSamples = results.controlSamples + results.treatmentSamples
    if (totalSamples >= 200) {
      recommendation = 'inconclusive' // Enough samples, truly no difference
    } else {
      recommendation = 'continue' // Need more samples
    }
  } else if (treatmentBetter) {
    recommendation = 'promote'
  } else {
    recommendation = 'deprecate'
  }

  return {
    testType: 'welch_t_test',
    pValue: results.pValue,
    isSignificant,
    effectSize: results.effectSize,
    confidenceInterval: results.confidenceInterval,
    recommendation,
  }
}

/**
 * Welch's t-test implementation
 * Compares two independent samples with potentially unequal variances
 */
function welchsTTest(
  sample1: number[],
  sample2: number[]
): { tStatistic: number; pValue: number; degreesOfFreedom: number } {
  const n1 = sample1.length
  const n2 = sample2.length

  const mean1 = sample1.reduce((a, b) => a + b, 0) / n1
  const mean2 = sample2.reduce((a, b) => a + b, 0) / n2

  const var1 = calculateVariance(sample1, mean1)
  const var2 = calculateVariance(sample2, mean2)

  // Welch's t-statistic
  const se = Math.sqrt(var1 / n1 + var2 / n2)
  const t = se > 0 ? (mean1 - mean2) / se : 0

  // Welch-Satterthwaite degrees of freedom
  const num = (var1 / n1 + var2 / n2) ** 2
  const denom = (var1 / n1) ** 2 / (n1 - 1) + (var2 / n2) ** 2 / (n2 - 1)
  const df = denom > 0 ? num / denom : 1

  // Calculate p-value using t-distribution approximation
  const pValue = 2 * (1 - tDistributionCDF(Math.abs(t), df))

  return {
    tStatistic: t,
    pValue: Math.max(0, Math.min(1, pValue)), // Clamp to [0, 1]
    degreesOfFreedom: df,
  }
}

/**
 * Calculate variance of a sample
 */
function calculateVariance(sample: number[], mean: number): number {
  if (sample.length < 2) return 0
  const sumSquaredDiff = sample.reduce((sum, x) => sum + (x - mean) ** 2, 0)
  return sumSquaredDiff / (sample.length - 1)
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(sample: number[], mean: number): number {
  return Math.sqrt(calculateVariance(sample, mean))
}

/**
 * Approximate t-distribution CDF
 * Uses a polynomial approximation that's accurate enough for our purposes
 */
function tDistributionCDF(t: number, df: number): number {
  // For large df, t-distribution approaches normal
  if (df > 100) {
    return normalCDF(t)
  }

  // Use approximation based on incomplete beta function
  const x = df / (df + t * t)
  const a = df / 2
  const b = 0.5

  // Regularized incomplete beta function approximation
  const beta = incompleteBetaApprox(x, a, b)

  if (t >= 0) {
    return 1 - 0.5 * beta
  } else {
    return 0.5 * beta
  }
}

/**
 * Standard normal CDF approximation
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x < 0 ? -1 : 1
  x = Math.abs(x) / Math.sqrt(2)

  const t = 1 / (1 + p * x)
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return 0.5 * (1 + sign * y)
}

/**
 * Approximate incomplete beta function
 * Uses a continued fraction approximation
 */
function incompleteBetaApprox(x: number, a: number, b: number): number {
  if (x === 0) return 0
  if (x === 1) return 1

  // Simple approximation using Lentz's algorithm truncated
  let result = 0
  const bt = Math.exp(
    a * Math.log(x) + b * Math.log(1 - x) -
    Math.log(a) - logBeta(a, b)
  )

  if (x < (a + 1) / (a + b + 2)) {
    result = bt * betaContinuedFraction(x, a, b) / a
  } else {
    result = 1 - bt * betaContinuedFraction(1 - x, b, a) / b
  }

  return Math.max(0, Math.min(1, result))
}

/**
 * Log of beta function
 */
function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b)
}

/**
 * Log gamma function approximation (Stirling's approximation)
 */
function logGamma(x: number): number {
  const coeffs = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.1208650973866179e-2,
    -0.5395239384953e-5,
  ]

  let y = x
  let tmp = x + 5.5
  tmp -= (x + 0.5) * Math.log(tmp)

  let ser = 1.000000000190015
  for (let j = 0; j < 6; j++) {
    ser += coeffs[j] / ++y
  }

  return -tmp + Math.log(2.5066282746310005 * ser / x)
}

/**
 * Beta continued fraction evaluation
 */
function betaContinuedFraction(x: number, a: number, b: number): number {
  const maxIterations = 100
  const epsilon = 1e-10

  let m = 1
  let aa: number, del: number

  let qab = a + b
  let qap = a + 1
  let qam = a - 1
  let c = 1
  let d = 1 - qab * x / qap
  if (Math.abs(d) < epsilon) d = epsilon
  d = 1 / d
  let h = d

  for (let i = 1; i <= maxIterations; i++) {
    m = i
    const m2 = 2 * m
    aa = m * (b - m) * x / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < epsilon) d = epsilon
    c = 1 + aa / c
    if (Math.abs(c) < epsilon) c = epsilon
    d = 1 / d
    h *= d * c
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < epsilon) d = epsilon
    c = 1 + aa / c
    if (Math.abs(c) < epsilon) c = epsilon
    d = 1 / d
    del = d * c
    h *= del
    if (Math.abs(del - 1) < epsilon) break
  }

  return h
}

/**
 * Calculate confidence interval for difference in means
 */
function calculateConfidenceInterval(
  sample1: number[],
  sample2: number[],
  confidence: number
): [number, number] {
  const n1 = sample1.length
  const n2 = sample2.length

  const mean1 = sample1.reduce((a, b) => a + b, 0) / n1
  const mean2 = sample2.reduce((a, b) => a + b, 0) / n2

  const var1 = calculateVariance(sample1, mean1)
  const var2 = calculateVariance(sample2, mean2)

  const se = Math.sqrt(var1 / n1 + var2 / n2)
  const diff = mean2 - mean1

  // Z-score for confidence level (approximation)
  const zScore = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645

  const margin = zScore * se

  return [diff - margin, diff + margin]
}

/**
 * Calculate statistical power
 * Power = probability of detecting an effect if it exists
 */
function calculatePower(
  n1: number,
  n2: number,
  effectSize: number
): number {
  if (n1 < 2 || n2 < 2 || effectSize === 0) return 0

  // Simplified power calculation
  const nHarmonic = 2 * n1 * n2 / (n1 + n2)
  const noncentrality = Math.abs(effectSize) * Math.sqrt(nHarmonic / 2)

  // Approximate power using normal distribution
  const criticalValue = 1.96 // For alpha = 0.05
  const power = 1 - normalCDF(criticalValue - noncentrality)

  return Math.max(0, Math.min(1, power))
}

/**
 * Estimate required sample size for desired power
 */
function estimateRequiredSamples(
  effectSize: number,
  desiredPower: number = 0.8
): number {
  if (effectSize === 0) return Infinity

  // Using simplified formula: n = 2 * ((z_alpha + z_beta) / d)^2
  const zAlpha = 1.96 // For alpha = 0.05
  const zBeta = desiredPower === 0.8 ? 0.84 : desiredPower === 0.9 ? 1.28 : 0.84

  const n = 2 * Math.pow((zAlpha + zBeta) / Math.abs(effectSize), 2)

  return Math.ceil(n)
}

/**
 * Check if experiment has reached statistical significance
 */
export async function checkSignificance(experimentId: string): Promise<{
  isSignificant: boolean
  pValue: number
  recommendation: string
  details: string
}> {
  const result = await getTestResult(experimentId)

  if (!result) {
    return {
      isSignificant: false,
      pValue: 1,
      recommendation: 'continue',
      details: 'Insufficient data for analysis',
    }
  }

  let details: string
  if (result.isSignificant) {
    const direction = result.effectSize > 0 ? 'better' : 'worse'
    details = `Treatment is significantly ${direction} (p=${result.pValue.toFixed(4)}, effect size=${result.effectSize.toFixed(3)})`
  } else {
    details = `No significant difference detected (p=${result.pValue.toFixed(4)})`
  }

  return {
    isSignificant: result.isSignificant,
    pValue: result.pValue,
    recommendation: result.recommendation,
    details,
  }
}
