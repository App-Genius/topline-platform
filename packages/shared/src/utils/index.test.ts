import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateShort,
  getDateRange,
  getDayOfYear,
  calculateAverageCheck,
  calculateVariance,
  calculatePercentComplete,
  calculateTrend,
  calculateDailyTarget,
  determineGameState,
  scoreQuestionnaire,
  formatCurrency,
  formatCurrencyDetailed,
  formatPercent,
  formatNumber,
  isValidEmail,
  generateInitials,
} from './index.js'

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      // Use Date object with explicit local time to avoid timezone issues
      const date = new Date(2024, 0, 15) // Jan 15, 2024 in local time
      const result = formatDate(date)
      expect(result).toContain('Jan')
      expect(result).toContain('15')
      expect(result).toContain('2024')
    })

    it('should handle Date object', () => {
      const date = new Date(2024, 5, 20) // June 20, 2024 in local time
      const result = formatDate(date)
      expect(result).toContain('Jun')
      expect(result).toContain('20')
    })
  })

  describe('formatDateShort', () => {
    it('should format date without year', () => {
      const date = new Date(2024, 2, 25) // Mar 25, 2024 in local time
      const result = formatDateShort(date)
      expect(result).toContain('Mar')
      expect(result).toContain('25')
      expect(result).not.toContain('2024')
    })
  })

  describe('getDateRange', () => {
    it('should return correct date range', () => {
      const { start, end } = getDateRange(7)
      // Difference should be approximately 7 days (plus the end of day adjustment)
      const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      expect(diffDays).toBeGreaterThanOrEqual(7)
      expect(diffDays).toBeLessThanOrEqual(8)
    })

    it('should set start at beginning of day', () => {
      const { start } = getDateRange(30)
      expect(start.getHours()).toBe(0)
      expect(start.getMinutes()).toBe(0)
      expect(start.getSeconds()).toBe(0)
    })

    it('should set end at end of day', () => {
      const { end } = getDateRange(30)
      expect(end.getHours()).toBe(23)
      expect(end.getMinutes()).toBe(59)
      expect(end.getSeconds()).toBe(59)
    })
  })

  describe('getDayOfYear', () => {
    it('should return 1 for Jan 1', () => {
      // Use local time to avoid timezone issues
      const date = new Date(2024, 0, 1, 12, 0, 0) // Jan 1, 2024 at noon local time
      const result = getDayOfYear(date)
      expect(result).toBe(1)
    })

    it('should return 365/366 for Dec 31', () => {
      const date = new Date(2024, 11, 31, 12, 0, 0) // Dec 31, 2024 at noon local time
      const result = getDayOfYear(date)
      expect(result).toBeGreaterThanOrEqual(365)
      expect(result).toBeLessThanOrEqual(366)
    })
  })
})

describe('Calculation Utilities', () => {
  describe('calculateAverageCheck', () => {
    it('should calculate correct average', () => {
      expect(calculateAverageCheck(10000, 200)).toBe(50)
    })

    it('should return 0 when covers is 0', () => {
      expect(calculateAverageCheck(10000, 0)).toBe(0)
    })

    it('should round to 2 decimal places', () => {
      expect(calculateAverageCheck(100, 3)).toBe(33.33)
    })
  })

  describe('calculateVariance', () => {
    it('should calculate positive variance', () => {
      expect(calculateVariance(110, 100)).toBe(10)
    })

    it('should calculate negative variance', () => {
      expect(calculateVariance(90, 100)).toBe(-10)
    })

    it('should return 0 when budget is 0', () => {
      expect(calculateVariance(100, 0)).toBe(0)
    })
  })

  describe('calculatePercentComplete', () => {
    it('should calculate correct percentage', () => {
      expect(calculatePercentComplete(50, 100)).toBe(50)
    })

    it('should cap at 100%', () => {
      expect(calculatePercentComplete(150, 100)).toBe(100)
    })

    it('should return 0 when target is 0', () => {
      expect(calculatePercentComplete(50, 0)).toBe(0)
    })
  })

  describe('calculateTrend', () => {
    it('should calculate positive trend', () => {
      expect(calculateTrend(110, 100)).toBe(10)
    })

    it('should calculate negative trend', () => {
      expect(calculateTrend(80, 100)).toBe(-20)
    })

    it('should return 0 when previous is 0', () => {
      expect(calculateTrend(100, 0)).toBe(0)
    })
  })

  describe('calculateDailyTarget', () => {
    it('should calculate correct daily target', () => {
      expect(calculateDailyTarget(365000, 365)).toBe(1000)
    })

    it('should return 0 when daysOpen is 0', () => {
      expect(calculateDailyTarget(365000, 0)).toBe(0)
    })
  })
})

