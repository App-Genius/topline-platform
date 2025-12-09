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
10. [Agentic Testing with Chrome MCP](#10-agentic-testing-with-chrome-mcp)
11. [LLM-as-Judge Error Analysis](#11-llm-as-judge-error-analysis)
12. [AI Operations Testing](#12-ai-operations-testing)

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

## 10. Agentic Testing with Chrome MCP

### 10.1 Philosophy

Beyond traditional E2E testing, we employ **agentic testing** - using AI agents to simulate real user journeys through the system. This approach:

- Discovers edge cases humans might miss
- Tests user flows as actual personas would experience them
- Generates comprehensive logs for error analysis
- Can run continuously to stress-test the system

### 10.2 Chrome MCP Integration

We use the Chrome DevTools MCP server to enable AI agents to interact with the browser:

```typescript
// tests/agentic/setup.ts
import { createMCPClient } from '@anthropic/mcp-client';

export async function createBrowserAgent() {
  const client = await createMCPClient({
    transport: 'stdio',
    command: 'npx',
    args: ['@anthropic/mcp-server-chrome-devtools']
  });

  return {
    // Navigate to a URL
    navigate: async (url: string) => {
      await client.call('navigate_page', { url, type: 'url' });
    },

    // Take a snapshot for understanding page state
    snapshot: async () => {
      return await client.call('take_snapshot', {});
    },

    // Click on an element by its accessibility ID
    click: async (uid: string) => {
      await client.call('click', { uid });
    },

    // Fill in a form field
    fill: async (uid: string, value: string) => {
      await client.call('fill', { uid, value });
    },

    // Wait for text to appear
    waitFor: async (text: string, timeout = 10000) => {
      await client.call('wait_for', { text, timeout });
    },

    // Take screenshot for visual verification
    screenshot: async (path?: string) => {
      return await client.call('take_screenshot', { filePath: path });
    }
  };
}
```

### 10.3 Persona-Based Test Scenarios

Each test scenario simulates a specific user persona:

```typescript
// tests/agentic/scenarios/staff-persona.ts
import { createBrowserAgent } from '../setup';
import { logTestAction, logTestError } from '../logging';

interface StaffPersona {
  name: string;
  role: 'server' | 'bartender' | 'host';
  experience: 'new' | 'experienced';
  techComfort: 'low' | 'medium' | 'high';
  behaviorPatterns: string[];
}

const STAFF_PERSONAS: StaffPersona[] = [
  {
    name: 'Maria - New Server',
    role: 'server',
    experience: 'new',
    techComfort: 'low',
    behaviorPatterns: [
      'logs_slowly',
      'forgets_optional_fields',
      'needs_confirmation'
    ]
  },
  {
    name: 'Joel - Experienced Server',
    role: 'server',
    experience: 'experienced',
    techComfort: 'high',
    behaviorPatterns: [
      'logs_quickly',
      'uses_shortcuts',
      'bulk_logs_at_end'
    ]
  },
  {
    name: 'Sam - Tech-Challenged',
    role: 'server',
    experience: 'experienced',
    techComfort: 'low',
    behaviorPatterns: [
      'multiple_tap_attempts',
      'confusion_with_modals',
      'accidental_back_navigation'
    ]
  }
];

export async function runStaffPersonaTest(persona: StaffPersona) {
  const agent = await createBrowserAgent();
  const actions: TestAction[] = [];

  try {
    // Login
    await agent.navigate('http://localhost:3000/staff-login');
    await logTestAction(actions, 'navigate', 'staff-login');

    const snapshot = await agent.snapshot();
    const pinInput = findElementByRole(snapshot, 'textbox', 'PIN');

    if (persona.techComfort === 'low') {
      // Simulate hesitation - wait before typing
      await delay(2000);
    }

    await agent.fill(pinInput.uid, '1234');
    await logTestAction(actions, 'fill', 'pin-input');

    const loginButton = findElementByRole(snapshot, 'button', 'Sign In');
    await agent.click(loginButton.uid);
    await logTestAction(actions, 'click', 'login-button');

    // Wait for dashboard
    await agent.waitFor('My Actions');
    await logTestAction(actions, 'waitFor', 'dashboard-loaded');

    // Log behaviors based on persona patterns
    if (persona.behaviorPatterns.includes('bulk_logs_at_end')) {
      // Experienced staff: navigate around first, then bulk log
      await simulateBrowsing(agent, actions);
      await bulkLogBehaviors(agent, actions, 5);
    } else {
      // New staff: log one at a time
      for (let i = 0; i < 3; i++) {
        await logSingleBehavior(agent, actions, persona);
        if (persona.techComfort === 'low') {
          await delay(1500); // Hesitation between logs
        }
      }
    }

    return { success: true, actions };

  } catch (error) {
    await logTestError(actions, error);
    await agent.screenshot(`tests/artifacts/${persona.name}-error.png`);
    return { success: false, actions, error };
  }
}
```

### 10.4 Comprehensive Logging

All agentic test actions are logged for analysis:

```typescript
// tests/agentic/logging.ts
interface TestAction {
  timestamp: Date;
  type: 'navigate' | 'click' | 'fill' | 'waitFor' | 'screenshot' | 'error';
  target: string;
  duration?: number;
  screenshot?: string;
  snapshot?: string;
  metadata?: Record<string, unknown>;
}

interface TestSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  persona: string;
  scenario: string;
  actions: TestAction[];
  result: 'pass' | 'fail' | 'error';
  errors?: Array<{
    message: string;
    stack?: string;
    screenshot?: string;
  }>;
}

let currentSession: TestSession | null = null;

export async function startTestSession(persona: string, scenario: string) {
  currentSession = {
    id: crypto.randomUUID(),
    startTime: new Date(),
    persona,
    scenario,
    actions: [],
    result: 'pass'
  };
}

export async function logTestAction(
  actions: TestAction[],
  type: TestAction['type'],
  target: string,
  metadata?: Record<string, unknown>
) {
  const action: TestAction = {
    timestamp: new Date(),
    type,
    target,
    metadata
  };

  actions.push(action);
  currentSession?.actions.push(action);

  // Also log to analytics for aggregation
  await analytics.track('agentic_test_action', {
    sessionId: currentSession?.id,
    type,
    target,
    persona: currentSession?.persona,
    scenario: currentSession?.scenario
  });
}

export async function logTestError(actions: TestAction[], error: Error) {
  if (currentSession) {
    currentSession.result = 'error';
    currentSession.errors = currentSession.errors || [];
    currentSession.errors.push({
      message: error.message,
      stack: error.stack
    });
  }
}

export async function endTestSession(): Promise<TestSession> {
  if (!currentSession) throw new Error('No active session');

  currentSession.endTime = new Date();

  // Store session for later analysis
  await storeTestSession(currentSession);

  const session = currentSession;
  currentSession = null;
  return session;
}
```

### 10.5 User Journey Simulation

Complete user journeys are simulated based on actual user flows:

```typescript
// tests/agentic/journeys/manager-day.ts
export async function simulateManagerDay() {
  const agent = await createBrowserAgent();

  const journey = {
    name: 'Manager Full Day Journey',
    steps: [
      // Morning: Daily Briefing
      { time: '10:00', action: 'complete_briefing' },

      // Throughout Day: Verify behaviors
      { time: '12:00', action: 'verify_behaviors', count: 5 },
      { time: '15:00', action: 'verify_behaviors', count: 8 },
      { time: '18:00', action: 'verify_behaviors', count: 10 },

      // End of Day: Daily Entry
      { time: '22:00', action: 'submit_daily_entry' },

      // Review: Check dashboard
      { time: '22:15', action: 'review_dashboard' },
    ]
  };

  for (const step of journey.steps) {
    console.log(`Simulating ${step.action} at ${step.time}`);

    switch (step.action) {
      case 'complete_briefing':
        await completeBriefingFlow(agent);
        break;
      case 'verify_behaviors':
        await verifyBehaviorsFlow(agent, step.count);
        break;
      case 'submit_daily_entry':
        await submitDailyEntryFlow(agent);
        break;
      case 'review_dashboard':
        await reviewDashboardFlow(agent);
        break;
    }

    // Take screenshot after each major step
    await agent.screenshot(
      `tests/artifacts/manager-day/${step.time.replace(':', '')}-${step.action}.png`
    );
  }
}
```

---

## 11. LLM-as-Judge Error Analysis

### 11.1 Overview

When tests fail or produce unexpected results, we use LLM analysis to:
- Understand what went wrong
- Categorize error types
- Suggest fixes
- Identify patterns across failures

### 11.2 Error Analysis Pipeline

```typescript
// tests/analysis/error-analyzer.ts
import { generateWithFallback } from '@/lib/ai/factory';
import { z } from 'zod';

const ErrorAnalysisSchema = z.object({
  category: z.enum([
    'ui_interaction_failure',
    'timing_issue',
    'data_validation_error',
    'network_error',
    'auth_failure',
    'business_logic_error',
    'environmental_issue',
    'unknown'
  ]),
  rootCause: z.string().max(500),
  confidence: z.number().min(0).max(1),
  suggestedFix: z.string().max(300),
  isFlaky: z.boolean(),
  requiresHumanReview: z.boolean(),
  relatedTests: z.array(z.string()).optional(),
  potentialImpact: z.enum(['low', 'medium', 'high', 'critical'])
});

type ErrorAnalysis = z.infer<typeof ErrorAnalysisSchema>;

export async function analyzeTestFailure(
  testSession: TestSession
): Promise<ErrorAnalysis> {
  const prompt = `
Analyze this test failure and provide structured analysis.

TEST SESSION:
- Persona: ${testSession.persona}
- Scenario: ${testSession.scenario}
- Duration: ${testSession.endTime.getTime() - testSession.startTime.getTime()}ms

ACTIONS TAKEN:
${testSession.actions.map(a => `[${a.timestamp.toISOString()}] ${a.type}: ${a.target}`).join('\n')}

ERRORS:
${testSession.errors?.map(e => `${e.message}\n${e.stack}`).join('\n\n')}

Analyze:
1. What category of error is this?
2. What is the root cause?
3. How confident are you in this analysis?
4. What fix would you suggest?
5. Is this likely a flaky test (timing, environment)?
6. Does this require human review?
7. What is the potential impact if this issue reached production?

Respond with JSON matching the ErrorAnalysis schema.
`;

  return generateWithFallback({
    prompt,
    systemPrompt: 'You are an expert test failure analyst.',
    schema: ErrorAnalysisSchema
  });
}
```

### 11.3 Pattern Detection

```typescript
// tests/analysis/pattern-detector.ts
interface FailurePattern {
  pattern: string;
  occurrences: number;
  affectedTests: string[];
  commonCharacteristics: string[];
  suggestedSystemicFix: string;
}

export async function detectFailurePatterns(
  failures: TestSession[]
): Promise<FailurePattern[]> {
  // Group failures by analysis category
  const analyses = await Promise.all(
    failures.map(f => analyzeTestFailure(f))
  );

  const byCategory = groupBy(analyses, a => a.category);

  const patterns: FailurePattern[] = [];

  for (const [category, categoryFailures] of Object.entries(byCategory)) {
    if (categoryFailures.length >= 3) {
      // Potential pattern detected
      const pattern = await identifyPattern(category, categoryFailures);
      patterns.push(pattern);
    }
  }

  return patterns;
}

async function identifyPattern(
  category: string,
  failures: ErrorAnalysis[]
): Promise<FailurePattern> {
  const prompt = `
Analyze these ${failures.length} test failures in the "${category}" category.

FAILURES:
${JSON.stringify(failures, null, 2)}

Identify:
1. What pattern connects these failures?
2. What are the common characteristics?
3. What systemic fix would address multiple failures?

Be specific about the pattern and provide an actionable fix.
`;

  const result = await generateWithFallback({
    prompt,
    systemPrompt: 'You are an expert at identifying patterns in test failures.',
    schema: z.object({
      pattern: z.string(),
      commonCharacteristics: z.array(z.string()),
      suggestedSystemicFix: z.string()
    })
  });

  return {
    pattern: result.pattern,
    occurrences: failures.length,
    affectedTests: [], // Would be populated with actual test IDs
    commonCharacteristics: result.commonCharacteristics,
    suggestedSystemicFix: result.suggestedSystemicFix
  };
}
```

### 11.4 Automated Triage

```typescript
// tests/analysis/triage.ts
interface TriageResult {
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  assignTo: 'frontend' | 'backend' | 'infrastructure' | 'qa';
  blocksRelease: boolean;
  suggestedAction: string;
  estimatedEffort: 'trivial' | 'small' | 'medium' | 'large';
}

export async function triageFailure(
  analysis: ErrorAnalysis,
  testContext: TestSession
): Promise<TriageResult> {
  // Determine priority based on impact and confidence
  let priority: TriageResult['priority'] = 'P3';

  if (analysis.potentialImpact === 'critical') {
    priority = 'P0';
  } else if (analysis.potentialImpact === 'high') {
    priority = 'P1';
  } else if (analysis.potentialImpact === 'medium') {
    priority = 'P2';
  }

  // Determine team assignment based on category
  const teamMap: Record<string, TriageResult['assignTo']> = {
    'ui_interaction_failure': 'frontend',
    'timing_issue': 'frontend',
    'data_validation_error': 'backend',
    'network_error': 'infrastructure',
    'auth_failure': 'backend',
    'business_logic_error': 'backend',
    'environmental_issue': 'infrastructure',
    'unknown': 'qa'
  };

  return {
    priority,
    assignTo: teamMap[analysis.category] || 'qa',
    blocksRelease: priority === 'P0' || priority === 'P1',
    suggestedAction: analysis.suggestedFix,
    estimatedEffort: analysis.isFlaky ? 'trivial' : 'medium'
  };
}
```

---

## 12. AI Operations Testing

### 12.1 Testing AI Components

AI operations require special testing approaches because outputs are non-deterministic:

```typescript
// tests/ai/ai-testing-strategy.ts

/**
 * AI Testing Strategy
 *
 * We test AI operations at three levels:
 * 1. Schema Validation: Outputs match expected Zod schemas
 * 2. Quality Assertions: Outputs meet quality criteria
 * 3. LLM-as-Judge: Independent AI evaluates output quality
 */
```

### 12.2 Schema Validation Tests

```typescript
// tests/ai/schema-validation.test.ts
import { describe, it, expect } from 'vitest';
import { BehaviorSuggestionModule } from '@/lib/ai/modules/behavior-suggestion';
import { BehaviorSuggestionOutputSchema } from '@/lib/ai/schemas';

describe('AI Schema Validation', () => {
  const module = new BehaviorSuggestionModule();

  it('behavior suggestion output matches schema', async () => {
    const result = await module.execute({
      roleType: 'SERVER',
      industry: 'RESTAURANT',
      focusKpis: ['AVERAGE_CHECK', 'REVENUE']
    });

    // Schema validation
    const validation = BehaviorSuggestionOutputSchema.safeParse(result.output);
    expect(validation.success).toBe(true);

    // Structure checks
    expect(result.output.behaviors).toBeInstanceOf(Array);
    expect(result.output.behaviors.length).toBeGreaterThanOrEqual(3);
    expect(result.output.behaviors.length).toBeLessThanOrEqual(7);

    // Each behavior has required fields
    for (const behavior of result.output.behaviors) {
      expect(behavior.name).toBeTruthy();
      expect(behavior.description).toBeTruthy();
      expect(behavior.targetPerShift).toBeGreaterThan(0);
      expect(behavior.points).toBeGreaterThan(0);
      expect(behavior.rationale).toBeTruthy();
    }
  });
});
```

### 12.3 Quality Assertion Tests

```typescript
// tests/ai/quality-assertions.test.ts
import { describe, it, expect } from 'vitest';
import { InsightModule } from '@/lib/ai/modules/insight';

describe('AI Quality Assertions', () => {
  const module = new InsightModule();

  it('generated insights are actionable', async () => {
    const result = await module.execute({
      revenue: 4500,
      revenueVsBenchmark: 110,
      avgCheck: 55,
      adoptionRate: 78
    });

    // Quality checks
    for (const insight of result.output.insights) {
      // Titles should not be generic
      expect(insight.title).not.toMatch(/^(Good job|Keep going|Performance)/i);

      // Recommendations should be actionable (contain action verbs)
      const actionVerbs = ['should', 'try', 'consider', 'increase', 'decrease', 'focus'];
      const hasActionVerb = insight.recommendations.every(
        rec => actionVerbs.some(verb => rec.toLowerCase().includes(verb))
      );
      expect(hasActionVerb).toBe(true);

      // Metrics should be included for non-info insights
      if (insight.type !== 'info') {
        expect(insight.metric).toBeDefined();
      }
    }
  });
});
```

### 12.4 LLM-as-Judge Tests

```typescript
// tests/ai/llm-judge.test.ts
import { describe, it, expect } from 'vitest';
import { judgeOutput } from '@/lib/ai/quality/judge';
import { BehaviorSuggestionModule } from '@/lib/ai/modules/behavior-suggestion';

describe('LLM-as-Judge Quality Tests', () => {
  const module = new BehaviorSuggestionModule();

  it('behavior suggestions pass quality judgment', async () => {
    const input = {
      roleType: 'SERVER',
      industry: 'RESTAURANT',
      focusKpis: ['AVERAGE_CHECK']
    };

    const result = await module.execute(input);

    const judgment = await judgeOutput(
      'behavior_suggestion',
      input,
      result.output,
      [
        'Behaviors are specific and measurable',
        'Targets are realistic for a restaurant server',
        'Scripts are natural and not robotic',
        'Rationale clearly links to average check improvement',
        'No duplicate or overlapping behaviors',
        'Behaviors are within server control (not kitchen/management tasks)'
      ]
    );

    expect(judgment.score).toBeGreaterThanOrEqual(70);
    expect(judgment.passed).toBe(true);

    // Log judgment for analysis
    console.log('Judgment:', {
      score: judgment.score,
      feedback: judgment.feedback,
      suggestions: judgment.suggestions
    });
  });

  it('flags low-quality outputs', async () => {
    // Test with a known problematic input that might produce weak results
    const input = {
      roleType: 'UNKNOWN_ROLE',
      industry: 'GENERIC',
      focusKpis: ['VAGUE_METRIC']
    };

    const result = await module.execute(input);

    const judgment = await judgeOutput(
      'behavior_suggestion',
      input,
      result.output,
      [
        'Behaviors are specific to the role',
        'Behaviors are industry-appropriate',
        'KPI linkage is clear'
      ]
    );

    // Expect lower scores for vague inputs
    if (judgment.score < 70) {
      expect(judgment.suggestions.length).toBeGreaterThan(0);
    }
  });
});
```

### 12.5 Token & Cost Tracking Tests

```typescript
// tests/ai/cost-tracking.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { withTokenTracking, calculateCost } from '@/lib/ai/tracking/tokens';
import { BehaviorSuggestionModule } from '@/lib/ai/modules/behavior-suggestion';

describe('AI Cost Tracking', () => {
  let originalModule: BehaviorSuggestionModule;
  let trackedModule: BehaviorSuggestionModule;

  beforeEach(() => {
    originalModule = new BehaviorSuggestionModule();
    trackedModule = withTokenTracking(originalModule, 'test-org');
  });

  it('tracks token usage for each operation', async () => {
    const result = await trackedModule.execute({
      roleType: 'SERVER',
      industry: 'RESTAURANT',
      focusKpis: ['AVERAGE_CHECK']
    });

    expect(result.metadata.tokensUsed).toBeGreaterThan(0);
    expect(result.metadata.latencyMs).toBeGreaterThan(0);
  });

  it('calculates cost correctly', () => {
    // GPT-4 Turbo pricing
    const cost = calculateCost('gpt-4-turbo', 1000, 500);
    expect(cost).toBe((1000 * 0.01 + 500 * 0.03) / 1000);

    // Claude pricing
    const claudeCost = calculateCost('claude-3-sonnet', 1000, 500);
    expect(claudeCost).toBe((1000 * 0.003 + 500 * 0.015) / 1000);
  });

  it('logs operations for aggregation', async () => {
    await trackedModule.execute({
      roleType: 'SERVER',
      industry: 'RESTAURANT',
      focusKpis: ['AVERAGE_CHECK']
    });

    const logs = await getOperationLogs('test-org', {
      start: new Date(Date.now() - 60000),
      end: new Date()
    });

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0]).toMatchObject({
      operation: 'behavior_suggestion',
      organizationId: 'test-org',
      success: true
    });
  });
});
```

### 12.6 Regression Testing for AI

```typescript
// tests/ai/regression.test.ts
import { describe, it, expect } from 'vitest';
import { InsightModule } from '@/lib/ai/modules/insight';

/**
 * AI Regression Tests
 *
 * These tests use known inputs with expected output characteristics
 * to catch regressions in AI behavior.
 */
describe('AI Regression Tests', () => {
  const module = new InsightModule();

  // Golden test cases with known-good outputs
  const goldenTests = [
    {
      name: 'high_performance_celebration',
      input: {
        revenue: 5000,
        revenueVsBenchmark: 125,
        avgCheck: 65,
        adoptionRate: 95
      },
      expectations: {
        shouldContainType: 'success',
        shouldMentionCelebration: true,
        shouldNotMention: ['concern', 'warning', 'drop']
      }
    },
    {
      name: 'low_performance_warning',
      input: {
        revenue: 2000,
        revenueVsBenchmark: 75,
        avgCheck: 35,
        adoptionRate: 45
      },
      expectations: {
        shouldContainType: 'warning',
        shouldMentionConcern: true,
        shouldNotMention: ['celebration', 'excellent']
      }
    }
  ];

  for (const test of goldenTests) {
    it(`regression: ${test.name}`, async () => {
      const result = await module.execute(test.input);

      // Check expected insight types present
      if (test.expectations.shouldContainType) {
        const hasType = result.output.insights.some(
          i => i.type === test.expectations.shouldContainType
        );
        expect(hasType).toBe(true);
      }

      // Check forbidden terms not present
      if (test.expectations.shouldNotMention) {
        const allText = JSON.stringify(result.output).toLowerCase();
        for (const term of test.expectations.shouldNotMention) {
          expect(allText).not.toContain(term.toLowerCase());
        }
      }
    });
  }
});
```

### 12.7 CI Integration for AI Tests

```yaml
# .github/workflows/ai-tests.yml
name: AI Operations Tests

on:
  push:
    paths:
      - 'lib/ai/**'
      - 'tests/ai/**'
  pull_request:
    paths:
      - 'lib/ai/**'
      - 'tests/ai/**'

jobs:
  ai-tests:
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

      - name: Run AI schema tests
        run: npm run test:ai:schema

      - name: Run AI quality tests
        run: npm run test:ai:quality
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}

      - name: Run LLM-as-Judge tests
        run: npm run test:ai:judge
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}

      - name: Generate AI test report
        run: npm run test:ai:report

      - name: Upload AI test artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ai-test-report
          path: test-reports/ai/
```

---

*This document is part of the Topline documentation suite. See [00-INDEX.md](./00-INDEX.md) for the complete list.*
