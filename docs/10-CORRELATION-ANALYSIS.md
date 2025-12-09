# Topline: Correlation Analysis Specification

## Overview

This document specifies the correlation analysis system that connects lead measures (behaviors) to lag measures (KPIs). The core hypothesis: **specific behaviors, consistently executed, will predictably impact business outcomes.**

---

## Table of Contents

1. [Correlation Fundamentals](#1-correlation-fundamentals)
2. [Data Collection](#2-data-collection)
3. [Statistical Methods](#3-statistical-methods)
4. [Analysis Types](#4-analysis-types)
5. [Anomaly Detection](#5-anomaly-detection)
6. [Fraud Detection](#6-fraud-detection)
7. [AI Interpretation](#7-ai-interpretation)
8. [Visualization](#8-visualization)
9. [Actionable Insights](#9-actionable-insights)

---

## 1. Correlation Fundamentals

### 1.1 The Lead-Lag Relationship

```
LEAD MEASURES (Behaviors)              LAG MEASURES (KPIs)
─────────────────────────              ──────────────────────
Upsell Appetizer                 →     Average Check ↑
Suggest Wine Pairing             →     Revenue ↑
Table Touch                      →     Customer Rating ↑
Compare Vendor Prices            →     Cost of Sales % ↓
Energy Audit                     →     Utilities ↓
```

### 1.2 Hypothesis Testing

The system continuously tests hypotheses about behavior-KPI relationships:

| Hypothesis | Behavior | Expected KPI Impact |
|------------|----------|---------------------|
| H1 | Upsell Appetizer | Average Check +$2-4 |
| H2 | Suggest Wine Pairing | Average Check +$5-8 |
| H3 | Table Touch | Rating +0.1-0.2 |
| H4 | Vendor Price Comparison | CoS% -1-2% |
| H5 | Request Feedback | Rating correlation |

### 1.3 Correlation vs Causation

**Important Distinction:**
- Correlation shows relationship, not causation
- High correlation + logical mechanism = likely causal
- System flags correlations for human interpretation

```typescript
interface CorrelationResult {
  behaviorId: string
  kpiType: KpiType
  correlation: number      // -1 to 1
  pValue: number          // Statistical significance
  sampleSize: number      // Data points analyzed
  confidence: 'low' | 'medium' | 'high'
  interpretation: string  // AI-generated explanation
  causalityLikelihood: 'unlikely' | 'possible' | 'likely' | 'strong'
}
```

---

## 2. Data Collection

### 2.1 Behavior Data

```typescript
interface BehaviorDataPoint {
  date: string           // YYYY-MM-DD
  behaviorId: string
  totalCount: number     // Total behaviors logged
  verifiedCount: number  // Verified behaviors
  uniqueUsers: number    // Users who logged
  avgPerUser: number     // Average per active user
}

// Aggregation query
SELECT
  DATE(created_at) as date,
  behavior_id,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE verified = true) as verified_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*)::float / COUNT(DISTINCT user_id) as avg_per_user
FROM behavior_logs
WHERE created_at >= :start_date
  AND created_at < :end_date
  AND organization_id = :org_id
GROUP BY DATE(created_at), behavior_id
```

### 2.2 KPI Data

```typescript
interface KpiDataPoint {
  date: string
  kpiType: KpiType
  value: number
  locationId: string
}

// Daily KPI values
SELECT
  date,
  kpi_type,
  value,
  location_id
FROM daily_kpi_values
WHERE date >= :start_date
  AND date < :end_date
  AND organization_id = :org_id
```

### 2.3 Data Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Sample Size | 30 days | 90+ days |
| Data Points | 30 | 90+ |
| Missing Data | <20% | <5% |
| Outliers | Flagged | Handled |

---

## 3. Statistical Methods

### 3.1 Pearson Correlation Coefficient

Primary method for measuring linear relationships:

```typescript
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n < 3) return 0

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0)
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0)
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  )

  if (denominator === 0) return 0
  return numerator / denominator
}
```

### 3.2 Correlation Strength Interpretation

| Coefficient | Strength | Interpretation |
|-------------|----------|----------------|
| 0.9 - 1.0 | Very Strong | Almost certain relationship |
| 0.7 - 0.9 | Strong | High confidence |
| 0.5 - 0.7 | Moderate | Notable relationship |
| 0.3 - 0.5 | Weak | Some relationship |
| 0.0 - 0.3 | Very Weak | Minimal/no relationship |

*Same scale applies to negative correlations*

### 3.3 Statistical Significance (P-Value)

```typescript
function calculatePValue(r: number, n: number): number {
  // t-statistic for Pearson correlation
  const t = r * Math.sqrt((n - 2) / (1 - r * r))

  // Degrees of freedom
  const df = n - 2

  // Two-tailed p-value using t-distribution
  return 2 * (1 - tDistributionCDF(Math.abs(t), df))
}

// Significance thresholds
const SIGNIFICANCE_LEVELS = {
  verySignificant: 0.001,  // p < 0.001
  significant: 0.01,       // p < 0.01
  marginal: 0.05,          // p < 0.05
  notSignificant: 0.05     // p >= 0.05
}
```

### 3.4 Time-Lagged Correlation

Behaviors may take time to impact KPIs:

```typescript
function calculateLaggedCorrelation(
  behaviors: number[],
  kpis: number[],
  maxLag: number = 7
): { lag: number; correlation: number }[] {
  const results: { lag: number; correlation: number }[] = []

  for (let lag = 0; lag <= maxLag; lag++) {
    // Shift KPI data forward by lag days
    const shiftedBehaviors = behaviors.slice(0, behaviors.length - lag)
    const shiftedKpis = kpis.slice(lag)

    const correlation = calculatePearsonCorrelation(shiftedBehaviors, shiftedKpis)
    results.push({ lag, correlation })
  }

  return results
}

// Find optimal lag
function findOptimalLag(laggedResults: { lag: number; correlation: number }[]): number {
  return laggedResults.reduce(
    (best, current) =>
      Math.abs(current.correlation) > Math.abs(best.correlation) ? current : best,
    laggedResults[0]
  ).lag
}
```

### 3.5 Rolling Correlation

Track how correlation changes over time:

```typescript
function calculateRollingCorrelation(
  behaviors: number[],
  kpis: number[],
  windowSize: number = 30
): number[] {
  const results: number[] = []

  for (let i = windowSize; i <= behaviors.length; i++) {
    const windowBehaviors = behaviors.slice(i - windowSize, i)
    const windowKpis = kpis.slice(i - windowSize, i)
    results.push(calculatePearsonCorrelation(windowBehaviors, windowKpis))
  }

  return results
}
```

---

## 4. Analysis Types

### 4.1 Behavior-to-KPI Correlation

Direct correlation between behavior counts and KPI values:

```typescript
interface BehaviorKpiCorrelation {
  behaviorId: string
  behaviorName: string
  kpiType: KpiType
  kpiName: string

  // Correlation metrics
  correlation: number
  pValue: number
  sampleSize: number

  // Interpretation
  strength: 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong'
  direction: 'positive' | 'negative'
  significant: boolean

  // Time analysis
  optimalLag: number
  laggedCorrelation: number

  // Trend
  correlationTrend: 'strengthening' | 'stable' | 'weakening'
}

async function analyzeBehaviorKpiCorrelation(
  organizationId: string,
  behaviorId: string,
  kpiType: KpiType,
  startDate: Date,
  endDate: Date
): Promise<BehaviorKpiCorrelation> {
  // Fetch data
  const behaviorData = await getBehaviorTimeSeries(organizationId, behaviorId, startDate, endDate)
  const kpiData = await getKpiTimeSeries(organizationId, kpiType, startDate, endDate)

  // Align dates
  const { behaviors, kpis } = alignTimeSeries(behaviorData, kpiData)

  // Calculate correlation
  const correlation = calculatePearsonCorrelation(behaviors, kpis)
  const pValue = calculatePValue(correlation, behaviors.length)

  // Time-lagged analysis
  const laggedResults = calculateLaggedCorrelation(behaviors, kpis)
  const optimalLag = findOptimalLag(laggedResults)

  // Rolling trend
  const rollingCorrelations = calculateRollingCorrelation(behaviors, kpis)
  const correlationTrend = determineCorrelationTrend(rollingCorrelations)

  return {
    behaviorId,
    behaviorName: await getBehaviorName(behaviorId),
    kpiType,
    kpiName: getKpiName(kpiType),
    correlation,
    pValue,
    sampleSize: behaviors.length,
    strength: interpretStrength(correlation),
    direction: correlation >= 0 ? 'positive' : 'negative',
    significant: pValue < 0.05,
    optimalLag,
    laggedCorrelation: laggedResults[optimalLag].correlation,
    correlationTrend,
  }
}
```

### 4.2 User Performance Analysis

Correlate individual user behavior patterns with KPI contributions:

```typescript
interface UserPerformanceCorrelation {
  userId: string
  userName: string

  // Behavior metrics
  behaviorCount: number
  verificationRate: number
  consistencyScore: number  // Standard deviation of daily counts

  // KPI attribution (where measurable)
  avgCheckAttribution: number  // If receipt scanning enabled
  estimatedRevenueImpact: number

  // Correlation with team KPIs
  behaviorKpiCorrelation: number
  isHighPerformer: boolean
  isAnomaly: boolean
  anomalyType?: 'high_behaviors_low_kpi' | 'low_behaviors_high_kpi'
}

async function analyzeUserPerformance(
  organizationId: string,
  userId: string,
  period: { start: Date; end: Date }
): Promise<UserPerformanceCorrelation> {
  const userBehaviors = await getUserBehaviorData(userId, period)
  const teamKpis = await getTeamKpiData(organizationId, period)

  // Calculate user's behavior pattern
  const dailyCounts = groupByDate(userBehaviors)
  const avgDaily = mean(dailyCounts)
  const stdDev = standardDeviation(dailyCounts)
  const consistencyScore = 1 - (stdDev / avgDaily) // Higher = more consistent

  // Correlate user's working days with team KPIs
  const userWorkingDays = Object.keys(dailyCounts)
  const kpiBehaviorPairs = userWorkingDays.map(date => ({
    behavior: dailyCounts[date],
    kpi: teamKpis[date],
  })).filter(p => p.kpi !== undefined)

  const correlation = calculatePearsonCorrelation(
    kpiBehaviorPairs.map(p => p.behavior),
    kpiBehaviorPairs.map(p => p.kpi)
  )

  // Detect anomalies
  const isAnomaly = detectUserAnomaly(userBehaviors, teamKpis)

  return {
    userId,
    userName: await getUserName(userId),
    behaviorCount: userBehaviors.length,
    verificationRate: userBehaviors.filter(b => b.verified).length / userBehaviors.length,
    consistencyScore,
    avgCheckAttribution: await calculateUserAvgCheckImpact(userId, period),
    estimatedRevenueImpact: await estimateRevenueImpact(userId, period),
    behaviorKpiCorrelation: correlation,
    isHighPerformer: correlation > 0.5 && userBehaviors.length > avgTeamBehaviors,
    isAnomaly: isAnomaly.detected,
    anomalyType: isAnomaly.type,
  }
}
```

### 4.3 Multi-Behavior Analysis

Analyze combinations of behaviors:

```typescript
interface MultiBehaviorAnalysis {
  behaviorCombination: string[]  // Behavior IDs
  kpiType: KpiType
  combinedCorrelation: number
  synergySCore: number  // Whether combination is better than individual
  insights: string[]
}

async function analyzeMultiBehaviorImpact(
  organizationId: string,
  behaviorIds: string[],
  kpiType: KpiType,
  period: { start: Date; end: Date }
): Promise<MultiBehaviorAnalysis> {
  // Get individual correlations
  const individualCorrelations = await Promise.all(
    behaviorIds.map(id => analyzeBehaviorKpiCorrelation(organizationId, id, kpiType, period.start, period.end))
  )

  // Get combined behavior counts per day
  const combinedDaily = await getCombinedBehaviorCounts(organizationId, behaviorIds, period)
  const kpiDaily = await getKpiTimeSeries(organizationId, kpiType, period.start, period.end)

  const { behaviors, kpis } = alignTimeSeries(combinedDaily, kpiDaily)
  const combinedCorrelation = calculatePearsonCorrelation(behaviors, kpis)

  // Calculate synergy
  const avgIndividualCorrelation = mean(individualCorrelations.map(c => c.correlation))
  const synergyScore = combinedCorrelation - avgIndividualCorrelation

  return {
    behaviorCombination: behaviorIds,
    kpiType,
    combinedCorrelation,
    synergyScore,
    insights: generateMultiBehaviorInsights(individualCorrelations, combinedCorrelation, synergyScore),
  }
}
```

---

## 5. Anomaly Detection

### 5.1 Statistical Anomalies

```typescript
interface StatisticalAnomaly {
  date: string
  type: 'behavior' | 'kpi'
  metric: string
  value: number
  expectedValue: number
  zScore: number
  severity: 'minor' | 'moderate' | 'severe'
}

function detectStatisticalAnomalies(
  timeSeries: number[],
  windowSize: number = 30
): StatisticalAnomaly[] {
  const anomalies: StatisticalAnomaly[] = []

  for (let i = windowSize; i < timeSeries.length; i++) {
    const window = timeSeries.slice(i - windowSize, i)
    const windowMean = mean(window)
    const windowStd = standardDeviation(window)

    const currentValue = timeSeries[i]
    const zScore = (currentValue - windowMean) / windowStd

    if (Math.abs(zScore) > 2) {
      anomalies.push({
        date: dates[i],
        type: 'metric',
        metric: metricName,
        value: currentValue,
        expectedValue: windowMean,
        zScore,
        severity: Math.abs(zScore) > 3 ? 'severe' : Math.abs(zScore) > 2.5 ? 'moderate' : 'minor',
      })
    }
  }

  return anomalies
}
```

### 5.2 Pattern Change Detection

```typescript
interface PatternChange {
  startDate: string
  endDate: string
  metric: string
  previousPattern: {
    mean: number
    trend: 'increasing' | 'stable' | 'decreasing'
  }
  newPattern: {
    mean: number
    trend: 'increasing' | 'stable' | 'decreasing'
  }
  changeSignificance: number  // p-value of change
  possibleCauses: string[]
}

function detectPatternChanges(
  timeSeries: number[],
  dates: string[],
  minSegmentLength: number = 14
): PatternChange[] {
  // Use change point detection algorithm
  const changePoints = detectChangePoints(timeSeries, minSegmentLength)

  return changePoints.map(cp => ({
    startDate: dates[cp.index],
    endDate: dates[Math.min(cp.index + minSegmentLength, dates.length - 1)],
    metric: metricName,
    previousPattern: analyzePattern(timeSeries.slice(cp.index - minSegmentLength, cp.index)),
    newPattern: analyzePattern(timeSeries.slice(cp.index, cp.index + minSegmentLength)),
    changeSignificance: cp.pValue,
    possibleCauses: [],  // AI will fill this
  }))
}
```

---

## 6. Fraud Detection

### 6.1 Behavior-KPI Mismatch

High behavior counts but no corresponding KPI improvement:

```typescript
interface FraudIndicator {
  userId: string
  userName: string
  indicatorType: 'behavior_kpi_mismatch' | 'pattern_anomaly' | 'verification_gaming'
  confidence: number  // 0-1
  evidence: {
    behaviorCount: number
    expectedKpiImpact: number
    actualKpiImpact: number
    deviationFromPeers: number
  }
  recommendation: string
}

async function detectBehaviorKpiMismatch(
  organizationId: string,
  period: { start: Date; end: Date }
): Promise<FraudIndicator[]> {
  const indicators: FraudIndicator[] = []

  // Get all users' behavior-KPI data
  const users = await getUsersWithBehaviorData(organizationId, period)

  for (const user of users) {
    // Calculate expected KPI impact based on behavior count
    const expectedImpact = calculateExpectedKpiImpact(user.behaviors)

    // Get actual KPI impact (from receipts or attribution)
    const actualImpact = user.measuredKpiContribution

    // Compare to peer performance
    const peerAvgImpactPerBehavior = await getPeerAverageImpact(organizationId, period)
    const userImpactPerBehavior = actualImpact / user.behaviorCount
    const deviationFromPeers = (userImpactPerBehavior - peerAvgImpactPerBehavior) / peerAvgImpactPerBehavior

    // Flag if significantly below peers with high behavior count
    if (user.behaviorCount > avgBehaviorCount && deviationFromPeers < -0.3) {
      indicators.push({
        userId: user.id,
        userName: user.name,
        indicatorType: 'behavior_kpi_mismatch',
        confidence: Math.min(Math.abs(deviationFromPeers), 1),
        evidence: {
          behaviorCount: user.behaviorCount,
          expectedKpiImpact: expectedImpact,
          actualKpiImpact: actualImpact,
          deviationFromPeers,
        },
        recommendation: 'Review behavior verification process and observe user technique',
      })
    }
  }

  return indicators
}
```

### 6.2 Pattern-Based Fraud Detection

```typescript
interface PatternFraudIndicator {
  userId: string
  pattern: 'clock_in_burst' | 'end_of_day_spike' | 'suspicious_regularity' | 'peer_correlation'
  confidence: number
  description: string
  evidence: Record<string, unknown>
}

function detectSuspiciousPatterns(
  userBehaviors: BehaviorLog[],
  period: { start: Date; end: Date }
): PatternFraudIndicator[] {
  const indicators: PatternFraudIndicator[] = []

  // Pattern 1: Behaviors clustered at shift start/end
  const timeDistribution = analyzeTimeDistribution(userBehaviors)
  if (timeDistribution.clockInBurstRatio > 0.5) {
    indicators.push({
      userId: userBehaviors[0].userId,
      pattern: 'clock_in_burst',
      confidence: timeDistribution.clockInBurstRatio,
      description: 'Most behaviors logged within first 30 minutes of shift',
      evidence: { distribution: timeDistribution },
    })
  }

  // Pattern 2: Suspiciously regular intervals
  const intervals = calculateBehaviorIntervals(userBehaviors)
  const intervalVariance = variance(intervals)
  if (intervalVariance < LOW_VARIANCE_THRESHOLD && userBehaviors.length > 10) {
    indicators.push({
      userId: userBehaviors[0].userId,
      pattern: 'suspicious_regularity',
      confidence: 1 - (intervalVariance / EXPECTED_VARIANCE),
      description: 'Behaviors logged at unusually regular intervals',
      evidence: { avgInterval: mean(intervals), variance: intervalVariance },
    })
  }

  // Pattern 3: Perfect correlation with another user (copying)
  const peerCorrelations = await calculatePeerCorrelations(userBehaviors)
  const highCorrelation = peerCorrelations.find(c => c.correlation > 0.95)
  if (highCorrelation) {
    indicators.push({
      userId: userBehaviors[0].userId,
      pattern: 'peer_correlation',
      confidence: highCorrelation.correlation,
      description: `Behavior pattern almost identical to ${highCorrelation.peerName}`,
      evidence: { peerId: highCorrelation.peerId, correlation: highCorrelation.correlation },
    })
  }

  return indicators
}
```

### 6.3 Fraud Alert System

```typescript
interface FraudAlert {
  id: string
  userId: string
  userName: string
  alertType: 'warning' | 'investigation_needed' | 'critical'
  indicators: FraudIndicator[]
  totalConfidence: number
  suggestedActions: string[]
  status: 'new' | 'investigating' | 'resolved' | 'dismissed'
  createdAt: Date
}

async function generateFraudAlerts(
  organizationId: string,
  period: { start: Date; end: Date }
): Promise<FraudAlert[]> {
  const mismatchIndicators = await detectBehaviorKpiMismatch(organizationId, period)
  const patternIndicators = await detectSuspiciousPatterns(organizationId, period)

  // Group indicators by user
  const userIndicators = groupBy([...mismatchIndicators, ...patternIndicators], 'userId')

  const alerts: FraudAlert[] = []

  for (const [userId, indicators] of Object.entries(userIndicators)) {
    const totalConfidence = mean(indicators.map(i => i.confidence))

    if (totalConfidence > 0.3) {  // Only alert if reasonable confidence
      alerts.push({
        id: generateId(),
        userId,
        userName: indicators[0].userName,
        alertType: totalConfidence > 0.8 ? 'critical' :
                   totalConfidence > 0.6 ? 'investigation_needed' : 'warning',
        indicators,
        totalConfidence,
        suggestedActions: generateSuggestedActions(indicators),
        status: 'new',
        createdAt: new Date(),
      })
    }
  }

  return alerts.sort((a, b) => b.totalConfidence - a.totalConfidence)
}
```

---

## 7. AI Interpretation

### 7.1 Correlation Interpretation

```typescript
const CORRELATION_INTERPRETATION_PROMPT = `
You are an analytics expert interpreting behavior-KPI correlations for a business.

Given:
- Behavior: {{behaviorName}}
- KPI: {{kpiName}}
- Correlation coefficient: {{correlation}}
- P-value: {{pValue}}
- Sample size: {{sampleSize}} days
- Optimal lag: {{optimalLag}} days

Generate:
1. A plain-English interpretation of the correlation (2-3 sentences)
2. The likely causal mechanism (if correlation is significant)
3. Confidence level in the relationship
4. Recommended actions based on this insight

Respond in JSON format:
{
  "interpretation": "string",
  "causalMechanism": "string | null",
  "confidenceLevel": "low | medium | high",
  "recommendations": ["string"]
}
`

async function interpretCorrelation(
  correlation: BehaviorKpiCorrelation
): Promise<CorrelationInterpretation> {
  const prompt = CORRELATION_INTERPRETATION_PROMPT
    .replace('{{behaviorName}}', correlation.behaviorName)
    .replace('{{kpiName}}', correlation.kpiName)
    .replace('{{correlation}}', correlation.correlation.toFixed(3))
    .replace('{{pValue}}', correlation.pValue.toFixed(4))
    .replace('{{sampleSize}}', correlation.sampleSize.toString())
    .replace('{{optimalLag}}', correlation.optimalLag.toString())

  const response = await aiClient.generateStructured(
    prompt,
    correlationInterpretationSchema
  )

  return response
}
```

### 7.2 Anomaly Explanation

```typescript
const ANOMALY_EXPLANATION_PROMPT = `
Analyze this anomaly in business metrics:

Date: {{date}}
Metric: {{metricName}}
Actual Value: {{actualValue}}
Expected Value: {{expectedValue}}
Deviation: {{deviation}}%

Context:
- Day of week: {{dayOfWeek}}
- Recent events: {{recentEvents}}
- Weather: {{weather}}
- Comparable dates: {{comparableDates}}

Provide:
1. Most likely explanation for the anomaly
2. Whether this is concerning or expected
3. Recommended follow-up actions

Respond in JSON format:
{
  "explanation": "string",
  "concerning": boolean,
  "followUpActions": ["string"]
}
`
```

### 7.3 Weekly Analysis Summary

```typescript
const WEEKLY_ANALYSIS_PROMPT = `
Generate a weekly correlation analysis summary for {{organizationName}}.

Data from {{startDate}} to {{endDate}}:

Top Performing Correlations:
{{topCorrelations}}

New/Changing Patterns:
{{patternChanges}}

Anomalies Detected:
{{anomalies}}

Fraud Indicators:
{{fraudIndicators}}

Generate:
1. Executive summary (2-3 sentences)
2. Key findings (3-5 bullet points)
3. Areas of concern
4. Recommended actions for next week
5. Team recognition (if appropriate)

Focus on actionable insights the owner can use.
`
```

---

## 8. Visualization

### 8.1 Correlation Matrix

```typescript
interface CorrelationMatrixData {
  behaviors: string[]
  kpis: string[]
  matrix: number[][]  // behaviors × kpis
  significanceMatrix: boolean[][]
}

function generateCorrelationMatrix(
  correlations: BehaviorKpiCorrelation[]
): CorrelationMatrixData {
  const behaviors = [...new Set(correlations.map(c => c.behaviorName))]
  const kpis = [...new Set(correlations.map(c => c.kpiName))]

  const matrix = behaviors.map(b =>
    kpis.map(k => {
      const corr = correlations.find(c => c.behaviorName === b && c.kpiName === k)
      return corr?.correlation ?? 0
    })
  )

  const significanceMatrix = behaviors.map(b =>
    kpis.map(k => {
      const corr = correlations.find(c => c.behaviorName === b && c.kpiName === k)
      return corr?.significant ?? false
    })
  )

  return { behaviors, kpis, matrix, significanceMatrix }
}
```

### 8.2 Scatter Plot Data

```typescript
interface ScatterPlotData {
  behaviorName: string
  kpiName: string
  points: Array<{
    x: number  // Behavior count
    y: number  // KPI value
    date: string
    label: string
  }>
  trendLine: {
    slope: number
    intercept: number
  }
  correlation: number
}
```

### 8.3 Time Series Overlay

```typescript
interface TimeSeriesOverlay {
  dates: string[]
  series: Array<{
    name: string
    type: 'behavior' | 'kpi'
    values: number[]
    color: string
    yAxis: 'left' | 'right'
  }>
  correlationLine?: {
    values: number[]  // Rolling correlation
  }
}
```

---

## 9. Actionable Insights

### 9.1 Insight Categories

```typescript
type InsightCategory =
  | 'strong_correlation'      // Behavior strongly impacts KPI
  | 'improving_correlation'   // Correlation getting stronger
  | 'declining_correlation'   // Correlation weakening
  | 'untapped_potential'      // High correlation but low adoption
  | 'diminishing_returns'     // Too many behaviors, flat KPI
  | 'fraud_warning'           // Suspicious pattern
  | 'team_recognition'        // Someone doing well
  | 'training_needed'         // Behavior not impacting KPI

interface ActionableInsight {
  category: InsightCategory
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  data: Record<string, unknown>
  actions: Array<{
    type: 'briefing_topic' | 'individual_coaching' | 'policy_change' | 'investigation' | 'recognition'
    description: string
    targetUser?: string
    targetBehavior?: string
  }>
}
```

### 9.2 Insight Generation

```typescript
async function generateInsights(
  organizationId: string,
  period: { start: Date; end: Date }
): Promise<ActionableInsight[]> {
  const insights: ActionableInsight[] = []

  // Analyze all correlations
  const correlations = await getAllCorrelations(organizationId, period)

  // Strong correlations
  correlations
    .filter(c => c.correlation > 0.7 && c.significant)
    .forEach(c => {
      insights.push({
        category: 'strong_correlation',
        priority: 'high',
        title: `${c.behaviorName} strongly impacts ${c.kpiName}`,
        description: `Days with more ${c.behaviorName} behaviors show ${Math.round(c.correlation * 100)}% correlation with higher ${c.kpiName}.`,
        data: { correlation: c },
        actions: [
          {
            type: 'briefing_topic',
            description: `Emphasize ${c.behaviorName} in daily briefings`,
            targetBehavior: c.behaviorId,
          },
        ],
      })
    })

  // Untapped potential (high correlation but low adoption)
  const adoptionRates = await getBehaviorAdoptionRates(organizationId, period)
  correlations
    .filter(c => c.correlation > 0.5 && adoptionRates[c.behaviorId] < 0.3)
    .forEach(c => {
      insights.push({
        category: 'untapped_potential',
        priority: 'high',
        title: `Opportunity: ${c.behaviorName}`,
        description: `${c.behaviorName} shows strong KPI impact but only ${Math.round(adoptionRates[c.behaviorId] * 100)}% adoption rate.`,
        data: { correlation: c, adoptionRate: adoptionRates[c.behaviorId] },
        actions: [
          {
            type: 'briefing_topic',
            description: `Training on ${c.behaviorName} technique`,
          },
          {
            type: 'policy_change',
            description: `Increase target for ${c.behaviorName}`,
          },
        ],
      })
    })

  // Fraud warnings
  const fraudAlerts = await generateFraudAlerts(organizationId, period)
  fraudAlerts
    .filter(a => a.alertType !== 'warning')
    .forEach(a => {
      insights.push({
        category: 'fraud_warning',
        priority: 'high',
        title: `Review needed: ${a.userName}`,
        description: `Suspicious behavior pattern detected with ${Math.round(a.totalConfidence * 100)}% confidence.`,
        data: { alert: a },
        actions: [
          {
            type: 'investigation',
            description: `Review ${a.userName}'s behavior logs and verification`,
            targetUser: a.userId,
          },
        ],
      })
    })

  // Team recognition
  const topPerformers = await getTopCorrelatedPerformers(organizationId, period)
  topPerformers.slice(0, 3).forEach(p => {
    insights.push({
      category: 'team_recognition',
      priority: 'medium',
      title: `Top performer: ${p.userName}`,
      description: `${p.userName} shows ${Math.round(p.correlation * 100)}% correlation between behaviors and KPI impact.`,
      data: { performer: p },
      actions: [
        {
          type: 'recognition',
          description: `Recognize ${p.userName} in briefing`,
          targetUser: p.userId,
        },
      ],
    })
  })

  return insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}
```

### 9.3 Report Output

```typescript
interface CorrelationReport {
  period: { start: Date; end: Date }
  organization: { id: string; name: string }

  // Summary metrics
  summary: {
    totalCorrelationsAnalyzed: number
    strongCorrelations: number
    anomaliesDetected: number
    fraudAlertsGenerated: number
  }

  // Detailed findings
  correlations: BehaviorKpiCorrelation[]
  anomalies: StatisticalAnomaly[]
  fraudAlerts: FraudAlert[]
  insights: ActionableInsight[]

  // Visualizations
  visualizations: {
    correlationMatrix: CorrelationMatrixData
    topCorrelationCharts: ScatterPlotData[]
    trendCharts: TimeSeriesOverlay[]
  }

  // AI summary
  aiSummary: {
    executiveSummary: string
    keyFindings: string[]
    recommendations: string[]
  }

  generatedAt: Date
}
```

---

## Appendix A: Statistical Formulas

### Pearson Correlation
```
r = Σ[(xi - x̄)(yi - ȳ)] / √[Σ(xi - x̄)² × Σ(yi - ȳ)²]
```

### T-Statistic for Correlation
```
t = r × √[(n-2) / (1-r²)]
```

### Z-Score for Anomaly Detection
```
z = (x - μ) / σ
```

### Standard Deviation
```
σ = √[Σ(xi - μ)² / n]
```

---

## Appendix B: Minimum Sample Sizes

| Analysis Type | Minimum n | Recommended n |
|---------------|-----------|---------------|
| Basic correlation | 30 | 90+ |
| Time-lagged | 45 | 120+ |
| Rolling window | 60 | 180+ |
| User comparison | 14/user | 30/user |
| Fraud detection | 30 | 60+ |
