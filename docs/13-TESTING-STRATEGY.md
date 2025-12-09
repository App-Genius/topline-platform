# Topline: Testing Strategy

## Overview

This document defines the comprehensive testing strategy for Topline, including test types, frameworks, coverage requirements, and testing best practices. The strategy follows a "business logic first" approach, prioritizing tests that validate core system behavior.

---

## Table of Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Test Types & Pyramid](#2-test-types--pyramid)
3. [Unit Testing](#3-unit-testing)
4. [Integration Testing](#4-integration-testing)
5. [End-to-End Testing](#5-end-to-end-testing)
6. [Test Scenarios](#6-test-scenarios)
7. [Testing Infrastructure](#7-testing-infrastructure)
8. [Coverage Requirements](#8-coverage-requirements)
9. [CI/CD Integration](#9-cicd-integration)

---

## 1. Testing Philosophy

### 1.1 Core Principles

| Principle | Description |
|-----------|-------------|
| **Business Logic First** | Test calculation engines and business rules before UI |
| **Test Behavior, Not Implementation** | Focus on what the code does, not how |
| **Fast Feedback** | Unit tests run in milliseconds, CI in minutes |
| **Realistic Data** | Use production-like data in integration tests |
| **Deterministic** | No flaky tests - if it fails, there's a real bug |

### 1.2 Testing Priorities

```
Priority 1 (Critical):
├── Calculation Engine
│   ├── KPI calculations
│   ├── Correlation analysis
│   ├── Game state determination
│   └── Budget variance
├── Authentication & Authorization
│   ├── JWT validation
│   ├── PIN authentication
│   └── Permission checks
└── Data Integrity
    ├── Behavior log validation
    ├── Daily entry validation
    └── User/Org relationships

Priority 2 (High):
├── API Endpoints
│   ├── Request validation
│   ├── Response format
│   └── Error handling
├── React Query Hooks
│   ├── Data fetching
│   ├── Caching behavior
│   └── Optimistic updates
└── Form Validation
    ├── Schema validation
    └── Error messages

Priority 3 (Medium):
├── UI Components
│   ├── Rendering
│   ├── User interactions
│   └── Accessibility
├── E2E Workflows
│   ├── Happy paths
│   └── Error recovery
└── Visual Regression
    ├── Layout stability
    └── Responsive design
```

---

## 2. Test Types & Pyramid

### 2.1 Test Pyramid

```
                    ┌───────────────┐
                    │     E2E       │   ~5% of tests
                    │  (Playwright) │   Slowest, most realistic
                    ├───────────────┤
                    │  Integration  │   ~15% of tests
                    │   (Vitest)    │   API + DB + Services
                    ├───────────────┤
                    │               │
                    │     Unit      │   ~80% of tests
                    │   (Vitest)    │   Fast, isolated
                    │               │
                    └───────────────┘
```

### 2.2 Test Type Definitions

| Type | Scope | Speed | Dependencies |
|------|-------|-------|--------------|
| **Unit** | Single function/component | < 10ms | Mocked |
| **Integration** | Multiple modules + DB | < 1s | Real DB (test) |
| **E2E** | Full user workflow | < 30s | Full system |
| **Visual** | Screenshot comparison | < 5s | Storybook |

---

## 3. Unit Testing

### 3.1 Framework & Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['**/e2e/**', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  }
});
```

### 3.2 Calculation Engine Tests

```typescript
// packages/shared/src/calculations/__tests__/kpi.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateAverageCheck,
  calculateAdoptionRate,
  determineGameState,
  calculateVariance
} from '../kpi';

describe('KPI Calculations', () => {
  describe('calculateAverageCheck', () => {
    it('calculates average check correctly', () => {
      expect(calculateAverageCheck(5000, 100)).toBe(50);
    });

    it('returns 0 when covers is 0', () => {
      expect(calculateAverageCheck(5000, 0)).toBe(0);
    });

    it('rounds to 2 decimal places', () => {
      expect(calculateAverageCheck(333, 7)).toBe(47.57);
    });

    it('handles negative revenue', () => {
      expect(calculateAverageCheck(-100, 10)).toBe(-10);
    });
  });

  describe('calculateAdoptionRate', () => {
    it('calculates adoption rate as percentage', () => {
      const result = calculateAdoptionRate({
        actualBehaviors: 85,
        expectedBehaviors: 100
      });
      expect(result).toBe(85);
    });

    it('caps at 100% even if over', () => {
      const result = calculateAdoptionRate({
        actualBehaviors: 120,
        expectedBehaviors: 100
      });
      expect(result).toBe(100);
    });

    it('returns 0 when expected is 0', () => {
      const result = calculateAdoptionRate({
        actualBehaviors: 50,
        expectedBehaviors: 0
      });
      expect(result).toBe(0);
    });
  });

  describe('determineGameState', () => {
    it.each([
      [105, 'celebrating'],
      [100, 'celebrating'],
      [97, 'winning'],
      [95, 'winning'],
      [92, 'neutral'],
      [90, 'neutral'],
      [85, 'losing'],
      [0, 'losing']
    ])('returns %s state for %d% of target', (percentage, expected) => {
      expect(determineGameState(percentage)).toBe(expected);
    });
  });

  describe('calculateVariance', () => {
    it('calculates positive variance', () => {
      const result = calculateVariance(110, 100);
      expect(result).toEqual({
        absolute: 10,
        percentage: 10,
        status: 'over'
      });
    });

    it('calculates negative variance', () => {
      const result = calculateVariance(90, 100);
      expect(result).toEqual({
        absolute: -10,
        percentage: -10,
        status: 'under'
      });
    });

    it('handles zero budget', () => {
      const result = calculateVariance(100, 0);
      expect(result.status).toBe('over');
    });
  });
});
```

### 3.3 Correlation Analysis Tests

```typescript
// packages/shared/src/calculations/__tests__/correlation.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculatePearsonCorrelation,
  interpretCorrelation,
  calculateStatisticalSignificance
} from '../correlation';

describe('Correlation Analysis', () => {
  describe('calculatePearsonCorrelation', () => {
    it('returns 1 for perfect positive correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      expect(calculatePearsonCorrelation(x, y)).toBeCloseTo(1, 5);
    });

    it('returns -1 for perfect negative correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [10, 8, 6, 4, 2];
      expect(calculatePearsonCorrelation(x, y)).toBeCloseTo(-1, 5);
    });

    it('returns ~0 for no correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [3, 1, 4, 2, 5];
      expect(Math.abs(calculatePearsonCorrelation(x, y))).toBeLessThan(0.5);
    });

    it('throws for mismatched array lengths', () => {
      expect(() => calculatePearsonCorrelation([1, 2], [1])).toThrow();
    });

    it('throws for insufficient data points', () => {
      expect(() => calculatePearsonCorrelation([1], [1])).toThrow();
    });
  });

  describe('interpretCorrelation', () => {
    it.each([
      [0.9, 'strong', 'positive'],
      [0.7, 'strong', 'positive'],
      [0.5, 'moderate', 'positive'],
      [0.3, 'weak', 'positive'],
      [0.1, 'none', 'positive'],
      [-0.8, 'strong', 'negative'],
      [-0.5, 'moderate', 'negative']
    ])('interprets %d as %s %s', (value, strength, direction) => {
      const result = interpretCorrelation(value);
      expect(result.strength).toBe(strength);
      expect(result.direction).toBe(direction);
    });
  });
});
```

### 3.4 React Hook Tests

```typescript
// apps/web/hooks/__tests__/useBehaviors.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBehaviors, useLogBehavior } from '../queries/useBehaviors';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useBehaviors', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches behaviors successfully', async () => {
    const behaviors = [
      { id: '1', name: 'Wine Pairing' },
      { id: '2', name: 'Dessert Suggestion' }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ behaviors })
    });

    const { result } = renderHook(() => useBehaviors(), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(behaviors);
  });

  it('handles fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' })
    });

    const { result } = renderHook(() => useBehaviors(), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useLogBehavior', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('logs behavior and invalidates cache', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'log-1', status: 'pending' })
    });

    const { result } = renderHook(() => useLogBehavior(), {
      wrapper: createWrapper()
    });

    await result.current.mutateAsync({
      behaviorId: 'behavior-1',
      tableNumber: '5',
      covers: 4,
      checkAmount: 150
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/behavior-logs'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String)
      })
    );
  });
});
```

### 3.5 Component Tests

```typescript
// apps/web/components/__tests__/Scoreboard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Scoreboard } from '../Scoreboard';

