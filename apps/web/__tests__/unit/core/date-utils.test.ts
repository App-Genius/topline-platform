import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getDateString,
  getTodayString,
  parseDate,
  safeParsDate,
  formatDate,
  formatDateShort,
  formatDateMedium,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  buildDateRange,
  buildMonthRange,
  buildWeekRange,
  getPreviousDateRange,
  isToday,
  isPastDate,
  isFutureDate,
  isYesterday,
  isSameDay,
  isWithinRange,
  addDays,
  addMonths,
  getDaysDifference,
  startOfDay,
  endOfDay,
  getWeekNumber,
  getDayName,
  getMonthName,
} from '@/lib/core/date-utils';

describe('getDateString', () => {
  it('extracts YYYY-MM-DD from Date', () => {
    expect(getDateString(new Date('2024-01-15T10:30:00Z'))).toBe('2024-01-15');
  });

  it('handles date at midnight', () => {
    expect(getDateString(new Date('2024-12-31T00:00:00Z'))).toBe('2024-12-31');
  });

  it('handles date at end of day', () => {
    expect(getDateString(new Date('2024-06-01T23:59:59Z'))).toBe('2024-06-01');
  });
});

describe('getTodayString', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-07-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns today as YYYY-MM-DD', () => {
    expect(getTodayString()).toBe('2024-07-15');
  });
});

describe('parseDate', () => {
  it('parses valid date string', () => {
    const date = parseDate('2024-01-15');
    expect(date).toBeInstanceOf(Date);
    expect(date.getFullYear()).toBe(2024);
  });

  it('throws on invalid date string', () => {
    expect(() => parseDate('invalid')).toThrow('Invalid date string');
    expect(() => parseDate('')).toThrow('Invalid date string');
  });
});

describe('safeParsDate', () => {
  it('returns Date for valid string', () => {
    const date = safeParsDate('2024-01-15');
    expect(date).toBeInstanceOf(Date);
  });

  it('returns null for invalid string', () => {
    expect(safeParsDate('invalid')).toBeNull();
    expect(safeParsDate('')).toBeNull();
  });
});

describe('formatDate', () => {
  it('formats date with full format', () => {
    const date = new Date('2024-01-15T12:00:00');
    const formatted = formatDate(date);
    expect(formatted).toContain('January');
    expect(formatted).toContain('15');
    expect(formatted).toContain('2024');
  });
});

describe('formatDateShort', () => {
  it('formats date as "Jan 15"', () => {
    // Use local date to avoid timezone issues
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    const formatted = formatDateShort(date);
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('15');
  });
});

describe('formatDateMedium', () => {
  it('formats date as "January 15, 2024"', () => {
    // Use local date to avoid timezone issues
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    const formatted = formatDateMedium(date);
    expect(formatted).toContain('January');
    expect(formatted).toContain('15');
    expect(formatted).toContain('2024');
  });
});

describe('formatDateTime', () => {
  it('formats date and time', () => {
    const date = new Date('2024-01-15T14:30:00');
    const formatted = formatDateTime(date);
    expect(formatted).toContain('January');
    expect(formatted).toContain('15');
    expect(formatted).toContain('2024');
    // Time format varies by locale, just check it contains something
    expect(formatted.length).toBeGreaterThan(10);
  });
});

describe('formatTime', () => {
  it('formats time only', () => {
    const date = new Date('2024-01-15T14:30:00');
    const formatted = formatTime(date);
    // Format varies by locale
    expect(formatted.length).toBeGreaterThan(0);
  });
});

describe('formatRelativeTime', () => {
  it('returns "just now" for very recent', () => {
    const now = new Date('2024-01-15T12:00:00');
    const recent = new Date('2024-01-15T11:59:30');
    expect(formatRelativeTime(recent, now)).toBe('just now');
  });

  it('returns minutes ago', () => {
    const now = new Date('2024-01-15T12:00:00');
    const fiveMinAgo = new Date('2024-01-15T11:55:00');
    expect(formatRelativeTime(fiveMinAgo, now)).toBe('5 minutes ago');
  });

  it('returns hours ago', () => {
    const now = new Date('2024-01-15T12:00:00');
    const threeHoursAgo = new Date('2024-01-15T09:00:00');
    expect(formatRelativeTime(threeHoursAgo, now)).toBe('3 hours ago');
  });

  it('returns days ago', () => {
    const now = new Date('2024-01-15T12:00:00');
    const twoDaysAgo = new Date('2024-01-13T12:00:00');
    expect(formatRelativeTime(twoDaysAgo, now)).toBe('2 days ago');
  });

  it('returns formatted date for > 7 days', () => {
    const now = new Date('2024-01-15T12:00:00');
    const twoWeeksAgo = new Date('2024-01-01T12:00:00');
    const result = formatRelativeTime(twoWeeksAgo, now);
    expect(result).toContain('Jan');
  });

  it('handles singular forms', () => {
    const now = new Date('2024-01-15T12:00:00');
    const oneMinAgo = new Date('2024-01-15T11:59:00');
    expect(formatRelativeTime(oneMinAgo, now)).toBe('1 minute ago');

    const oneHourAgo = new Date('2024-01-15T11:00:00');
    expect(formatRelativeTime(oneHourAgo, now)).toBe('1 hour ago');
  });
});

