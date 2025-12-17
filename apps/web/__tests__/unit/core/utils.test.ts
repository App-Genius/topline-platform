import { describe, it, expect } from 'vitest';
import {
  sanitizeUser,
  sanitizeUsers,
  generateAvatar,
  generateColorFromString,
  validatePassword,
  validatePasswordStrict,
  validateEmail,
  validatePhone,
  safeDivide,
  clamp,
  roundTo,
  isInRange,
  truncate,
  capitalize,
  titleCase,
  slugify,
  unique,
  uniqueBy,
  groupBy,
  sum,
  average,
  chunk,
  pick,
  omit,
  isEmpty,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '@/lib/core/utils';

describe('sanitizeUser', () => {
  it('removes passwordHash from user object', () => {
    const user = {
      id: '1',
      name: 'Alice',
      email: 'alice@example.com',
      passwordHash: 'abc123hash',
    };

    const result = sanitizeUser(user);

    expect(result).not.toHaveProperty('passwordHash');
    expect(result).toEqual({
      id: '1',
      name: 'Alice',
      email: 'alice@example.com',
    });
  });

  it('handles user without passwordHash', () => {
    const user = { id: '1', name: 'Alice' };
    const result = sanitizeUser(user);
    expect(result).toEqual(user);
  });

  it('preserves all other properties', () => {
    const user = {
      id: '1',
      name: 'Alice',
      role: 'ADMIN',
      passwordHash: 'hash',
      extra: 'field',
    };

    const result = sanitizeUser(user);

    expect(result.extra).toBe('field');
    expect(result.role).toBe('ADMIN');
  });
});

describe('sanitizeUsers', () => {
  it('removes passwordHash from all users', () => {
    const users = [
      { id: '1', name: 'Alice', passwordHash: 'hash1' },
      { id: '2', name: 'Bob', passwordHash: 'hash2' },
    ];

    const result = sanitizeUsers(users);

    expect(result).toHaveLength(2);
    result.forEach((u) => {
      expect(u).not.toHaveProperty('passwordHash');
    });
  });
});

describe('generateAvatar', () => {
  it('generates initials from full name', () => {
    expect(generateAvatar('John Doe')).toBe('JD');
  });

  it('generates single initial from single name', () => {
    expect(generateAvatar('Alice')).toBe('A');
  });

  it('returns provided avatar if given', () => {
    expect(generateAvatar('John Doe', 'AB')).toBe('AB');
  });

  it('handles empty name', () => {
    expect(generateAvatar('')).toBe('??');
  });

  it('handles name with multiple parts', () => {
    expect(generateAvatar('John Jacob Doe')).toBe('JJ'); // Takes first 2
  });

  it('returns uppercase', () => {
    expect(generateAvatar('john doe')).toBe('JD');
  });
});

describe('generateColorFromString', () => {
  it('generates consistent color for same string', () => {
    const color1 = generateColorFromString('test');
    const color2 = generateColorFromString('test');
    expect(color1).toBe(color2);
  });

  it('generates different colors for different strings', () => {
    const color1 = generateColorFromString('alice');
    const color2 = generateColorFromString('bob');
    expect(color1).not.toBe(color2);
  });

  it('returns valid HSL color', () => {
    const color = generateColorFromString('test');
    expect(color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });
});

describe('validatePassword', () => {
  it('returns valid for 8+ character password', () => {
    expect(validatePassword('password123')).toEqual({ valid: true });
  });

  it('returns error for short password', () => {
    const result = validatePassword('short');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('8 characters');
  });

  it('returns error for empty password', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });
});

describe('validatePasswordStrict', () => {
  it('requires uppercase letter', () => {
    const result = validatePasswordStrict('password123');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('uppercase');
  });

  it('requires lowercase letter', () => {
    const result = validatePasswordStrict('PASSWORD123');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('lowercase');
  });

  it('requires number', () => {
    const result = validatePasswordStrict('PasswordABC');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('number');
  });

  it('accepts valid password', () => {
    expect(validatePasswordStrict('Password123')).toEqual({ valid: true });
  });
});

describe('validateEmail', () => {
  it('returns true for valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.uk')).toBe(true);
  });

  it('returns false for invalid email', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('no@domain')).toBe(false);
    expect(validateEmail('@nodomain.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });
});

describe('validatePhone', () => {
  it('returns true for valid phone', () => {
    expect(validatePhone('1234567890')).toBe(true);
    expect(validatePhone('123-456-7890')).toBe(true);
    expect(validatePhone('(123) 456-7890')).toBe(true);
  });

  it('returns false for invalid phone', () => {
    expect(validatePhone('123')).toBe(false);
    expect(validatePhone('')).toBe(false);
  });
});