describe('Game State Utilities', () => {
  describe('determineGameState', () => {
    it('should return celebrating when goal achieved', () => {
      expect(determineGameState(1000000, 1000000, 180, 365)).toBe('celebrating')
    })

    it('should return winning when ahead of pace', () => {
      // At day 182.5 (50%), should have $500k. If at $600k, winning.
      expect(determineGameState(600000, 1000000, 182, 365)).toBe('winning')
    })

    it('should return losing when behind pace', () => {
      // At day 182.5 (50%), should have $500k. If at $400k, losing.
      expect(determineGameState(400000, 1000000, 182, 365)).toBe('losing')
    })

    it('should return neutral when on pace', () => {
      expect(determineGameState(500000, 1000000, 182, 365)).toBe('neutral')
    })
  })
})

describe('Questionnaire Scoring', () => {
  describe('scoreQuestionnaire', () => {
    it('should score high for positive responses', () => {
      const scores = scoreQuestionnaire({
        revenueGrowth: 5,
        revenueConcern: false,
        costIncrease: 1,
        trackCostOfSales: true,
        teamContribution: 5,
        retentionIssues: false,
        regularMeetings: true,
      })

      expect(scores.revenueHealth).toBe(100)
      expect(scores.costManagement).toBe(100)
      expect(scores.teamEngagement).toBe(100)
      expect(scores.overall).toBe(100)
    })

    it('should score low for negative responses', () => {
      const scores = scoreQuestionnaire({
        revenueGrowth: 1,
        revenueConcern: true,
        costIncrease: 5,
        trackCostOfSales: false,
        teamContribution: 1,
        retentionIssues: true,
        regularMeetings: false,
      })

      expect(scores.revenueHealth).toBeLessThan(50)
      expect(scores.costManagement).toBeLessThan(50)
      expect(scores.teamEngagement).toBeLessThan(50)
    })

    it('should provide relevant recommendations', () => {
      const scores = scoreQuestionnaire({
        revenueGrowth: 2,
        revenueConcern: true,
        costIncrease: 4,
        trackCostOfSales: false,
        teamContribution: 3,
        retentionIssues: true,
        regularMeetings: false,
      })

      expect(scores.recommendations.length).toBeGreaterThan(0)
    })
  })
})

describe('Formatting Utilities', () => {
  describe('formatCurrency', () => {
    it('should format without decimals', () => {
      expect(formatCurrency(12345.67)).toBe('$12,346')
    })

    it('should handle negative values', () => {
      expect(formatCurrency(-1000)).toBe('-$1,000')
    })
  })

  describe('formatCurrencyDetailed', () => {
    it('should format with 2 decimals', () => {
      expect(formatCurrencyDetailed(12345.67)).toBe('$12,345.67')
    })
  })

  describe('formatPercent', () => {
    it('should add + for positive values', () => {
      expect(formatPercent(10.5)).toBe('+10.5%')
    })

    it('should not add + for negative values', () => {
      expect(formatPercent(-5.2)).toBe('-5.2%')
    })
  })

  describe('formatNumber', () => {
    it('should add thousand separators', () => {
      expect(formatNumber(1234567)).toBe('1,234,567')
    })
  })
})

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('missing@domain')).toBe(false)
      expect(isValidEmail('@nodomain.com')).toBe(false)
    })
  })

  describe('generateInitials', () => {
    it('should generate initials from full name', () => {
      expect(generateInitials('John Doe')).toBe('JD')
    })

    it('should handle single name', () => {
      expect(generateInitials('John')).toBe('J')
    })

    it('should handle multiple names', () => {
      expect(generateInitials('John Michael Doe')).toBe('JM')
    })

    it('should uppercase initials', () => {
      expect(generateInitials('john doe')).toBe('JD')
    })
  })
})
