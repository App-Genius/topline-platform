# Topline: Calculation Engine Specification

## Overview

This document specifies all calculations, formulas, algorithms, and business logic that power the Topline system. It serves as the source of truth for implementing the calculation layer.

---

## Table of Contents

1. [Benchmark Calculations](#1-benchmark-calculations)
2. [KPI Calculations](#2-kpi-calculations)
3. [Adoption Rate Calculations](#3-adoption-rate-calculations)
4. [Variance Calculations](#4-variance-calculations)
5. [Game State Logic](#5-game-state-logic)
6. [Correlation Analysis](#6-correlation-analysis)
7. [Leaderboard Rankings](#7-leaderboard-rankings)
8. [Scoring & Points System](#8-scoring--points-system)
9. [Fraud Detection Algorithms](#9-fraud-detection-algorithms)
10. [Report Aggregations](#10-report-aggregations)

---

## 1. Benchmark Calculations

### 1.1 Daily Revenue Benchmark

**Purpose**: Establish the baseline daily revenue to compare against.

**Formula**:
```
Daily Revenue Benchmark = Annual Revenue / Days Open Per Year
                        = Annual Revenue / (Days Open Per Week × 52)
```

**Example**:
```
Annual Revenue: $600,000
Days Open Per Week: 6
Days Open Per Year: 6 × 52 = 312

Daily Revenue Benchmark = $600,000 / 312 = $1,923.08
```

**Implementation**:
```typescript
function calculateDailyRevenueBenchmark(
  annualRevenue: number,
  daysOpenPerWeek: number
): number {
  const daysOpenPerYear = daysOpenPerWeek * 52;
  return annualRevenue / daysOpenPerYear;
}
```

**Edge Cases**:
- If `daysOpenPerWeek` is 0, return 0 (business not operating)
- Round to 2 decimal places for display
- Store as float in database for calculations

---

### 1.2 Average Check Benchmark

**Purpose**: Establish baseline average check from historical data.

**Formula**:
```
Average Check Benchmark = Total Historical Revenue / Total Historical Covers
```

**If No Historical Data (Estimate by Industry)**:
| Industry | Estimated Avg Check |
|----------|---------------------|
| Fine Dining | $85.00 |
| Casual Dining | $35.00 |
| Fast Casual | $15.00 |
| Bar/Nightclub | $25.00 |
| Retail | $45.00 |
| Gas Station | $12.00 |

**Implementation**:
```typescript
function calculateAverageCheckBenchmark(
  totalRevenue: number,
  totalCovers: number,
  industry?: Industry
): number {
  if (totalCovers > 0) {
    return totalRevenue / totalCovers;
  }

  // Fallback to industry estimate
  const industryEstimates: Record<Industry, number> = {
    FINE_DINING: 85.00,
    CASUAL_DINING: 35.00,
    FAST_CASUAL: 15.00,
    BAR_NIGHTCLUB: 25.00,
    RETAIL: 45.00,
    GAS_STATION: 12.00,
    HOSPITALITY: 50.00,
    OTHER: 30.00
  };

  return industryEstimates[industry ?? 'OTHER'];
}
```

---

### 1.3 Monthly Revenue Benchmark

**Purpose**: Compare current month to same month last year.

**Formula**:
```
Monthly Revenue Benchmark = Same Month Last Year's Revenue
```

**Alternative (if no same-month data)**:
```
Monthly Revenue Benchmark = Daily Benchmark × Days in Month
                          = (Annual Revenue / Days Open Per Year) × Days Open This Month
```

**Implementation**:
```typescript
function getMonthlyRevenueBenchmark(
  organizationId: string,
  targetMonth: Date
): number {
  const sameMonthLastYear = new Date(
    targetMonth.getFullYear() - 1,
    targetMonth.getMonth(),
    1
  );

  const lastYearData = getDailyEntriesForMonth(organizationId, sameMonthLastYear);

  if (lastYearData.length > 0) {
    return lastYearData.reduce((sum, entry) => sum + entry.totalRevenue, 0);
  }

  // Fallback: use daily benchmark × operating days
  const dailyBenchmark = getDailyRevenueBenchmark(organizationId);
  const daysOpenThisMonth = getOperatingDaysInMonth(organizationId, targetMonth);
  return dailyBenchmark * daysOpenThisMonth;
}
```

---

## 2. KPI Calculations

### 2.1 Average Check

**Formula**:
```
Average Check = Total Revenue / Total Covers
```

**Scope Options**:
- Per transaction (single table/check)
- Per shift
- Per day
- Per week
- Per month
- Per staff member

**Implementation**:
```typescript
interface AverageCheckParams {
  revenue: number;
  covers: number;
}

function calculateAverageCheck({ revenue, covers }: AverageCheckParams): number {
  if (covers === 0) return 0;
  return Math.round((revenue / covers) * 100) / 100; // Round to cents
}

// Per Staff Member
function calculateStaffAverageCheck(
  userId: string,
  startDate: Date,
  endDate: Date
): number {
  const entries = getStaffDailyEntries(userId, startDate, endDate);
  const totalRevenue = entries.reduce((sum, e) => sum + e.revenue, 0);
  const totalCovers = entries.reduce((sum, e) => sum + e.covers, 0);
  return calculateAverageCheck({ revenue: totalRevenue, covers: totalCovers });
}
```

**Display**:
- Always show with 2 decimal places: `$52.00`
- Show variance from benchmark: `$52.00 (+$3.00 vs baseline)`

---

### 2.2 Covers (Guest Count)

**Formula**:
```
Total Covers = Sum of all guests served
```

**Notes**:
- For restaurants: Number of people who dined
- For retail: Number of transactions
- For gas stations: Number of customers

**Implementation**:
```typescript
function calculateTotalCovers(
  entries: DailyEntry[],
  period: 'day' | 'week' | 'month'
): number {
  return entries
    .filter(e => isInPeriod(e.date, period))
    .reduce((sum, e) => sum + e.totalCovers, 0);
}
```

---

### 2.3 Cost of Sales Percentage

**Formula**:
```
Cost of Sales % = (Cost of Goods Sold / Total Revenue) × 100
```

**Components**:
- Food Cost (for restaurants)
- Beverage Cost (for restaurants)
- Product Cost (for retail)

**Implementation**:
```typescript
function calculateCostOfSalesPercent(
  costOfGoodsSold: number,
  totalRevenue: number
): number {
  if (totalRevenue === 0) return 0;
  return Math.round((costOfGoodsSold / totalRevenue) * 10000) / 100;
}

// Example
// COGS: $32,000, Revenue: $100,000
// CoS% = (32000 / 100000) × 100 = 32%
```

**Thresholds** (Restaurant):
| Status | Range |
|--------|-------|
| Good | < 30% |
| Warning | 30-35% |
| Critical | > 35% |

---

### 2.4 Gross Operating Profit (GOP)

**Formula**:
```
GOP = Revenue - COGS - Labor - Controllable Expenses

GOP % = (GOP / Revenue) × 100
```

**Controllable Expenses Include**:
- Paper supplies
- China/glassware
- Utensils
- Cleaning supplies
- Minor maintenance
- Marketing (variable)

**Implementation**:
```typescript
interface GOPParams {
  revenue: number;
  cogs: number;
  labor: number;
  controllables: number;
}

function calculateGOP({ revenue, cogs, labor, controllables }: GOPParams): {
  gop: number;
  gopPercent: number;
} {
  const gop = revenue - cogs - labor - controllables;
  const gopPercent = revenue > 0 ? (gop / revenue) * 100 : 0;

  return {
    gop: Math.round(gop * 100) / 100,
    gopPercent: Math.round(gopPercent * 10) / 10
  };
}
```

**Benchmarks**:
| Industry | Target GOP % |
|----------|--------------|
| Full-Service Restaurant | 15-20% |
| Fast Casual | 12-18% |
| Hotel F&B | 35-45% |
| Retail | 15-25% |

---

### 2.5 Labor Cost Percentage

**Formula**:
```
Labor % = (Total Labor Cost / Total Revenue) × 100
```

**Implementation**:
```typescript
function calculateLaborPercent(
  totalLaborCost: number,
  totalRevenue: number
): number {
  if (totalRevenue === 0) return 0;
  return Math.round((totalLaborCost / totalRevenue) * 10000) / 100;
}
```

**Thresholds**:
| Status | Range |
|--------|-------|
| Good | < 28% |
| Warning | 28-32% |
| Critical | > 32% |

---

### 2.6 Prime Cost

**Formula**:
```
Prime Cost = COGS + Labor
Prime Cost % = ((COGS + Labor) / Revenue) × 100
```

**Target**: < 65% of revenue

**Implementation**:
```typescript
function calculatePrimeCost(
  cogs: number,
  labor: number,
  revenue: number
): { primeCost: number; primeCostPercent: number } {
  const primeCost = cogs + labor;
  const primeCostPercent = revenue > 0 ? (primeCost / revenue) * 100 : 0;

  return {
    primeCost,
    primeCostPercent: Math.round(primeCostPercent * 10) / 10
  };
}
```

---

### 2.7 Budget Variance

**Formula**:
```
Variance = Actual - Budget
Variance % = ((Actual - Budget) / Budget) × 100
```

**Implementation**:
```typescript
function calculateVariance(
  actual: number,
  budget: number
): { variance: number; variancePercent: number; status: 'under' | 'over' | 'on' } {
  const variance = actual - budget;
  const variancePercent = budget !== 0 ? (variance / budget) * 100 : 0;

  let status: 'under' | 'over' | 'on';
  if (Math.abs(variancePercent) < 2) {
    status = 'on';
  } else if (variance > 0) {
    status = 'over';
  } else {
    status = 'under';
  }

  return {
    variance: Math.round(variance * 100) / 100,
    variancePercent: Math.round(variancePercent * 10) / 10,
    status
  };
}
```

**Alert Thresholds**:
| Category | Warning | Critical |
|----------|---------|----------|
| Revenue (below budget) | -5% | -10% |
| Expenses (over budget) | +5% | +10% |

---

## 3. Adoption Rate Calculations

### 3.1 Organization-Wide Adoption Rate

**Formula**:
```
Adoption Rate = (Total Behaviors Logged / Total Expected Behaviors) × 100

Total Expected Behaviors = Σ (Active Staff × Behavior Target × Shifts Worked)
```

**Implementation**:
```typescript
interface AdoptionRateParams {
  organizationId: string;
  startDate: Date;
  endDate: Date;
}

async function calculateAdoptionRate({
  organizationId,
  startDate,
  endDate
}: AdoptionRateParams): Promise<number> {
  // Get all behavior logs in period
  const logs = await getBehaviorLogs({
    organizationId,
    startDate,
    endDate
  });

  // Calculate expected behaviors
  const activeUsers = await getActiveUsers(organizationId);
  const behaviors = await getActiveBehaviors(organizationId);

  let totalExpected = 0;

  for (const user of activeUsers) {
    const shiftsWorked = await getShiftsWorked(user.id, startDate, endDate);
    const userBehaviors = behaviors.filter(b =>
      b.roleIds.includes(user.roleId)
    );

    for (const behavior of userBehaviors) {
      const expectedCount = getExpectedCount(behavior, shiftsWorked);
      totalExpected += expectedCount;
    }
  }

  if (totalExpected === 0) return 100; // No expectations = 100%

  return Math.round((logs.length / totalExpected) * 10000) / 100;
}

function getExpectedCount(
  behavior: Behavior,
  shiftsOrDays: number
): number {
  switch (behavior.frequency) {
    case 'PER_SHIFT':
      return behavior.targetPerDay * shiftsOrDays;
    case 'PER_DAY':
      return behavior.targetPerDay * shiftsOrDays;
    case 'PER_WEEK':
      return behavior.targetPerDay * Math.ceil(shiftsOrDays / 7);
    case 'PER_MONTH':
      return behavior.targetPerDay * Math.ceil(shiftsOrDays / 30);
    default:
      return 0;
  }
}
```

**Thresholds**:
| Status | Range |
|--------|-------|
| Excellent | ≥ 95% |
| Good | 90-95% |
| Warning | 80-90% |
| Poor | < 80% |

---

### 3.2 Per-User Adoption Rate

**Formula**:
```
User Adoption Rate = (User's Behaviors Logged / User's Expected Behaviors) × 100
```

**Implementation**:
```typescript
async function calculateUserAdoptionRate(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const user = await getUser(userId);
  const logs = await getBehaviorLogs({ userId, startDate, endDate });
  const behaviors = await getBehaviorsForRole(user.roleId);
  const shiftsWorked = await getShiftsWorked(userId, startDate, endDate);

  let totalExpected = 0;
  for (const behavior of behaviors) {
    totalExpected += getExpectedCount(behavior, shiftsWorked);
  }

  if (totalExpected === 0) return 100;
  return Math.round((logs.length / totalExpected) * 10000) / 100;
}
```

---

### 3.3 Per-Behavior Adoption Rate

**Formula**:
```
Behavior Adoption Rate = (Times Behavior Logged / Expected Times) × 100
```

**Implementation**:
```typescript
async function calculateBehaviorAdoptionRate(
  behaviorId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const behavior = await getBehavior(behaviorId);
  const logs = await getBehaviorLogs({ behaviorId, startDate, endDate });

  // Get users who should be doing this behavior
  const users = await getUsersByRoles(behavior.roleIds);
  let totalExpected = 0;

  for (const user of users) {
    const shiftsWorked = await getShiftsWorked(user.id, startDate, endDate);
    totalExpected += getExpectedCount(behavior, shiftsWorked);
  }

  if (totalExpected === 0) return 100;
  return Math.round((logs.length / totalExpected) * 10000) / 100;
}
```

---

## 4. Variance Calculations

### 4.1 Period-Over-Period Variance

**Formulas**:
```
Week over Week = (This Week - Last Week) / Last Week × 100
Month over Month = (This Month - Last Month) / Last Month × 100
Year over Year = (This Period - Same Period Last Year) / Same Period Last Year × 100
```

**Implementation**:
```typescript
interface PeriodVariance {
  currentValue: number;
  previousValue: number;
  absoluteChange: number;
  percentChange: number;
  trend: 'up' | 'down' | 'flat';
}

function calculatePeriodVariance(
  currentValue: number,
  previousValue: number
): PeriodVariance {
  const absoluteChange = currentValue - previousValue;
  const percentChange = previousValue !== 0
    ? (absoluteChange / previousValue) * 100
    : 0;

  let trend: 'up' | 'down' | 'flat';
  if (Math.abs(percentChange) < 1) {
    trend = 'flat';
  } else if (percentChange > 0) {
    trend = 'up';
  } else {
    trend = 'down';
  }

  return {
    currentValue,
    previousValue,
    absoluteChange: Math.round(absoluteChange * 100) / 100,
    percentChange: Math.round(percentChange * 10) / 10,
    trend
  };
}
```

---

### 4.2 Versus Benchmark Variance

**Formula**:
```
Benchmark Variance = (Actual - Benchmark) / Benchmark × 100
```

**Implementation**:
```typescript
function calculateBenchmarkVariance(
  actual: number,
  benchmark: number
): { variance: number; percentVariance: number } {
  const variance = actual - benchmark;
  const percentVariance = benchmark !== 0
    ? (variance / benchmark) * 100
    : 0;

  return {
    variance: Math.round(variance * 100) / 100,
    percentVariance: Math.round(percentVariance * 10) / 10
  };
}
```

---

## 5. Game State Logic

### 5.1 Daily Game State

**Purpose**: Determine if business is winning/losing today.

**Formula**:
```
Progress to Daily Target = (Current Revenue / Daily Target) × 100

Game State Rules:
- CELEBRATING: Progress ≥ 100%
- WINNING: Progress ≥ 95%
- NEUTRAL: Progress ≥ 85%
- LOSING: Progress < 85%

Time-Adjusted Rules (mid-shift):
- Adjust target by time of day
- 50% of day passed → expect 50% of revenue
```

**Implementation**:
```typescript
type GameState = 'celebrating' | 'winning' | 'neutral' | 'losing';

interface GameStateParams {
  currentRevenue: number;
  dailyTarget: number;
  currentHour: number;  // 0-23
  openingHour: number;  // e.g., 11
  closingHour: number;  // e.g., 22
}

function determineGameState({
  currentRevenue,
  dailyTarget,
  currentHour,
  openingHour,
  closingHour
}: GameStateParams): { state: GameState; progress: number; message: string } {

  // Calculate time-adjusted target
  const totalHours = closingHour - openingHour;
  const hoursElapsed = Math.max(0, Math.min(currentHour - openingHour, totalHours));
  const timeProgress = hoursElapsed / totalHours;
  const adjustedTarget = dailyTarget * timeProgress;

  // Calculate progress
  const progress = adjustedTarget > 0
    ? (currentRevenue / adjustedTarget) * 100
    : 100;

  // Determine state
  let state: GameState;
  let message: string;

  if (progress >= 100) {
    state = 'celebrating';
    message = 'Crushing it! You\'re ahead of target!';
  } else if (progress >= 95) {
    state = 'winning';
    message = 'Great work! On track to hit your goal!';
  } else if (progress >= 85) {
    state = 'neutral';
    message = 'Keep pushing - you\'re close!';
  } else {
    state = 'losing';
    message = 'Let\'s pick up the pace - we can do this!';
  }

  return {
    state,
    progress: Math.round(progress),
    message
  };
}
```

---

### 5.2 Monthly Game State

**Formula**:
```
Days Passed = Current Day of Month
Expected Revenue = (Days Passed / Days in Month) × Monthly Target
Progress = (Actual MTD Revenue / Expected Revenue) × 100
```

**Implementation**:
```typescript
function determineMonthlyGameState(
  mtdRevenue: number,
  monthlyTarget: number,
  currentDate: Date
): { state: GameState; progress: number; daysRemaining: number } {
  const dayOfMonth = currentDate.getDate();
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const expectedRevenue = (dayOfMonth / daysInMonth) * monthlyTarget;
  const progress = expectedRevenue > 0
    ? (mtdRevenue / expectedRevenue) * 100
    : 100;

  let state: GameState;
  if (progress >= 100) {
    state = 'celebrating';
  } else if (progress >= 95) {
    state = 'winning';
  } else if (progress >= 85) {
    state = 'neutral';
  } else {
    state = 'losing';
  }

  return {
    state,
    progress: Math.round(progress),
    daysRemaining: daysInMonth - dayOfMonth
  };
}
```

---

## 6. Correlation Analysis

### 6.1 Behavior-KPI Correlation

**Purpose**: Measure how strongly a behavior correlates with a KPI.

**Method**: Pearson Correlation Coefficient

**Formula**:
```
r = Σ((xi - x̄)(yi - ȳ)) / √(Σ(xi - x̄)² × Σ(yi - ȳ)²)

Where:
- xi = behavior count for day i
- yi = KPI value for day i
- x̄ = mean behavior count
- ȳ = mean KPI value
```

**Implementation**:
```typescript
interface DataPoint {
  behaviorCount: number;
  kpiValue: number;
}

function calculatePearsonCorrelation(data: DataPoint[]): number {
  const n = data.length;
  if (n < 3) return 0; // Not enough data

  const sumX = data.reduce((sum, d) => sum + d.behaviorCount, 0);
  const sumY = data.reduce((sum, d) => sum + d.kpiValue, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0;
  let sumXDiffSquared = 0;
  let sumYDiffSquared = 0;

  for (const point of data) {
    const xDiff = point.behaviorCount - meanX;
    const yDiff = point.kpiValue - meanY;
    numerator += xDiff * yDiff;
    sumXDiffSquared += xDiff * xDiff;
    sumYDiffSquared += yDiff * yDiff;
  }

  const denominator = Math.sqrt(sumXDiffSquared * sumYDiffSquared);
  if (denominator === 0) return 0;

  return Math.round((numerator / denominator) * 100) / 100;
}
```

**Interpretation**:
| Correlation | Interpretation |
|-------------|----------------|
| 0.7 to 1.0 | Strong positive - behavior drives KPI |
| 0.3 to 0.7 | Moderate positive - behavior helps |
| -0.3 to 0.3 | Weak/no correlation - behavior may not matter |
| -0.7 to -0.3 | Moderate negative - behavior might hurt |
| -1.0 to -0.7 | Strong negative - behavior is counterproductive |

---

### 6.2 Time-Lagged Correlation

**Purpose**: Some behaviors take time to impact KPIs.

**Example**:
- Upselling → Same-day revenue impact
- Vendor negotiation → Next-month cost impact
- Training → Gradual skill improvement

**Implementation**:
```typescript
function calculateLaggedCorrelation(
  behaviorData: number[],  // Daily counts
  kpiData: number[],       // Daily values
  lagDays: number          // How many days to lag
): number {
  if (behaviorData.length <= lagDays || kpiData.length <= lagDays) {
    return 0;
  }

  // Shift behavior data forward (or KPI backward)
  const alignedBehavior = behaviorData.slice(0, -lagDays);
  const alignedKpi = kpiData.slice(lagDays);

  const dataPoints = alignedBehavior.map((b, i) => ({
    behaviorCount: b,
    kpiValue: alignedKpi[i]
  }));

  return calculatePearsonCorrelation(dataPoints);
}

// Find optimal lag
function findOptimalLag(
  behaviorData: number[],
  kpiData: number[],
  maxLag: number = 30
): { lag: number; correlation: number } {
  let bestLag = 0;
  let bestCorrelation = 0;

  for (let lag = 0; lag <= maxLag; lag++) {
    const correlation = calculateLaggedCorrelation(behaviorData, kpiData, lag);
    if (Math.abs(correlation) > Math.abs(bestCorrelation)) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  return { lag: bestLag, correlation: bestCorrelation };
}
```

---

### 6.3 Weekly Correlation Analysis

**Process**:
1. Aggregate daily behaviors and KPIs
2. Calculate correlation for past 4 weeks
3. Generate insight based on correlation strength

**Implementation**:
```typescript
interface CorrelationInsight {
  behaviorId: string;
  behaviorName: string;
  kpiType: string;
  correlation: number;
  strength: 'strong' | 'moderate' | 'weak' | 'negative';
  insight: string;
  recommendation: string;
}

async function analyzeWeeklyCorrelation(
  organizationId: string,
  behaviorId: string,
  kpiType: string
): Promise<CorrelationInsight> {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 28 * 24 * 60 * 60 * 1000); // 4 weeks

  const behavior = await getBehavior(behaviorId);

  // Get daily data
  const dailyBehaviorCounts = await getDailyBehaviorCounts(
    organizationId,
    behaviorId,
    startDate,
    endDate
  );

  const dailyKpiValues = await getDailyKpiValues(
    organizationId,
    kpiType,
    startDate,
    endDate
  );

  // Align data
  const dataPoints = dailyBehaviorCounts.map((count, i) => ({
    behaviorCount: count,
    kpiValue: dailyKpiValues[i] ?? 0
  }));

  const correlation = calculatePearsonCorrelation(dataPoints);

  // Determine strength
  let strength: 'strong' | 'moderate' | 'weak' | 'negative';
  if (correlation >= 0.7) strength = 'strong';
  else if (correlation >= 0.3) strength = 'moderate';
  else if (correlation >= -0.3) strength = 'weak';
  else strength = 'negative';

  // Generate insight
  const insight = generateCorrelationInsight(behavior.name, kpiType, correlation, strength);
  const recommendation = generateCorrelationRecommendation(strength);

  return {
    behaviorId,
    behaviorName: behavior.name,
    kpiType,
    correlation,
    strength,
    insight,
    recommendation
  };
}

function generateCorrelationInsight(
  behaviorName: string,
  kpiType: string,
  correlation: number,
  strength: string
): string {
  switch (strength) {
    case 'strong':
      return `${behaviorName} shows strong positive correlation (${correlation.toFixed(2)}) with ${kpiType}. This behavior is clearly driving results!`;
    case 'moderate':
      return `${behaviorName} has moderate correlation (${correlation.toFixed(2)}) with ${kpiType}. This behavior is helping, but other factors also matter.`;
    case 'weak':
      return `${behaviorName} shows weak correlation (${correlation.toFixed(2)}) with ${kpiType}. Consider whether this behavior is being done correctly or if it's the right focus.`;
    case 'negative':
      return `Warning: ${behaviorName} shows negative correlation (${correlation.toFixed(2)}) with ${kpiType}. This behavior may need to be reconsidered or retrained.`;
    default:
      return '';
  }
}
```

---

## 7. Leaderboard Rankings

### 7.1 Behavior Count Ranking

**Formula**:
```
Rank by: Total verified behaviors in period (descending)
Tiebreaker: Verification rate (descending)
```

**Implementation**:
```typescript
interface LeaderboardEntry {
  userId: string;
  userName: string;
  behaviorCount: number;
  verificationRate: number;
  rank: number;
}

async function calculateBehaviorLeaderboard(
  organizationId: string,
  startDate: Date,
  endDate: Date
): Promise<LeaderboardEntry[]> {
  const users = await getActiveUsers(organizationId);

  const entries: LeaderboardEntry[] = [];

  for (const user of users) {
    const logs = await getBehaviorLogs({
      userId: user.id,
      startDate,
      endDate
    });

    const verifiedLogs = logs.filter(l => l.verified);
    const verificationRate = logs.length > 0
      ? verifiedLogs.length / logs.length
      : 0;

    entries.push({
      userId: user.id,
      userName: user.name,
      behaviorCount: verifiedLogs.length,
      verificationRate,
      rank: 0 // Will be calculated
    });
  }

  // Sort by behavior count (desc), then verification rate (desc)
  entries.sort((a, b) => {
    if (b.behaviorCount !== a.behaviorCount) {
      return b.behaviorCount - a.behaviorCount;
    }
    return b.verificationRate - a.verificationRate;
  });

  // Assign ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
}
```

---

### 7.2 Average Check Ranking

**Formula**:
```
Rank by: Average check (descending)
Minimum covers required: 10 (to avoid statistical noise)
Tiebreaker: Total revenue (descending)
```

**Implementation**:
```typescript
interface AvgCheckLeaderboardEntry {
  userId: string;
  userName: string;
  averageCheck: number;
  totalRevenue: number;
  totalCovers: number;
  rank: number;
}

async function calculateAvgCheckLeaderboard(
  organizationId: string,
  startDate: Date,
  endDate: Date,
  minCovers: number = 10
): Promise<AvgCheckLeaderboardEntry[]> {
  const staffEntries = await getStaffDailyEntries(organizationId, startDate, endDate);

  // Group by user
  const userTotals = new Map<string, { revenue: number; covers: number; name: string }>();

  for (const entry of staffEntries) {
    const current = userTotals.get(entry.userId) || {
      revenue: 0,
      covers: 0,
      name: entry.userName
    };
    current.revenue += entry.revenue;
    current.covers += entry.covers;
    userTotals.set(entry.userId, current);
  }

  // Convert to leaderboard entries
  const entries: AvgCheckLeaderboardEntry[] = [];

  for (const [userId, data] of userTotals) {
    if (data.covers < minCovers) continue; // Exclude insufficient data

    entries.push({
      userId,
      userName: data.name,
      averageCheck: data.revenue / data.covers,
      totalRevenue: data.revenue,
      totalCovers: data.covers,
      rank: 0
    });
  }

  // Sort by average check (desc), then total revenue (desc)
  entries.sort((a, b) => {
    if (Math.abs(b.averageCheck - a.averageCheck) > 0.01) {
      return b.averageCheck - a.averageCheck;
    }
    return b.totalRevenue - a.totalRevenue;
  });

  // Assign ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
}
```

---

## 8. Scoring & Points System

### 8.1 Behavior Points

**Point Values**:
| Action | Points |
|--------|--------|
| Log behavior (unverified) | 5 |
| Verified behavior | 10 |
| Behavior with receipt | 15 |
| Accepted upsell | 20 |
| Streak bonus (consecutive days) | +5 per day |

**Implementation**:
```typescript
interface PointCalculation {
  basePoints: number;
  verificationBonus: number;
  receiptBonus: number;
  acceptedBonus: number;
  streakBonus: number;
  totalPoints: number;
}

function calculateBehaviorPoints(
  isVerified: boolean,
  hasReceipt: boolean,
  wasAccepted: boolean,
  currentStreak: number
): PointCalculation {
  const basePoints = 5;
  const verificationBonus = isVerified ? 5 : 0;
  const receiptBonus = hasReceipt ? 5 : 0;
  const acceptedBonus = wasAccepted ? 5 : 0;
  const streakBonus = Math.min(currentStreak, 7) * 5; // Cap at 7 days

  return {
    basePoints,
    verificationBonus,
    receiptBonus,
    acceptedBonus,
    streakBonus,
    totalPoints: basePoints + verificationBonus + receiptBonus + acceptedBonus + streakBonus
  };
}
```

---

### 8.2 Streak Calculation

**Formula**:
```
Streak = Consecutive days with at least 1 verified behavior
```

**Implementation**:
```typescript
async function calculateStreak(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  while (true) {
    const logs = await getBehaviorLogs({
      userId,
      startDate: checkDate,
      endDate: new Date(checkDate.getTime() + 24 * 60 * 60 * 1000),
      verified: true
    });

    if (logs.length === 0) break;

    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}
```

---

## 9. Fraud Detection Algorithms

### 9.1 Behavior-KPI Mismatch Detection

**Logic**:
```
IF (High Behaviors Logged) AND (Low/Declining KPI)
THEN Flag for Review
```

**Implementation**:
```typescript
interface FraudAlert {
  userId: string;
  userName: string;
  alertType: 'behavior_kpi_mismatch' | 'statistical_anomaly' | 'pattern_change';
  severity: 'low' | 'medium' | 'high';
  description: string;
  evidence: Record<string, unknown>;
}

async function detectBehaviorKpiMismatch(
  userId: string,
  periodDays: number = 7
): Promise<FraudAlert | null> {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

  // Get user's behaviors
  const logs = await getBehaviorLogs({ userId, startDate, endDate });
  const behaviorCount = logs.length;

  // Get user's average check
  const avgCheckData = await getStaffAverageCheck(userId, startDate, endDate);
  const avgCheckChange = avgCheckData.changePercent;

  // Get team average for comparison
  const teamBehaviorAvg = await getTeamAverageBehaviors(userId, startDate, endDate);
  const behaviorVsTeam = behaviorCount / teamBehaviorAvg;

  // Check for mismatch
  if (behaviorVsTeam > 1.5 && avgCheckChange < 0) {
    // User has 50%+ more behaviors than team average, but avg check is declining
    const user = await getUser(userId);

    return {
      userId,
      userName: user.name,
      alertType: 'behavior_kpi_mismatch',
      severity: behaviorVsTeam > 2 ? 'high' : 'medium',
      description: `${user.name} logged ${behaviorCount} behaviors (${Math.round(behaviorVsTeam * 100)}% of team average) but average check declined by ${Math.abs(avgCheckChange).toFixed(1)}%.`,
      evidence: {
        behaviorCount,
        teamAverage: Math.round(teamBehaviorAvg),
        avgCheckChange,
        periodDays
      }
    };
  }

  return null;
}
```

---

### 9.2 Statistical Anomaly Detection

**Logic**:
```
IF (User's behavior count > 2 standard deviations from their own average)
THEN Flag for Review
```

**Implementation**:
```typescript
async function detectStatisticalAnomaly(
  userId: string,
  today: Date
): Promise<FraudAlert | null> {
  // Get user's historical daily behavior counts (last 30 days)
  const historicalCounts = await getUserDailyBehaviorCounts(userId, 30);

  if (historicalCounts.length < 7) return null; // Not enough data

  // Calculate mean and standard deviation
  const mean = historicalCounts.reduce((a, b) => a + b, 0) / historicalCounts.length;
  const variance = historicalCounts.reduce((sum, count) => {
    return sum + Math.pow(count - mean, 2);
  }, 0) / historicalCounts.length;
  const stdDev = Math.sqrt(variance);

  // Get today's count
  const todayCount = await getTodayBehaviorCount(userId, today);

  // Check if anomalous (> 2 std deviations)
  const zScore = stdDev > 0 ? (todayCount - mean) / stdDev : 0;

  if (zScore > 2) {
    const user = await getUser(userId);

    return {
      userId,
      userName: user.name,
      alertType: 'statistical_anomaly',
      severity: zScore > 3 ? 'high' : 'medium',
      description: `${user.name} logged ${todayCount} behaviors today, which is ${zScore.toFixed(1)} standard deviations above their average of ${mean.toFixed(0)}.`,
      evidence: {
        todayCount,
        historicalMean: Math.round(mean),
        standardDeviation: Math.round(stdDev),
        zScore: Math.round(zScore * 10) / 10
      }
    };
  }

  return null;
}
```

---

### 9.3 Pattern Change Detection

**Logic**:
```
IF (Sudden increase in behaviors) AND (No corresponding shift schedule change)
THEN Flag for Review
```

**Implementation**:
```typescript
async function detectPatternChange(
  userId: string
): Promise<FraudAlert | null> {
  // Compare last 7 days to previous 7 days
  const currentWeek = await getUserBehaviorTotal(userId, 7);
  const previousWeek = await getUserBehaviorTotal(userId, 14, 7); // 14 days ago to 7 days ago

  const changePercent = previousWeek > 0
    ? ((currentWeek - previousWeek) / previousWeek) * 100
    : 0;

  // If >100% increase, check if shifts also increased
  if (changePercent > 100) {
    const currentShifts = await getShiftsWorked(userId, 7);
    const previousShifts = await getShiftsWorked(userId, 14, 7);

    const shiftsChangePercent = previousShifts > 0
      ? ((currentShifts - previousShifts) / previousShifts) * 100
      : 0;

    // If behaviors doubled but shifts didn't significantly increase
    if (shiftsChangePercent < 30) {
      const user = await getUser(userId);

      return {
        userId,
        userName: user.name,
        alertType: 'pattern_change',
        severity: 'medium',
        description: `${user.name}'s behaviors increased by ${Math.round(changePercent)}% week-over-week, but shift count only changed ${Math.round(shiftsChangePercent)}%.`,
        evidence: {
          currentWeekBehaviors: currentWeek,
          previousWeekBehaviors: previousWeek,
          behaviorChangePercent: Math.round(changePercent),
          currentShifts,
          previousShifts,
          shiftsChangePercent: Math.round(shiftsChangePercent)
        }
      };
    }
  }

  return null;
}
```

---

## 10. Report Aggregations

### 10.1 Daily Summary

```typescript
interface DailySummary {
  date: Date;
  revenue: number;
  covers: number;
  averageCheck: number;
  behaviorCount: number;
  verifiedBehaviorCount: number;
  adoptionRate: number;
  vsTargetRevenue: number;
  vsTargetAvgCheck: number;
  topPerformer: { userId: string; name: string; metric: number };
  gameState: GameState;
}

async function generateDailySummary(
  organizationId: string,
  date: Date
): Promise<DailySummary> {
  const dailyEntry = await getDailyEntry(organizationId, date);
  const benchmarks = await getBenchmarks(organizationId);
  const behaviors = await getBehaviorLogs({ organizationId, date });
  const adoptionRate = await calculateAdoptionRate({ organizationId, date });
  const leaderboard = await calculateAvgCheckLeaderboard(organizationId, date, date);

  return {
    date,
    revenue: dailyEntry?.totalRevenue ?? 0,
    covers: dailyEntry?.totalCovers ?? 0,
    averageCheck: dailyEntry
      ? dailyEntry.totalRevenue / dailyEntry.totalCovers
      : 0,
    behaviorCount: behaviors.length,
    verifiedBehaviorCount: behaviors.filter(b => b.verified).length,
    adoptionRate,
    vsTargetRevenue: calculateBenchmarkVariance(
      dailyEntry?.totalRevenue ?? 0,
      benchmarks.dailyRevenue
    ).percentVariance,
    vsTargetAvgCheck: calculateBenchmarkVariance(
      dailyEntry ? dailyEntry.totalRevenue / dailyEntry.totalCovers : 0,
      benchmarks.averageCheck
    ).percentVariance,
    topPerformer: leaderboard[0]
      ? { userId: leaderboard[0].userId, name: leaderboard[0].userName, metric: leaderboard[0].averageCheck }
      : null,
    gameState: determineGameState({
      currentRevenue: dailyEntry?.totalRevenue ?? 0,
      dailyTarget: benchmarks.dailyRevenue,
      currentHour: 23, // End of day
      openingHour: benchmarks.openingHour,
      closingHour: benchmarks.closingHour
    }).state
  };
}
```

---

### 10.2 Weekly Report

```typescript
interface WeeklyReport {
  weekOf: Date;
  totalRevenue: number;
  totalCovers: number;
  averageCheck: number;
  weekOverWeekRevenueChange: number;
  weekOverWeekAvgCheckChange: number;
  totalBehaviors: number;
  adoptionRate: number;
  briefingsHeld: number;
  briefingsExpected: number;
  briefingCompletionRate: number;
  correlationInsights: CorrelationInsight[];
  fraudAlerts: FraudAlert[];
  topPerformers: LeaderboardEntry[];
  anonymousFeedbackThemes: string[];
  aiRecommendations: string[];
}

async function generateWeeklyReport(
  organizationId: string,
  weekStartDate: Date
): Promise<WeeklyReport> {
  const weekEndDate = new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const prevWeekStart = new Date(weekStartDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Current week data
  const currentWeekEntries = await getDailyEntries(organizationId, weekStartDate, weekEndDate);
  const currentRevenue = currentWeekEntries.reduce((sum, e) => sum + e.totalRevenue, 0);
  const currentCovers = currentWeekEntries.reduce((sum, e) => sum + e.totalCovers, 0);

  // Previous week data
  const prevWeekEntries = await getDailyEntries(organizationId, prevWeekStart, weekStartDate);
  const prevRevenue = prevWeekEntries.reduce((sum, e) => sum + e.totalRevenue, 0);
  const prevCovers = prevWeekEntries.reduce((sum, e) => sum + e.totalCovers, 0);

  // Behaviors
  const behaviors = await getBehaviorLogs({ organizationId, startDate: weekStartDate, endDate: weekEndDate });
  const adoptionRate = await calculateAdoptionRate({ organizationId, startDate: weekStartDate, endDate: weekEndDate });

  // Briefings
  const briefings = await getBriefings(organizationId, weekStartDate, weekEndDate);
  const operatingDays = await getOperatingDays(organizationId, weekStartDate, weekEndDate);

  // Analysis
  const correlations = await analyzeAllBehaviorCorrelations(organizationId, weekStartDate, weekEndDate);
  const fraudAlerts = await runFraudDetection(organizationId, weekStartDate, weekEndDate);
  const leaderboard = await calculateAvgCheckLeaderboard(organizationId, weekStartDate, weekEndDate);
  const feedback = await getAnonymousFeedback(organizationId, weekStartDate, weekEndDate);
  const recommendations = await generateAIRecommendations(organizationId, weekStartDate, weekEndDate);

  return {
    weekOf: weekStartDate,
    totalRevenue: currentRevenue,
    totalCovers: currentCovers,
    averageCheck: currentCovers > 0 ? currentRevenue / currentCovers : 0,
    weekOverWeekRevenueChange: calculatePeriodVariance(currentRevenue, prevRevenue).percentChange,
    weekOverWeekAvgCheckChange: calculatePeriodVariance(
      currentCovers > 0 ? currentRevenue / currentCovers : 0,
      prevCovers > 0 ? prevRevenue / prevCovers : 0
    ).percentChange,
    totalBehaviors: behaviors.length,
    adoptionRate,
    briefingsHeld: briefings.filter(b => b.completedAt).length,
    briefingsExpected: operatingDays,
    briefingCompletionRate: operatingDays > 0
      ? (briefings.filter(b => b.completedAt).length / operatingDays) * 100
      : 0,
    correlationInsights: correlations,
    fraudAlerts,
    topPerformers: leaderboard.slice(0, 5),
    anonymousFeedbackThemes: synthesizeFeedbackThemes(feedback),
    aiRecommendations: recommendations
  };
}
```

---

## Summary

This calculation engine provides the mathematical foundation for all Topline analytics:

| Category | Key Calculations |
|----------|------------------|
| **Benchmarks** | Daily revenue, average check, monthly targets |
| **KPIs** | Average check, CoS%, GOP%, labor%, prime cost, variance |
| **Adoption** | Org-wide, per-user, per-behavior rates |
| **Variance** | Period-over-period, vs benchmark, budget variance |
| **Game State** | Daily/monthly progress with time adjustment |
| **Correlation** | Pearson coefficient with lag analysis |
| **Rankings** | Behavior count, average check leaderboards |
| **Points** | Behavior points with verification and streak bonuses |
| **Fraud Detection** | KPI mismatch, statistical anomaly, pattern change |
| **Reports** | Daily summary, weekly aggregation |

All calculations should be implemented as pure functions where possible, making them easy to test and maintain.

---

*This document is part of the Topline documentation suite. See [00-INDEX.md](./00-INDEX.md) for the complete list.*