describe('safeDivide', () => {
  it('divides normally', () => {
    expect(safeDivide(10, 2)).toBe(5);
  });

  it('returns 0 for division by zero', () => {
    expect(safeDivide(10, 0)).toBe(0);
  });
});

describe('clamp', () => {
  it('returns value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps to max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('roundTo', () => {
  it('rounds to specified decimals', () => {
    expect(roundTo(3.14159, 2)).toBe(3.14);
    expect(roundTo(3.14159, 0)).toBe(3);
    expect(roundTo(3.14159, 4)).toBe(3.1416);
  });
});

describe('isInRange', () => {
  it('returns true for value in range', () => {
    expect(isInRange(5, 0, 10)).toBe(true);
  });

  it('returns true for boundary values', () => {
    expect(isInRange(0, 0, 10)).toBe(true);
    expect(isInRange(10, 0, 10)).toBe(true);
  });

  it('returns false for value outside range', () => {
    expect(isInRange(15, 0, 10)).toBe(false);
    expect(isInRange(-5, 0, 10)).toBe(false);
  });
});

describe('truncate', () => {
  it('truncates long string with ellipsis', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
  });

  it('returns original if within limit', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('handles exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('lowercases rest', () => {
    expect(capitalize('hELLO')).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('titleCase', () => {
  it('capitalizes each word', () => {
    expect(titleCase('hello world')).toBe('Hello World');
  });

  it('handles single word', () => {
    expect(titleCase('hello')).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(titleCase('')).toBe('');
  });
});

describe('slugify', () => {
  it('converts to URL-safe slug', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('Hello@#$World')).toBe('hello-world');
  });

  it('handles multiple spaces', () => {
    expect(slugify('hello   world')).toBe('hello-world');
  });
});

describe('unique', () => {
  it('removes duplicates', () => {
    expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
  });

  it('handles strings', () => {
    expect(unique(['a', 'b', 'a'])).toEqual(['a', 'b']);
  });

  it('handles empty array', () => {
    expect(unique([])).toEqual([]);
  });
});

describe('uniqueBy', () => {
  it('removes duplicates by key', () => {
    const arr = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 1, name: 'C' },
    ];
    const result = uniqueBy(arr, 'id');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('A'); // First occurrence kept
  });
});

describe('groupBy', () => {
  it('groups by key', () => {
    const arr = [
      { type: 'a', value: 1 },
      { type: 'b', value: 2 },
      { type: 'a', value: 3 },
    ];
    const result = groupBy(arr, 'type');
    expect(result).toEqual({
      a: [
        { type: 'a', value: 1 },
        { type: 'a', value: 3 },
      ],
      b: [{ type: 'b', value: 2 }],
    });
  });
});

describe('sum', () => {
  it('sums array of numbers', () => {
    expect(sum([1, 2, 3, 4, 5])).toBe(15);
  });

  it('returns 0 for empty array', () => {
    expect(sum([])).toBe(0);
  });
});

describe('average', () => {
  it('calculates average', () => {
    expect(average([1, 2, 3, 4, 5])).toBe(3);
  });

  it('returns 0 for empty array', () => {
    expect(average([])).toBe(0);
  });
});

describe('chunk', () => {
  it('splits array into chunks', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('handles array smaller than chunk size', () => {
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
  });

  it('handles empty array', () => {
    expect(chunk([], 2)).toEqual([]);
  });
});

describe('pick', () => {
  it('picks specified keys', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });

  it('ignores non-existent keys', () => {
    const obj = { a: 1 };
    // @ts-expect-error Testing non-existent key
    expect(pick(obj, ['a', 'z'])).toEqual({ a: 1 });
  });
});

describe('omit', () => {
  it('omits specified keys', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
  });
});

describe('isEmpty', () => {
  it('returns true for empty object', () => {
    expect(isEmpty({})).toBe(true);
  });

  it('returns false for non-empty object', () => {
    expect(isEmpty({ a: 1 })).toBe(false);
  });
});

describe('formatCurrency', () => {
  it('formats as USD by default', () => {
    const result = formatCurrency(1234.56);
    expect(result).toBe('$1,234.56');
  });

  it('handles different currencies', () => {
    const result = formatCurrency(1234.56, 'EUR');
    expect(result).toContain('1,234.56');
  });
});

describe('formatNumber', () => {
  it('formats with commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('handles decimals', () => {
    expect(formatNumber(1234.56)).toBe('1,234.56');
  });
});

describe('formatPercent', () => {
  it('formats as percentage', () => {
    expect(formatPercent(75.5)).toBe('75.5%');
  });

  it('handles normalized values', () => {
    expect(formatPercent(0.755, 1, true)).toBe('75.5%');
  });

  it('respects decimal places', () => {
    expect(formatPercent(75.567, 2)).toBe('75.57%');
  });
});