describe('Scoreboard', () => {
  const mockData = {
    revenue: 4250,
    target: 3500,
    percentage: 121,
    avgCheck: 54.20,
    avgCheckBenchmark: 52.00,
    adoption: 87,
    gameState: 'winning' as const,
    leaderboard: [
      { rank: 1, name: 'Joel', behaviors: 15, avgCheck: 62.50 },
      { rank: 2, name: 'Maria', behaviors: 12, avgCheck: 55.00 },
      { rank: 3, name: 'Sam', behaviors: 10, avgCheck: 48.50 }
    ]
  };

  it('renders revenue metrics', () => {
    render(<Scoreboard data={mockData} />);

    expect(screen.getByText('$4,250')).toBeInTheDocument();
    expect(screen.getByText('121%')).toBeInTheDocument();
  });

  it('renders game state indicator', () => {
    render(<Scoreboard data={mockData} />);

    expect(screen.getByText(/winning/i)).toBeInTheDocument();
  });

  it('renders leaderboard entries', () => {
    render(<Scoreboard data={mockData} />);

    expect(screen.getByText('Joel')).toBeInTheDocument();
    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(screen.getByText('Sam')).toBeInTheDocument();
  });

  it('applies correct styling for winning state', () => {
    render(<Scoreboard data={mockData} />);

    const stateIndicator = screen.getByTestId('game-state');
    expect(stateIndicator).toHaveClass('bg-green-500');
  });

  it('applies correct styling for losing state', () => {
    render(<Scoreboard data={{ ...mockData, gameState: 'losing' }} />);

    const stateIndicator = screen.getByTestId('game-state');
    expect(stateIndicator).toHaveClass('bg-red-500');
  });
});
```

---

## 4. Integration Testing

### 4.1 Database Setup

```typescript
// tests/integration/setup.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