describe('buildDateRange', () => {
  it('builds correct range spanning specified days', () => {
    const { startDate, endDate } = buildDateRange(7);

    // Verify startDate is 7 days before today
    const today = new Date();
    const expectedStart = new Date(today);
    expectedStart.setDate(today.getDate() - 7);

    expect(startDate.getDate()).toBe(expectedStart.getDate());
    expect(startDate.getMonth()).toBe(expectedStart.getMonth());
  });

  it('sets start time to midnight', () => {
    const { startDate } = buildDateRange(7);
    expect(startDate.getHours()).toBe(0);
    expect(startDate.getMinutes()).toBe(0);
    expect(startDate.getSeconds()).toBe(0);
  });

  it('sets end time to 23:59:59.999', () => {
    const { endDate } = buildDateRange(7);
    expect(endDate.getHours()).toBe(23);
    expect(endDate.getMinutes()).toBe(59);
    expect(endDate.getSeconds()).toBe(59);
  });

  it('endDate is today', () => {
    const { endDate } = buildDateRange(7);
    const today = new Date();
    // Same calendar day in local time
    expect(endDate.getDate()).toBe(today.getDate());
    expect(endDate.getMonth()).toBe(today.getMonth());
    expect(endDate.getFullYear()).toBe(today.getFullYear());
  });
});

describe('buildMonthRange', () => {
  it('builds correct range for January 2024', () => {
    const { startDate, endDate } = buildMonthRange(2024, 1);

    // The function creates local dates, so just verify the date parts
    expect(startDate.getFullYear()).toBe(2024);
    expect(startDate.getMonth()).toBe(0); // January
    expect(startDate.getDate()).toBe(1);
    expect(endDate.getDate()).toBe(31);
  });

  it('handles February in leap year', () => {
    const { startDate, endDate } = buildMonthRange(2024, 2);

    expect(startDate.getMonth()).toBe(1); // February
    expect(startDate.getDate()).toBe(1);
    expect(endDate.getDate()).toBe(29);
  });

  it('handles February in non-leap year', () => {
    const { endDate } = buildMonthRange(2023, 2);

    expect(endDate.getDate()).toBe(28);
  });
});

describe('buildWeekRange', () => {
  it('builds correct week starting Monday', () => {
    // Wednesday Jan 17, 2024 - use local date
    const date = new Date(2024, 0, 17);
    const { startDate, endDate } = buildWeekRange(date, 1);

    expect(startDate.getDate()).toBe(15); // Monday
    expect(endDate.getDate()).toBe(21); // Sunday
  });

  it('builds correct week starting Sunday', () => {
    const date = new Date(2024, 0, 17);
    const { startDate, endDate } = buildWeekRange(date, 0);

    expect(startDate.getDate()).toBe(14); // Sunday
    expect(endDate.getDate()).toBe(20); // Saturday
  });
});

describe('getPreviousDateRange', () => {
  it('returns previous period with same duration', () => {
    const { startDate, endDate } = getPreviousDateRange(7);

    // Verify the range spans 7 days
    const diffDays = Math.round(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(7);
  });

  it('previous period ends before current period starts', () => {
    const current = buildDateRange(7);
    const previous = getPreviousDateRange(7);

    // Previous period should end before current starts
    expect(previous.endDate.getTime()).toBeLessThan(current.startDate.getTime());
  });

  it('sets times correctly', () => {
    const { startDate, endDate } = getPreviousDateRange(7);

    // Start at midnight
    expect(startDate.getHours()).toBe(0);
    expect(startDate.getMinutes()).toBe(0);

    // End at 23:59:59
    expect(endDate.getHours()).toBe(23);
    expect(endDate.getMinutes()).toBe(59);
  });
});

describe('isToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Use UTC time for consistent date string comparison
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for today', () => {
    // Use UTC dates to ensure consistent behavior with toISOString()
    expect(isToday(new Date('2024-01-15T08:00:00Z'))).toBe(true);
    expect(isToday(new Date('2024-01-15T23:59:59Z'))).toBe(true);
  });

  it('returns false for other days', () => {
    expect(isToday(new Date('2024-01-14T12:00:00Z'))).toBe(false);
    expect(isToday(new Date('2024-01-16T12:00:00Z'))).toBe(false);
  });
});

describe('isPastDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for past dates', () => {
    expect(isPastDate(new Date(2024, 0, 14))).toBe(true);
    expect(isPastDate(new Date(2023, 11, 1))).toBe(true);
  });

  it('returns false for today', () => {
    expect(isPastDate(new Date(2024, 0, 15))).toBe(false);
  });

  it('returns false for future dates', () => {
    expect(isPastDate(new Date(2024, 0, 16))).toBe(false);
  });
});

