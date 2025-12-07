// ============================================
// DATE UTILITIES
// ============================================

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateShort(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function getDateRange(days: number): { start: Date; end: Date } {
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const start = new Date()
  start.setDate(start.getDate() - days)
  start.setHours(0, 0, 0, 0)

  return { start, end }
}

export function getDayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

// ============================================
// CALCULATION UTILITIES
// ============================================

export function calculateAverageCheck(revenue: number, covers: number): number {
  if (covers === 0) return 0
  return Math.round((revenue / covers) * 100) / 100
}

export function calculateVariance(actual: number, budget: number): number {
  if (budget === 0) return 0
  return Math.round(((actual - budget) / budget) * 10000) / 100
}

export function calculatePercentComplete(current: number, target: number): number {
  if (target === 0) return 0
  return Math.min(100, Math.round((current / target) * 10000) / 100)
}

export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 10000) / 100
}

export function calculateDailyTarget(yearlyTotal: number, daysOpen: number): number {
  if (daysOpen === 0) return 0
  return Math.round((yearlyTotal / daysOpen) * 100) / 100
}

// ============================================
// GAME STATE UTILITIES
// ============================================

export type GameStatus = 'neutral' | 'winning' | 'losing' | 'celebrating'

export function determineGameState(
  currentRevenue: number,
  targetRevenue: number,
  dayOfYear: number,
  totalDays: number
): GameStatus {
  const expectedProgress = dayOfYear / totalDays
  const actualProgress = currentRevenue / targetRevenue
  const progressDelta = actualProgress - expectedProgress

  if (actualProgress >= 1) return 'celebrating'
  if (progressDelta >= 0.05) return 'winning'
  if (progressDelta <= -0.05) return 'losing'
  return 'neutral'
}

// ============================================
// QUESTIONNAIRE SCORING
// ============================================

export interface QuestionnaireScores {
  revenueHealth: number
  costManagement: number
  teamEngagement: number
  overall: number
  recommendations: string[]
}

export function scoreQuestionnaire(responses: {
  revenueGrowth: number
  revenueConcern: boolean
  costIncrease: number
  trackCostOfSales: boolean
  teamContribution: number
  retentionIssues: boolean
  regularMeetings: boolean
}): QuestionnaireScores {
  // Revenue Health (0-100)
  const revenueHealth = Math.round(
    (responses.revenueGrowth / 5) * 50 + (responses.revenueConcern ? 0 : 50)
  )

  // Cost Management (0-100)
  const costManagement = Math.round(
    ((5 - responses.costIncrease) / 4) * 50 + (responses.trackCostOfSales ? 50 : 0)
  )

  // Team Engagement (0-100)
  const teamEngagement = Math.round(
    (responses.teamContribution / 5) * 40 +
      (responses.retentionIssues ? 0 : 30) +
      (responses.regularMeetings ? 30 : 0)
  )

  const overall = Math.round((revenueHealth + costManagement + teamEngagement) / 3)

  const recommendations: string[] = []
  if (revenueHealth < 50) {
    recommendations.push('Focus on revenue-driving behaviors like upselling and cross-selling')
  }
  if (costManagement < 50) {
    recommendations.push('Implement cost tracking and vendor comparison processes')
  }
  if (teamEngagement < 50) {
    recommendations.push('Establish regular team meetings with training components')
  }
  if (overall >= 70) {
    recommendations.push('Your business is well-positioned for Topline optimization')
  }

  return {
    revenueHealth,
    costManagement,
    teamEngagement,
    overall,
    recommendations,
  }
}

// ============================================
// FORMATTING UTILITIES
// ============================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCurrencyDetailed(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

// ============================================
// VALIDATION UTILITIES
// ============================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function generateInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