export async function setupTestDatabase() {
  // Push schema to test database
  execSync('npx prisma db push --force-reset', {
    env: {
      ...process.env,
      DATABASE_URL: process.env.TEST_DATABASE_URL
    }
  });
}

export async function seedTestData() {
  // Create test organization
  const org = await prisma.organization.create({
    data: {
      name: 'Test Restaurant',
      industry: 'restaurant',
      settings: {
        benchmark: {
          dailyRevenue: 1923,
          avgCheck: 52
        }
      }
    }
  });

  // Create test users
  const owner = await prisma.user.create({
    data: {
      name: 'Test Owner',
      email: 'owner@test.com',
      passwordHash: await hashPassword('password123'),
      role: 'admin',
      organizationId: org.id
    }
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Test Manager',
      email: 'manager@test.com',
      passwordHash: await hashPassword('password123'),
      role: 'manager',
      organizationId: org.id
    }
  });

  const staff = await prisma.user.create({
    data: {
      name: 'Test Staff',
      email: 'staff@test.com',
      pin: '1234',
      role: 'staff',
      organizationId: org.id
    }
  });

  // Create test behaviors
  const behaviors = await prisma.behavior.createMany({
    data: [
      {
        name: 'Wine Pairing',
        description: 'Suggest wine with meal',
        points: 10,
        organizationId: org.id
      },
      {
        name: 'Dessert Suggestion',
        description: 'Offer dessert',
        points: 10,
        organizationId: org.id
      }
    ]
  });

  return { org, owner, manager, staff, behaviors };
}

export async function cleanupTestDatabase() {
  await prisma.$transaction([
    prisma.behaviorLog.deleteMany(),
    prisma.dailyEntry.deleteMany(),
    prisma.behavior.deleteMany(),
    prisma.user.deleteMany(),
    prisma.organization.deleteMany()
  ]);
}
```

### 4.2 API Integration Tests

```typescript
// tests/integration/api/behaviors.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, seedTestData, cleanupTestDatabase } from '../setup';
import { createTestClient } from '../utils';

