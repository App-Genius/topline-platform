/**
 * Shared Utility Functions
 *
 * Common helpers used across the application.
 * All functions are pure with no side effects.
 */

import type { PasswordValidation } from './types';

// =============================================================================
// User Data Sanitization
// =============================================================================

/**
 * Sanitize user object (remove passwordHash)
 *
 * Use this before returning user data from API responses.
 *
 * @param user - User object with potential passwordHash
 * @returns User object without passwordHash
 *
 * @example
 * sanitizeUser({ id: '1', name: 'Alice', passwordHash: 'abc123' })
 * // => { id: '1', name: 'Alice' }
 */
export function sanitizeUser<T extends { passwordHash?: string }>(
  user: T
): Omit<T, 'passwordHash'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Sanitize array of users
 *
 * @param users - Array of user objects
 * @returns Array of sanitized user objects
 */
export function sanitizeUsers<T extends { passwordHash?: string }>(
  users: T[]
): Array<Omit<T, 'passwordHash'>> {
  return users.map(sanitizeUser);
}

// =============================================================================
// Avatar Generation
// =============================================================================

/**
 * Generate avatar initials from name
 *
 * @param name - User's full name
 * @param provided - Optional already-provided avatar
 * @returns Two-letter initials (uppercase)
 *
 * @example
 * generateAvatar('John Doe')        // => 'JD'
 * generateAvatar('Alice')           // => 'A'
 * generateAvatar('John Doe', 'AB')  // => 'AB' (uses provided)
 */
export function generateAvatar(name: string, provided?: string): string {
  if (provided) return provided;

  if (!name || name.trim() === '') return '??';

  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate consistent color from string (for avatar backgrounds)
 *
 * @param str - String to generate color from
 * @returns Hex color code
 */
export function generateColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 45%)`;
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate password strength
 *
 * @param password - Password to validate
 * @returns Validation result
 *
 * @example
 * validatePassword('short')   // => { valid: false, error: '...' }
 * validatePassword('longEnough123') // => { valid: true }
 */
export function validatePassword(password: string): PasswordValidation {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  return { valid: true };
}

/**
 * Validate password with strict rules
 *
 * @param password - Password to validate
 * @returns Validation result with specific requirements
 */
export function validatePasswordStrict(password: string): PasswordValidation {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter',
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one lowercase letter',
    };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  return { valid: true };
}

/**
 * Validate email format
 *
 * @param email - Email to validate
 * @returns True if valid email format
 *
 * @example
 * validateEmail('test@example.com') // => true
 * validateEmail('invalid')          // => false
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic)
 *
 * @param phone - Phone number to validate
 * @returns True if valid phone format
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  // Remove non-digits
  const digitsOnly = phone.replace(/\D/g, '');
  // Must have 10-15 digits
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

// =============================================================================
// Math Utilities
// =============================================================================

/**
 * Safe division (returns 0 if denominator is 0)
 *
 * @param numerator - Numerator
 * @param denominator - Denominator
 * @returns Division result or 0
 *
 * @example
 * safeDivide(10, 2) // => 5
 * safeDivide(10, 0) // => 0
 */
export function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Clamp number between min and max
 *
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 *
 * @example
 * clamp(5, 0, 10)  // => 5
 * clamp(-5, 0, 10) // => 0
 * clamp(15, 0, 10) // => 10
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round to specified decimal places
 *
 * @param value - Value to round
 * @param decimals - Number of decimal places
 * @returns Rounded value
 *
 * @example
 * roundTo(3.14159, 2) // => 3.14
 * roundTo(3.14159, 0) // => 3
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Check if value is within range
 *
 * @param value - Value to check
 * @param min - Minimum (inclusive)
 * @param max - Maximum (inclusive)
 * @returns True if value is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

// =============================================================================
// String Utilities
// =============================================================================

/**
 * Truncate string with ellipsis
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 *
 * @example
 * truncate('Hello World', 5) // => 'Hello...'
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * Capitalize first letter
 *
 * @param str - String to capitalize
 * @returns String with first letter capitalized
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert to title case
 *
 * @param str - String to convert
 * @returns Title-cased string
 *
 * @example
 * titleCase('hello world') // => 'Hello World'
 */
export function titleCase(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
}

/**
 * Slugify string (URL-safe)
 *
 * @param str - String to slugify
 * @returns URL-safe slug
 *
 * @example
 * slugify('Hello World!') // => 'hello-world'
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// =============================================================================
// Array Utilities
// =============================================================================

/**
 * Remove duplicates from array
 *
 * @param arr - Array with potential duplicates
 * @returns Array with unique values
 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * Remove duplicates by key
 *
 * @param arr - Array of objects
 * @param key - Key to check uniqueness
 * @returns Array with unique values by key
 */
export function uniqueBy<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set();
  return arr.filter((item) => {
    const k = item[key];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Group array by key
 *
 * @param arr - Array to group
 * @param key - Key to group by
 * @returns Object with grouped arrays
 *
 * @example
 * groupBy([{ a: 1 }, { a: 2 }, { a: 1 }], 'a')
 * // => { '1': [{ a: 1 }, { a: 1 }], '2': [{ a: 2 }] }
 */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const k = String(item[key]);
      if (!acc[k]) acc[k] = [];
      acc[k].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Sum array of numbers
 *
 * @param arr - Array of numbers
 * @returns Sum
 */
export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

/**
 * Average of array of numbers
 *
 * @param arr - Array of numbers
 * @returns Average or 0 if empty
 */
export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return sum(arr) / arr.length;
}

/**
 * Chunk array into smaller arrays
 *
 * @param arr - Array to chunk
 * @param size - Chunk size
 * @returns Array of chunks
 *
 * @example
 * chunk([1, 2, 3, 4, 5], 2) // => [[1, 2], [3, 4], [5]]
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// =============================================================================
// Object Utilities
// =============================================================================

/**
 * Pick specific keys from object
 *
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns Object with only specified keys
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omit specific keys from object
 *
 * @param obj - Source object
 * @param keys - Keys to omit
 * @returns Object without specified keys
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Check if object is empty
 *
 * @param obj - Object to check
 * @returns True if object has no keys
 */
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

// =============================================================================
// Currency Formatting
// =============================================================================

/**
 * Format number as currency
 *
 * @param amount - Amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1234.56) // => '$1,234.56'
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format number with commas
 *
 * @param num - Number to format
 * @returns Formatted number string
 *
 * @example
 * formatNumber(1234567) // => '1,234,567'
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format number as percentage
 *
 * @param value - Value to format (0-100 or 0-1)
 * @param decimals - Decimal places
 * @param normalized - If true, value is 0-1; if false, value is 0-100
 * @returns Formatted percentage string
 *
 * @example
 * formatPercent(75.5)           // => '75.5%'
 * formatPercent(0.755, 1, true) // => '75.5%'
 */
export function formatPercent(
  value: number,
  decimals: number = 1,
  normalized: boolean = false
): string {
  const pct = normalized ? value * 100 : value;
  return `${roundTo(pct, decimals)}%`;
}