describe('isFutureDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for future dates', () => {
    expect(isFutureDate(new Date(2024, 0, 16))).toBe(true);
    expect(isFutureDate(new Date(2025, 0, 1))).toBe(true);
  });

  it('returns false for today', () => {
    expect(isFutureDate(new Date(2024, 0, 15, 12, 0, 0))).toBe(false);
  });

  it('returns false for past dates', () => {
    expect(isFutureDate(new Date(2024, 0, 14))).toBe(false);
  });
});

describe('isYesterday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for yesterday', () => {
    expect(isYesterday(new Date(2024, 0, 14))).toBe(true);
  });

  it('returns false for today', () => {
    expect(isYesterday(new Date(2024, 0, 15))).toBe(false);
  });

  it('returns false for other days', () => {
    expect(isYesterday(new Date(2024, 0, 13))).toBe(false);
  });
});

describe('isSameDay', () => {
  it('returns true for same day', () => {
    // Use UTC dates to ensure consistent ISO string comparison
    const d1 = new Date('2024-01-15T08:00:00Z');
    const d2 = new Date('2024-01-15T20:00:00Z');
    expect(isSameDay(d1, d2)).toBe(true);
  });

  it('returns false for different days', () => {
    const d1 = new Date('2024-01-15T12:00:00Z');
    const d2 = new Date('2024-01-16T12:00:00Z');
    expect(isSameDay(d1, d2)).toBe(false);
  });
});

describe('isWithinRange', () => {
  it('returns true for date within range', () => {
    const range = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };
    expect(isWithinRange(new Date('2024-01-15'), range)).toBe(true);
  });

  it('returns true for start boundary', () => {
    const range = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };
    expect(isWithinRange(new Date('2024-01-01'), range)).toBe(true);
  });

  it('returns false for date outside range', () => {
    const range = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };
    expect(isWithinRange(new Date('2024-02-01'), range)).toBe(false);
  });
});

describe('addDays', () => {
  it('adds positive days', () => {
    const date = new Date('2024-01-15');
    expect(getDateString(addDays(date, 5))).toBe('2024-01-20');
  });

  it('subtracts with negative days', () => {
    const date = new Date('2024-01-15');
    expect(getDateString(addDays(date, -5))).toBe('2024-01-10');
  });

  it('handles month boundary', () => {
    const date = new Date('2024-01-30');
    expect(getDateString(addDays(date, 5))).toBe('2024-02-04');
  });
});

describe('addMonths', () => {
  it('adds positive months', () => {
    const date = new Date('2024-01-15');
    expect(getDateString(addMonths(date, 2))).toBe('2024-03-15');
  });

  it('subtracts with negative months', () => {
    const date = new Date('2024-03-15');
    expect(getDateString(addMonths(date, -2))).toBe('2024-01-15');
  });

  it('handles year boundary', () => {
    const date = new Date('2024-11-15');
    expect(getDateString(addMonths(date, 3))).toBe('2025-02-15');
  });
});

describe('getDaysDifference', () => {
  it('returns difference in days', () => {
    const d1 = new Date('2024-01-01');
    const d2 = new Date('2024-01-15');
    expect(getDaysDifference(d1, d2)).toBe(14);
  });

  it('returns absolute difference', () => {
    const d1 = new Date('2024-01-15');
    const d2 = new Date('2024-01-01');
    expect(getDaysDifference(d1, d2)).toBe(14);
  });
});

describe('startOfDay', () => {
  it('returns date at midnight', () => {
    const date = new Date('2024-01-15T14:30:45');
    const start = startOfDay(date);

    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
  });
});

describe('endOfDay', () => {
  it('returns date at 23:59:59.999', () => {
    const date = new Date('2024-01-15T14:30:45');
    const end = endOfDay(date);

    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });
});

describe('getWeekNumber', () => {
  it('returns correct week number', () => {
    // First week of 2024 - use local date
    expect(getWeekNumber(new Date(2024, 0, 1))).toBe(1);
    // Mid year - use local date
    expect(getWeekNumber(new Date(2024, 6, 1))).toBeGreaterThan(26);
  });
});

describe('getDayName', () => {
  it('returns full day name by default', () => {
    // Jan 15, 2024 is a Monday - use local date
    const monday = new Date(2024, 0, 15);
    expect(getDayName(monday)).toBe('Monday');
  });

  it('returns short day name', () => {
    const monday = new Date(2024, 0, 15);
    expect(getDayName(monday, 'short')).toBe('Mon');
  });

  it('returns narrow day name', () => {
    const monday = new Date(2024, 0, 15);
    expect(getDayName(monday, 'narrow')).toBe('M');
  });
});

describe('getMonthName', () => {
  it('returns full month name by default', () => {
    // Use local date - Jan 15, 2024
    const january = new Date(2024, 0, 15);
    expect(getMonthName(january)).toBe('January');
  });

  it('returns short month name', () => {
    const january = new Date(2024, 0, 15);
    expect(getMonthName(january, 'short')).toBe('Jan');
  });

  it('returns narrow month name', () => {
    const january = new Date(2024, 0, 15);
    expect(getMonthName(january, 'narrow')).toBe('J');
  });
});
