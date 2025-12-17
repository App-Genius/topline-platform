/**
 * Date Manipulation Utilities
 *
 * Consistent date handling across the application.
 * All functions are pure and timezone-aware where possible.
 */

import type { DateRange } from './types';

// =============================================================================
// Date String Conversions
// =============================================================================

/**
 * Get date string (YYYY-MM-DD) from Date
 *
 * @param date - Date to convert
 * @returns ISO date string (YYYY-MM-DD)
 *
 * @example
 * getDateString(new Date('2024-01-15T10:30:00')) // => '2024-01-15'
 */
export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date string
 *
 * @returns Today's date as YYYY-MM-DD
 *
 * @example
 * getTodayString() // => '2024-01-15' (if today is Jan 15, 2024)
 */
export function getTodayString(): string {
  return getDateString(new Date());
}

/**
 * Parse date string to Date object
 *
 * @param dateString - Date string to parse
 * @returns Date object
 * @throws Error if invalid date string
 *
 * @example
 * parseDate('2024-01-15') // => Date object
 */
export function parseDate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date;
}

/**
 * Safe parse date - returns null instead of throwing
 *
 * @param dateString - Date string to parse
 * @returns Date object or null
 */
export function safeParsDate(dateString: string): Date | null {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

// =============================================================================
// Date Formatting
// =============================================================================

/**
 * Format date for display (full format)
 *
 * @param date - Date to format
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date('2024-01-15')) // => 'Monday, January 15, 2024'
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date short (e.g., "Jan 15")
 *
 * @param date - Date to format
 * @returns Short formatted date
 *
 * @example
 * formatDateShort(new Date('2024-01-15')) // => 'Jan 15'
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format date medium (e.g., "January 15, 2024")
 *
 * @param date - Date to format
 * @returns Medium formatted date
 */
export function formatDateMedium(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date with time
 *
 * @param date - Date to format
 * @returns Date and time string
 *
 * @example
 * formatDateTime(new Date('2024-01-15T14:30:00'))
 * // => 'January 15, 2024 at 2:30 PM'
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format time only
 *
 * @param date - Date to get time from
 * @returns Time string
 *
 * @example
 * formatTime(new Date('2024-01-15T14:30:00')) // => '2:30 PM'
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 *
 * @param date - Date to format
 * @param now - Current date (defaults to now)
 * @returns Relative time string
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000)) // => '1 hour ago'
 */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  return formatDateShort(date);
}

// =============================================================================
// Date Range Building
// =============================================================================

/**
 * Build date range for queries (last N days)
 *
 * @param days - Number of days to include
 * @returns Date range with start and end
 *
 * @example
 * buildDateRange(7) // => { startDate: 7 days ago, endDate: today }
 */
export function buildDateRange(days: number): DateRange {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate };
}

/**
 * Build date range for a specific month
 *
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Date range for that month
 */
export function buildMonthRange(year: number, month: number): DateRange {
  const startDate = new Date(year, month - 1, 1);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(year, month, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

/**
 * Build date range for a specific week
 *
 * @param date - Any date in the week
 * @param startDay - Week start day (0 = Sunday, 1 = Monday)
 * @returns Date range for that week
 */
export function buildWeekRange(date: Date, startDay: number = 1): DateRange {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day < startDay ? 7 : 0) + day - startDay;

  const startDate = new Date(d);
  startDate.setDate(d.getDate() - diff);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

/**
 * Get previous date range (for comparison)
 *
 * @param days - Number of days in range
 * @returns Previous period date range
 *
 * @example
 * // If today is Jan 15 and days=7
 * getPreviousDateRange(7) // => { startDate: Jan 1, endDate: Jan 7 }
 */
export function getPreviousDateRange(days: number): DateRange {
  const { startDate } = buildDateRange(days);

  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);
  prevEndDate.setHours(23, 59, 59, 999);

  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - days + 1);
  prevStartDate.setHours(0, 0, 0, 0);

  return { startDate: prevStartDate, endDate: prevEndDate };
}

// =============================================================================
// Date Comparisons
// =============================================================================

/**
 * Check if date is today
 *
 * @param date - Date to check
 * @returns True if date is today
 *
 * @example
 * isToday(new Date()) // => true
 */
export function isToday(date: Date): boolean {
  return getDateString(date) === getTodayString();
}

/**
 * Check if date is in the past
 *
 * @param date - Date to check
 * @returns True if date is before today
 */
export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const check = new Date(date);
  check.setHours(0, 0, 0, 0);
  return check < today;
}

/**
 * Check if date is in the future
 *
 * @param date - Date to check
 * @returns True if date is after today
 */
export function isFutureDate(date: Date): boolean {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date > today;
}

/**
 * Check if date is yesterday
 *
 * @param date - Date to check
 * @returns True if date is yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateString(date) === getDateString(yesterday);
}

/**
 * Check if two dates are the same day
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if same calendar day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return getDateString(date1) === getDateString(date2);
}

/**
 * Check if date is within range
 *
 * @param date - Date to check
 * @param range - Date range
 * @returns True if date is within range (inclusive)
 */
export function isWithinRange(date: Date, range: DateRange): boolean {
  return date >= range.startDate && date <= range.endDate;
}

// =============================================================================
// Date Arithmetic
// =============================================================================

/**
 * Add days to a date
 *
 * @param date - Starting date
 * @param days - Number of days to add (can be negative)
 * @returns New date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date
 *
 * @param date - Starting date
 * @param months - Number of months to add (can be negative)
 * @returns New date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Get difference in days between two dates
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days (absolute)
 */
export function getDaysDifference(date1: Date, date2: Date): number {
  const diffMs = Math.abs(date1.getTime() - date2.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get start of day (midnight)
 *
 * @param date - Date to get start of
 * @returns Date at 00:00:00.000
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day
 *
 * @param date - Date to get end of
 * @returns Date at 23:59:59.999
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

// =============================================================================
// Week Utilities
// =============================================================================

/**
 * Get the week number of the year
 *
 * @param date - Date to check
 * @returns Week number (1-53)
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get day name from date
 *
 * @param date - Date to get day name from
 * @param format - 'long' | 'short' | 'narrow'
 * @returns Day name
 */
export function getDayName(
  date: Date,
  format: 'long' | 'short' | 'narrow' = 'long'
): string {
  return date.toLocaleDateString('en-US', { weekday: format });
}

/**
 * Get month name from date
 *
 * @param date - Date to get month name from
 * @param format - 'long' | 'short' | 'narrow'
 * @returns Month name
 */
export function getMonthName(
  date: Date,
  format: 'long' | 'short' | 'narrow' = 'long'
): string {
  return date.toLocaleDateString('en-US', { month: format });
}