describe('Behavior API', () => {
  let testData: Awaited<ReturnType<typeof seedTestData>>;
  let client: ReturnType<typeof createTestClient>;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
    testData = await seedTestData();
    client = createTestClient();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/behavior-logs', () => {
    it('creates a behavior log with valid data', async () => {
      const token = await client.loginAsStaff(testData.staff);

      const response = await client.post('/api/behavior-logs', {
        behaviorId: testData.behaviors[0].id,
        tableNumber: '5',
        covers: 4,
        checkAmount: 175.50,
        accepted: true
      }, { token });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        behaviorId: testData.behaviors[0].id,
        userId: testData.staff.id,
        status: 'pending',
        metadata: {
          tableNumber: '5',
          covers: 4,
          checkAmount: 175.50
        }
      });
    });

    it('rejects log from unauthorized user', async () => {
      const response = await client.post('/api/behavior-logs', {
        behaviorId: testData.behaviors[0].id
      });

      expect(response.status).toBe(401);
    });

    it('validates required fields', async () => {
      const token = await client.loginAsStaff(testData.staff);

      const response = await client.post('/api/behavior-logs', {
        // Missing behaviorId
        tableNumber: '5'
      }, { token });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('behaviorId');
    });

    it('rejects behavior from different organization', async () => {
      // Create behavior in different org
      const otherOrg = await createOrganization('Other Org');
      const otherBehavior = await createBehavior(otherOrg.id);

      const token = await client.loginAsStaff(testData.staff);

      const response = await client.post('/api/behavior-logs', {
        behaviorId: otherBehavior.id
      }, { token });

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/behavior-logs/:id/verify', () => {
    it('allows manager to verify pending log', async () => {
      const staffToken = await client.loginAsStaff(testData.staff);
      const managerToken = await client.loginAsManager(testData.manager);

      // Create a log as staff
      const logResponse = await client.post('/api/behavior-logs', {
        behaviorId: testData.behaviors[0].id,
        covers: 2,
        checkAmount: 85
      }, { token: staffToken });

      // Verify as manager
      const verifyResponse = await client.patch(
        `/api/behavior-logs/${logResponse.body.id}/verify`,
        { status: 'verified' },
        { token: managerToken }
      );

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.status).toBe('verified');
    });

    it('rejects verification by non-manager', async () => {
      const staffToken = await client.loginAsStaff(testData.staff);

      const logResponse = await client.post('/api/behavior-logs', {
        behaviorId: testData.behaviors[0].id
      }, { token: staffToken });

      const verifyResponse = await client.patch(
        `/api/behavior-logs/${logResponse.body.id}/verify`,
        { status: 'verified' },
        { token: staffToken }
      );

      expect(verifyResponse.status).toBe(403);
    });
  });
});
```

### 4.3 Authentication Integration Tests

```typescript
// tests/integration/api/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { seedTestData, cleanupTestDatabase } from '../setup';
import { createTestClient } from '../utils';

describe('Authentication', () => {
  let testData: Awaited<ReturnType<typeof seedTestData>>;
  let client: ReturnType<typeof createTestClient>;

  beforeEach(async () => {
    await cleanupTestDatabase();
    testData = await seedTestData();
    client = createTestClient();
  });

  describe('POST /auth/login', () => {
    it('returns tokens for valid credentials', async () => {
      const response = await client.post('/auth/login', {
        email: 'owner@test.com',
        password: 'password123'
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: {
          id: testData.owner.id,
          email: 'owner@test.com',
          role: 'admin'
        }
      });
    });

    it('rejects invalid password', async () => {
      const response = await client.post('/auth/login', {
        email: 'owner@test.com',
        password: 'wrongpassword'
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid');
    });

    it('rejects unknown email', async () => {
      const response = await client.post('/auth/login', {
        email: 'unknown@test.com',
        password: 'password123'
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/staff-login', () => {
    it('authenticates staff with valid PIN', async () => {
      const response = await client.post('/auth/staff-login', {
        userId: testData.staff.id,
        pin: '1234'
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        user: {
          id: testData.staff.id,
          role: 'staff'
        }
      });
    });

    it('rejects invalid PIN', async () => {
      const response = await client.post('/auth/staff-login', {
        userId: testData.staff.id,
        pin: '0000'
      });

      expect(response.status).toBe(401);
    });

    it('locks account after 3 failed attempts', async () => {
      for (let i = 0; i < 3; i++) {
        await client.post('/auth/staff-login', {
          userId: testData.staff.id,
          pin: '0000'
        });
      }

      const response = await client.post('/auth/staff-login', {
        userId: testData.staff.id,
        pin: '1234'  // Correct PIN
      });

      expect(response.status).toBe(429);
      expect(response.body.error).toContain('locked');
    });
  });
});
```

---

## 5. End-to-End Testing

### 5.1 Playwright Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

### 5.2 E2E Test Examples

```typescript
// tests/e2e/staff-behavior-logging.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsStaff, seedTestData } from './helpers';

test.describe('Staff Behavior Logging', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestData();
  });

  test('complete behavior logging flow', async ({ page }) => {
    // Login as staff
    await loginAsStaff(page, { pin: '1234', name: 'Joel' });

    // Verify dashboard loads
    await expect(page.getByText('Good Evening, Joel')).toBeVisible();
    await expect(page.getByText('My Actions')).toBeVisible();

    // Click Quick Log button
    await page.getByRole('button', { name: 'Quick Log' }).click();

    // Fill in behavior log form
    await page.getByLabel('Table Number').fill('5');
    await page.getByLabel('Covers').fill('4');
    await page.getByLabel('Check Total').fill('175.50');

    // Select behavior
    await page.getByRole('checkbox', { name: 'Wine Pairing' }).check();
    await page.getByRole('radio', { name: 'Accepted' }).check();

    // Submit
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify success
    await expect(page.getByText('Behaviors Logged!')).toBeVisible();
    await expect(page.getByText('+20 points')).toBeVisible();

    // Verify behavior appears in activity list
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByText('Wine Pairing')).toBeVisible();
    await expect(page.getByText('Table 5')).toBeVisible();
  });

  test('shows validation errors', async ({ page }) => {
    await loginAsStaff(page, { pin: '1234', name: 'Joel' });

    await page.getByRole('button', { name: 'Quick Log' }).click();

    // Submit without required fields
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify error messages
    await expect(page.getByText('At least one behavior required')).toBeVisible();
  });
});
```

### 5.3 Manager Verification E2E

```typescript
// tests/e2e/manager-verification.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsManager, loginAsStaff, seedTestData } from './helpers';

test.describe('Manager Verification Flow', () => {
  test('verify pending behavior logs', async ({ browser }) => {
    await seedTestData();

    // Create two browser contexts for staff and manager
    const staffContext = await browser.newContext();
    const managerContext = await browser.newContext();

    const staffPage = await staffContext.newPage();
    const managerPage = await managerContext.newPage();

    // Staff logs a behavior
    await loginAsStaff(staffPage, { pin: '1234', name: 'Joel' });
    await staffPage.getByRole('button', { name: 'Quick Log' }).click();
    await staffPage.getByLabel('Covers').fill('2');
    await staffPage.getByLabel('Check Total').fill('85');
    await staffPage.getByRole('checkbox', { name: 'Wine Pairing' }).check();
    await staffPage.getByRole('button', { name: 'Submit' }).click();
    await expect(staffPage.getByText('Behaviors Logged!')).toBeVisible();

    // Manager verifies the log
    await loginAsManager(managerPage);
    await managerPage.goto('/manager/verify');

    // Find the pending log
    await expect(managerPage.getByText('Joel - Wine Pairing')).toBeVisible();
    await expect(managerPage.getByText('Pending')).toBeVisible();

    // Verify it
    await managerPage.getByRole('button', { name: 'Verify' }).first().click();

    // Confirm verification
    await expect(managerPage.getByText('Verified')).toBeVisible();

    // Clean up
    await staffContext.close();
    await managerContext.close();
  });

  test('bulk verification', async ({ page }) => {
    await seedTestData();
    // Create multiple pending logs
    await createPendingLogs(5);

    await loginAsManager(page);
    await page.goto('/manager/verify');

    // Select all
    await page.getByRole('checkbox', { name: 'Select All' }).check();

    // Bulk verify
    await page.getByRole('button', { name: 'Bulk Verify (5)' }).click();

    // Confirm all verified
    await expect(page.getByText('5 behaviors verified')).toBeVisible();
    await expect(page.getByText('Pending Verifications: 0')).toBeVisible();
  });
});
```

### 5.4 Daily Briefing E2E

```typescript
// tests/e2e/daily-briefing.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsManager, seedTestData } from './helpers';

test.describe('Daily Briefing Flow', () => {
  test('complete daily briefing wizard', async ({ page }) => {
    await seedTestData();
    await loginAsManager(page);

    await page.goto('/manager/briefing');

    // Step 1: Overview
    await expect(page.getByText("Today's Overview")).toBeVisible();
    await expect(page.getByText("Yesterday's Performance")).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 2: VIP Guests
    await expect(page.getByText('VIP Guests')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3: Kitchen Updates
    await expect(page.getByText('Kitchen Updates')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 4: Upsell Focus
    await expect(page.getByText('Upsell Focus')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 5: Training
    await expect(page.getByText('Training Topic')).toBeVisible();
    await page.getByRole('checkbox', { name: 'Training topic discussed' }).check();
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 6: Attendance
    await expect(page.getByText('Confirm Attendance')).toBeVisible();
    await page.getByRole('checkbox', { name: 'Joel' }).check();
    await page.getByRole('checkbox', { name: 'Maria' }).check();
    await page.getByRole('button', { name: 'Complete Briefing' }).click();

    // Verify completion
    await expect(page.getByText('Briefing Complete')).toBeVisible();
  });
});
```

---

## 6. Test Scenarios

### 6.1 Critical Path Scenarios

| Scenario | Type | Priority |
|----------|------|----------|
| User registration and login | E2E | P0 |
| Staff PIN login | E2E | P0 |
| Behavior logging | E2E | P0 |
| Manager verification | E2E | P0 |
| Daily entry submission | E2E | P0 |
| Dashboard data display | E2E | P0 |

### 6.2 Edge Case Scenarios

| Scenario | Expected Behavior | Test Type |
|----------|-------------------|-----------|
| Zero revenue day | Allow entry, show warning | Integration |
| 100+ behaviors in shift | No performance degradation | Load test |
| Concurrent verifications | Last write wins, no data loss | Integration |
| Network disconnection | Queue for retry, show offline status | E2E |
| Token expiration mid-session | Refresh silently or prompt login | Integration |

### 6.3 Error Recovery Scenarios

| Scenario | Expected Behavior | Test Type |
|----------|-------------------|-----------|
| API returns 500 | Show error message, allow retry | E2E |
| Form validation fails | Show field-level errors | Unit |
| Database constraint violation | Return meaningful error | Integration |
| File upload fails | Allow retry, preserve form data | E2E |

---

## 7. Testing Infrastructure

### 7.1 Test Utilities

```typescript
// tests/utils/factories.ts
import { faker } from '@faker-js/faker';

export const factories = {
  organization: (overrides = {}) => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    industry: 'restaurant',
    ...overrides
  }),

  user: (overrides = {}) => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: 'staff',
    ...overrides
  }),

  behavior: (overrides = {}) => ({
    id: faker.string.uuid(),
    name: faker.lorem.words(2),
    points: faker.number.int({ min: 5, max: 20 }),
    ...overrides
  }),

  behaviorLog: (overrides = {}) => ({
    id: faker.string.uuid(),
    status: 'pending',
    metadata: {
      tableNumber: String(faker.number.int({ min: 1, max: 20 })),
      covers: faker.number.int({ min: 1, max: 10 }),
      checkAmount: faker.number.float({ min: 20, max: 500, fractionDigits: 2 })
    },
    ...overrides
  }),

  dailyEntry: (overrides = {}) => ({
    id: faker.string.uuid(),
    date: faker.date.recent(),
    revenue: faker.number.float({ min: 1000, max: 10000, fractionDigits: 2 }),
    covers: faker.number.int({ min: 20, max: 200 }),
    ...overrides
  })
};
```

### 7.2 Mock Services

```typescript
// tests/utils/mocks.ts
import { vi } from 'vitest';

export const mockAuthService = {
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  validateToken: vi.fn()
};

export const mockAIService = {
  generateInsights: vi.fn(),
  extractReceiptData: vi.fn(),
  synthesizeFeedback: vi.fn()
};

export const mockEmailService = {
  send: vi.fn(),
  sendTemplate: vi.fn()
};

export function setupMocks() {
  vi.mock('@/services/auth', () => mockAuthService);
  vi.mock('@/services/ai', () => mockAIService);
  vi.mock('@/services/email', () => mockEmailService);
}
```

---

## 8. Coverage Requirements

### 8.1 Coverage Targets

| Component | Line Coverage | Branch Coverage | Function Coverage |
|-----------|--------------|-----------------|-------------------|
| Calculation Engine | 95% | 90% | 100% |
| API Routes | 80% | 75% | 90% |
| React Hooks | 85% | 80% | 90% |
| UI Components | 70% | 65% | 80% |
| Utilities | 90% | 85% | 95% |

### 8.2 Coverage Enforcement

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Check coverage thresholds
        run: |
          npx vitest run --coverage.thresholds.lines=80 \
                         --coverage.thresholds.branches=75 \
                         --coverage.thresholds.functions=85
```

---

## 9. CI/CD Integration

### 9.1 Test Pipeline

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run type-check

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: topline_test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:integration
        env:
          TEST_DATABASE_URL: postgresql://postgres:test@localhost:5432/topline_test

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

*This document is part of the Topline documentation suite. See [00-INDEX.md](./00-INDEX.md) for the complete list.*
