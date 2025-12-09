# Topline: Testing Strategy

## Overview

This document defines the comprehensive testing strategy for Topline. The strategy follows a **pragmatic, HTTP-first approach** that maximizes test coverage with minimal complexity. The core philosophy: **HTTP calls + test database + data generators gets you 90% of the benefit at 20% of the complexity**.

---

## Table of Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Testing Tiers](#2-testing-tiers)
3. [Tier 1: Unit Tests](#3-tier-1-unit-tests)
4. [Tier 2: HTTP Scenario Tests](#4-tier-2-http-scenario-tests)
5. [Tier 3: Browser E2E Tests](#5-tier-3-browser-e2e-tests)
6. [Tier 4: Real LLM Integration Tests](#6-tier-4-real-llm-integration-tests)
7. [Test Data Generators](#7-test-data-generators)
8. [Multi-Role Test Helpers](#8-multi-role-test-helpers)
9. [Testing Infrastructure](#9-testing-infrastructure)
10. [CI/CD Integration](#10-cicd-integration)
11. [Agentic Development Workflow](#11-agentic-development-workflow)
12. [AI Operations Testing](#12-ai-operations-testing)
13. [Coverage Requirements](#13-coverage-requirements)
14. [Required Calculation Tests](#14-required-calculation-tests)
15. [Edge Case Discovery Patterns](#15-edge-case-discovery-patterns)
16. [Multi-Role Interaction Matrix](#16-multi-role-interaction-matrix)

---

## 1. Testing Philosophy

### 1.1 Core Principles

| Principle | Description |
|-----------|-------------|
| **HTTP-First** | Test through the API layer - it's how real users interact |
| **Real Database** | Use a test database, not mocks - catch real integration issues |
| **Data Generators** | Generate realistic test data with controllable constraints |
| **Multi-Role Scenarios** | Test complete workflows across staff, manager, admin roles |
| **Business Logic First** | Prioritize testing calculations and business rules |
| **AI is Just HTTP** | AI operations are controllable input→output - test them like any endpoint |

### 1.2 Why This Approach Works

Every feature in Topline is accessible via HTTP endpoints with structured I/O:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TESTABILITY ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  USER ACTION          HTTP ENDPOINT         STRUCTURED OUTPUT     │
│                                                                   │
│  Staff logs behavior → POST /behavior-logs → { id, status, ... }  │
│  Manager verifies    → PATCH /logs/:id     → { verified: true }   │
│  AI generates insight→ POST /ai/insights   → { insights: [...] }  │
│  Report requested    → GET /reports/weekly → { data, format }     │
│                                                                   │
│  Everything is testable through HTTP with controlled inputs.      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 What We DON'T Need

| Unnecessary Complexity | Why We Skip It |
|-----------------------|----------------|
| Hexagonal architecture | Route handlers ARE the use cases |
| Complex DI frameworks | Test database IS the "port" |
| Elaborate mocking | Mock only external services (LLM APIs) |
| Robot Pattern abstraction | Simple helper classes suffice |

---

## 2. Testing Tiers

### 2.1 The Testing Pyramid

```
                    ┌───────────────┐
                    │   Tier 4      │   ~2% - Real LLM (nightly)
                    │  Real AI      │   Validates AI integration
                    ├───────────────┤
                    │   Tier 3      │   ~3% - Browser E2E
                    │  Playwright   │   Critical visual flows
                    ├───────────────┤
                    │               │
                    │   Tier 2      │   ~25% - HTTP Scenarios
                    │ Multi-Role    │   Complete business flows
                    │  HTTP Tests   │
                    ├───────────────┤
                    │               │
                    │               │
                    │   Tier 1      │   ~70% - Unit Tests
                    │  Pure Logic   │   Calculations, validation
                    │               │
                    └───────────────┘
```

### 2.2 Tier Summary

| Tier | What | Speed | When to Run |
|------|------|-------|-------------|
| **Tier 1** | Unit tests (pure functions) | < 10ms each | Every save |
| **Tier 2** | HTTP scenario tests | < 500ms each | Every commit |
| **Tier 3** | Browser E2E | < 30s each | PR merge |
| **Tier 4** | Real LLM tests | Variable | Nightly/manual |

---

## 3. Tier 1: Unit Tests

### 3.1 What to Unit Test

Pure functions with no external dependencies:

- **Calculation Engine**: KPI calculations, variance, averages
- **Correlation Analysis**: Pearson correlation, statistical significance
- **Validation Logic**: Schema validation, business rules
- **Transformations**: Data normalization, formatting

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
  });

  describe('determineGameState', () => {
    it.each([
      [105, 'celebrating'],
      [100, 'celebrating'],
      [97, 'winning'],
      [90, 'neutral'],
      [85, 'losing'],
    ])('returns correct state for %d% of target', (percentage, expected) => {
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

    it('throws for insufficient data points', () => {
      expect(() => calculatePearsonCorrelation([1], [1])).toThrow();
    });
  });

  describe('interpretCorrelation', () => {
    it.each([
      [0.9, 'strong', 'positive'],
      [0.5, 'moderate', 'positive'],
      [0.2, 'weak', 'positive'],
      [-0.8, 'strong', 'negative'],
    ])('interprets %d as %s %s', (value, strength, direction) => {
      const result = interpretCorrelation(value);
      expect(result.strength).toBe(strength);
      expect(result.direction).toBe(direction);
    });
  });
});
```

### 3.4 Running Unit Tests

```bash
# Watch mode during development
npm run test:unit

# Single run with coverage
npm run test:unit -- --coverage

# Run specific file
npm run test:unit -- correlation.test.ts
```

---

## 4. Tier 2: HTTP Scenario Tests

### 4.1 The Primary Testing Approach

HTTP scenario tests are the **backbone** of our testing strategy. They test complete business flows through the API layer with a real test database.

**Why HTTP tests are powerful:**
- Test real integration between components
- Catch database constraint violations
- Verify auth and permissions
- Test multi-role workflows
- Fast enough to run on every commit

### 4.2 Test Client Setup

```typescript
// tests/utils/test-client.ts
import { PrismaClient } from '@prisma/client';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const API_URL = process.env.TEST_API_URL || 'http://localhost:3001';

export function createTestClient() {
  const prisma = new PrismaClient({
    datasources: { db: { url: TEST_DATABASE_URL } }
  });

  return {
    prisma,

    async request(method: string, path: string, options: RequestOptions = {}) {
      const response = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(options.token && { Authorization: `Bearer ${options.token}` }),
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      return {
        status: response.status,
        body: await response.json().catch(() => null)
      };
    },

    get: (path: string, options?: RequestOptions) =>
      this.request('GET', path, options),

    post: (path: string, body: unknown, options?: RequestOptions) =>
      this.request('POST', path, { ...options, body }),

    patch: (path: string, body: unknown, options?: RequestOptions) =>
      this.request('PATCH', path, { ...options, body }),

    delete: (path: string, options?: RequestOptions) =>
      this.request('DELETE', path, options),
  };
}
```

### 4.3 Database Setup and Cleanup

```typescript
// tests/utils/database.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

export async function setupTestDatabase() {
  // Reset database to clean state
  execSync('npx prisma db push --force-reset', {
    env: {
      ...process.env,
      DATABASE_URL: process.env.TEST_DATABASE_URL
    }
  });
}

export async function cleanupTestData() {
  // Delete in order respecting foreign keys
  await prisma.$transaction([
    prisma.behaviorLog.deleteMany(),
    prisma.dailyEntry.deleteMany(),
    prisma.behavior.deleteMany(),
    prisma.user.deleteMany(),
    prisma.organization.deleteMany()
  ]);
}

export async function seedTestOrganization() {
  const org = await prisma.organization.create({
    data: {
      name: 'Test Restaurant',
      industry: 'restaurant',
      settings: {
        benchmark: { dailyRevenue: 1923, avgCheck: 52 }
      }
    }
  });

  return org;
}
```

### 4.4 Multi-Role Scenario Tests

**This is the core pattern for testing Topline workflows:**

```typescript
// tests/scenarios/behavior-verification.test.ts
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { createTestClient, setupTestDatabase, cleanupTestData } from '../utils';
import { createStaffActions, createManagerActions } from '../helpers';
import { generateTestOrg, generateTestUsers, generateBehaviors } from '../generators';

describe('Behavior Verification Flow', () => {
  const client = createTestClient();
  let org: Organization;
  let staff: User;
  let manager: User;
  let behaviors: Behavior[];
  let staffToken: string;
  let managerToken: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestData();

    // Generate test data
    org = await generateTestOrg(client.prisma);
    const users = await generateTestUsers(client.prisma, org.id);
    staff = users.staff;
    manager = users.manager;
    behaviors = await generateBehaviors(client.prisma, org.id);

    // Get auth tokens
    staffToken = await loginAsStaff(client, staff);
    managerToken = await loginAsManager(client, manager);
  });

  afterAll(async () => {
    await client.prisma.$disconnect();
  });

  it('complete flow: staff logs → manager sees pending → manager verifies → staff sees verified', async () => {
    // STEP 1: Staff logs a behavior
    const logResponse = await client.post('/api/behavior-logs', {
      behaviorId: behaviors[0].id,
      tableNumber: '5',
      covers: 4,
      checkAmount: 175.50
    }, { token: staffToken });

    expect(logResponse.status).toBe(201);
    expect(logResponse.body.status).toBe('pending');
    const logId = logResponse.body.id;

    // STEP 2: Manager sees it in pending queue
    const pendingResponse = await client.get('/api/behavior-logs/pending', {
      token: managerToken
    });

    expect(pendingResponse.status).toBe(200);
    expect(pendingResponse.body.logs).toContainEqual(
      expect.objectContaining({ id: logId, status: 'pending' })
    );

    // STEP 3: Manager verifies the log
    const verifyResponse = await client.patch(`/api/behavior-logs/${logId}/verify`, {
      status: 'verified',
      notes: 'Confirmed with table'
    }, { token: managerToken });

    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.status).toBe('verified');

    // STEP 4: Staff sees their log is now verified
    const myLogsResponse = await client.get('/api/behavior-logs/mine', {
      token: staffToken
    });

    expect(myLogsResponse.status).toBe(200);
    const myLog = myLogsResponse.body.logs.find(l => l.id === logId);
    expect(myLog.status).toBe('verified');
  });

  it('manager can reject with reason', async () => {
    // Staff logs behavior
    const logResponse = await client.post('/api/behavior-logs', {
      behaviorId: behaviors[0].id,
      covers: 2
    }, { token: staffToken });

    // Manager rejects
    const rejectResponse = await client.patch(
      `/api/behavior-logs/${logResponse.body.id}/verify`,
      { status: 'rejected', reason: 'Could not confirm with customer' },
      { token: managerToken }
    );

    expect(rejectResponse.status).toBe(200);
    expect(rejectResponse.body.status).toBe('rejected');
    expect(rejectResponse.body.rejectionReason).toBe('Could not confirm with customer');
  });

  it('staff cannot verify their own logs', async () => {
    const logResponse = await client.post('/api/behavior-logs', {
      behaviorId: behaviors[0].id
    }, { token: staffToken });

    const verifyResponse = await client.patch(
      `/api/behavior-logs/${logResponse.body.id}/verify`,
      { status: 'verified' },
      { token: staffToken } // Using staff token, not manager
    );

    expect(verifyResponse.status).toBe(403);
  });

  it('manager can bulk verify multiple logs', async () => {
    // Staff logs multiple behaviors
    const logs = await Promise.all([
      client.post('/api/behavior-logs', { behaviorId: behaviors[0].id }, { token: staffToken }),
      client.post('/api/behavior-logs', { behaviorId: behaviors[1].id }, { token: staffToken }),
      client.post('/api/behavior-logs', { behaviorId: behaviors[0].id }, { token: staffToken })
    ]);

    const logIds = logs.map(l => l.body.id);

    // Manager bulk verifies
    const bulkResponse = await client.post('/api/behavior-logs/bulk-verify', {
      logIds,
      status: 'verified'
    }, { token: managerToken });

    expect(bulkResponse.status).toBe(200);
    expect(bulkResponse.body.verified).toBe(3);

    // Verify all are now verified
    const pendingResponse = await client.get('/api/behavior-logs/pending', {
      token: managerToken
    });
    expect(pendingResponse.body.logs.filter(l => logIds.includes(l.id))).toHaveLength(0);
  });
});
```

### 4.5 Daily Operations Scenario

```typescript
// tests/scenarios/daily-operations.test.ts
describe('Daily Operations Flow', () => {
  it('complete day: briefing → staff logs → verification → daily entry → dashboard update', async () => {
    const staffActions = createStaffActions(client, staffToken);
    const managerActions = createManagerActions(client, managerToken);

    // Morning: Manager completes briefing
    const briefing = await managerActions.completeBriefing({
      attendees: [staff.id],
      trainingTopicCovered: true
    });
    expect(briefing.status).toBe('completed');

    // During shift: Staff logs behaviors
    const logs = await staffActions.logBehaviors([
      { behaviorId: behaviors[0].id, covers: 4, checkAmount: 180 },
      { behaviorId: behaviors[1].id, covers: 2, checkAmount: 95 },
      { behaviorId: behaviors[0].id, covers: 6, checkAmount: 320 }
    ]);
    expect(logs).toHaveLength(3);

    // Manager verifies throughout day
    await managerActions.verifyAll(logs.map(l => l.id));

    // End of day: Manager submits daily entry
    const dailyEntry = await managerActions.submitDailyEntry({
      date: new Date().toISOString().split('T')[0],
      revenue: 4500,
      covers: 85
    });
    expect(dailyEntry.avgCheck).toBeCloseTo(52.94, 2);

    // Dashboard reflects the data
    const dashboard = await client.get('/api/dashboard', { token: managerToken });
    expect(dashboard.body.todayRevenue).toBe(4500);
    expect(dashboard.body.behaviorsLogged).toBe(3);
    expect(dashboard.body.behaviorsVerified).toBe(3);
  });
});
```

### 4.6 Authorization Tests

```typescript
// tests/scenarios/authorization.test.ts
describe('Authorization', () => {
  it('staff cannot access admin endpoints', async () => {
    const response = await client.get('/api/admin/settings', { token: staffToken });
    expect(response.status).toBe(403);
  });

  it('staff cannot see other staff behavior logs', async () => {
    // Create another staff member
    const otherStaff = await generateUser(client.prisma, org.id, 'staff');
    const otherStaffToken = await loginAsStaff(client, otherStaff);

    // Other staff logs a behavior
    await client.post('/api/behavior-logs', {
      behaviorId: behaviors[0].id
    }, { token: otherStaffToken });

    // Original staff requests their logs
    const response = await client.get('/api/behavior-logs/mine', { token: staffToken });

    // Should not see other staff's logs
    expect(response.body.logs.every(l => l.userId === staff.id)).toBe(true);
  });

  it('manager can only see their team', async () => {
    // Create another org with its own manager
    const otherOrg = await generateTestOrg(client.prisma, { name: 'Other Restaurant' });
    const otherManager = await generateUser(client.prisma, otherOrg.id, 'manager');
    const otherManagerToken = await loginAsManager(client, otherManager);

    // Other manager tries to access our org's logs
    const response = await client.get('/api/behavior-logs/pending', {
      token: otherManagerToken
    });

    // Should only see their own org's data
    expect(response.body.logs.every(l => l.organizationId === otherOrg.id)).toBe(true);
  });

  it('PIN lockout after failed attempts', async () => {
    // Fail 3 times
    for (let i = 0; i < 3; i++) {
      await client.post('/api/auth/pin-login', {
        staffId: staff.id,
        pin: '0000' // Wrong PIN
      });
    }

    // Fourth attempt with correct PIN should fail
    const response = await client.post('/api/auth/pin-login', {
      staffId: staff.id,
      pin: '1234' // Correct PIN
    });

    expect(response.status).toBe(429);
    expect(response.body.error).toContain('locked');
  });
});
```

---

## 5. Tier 3: Browser E2E Tests

### 5.1 When to Use Browser E2E

Browser E2E tests are for catching issues that HTTP tests cannot:

| Issue Type | Example |
|-----------|---------|
| **UI State** | React state not updating after API call |
| **Hydration** | Server/client mismatch |
| **Visual** | CSS breaking the experience |
| **Touch** | Mobile gesture handling |
| **Accessibility** | Focus management, screen readers |

### 5.2 Playwright Setup

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
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

### 5.3 Critical Path E2E Tests

**Only test the most critical user journeys:**

```typescript
// tests/e2e/critical-flows.spec.ts
import { test, expect } from '@playwright/test';
import { seedTestData, loginAs } from './helpers';

test.describe('Critical User Flows', () => {
  test.beforeEach(async () => {
    await seedTestData();
  });

  test('staff can log behavior and see it reflected', async ({ page }) => {
    await loginAs(page, 'staff', '1234');

    // Navigate to quick log
    await page.goto('/staff');
    await expect(page.getByText('My Actions')).toBeVisible();

    // Log a behavior
    await page.getByRole('button', { name: 'Quick Log' }).click();
    await page.getByLabel('Table Number').fill('5');
    await page.getByLabel('Covers').fill('4');
    await page.getByRole('checkbox', { name: 'Wine Pairing' }).check();
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify success feedback
    await expect(page.getByText('Behavior Logged!')).toBeVisible();

    // Verify it appears in activity list
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByText('Wine Pairing')).toBeVisible();
    await expect(page.getByText('Table 5')).toBeVisible();
  });

  test('manager verifies and staff sees update', async ({ browser }) => {
    // Two browser contexts for different users
    const staffContext = await browser.newContext();
    const managerContext = await browser.newContext();

    const staffPage = await staffContext.newPage();
    const managerPage = await managerContext.newPage();

    // Staff logs behavior
    await loginAs(staffPage, 'staff', '1234');
    await staffPage.goto('/staff');
    await staffPage.getByRole('button', { name: 'Quick Log' }).click();
    await staffPage.getByRole('checkbox', { name: 'Wine Pairing' }).check();
    await staffPage.getByRole('button', { name: 'Submit' }).click();
    await expect(staffPage.getByText('Pending')).toBeVisible();

    // Manager verifies
    await loginAs(managerPage, 'manager');
    await managerPage.goto('/manager/verify');
    await expect(managerPage.getByText('Wine Pairing')).toBeVisible();
    await managerPage.getByRole('button', { name: 'Verify' }).first().click();

    // Staff refreshes and sees verified
    await staffPage.reload();
    await expect(staffPage.getByText('Verified')).toBeVisible();

    await staffContext.close();
    await managerContext.close();
  });

  test('daily briefing flow completes successfully', async ({ page }) => {
    await loginAs(page, 'manager');
    await page.goto('/manager/briefing');

    // Step through wizard
    await expect(page.getByText("Today's Overview")).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Training Topic')).toBeVisible();
    await page.getByRole('checkbox', { name: 'Training discussed' }).check();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Attendance')).toBeVisible();
    await page.getByRole('checkbox', { name: 'Joel' }).check();
    await page.getByRole('button', { name: 'Complete Briefing' }).click();

    // Verify completion
    await expect(page.getByText('Briefing Complete')).toBeVisible();
  });
});
```

### 5.4 What NOT to E2E Test

- Component styling (use visual regression tools separately)
- Every CRUD operation (HTTP tests cover this)
- Error message wording (unit test validation)
- Form field validation (unit test schemas)

---

## 6. Tier 4: Real LLM Integration Tests

### 6.1 When to Use Real LLM Tests

Run these tests to verify:
- AI integration is working end-to-end
- Prompt changes haven't broken output quality
- Schema validation handles real LLM responses
- New model versions work correctly

**These tests are slow and cost money - run them deliberately:**

```bash
# Nightly build only
npm run test:ai:real

# Manual verification
npm run test:ai:real -- --grep "behavior suggestions"
```

### 6.2 Real LLM Test Structure

```typescript
// tests/ai/real-llm.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createTestClient } from '../utils';

// Skip in CI unless explicitly enabled
const runRealLLM = process.env.RUN_REAL_LLM_TESTS === 'true';

describe.skipIf(!runRealLLM)('Real LLM Integration', () => {
  const client = createTestClient();
  let adminToken: string;

  beforeAll(async () => {
    // Setup and get admin token
    adminToken = await setupAndGetAdminToken(client);
  });

  it('generates valid behavior suggestions for restaurant server', async () => {
    const response = await client.post('/api/ai/generate-behaviors', {
      industry: 'restaurant',
      role: 'server',
      focusKpis: ['AVERAGE_CHECK', 'REVENUE']
    }, { token: adminToken });

    expect(response.status).toBe(200);

    // Schema validation
    const { behaviors } = response.body;
    expect(behaviors).toBeInstanceOf(Array);
    expect(behaviors.length).toBeGreaterThanOrEqual(3);
    expect(behaviors.length).toBeLessThanOrEqual(7);

    // Quality assertions
    for (const behavior of behaviors) {
      expect(behavior.name).toBeTruthy();
      expect(behavior.name.length).toBeLessThanOrEqual(50);
      expect(behavior.description).toBeTruthy();
      expect(behavior.targetPerShift).toBeGreaterThan(0);
      expect(behavior.points).toBeGreaterThan(0);
      expect(behavior.points).toBeLessThanOrEqual(10);
      expect(behavior.rationale).toBeTruthy();

      // Should have natural scripts, not robotic
      if (behavior.script) {
        expect(behavior.script).not.toMatch(/\[insert|placeholder|TODO/i);
      }
    }
  });

  it('generates relevant insights from performance data', async () => {
    const response = await client.post('/api/ai/insights', {
      revenue: 4500,
      revenueVsBenchmark: 110,
      avgCheck: 55,
      adoptionRate: 78,
      topBehaviors: ['Wine Pairing', 'Dessert Suggestion'],
      correlations: [
        { behavior: 'Wine Pairing', kpi: 'avgCheck', correlation: 0.72 }
      ]
    }, { token: adminToken });

    expect(response.status).toBe(200);

    const { insights } = response.body;
    expect(insights).toBeInstanceOf(Array);
    expect(insights.length).toBeGreaterThan(0);

    // At least one insight should be actionable
    const hasActionable = insights.some(i =>
      i.recommendations && i.recommendations.length > 0
    );
    expect(hasActionable).toBe(true);

    // Insights should reference the actual data
    const allText = JSON.stringify(insights).toLowerCase();
    expect(allText).toMatch(/wine|revenue|check|behavior/);
  });

  it('handles edge case inputs gracefully', async () => {
    const response = await client.post('/api/ai/insights', {
      revenue: 0,
      revenueVsBenchmark: 0,
      avgCheck: 0,
      adoptionRate: 0
    }, { token: adminToken });

    // Should not error, should provide helpful response
    expect(response.status).toBe(200);
    expect(response.body.insights).toBeInstanceOf(Array);
  });
});
```

### 6.3 AI Quality Regression Tests

```typescript
// tests/ai/quality-regression.test.ts
describe.skipIf(!runRealLLM)('AI Quality Regression', () => {
  // Golden test cases - known inputs with expected output characteristics
  const goldenTests = [
    {
      name: 'high_performance_should_celebrate',
      input: {
        revenue: 5000,
        revenueVsBenchmark: 125,
        avgCheck: 65,
        adoptionRate: 95
      },
      expectations: {
        shouldContainType: 'success',
        shouldMention: ['exceed', 'great', 'strong'],
        shouldNotMention: ['concern', 'warning', 'drop', 'decline']
      }
    },
    {
      name: 'low_performance_should_warn',
      input: {
        revenue: 2000,
        revenueVsBenchmark: 75,
        avgCheck: 35,
        adoptionRate: 45
      },
      expectations: {
        shouldContainType: 'warning',
        shouldMention: ['improve', 'focus', 'opportunity'],
        shouldNotMention: ['excellent', 'celebration', 'record']
      }
    }
  ];

  for (const test of goldenTests) {
    it(`regression: ${test.name}`, async () => {
      const response = await client.post('/api/ai/insights', test.input, {
        token: adminToken
      });

      const allText = JSON.stringify(response.body).toLowerCase();

      // Check expected type present
      if (test.expectations.shouldContainType) {
        expect(response.body.insights.some(
          i => i.type === test.expectations.shouldContainType
        )).toBe(true);
      }

      // Check expected terms mentioned
      if (test.expectations.shouldMention) {
        const hasSomeMention = test.expectations.shouldMention.some(
          term => allText.includes(term)
        );
        expect(hasSomeMention).toBe(true);
      }

      // Check forbidden terms not present
      if (test.expectations.shouldNotMention) {
        for (const term of test.expectations.shouldNotMention) {
          expect(allText).not.toContain(term);
        }
      }
    });
  }
});
```

---

## 7. Test Data Generators

### 7.1 Generator Philosophy

Generators create realistic test data with controllable constraints:

```typescript
// tests/generators/index.ts
export { generateOrganization } from './organization';
export { generateUser, generateUsers } from './user';
export { generateBehavior, generateBehaviors } from './behavior';
export { generateBehaviorLogs } from './behavior-log';
export { generateDailyEntries } from './daily-entry';
```

### 7.2 Organization Generator

```typescript
// tests/generators/organization.ts
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

interface OrgOptions {
  name?: string;
  industry?: 'restaurant' | 'retail' | 'hospitality';
  settings?: Partial<OrgSettings>;
}

export async function generateOrganization(
  prisma: PrismaClient,
  options: OrgOptions = {}
) {
  return prisma.organization.create({
    data: {
      name: options.name ?? faker.company.name(),
      industry: options.industry ?? 'restaurant',
      settings: {
        benchmark: {
          dailyRevenue: faker.number.int({ min: 1500, max: 5000 }),
          avgCheck: faker.number.int({ min: 40, max: 80 })
        },
        ...options.settings
      }
    }
  });
}
```

### 7.3 User Generator

```typescript
// tests/generators/user.ts
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { hashPassword, hashPin } from '@/lib/auth';

type UserRole = 'admin' | 'manager' | 'staff';

interface UserOptions {
  role?: UserRole;
  name?: string;
  pin?: string;
}

export async function generateUser(
  prisma: PrismaClient,
  organizationId: string,
  options: UserOptions = {}
) {
  const role = options.role ?? 'staff';
  const pin = options.pin ?? faker.string.numeric(4);

  return prisma.user.create({
    data: {
      name: options.name ?? faker.person.fullName(),
      email: faker.internet.email(),
      role,
      organizationId,
      ...(role === 'staff' ? {
        pin: await hashPin(pin),
        pinPlaintext: pin // Store for test access, not in production!
      } : {
        passwordHash: await hashPassword('testpassword123')
      })
    }
  });
}

export async function generateUsers(
  prisma: PrismaClient,
  organizationId: string,
  count: { admin?: number; manager?: number; staff?: number } = {}
) {
  const users = {
    admins: [] as User[],
    managers: [] as User[],
    staff: [] as User[]
  };

  for (let i = 0; i < (count.admin ?? 1); i++) {
    users.admins.push(await generateUser(prisma, organizationId, { role: 'admin' }));
  }

  for (let i = 0; i < (count.manager ?? 1); i++) {
    users.managers.push(await generateUser(prisma, organizationId, { role: 'manager' }));
  }

  for (let i = 0; i < (count.staff ?? 3); i++) {
    users.staff.push(await generateUser(prisma, organizationId, { role: 'staff' }));
  }

  return users;
}
```

### 7.4 Behavior Log Generator

```typescript
// tests/generators/behavior-log.ts
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { subDays, addHours } from 'date-fns';

interface LogGeneratorOptions {
  userId: string;
  behaviorIds: string[];
  organizationId: string;
  days?: number;
  logsPerDay?: number | { min: number; max: number };
  status?: 'pending' | 'verified' | 'rejected' | 'mixed';
  verificationRate?: number; // 0-1, for 'mixed' status
}

export async function generateBehaviorLogs(
  prisma: PrismaClient,
  options: LogGeneratorOptions
) {
  const days = options.days ?? 7;
  const logsPerDay = typeof options.logsPerDay === 'number'
    ? { min: options.logsPerDay, max: options.logsPerDay }
    : options.logsPerDay ?? { min: 3, max: 10 };
  const verificationRate = options.verificationRate ?? 0.8;

  const logs = [];

  for (let d = 0; d < days; d++) {
    const date = subDays(new Date(), d);
    const numLogs = faker.number.int(logsPerDay);

    for (let l = 0; l < numLogs; l++) {
      const behaviorId = faker.helpers.arrayElement(options.behaviorIds);
      const timestamp = addHours(date, faker.number.int({ min: 10, max: 22 }));

      let status: string;
      if (options.status === 'mixed') {
        status = Math.random() < verificationRate ? 'verified' : 'pending';
      } else {
        status = options.status ?? 'pending';
      }

      const log = await prisma.behaviorLog.create({
        data: {
          userId: options.userId,
          behaviorId,
          organizationId: options.organizationId,
          status,
          createdAt: timestamp,
          metadata: {
            tableNumber: String(faker.number.int({ min: 1, max: 20 })),
            covers: faker.number.int({ min: 1, max: 8 }),
            checkAmount: faker.number.float({ min: 40, max: 300, fractionDigits: 2 })
          }
        }
      });

      logs.push(log);
    }
  }

  return logs;
}
```

### 7.5 Correlation Test Data Generator

```typescript
// tests/generators/correlation-data.ts
/**
 * Generate behavior logs with a known correlation to revenue
 * for testing the correlation analysis engine
 */
export async function generateCorrelatedData(
  prisma: PrismaClient,
  options: {
    organizationId: string;
    userId: string;
    behaviorId: string;
    targetCorrelation: number; // -1 to 1
    days: number;
  }
) {
  const { targetCorrelation, days } = options;
  const baseRevenue = 3000;
  const baseBehaviors = 10;

  const entries = [];
  const logs = [];

  for (let d = 0; d < days; d++) {
    const date = subDays(new Date(), d);

    // Generate correlated values
    const noise = (Math.random() - 0.5) * (1 - Math.abs(targetCorrelation));
    const behaviorVariation = (Math.random() - 0.5) * 10;
    const behaviorCount = Math.max(1, Math.round(baseBehaviors + behaviorVariation));

    // Revenue correlates with behaviors based on targetCorrelation
    const revenueVariation = targetCorrelation * behaviorVariation * 50 + noise * 500;
    const revenue = Math.max(1000, baseRevenue + revenueVariation);

    // Create daily entry
    const entry = await prisma.dailyEntry.create({
      data: {
        date,
        organizationId: options.organizationId,
        revenue,
        covers: Math.round(revenue / 50)
      }
    });
    entries.push(entry);

    // Create behavior logs
    for (let b = 0; b < behaviorCount; b++) {
      const log = await prisma.behaviorLog.create({
        data: {
          userId: options.userId,
          behaviorId: options.behaviorId,
          organizationId: options.organizationId,
          status: 'verified',
          createdAt: date
        }
      });
      logs.push(log);
    }
  }

  return { entries, logs, expectedCorrelation: targetCorrelation };
}
```

---

## 8. Multi-Role Test Helpers

### 8.1 Helper Class Pattern

Simple helper classes that wrap HTTP calls for readability:

```typescript
// tests/helpers/staff-actions.ts
export class StaffActions {
  constructor(
    private client: TestClient,
    private token: string
  ) {}

  async logBehavior(behaviorId: string, metadata?: BehaviorMetadata) {
    const response = await this.client.post('/api/behavior-logs', {
      behaviorId,
      ...metadata
    }, { token: this.token });

    if (response.status !== 201) {
      throw new Error(`Failed to log behavior: ${response.body.error}`);
    }

    return response.body;
  }

  async logBehaviors(behaviors: Array<{ behaviorId: string } & BehaviorMetadata>) {
    return Promise.all(behaviors.map(b => this.logBehavior(b.behaviorId, b)));
  }

  async getMyLogs(filters?: { status?: string; date?: string }) {
    const params = new URLSearchParams(filters as Record<string, string>);
    const response = await this.client.get(`/api/behavior-logs/mine?${params}`, {
      token: this.token
    });
    return response.body.logs;
  }

  async getDashboard() {
    const response = await this.client.get('/api/staff/dashboard', {
      token: this.token
    });
    return response.body;
  }
}

export function createStaffActions(client: TestClient, token: string) {
  return new StaffActions(client, token);
}
```

```typescript
// tests/helpers/manager-actions.ts
export class ManagerActions {
  constructor(
    private client: TestClient,
    private token: string
  ) {}

  async getPendingLogs() {
    const response = await this.client.get('/api/behavior-logs/pending', {
      token: this.token
    });
    return response.body.logs;
  }

  async verify(logId: string, notes?: string) {
    const response = await this.client.patch(`/api/behavior-logs/${logId}/verify`, {
      status: 'verified',
      notes
    }, { token: this.token });
    return response.body;
  }

  async reject(logId: string, reason: string) {
    const response = await this.client.patch(`/api/behavior-logs/${logId}/verify`, {
      status: 'rejected',
      reason
    }, { token: this.token });
    return response.body;
  }

  async verifyAll(logIds: string[]) {
    const response = await this.client.post('/api/behavior-logs/bulk-verify', {
      logIds,
      status: 'verified'
    }, { token: this.token });
    return response.body;
  }

  async completeBriefing(data: BriefingData) {
    const response = await this.client.post('/api/briefings/complete', data, {
      token: this.token
    });
    return response.body;
  }

  async submitDailyEntry(data: DailyEntryData) {
    const response = await this.client.post('/api/daily-entries', data, {
      token: this.token
    });
    return response.body;
  }
}

export function createManagerActions(client: TestClient, token: string) {
  return new ManagerActions(client, token);
}
```

```typescript
// tests/helpers/admin-actions.ts
export class AdminActions {
  constructor(
    private client: TestClient,
    private token: string
  ) {}

  async createBehavior(data: CreateBehaviorData) {
    const response = await this.client.post('/api/behaviors', data, {
      token: this.token
    });
    return response.body;
  }

  async updateSettings(settings: Partial<OrgSettings>) {
    const response = await this.client.patch('/api/settings', settings, {
      token: this.token
    });
    return response.body;
  }

  async getCorrelations(options?: CorrelationOptions) {
    const params = new URLSearchParams(options as Record<string, string>);
    const response = await this.client.get(`/api/analytics/correlations?${params}`, {
      token: this.token
    });
    return response.body;
  }

  async generateReport(type: string, dateRange: DateRange) {
    const response = await this.client.post('/api/reports/generate', {
      type,
      ...dateRange
    }, { token: this.token });
    return response.body;
  }
}

export function createAdminActions(client: TestClient, token: string) {
  return new AdminActions(client, token);
}
```

### 8.2 Using Helpers in Tests

```typescript
// tests/scenarios/complete-workflow.test.ts
describe('Complete Daily Workflow', () => {
  let staff: StaffActions;
  let manager: ManagerActions;
  let admin: AdminActions;

  beforeEach(async () => {
    // ... setup ...
    staff = createStaffActions(client, staffToken);
    manager = createManagerActions(client, managerToken);
    admin = createAdminActions(client, adminToken);
  });

  it('simulates a complete business day', async () => {
    // Morning briefing
    await manager.completeBriefing({
      attendees: [staffUser.id],
      trainingTopicCovered: true,
      focusItems: ['Wine Pairing']
    });

    // Staff shift - log behaviors throughout the day
    const morningLogs = await staff.logBehaviors([
      { behaviorId: behaviors.winePairing.id, covers: 4, checkAmount: 180 },
      { behaviorId: behaviors.dessert.id, covers: 2, checkAmount: 95 }
    ]);

    // Manager spot-checks and verifies
    const pending = await manager.getPendingLogs();
    expect(pending).toHaveLength(2);
    await manager.verify(morningLogs[0].id, 'Confirmed with guest');

    // More staff activity
    const afternoonLogs = await staff.logBehaviors([
      { behaviorId: behaviors.winePairing.id, covers: 6, checkAmount: 320 },
      { behaviorId: behaviors.appetizer.id, covers: 4, checkAmount: 45 }
    ]);

    // End of day verification
    await manager.verifyAll([
      morningLogs[1].id,
      ...afternoonLogs.map(l => l.id)
    ]);

    // Submit daily entry
    const dailyEntry = await manager.submitDailyEntry({
      date: new Date().toISOString().split('T')[0],
      revenue: 4500,
      covers: 85
    });

    // Verify calculations
    expect(dailyEntry.avgCheck).toBeCloseTo(52.94, 2);

    // Check staff dashboard reflects the work
    const staffDashboard = await staff.getDashboard();
    expect(staffDashboard.behaviorsLoggedToday).toBe(4);
    expect(staffDashboard.behaviorsVerifiedToday).toBe(4);

    // Admin views analytics
    const correlations = await admin.getCorrelations({ days: 1 });
    expect(correlations).toBeDefined();
  });
});
```

---

## 9. Testing Infrastructure

### 9.1 Project Structure

```
tests/
├── utils/
│   ├── test-client.ts      # HTTP client wrapper
│   ├── database.ts         # DB setup/cleanup
│   └── auth.ts             # Login helpers
├── generators/
│   ├── index.ts            # Barrel export
│   ├── organization.ts     # Org generator
│   ├── user.ts             # User generator
│   ├── behavior.ts         # Behavior generator
│   ├── behavior-log.ts     # Log generator
│   └── daily-entry.ts      # Daily entry generator
├── helpers/
│   ├── staff-actions.ts    # Staff helper class
│   ├── manager-actions.ts  # Manager helper class
│   └── admin-actions.ts    # Admin helper class
├── unit/
│   ├── calculations/       # KPI calculation tests
│   └── correlation/        # Correlation tests
├── scenarios/
│   ├── behavior-verification.test.ts
│   ├── daily-operations.test.ts
│   ├── authorization.test.ts
│   └── complete-workflow.test.ts
├── ai/
│   ├── schema-validation.test.ts
│   ├── quality-assertions.test.ts
│   └── real-llm.test.ts
├── e2e/
│   ├── critical-flows.spec.ts
│   └── helpers.ts
└── setup.ts                # Vitest global setup
```

### 9.2 Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/unit/**/*.test.ts',
      'tests/scenarios/**/*.test.ts',
      'tests/ai/**/*.test.ts'
    ],
    exclude: ['tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    },
    poolOptions: {
      threads: {
        singleThread: true // Required for database tests
      }
    }
  }
});
```

### 9.3 Test Setup

```typescript
// tests/setup.ts
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, cleanupTestData } from './utils/database';

beforeAll(async () => {
  // Ensure test database exists and has schema
  await setupTestDatabase();
});

beforeEach(async () => {
  // Clean data between tests
  await cleanupTestData();
});

afterAll(async () => {
  // Final cleanup
  await cleanupTestData();
});
```

---

## 10. CI/CD Integration

### 10.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/topline_test

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3

  scenario-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: topline_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma db push
        env:
          DATABASE_URL: ${{ env.TEST_DATABASE_URL }}
      - run: npm run test:scenarios

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, scenario-tests]
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: topline_test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  ai-tests-nightly:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule' || github.event.inputs.run_ai_tests == 'true'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:ai:real
        env:
          RUN_REAL_LLM_TESTS: 'true'
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

### 10.2 NPM Scripts

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:scenarios",
    "test:unit": "vitest run tests/unit",
    "test:unit:watch": "vitest tests/unit",
    "test:scenarios": "vitest run tests/scenarios",
    "test:scenarios:watch": "vitest tests/scenarios",
    "test:ai": "vitest run tests/ai --exclude tests/ai/real-llm.test.ts",
    "test:ai:real": "RUN_REAL_LLM_TESTS=true vitest run tests/ai/real-llm.test.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:coverage": "vitest run --coverage",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

---

## 11. Agentic Development Workflow

### 11.1 The Build-Test-Review Loop

When implementing features, follow this workflow:

```
┌─────────────────────────────────────────────────────────────────┐
│                  AGENTIC DEVELOPMENT LOOP                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. UNDERSTAND                                                    │
│     ├── Read feature spec from docs/                             │
│     ├── Identify affected endpoints                               │
│     └── Note test scenarios needed                                │
│                                                                   │
│  2. IMPLEMENT                                                     │
│     ├── Write the feature code                                    │
│     ├── Follow architecture patterns                              │
│     └── Add inline documentation                                  │
│                                                                   │
│  3. TEST                                                          │
│     ├── Write unit tests for pure logic                          │
│     ├── Write HTTP scenario tests for flows                      │
│     ├── Run tests: npm run test                                  │
│     └── Fix any failures                                          │
│                                                                   │
│  4. VERIFY                                                        │
│     ├── Run full test suite                                       │
│     ├── Check coverage: npm run test:coverage                    │
│     ├── Verify no regressions                                     │
│     └── Run E2E if touching critical paths                       │
│                                                                   │
│  5. COMPLETE                                                      │
│     ├── All tests passing                                         │
│     ├── Coverage targets met                                      │
│     ├── Code follows architecture rules                           │
│     └── Mark task complete                                        │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    LOOP CONTINUES                          │    │
│  │                                                            │    │
│  │  If tests fail → Fix code → Re-run tests                  │    │
│  │  If new edge case found → Add test → Implement → Verify   │    │
│  │  If architecture violation → Refactor → Re-test           │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Test-Driven Feature Implementation

When implementing a new feature:

```typescript
// Step 1: Write the test first (it will fail)
describe('Bulk Behavior Verification', () => {
  it('manager can verify multiple behaviors at once', async () => {
    // Arrange
    const logs = await staff.logBehaviors([
      { behaviorId: behaviors[0].id },
      { behaviorId: behaviors[1].id },
      { behaviorId: behaviors[0].id }
    ]);

    // Act
    const result = await manager.verifyAll(logs.map(l => l.id));

    // Assert
    expect(result.verified).toBe(3);
    const pending = await manager.getPendingLogs();
    expect(pending).toHaveLength(0);
  });
});

// Step 2: Implement until test passes
// Step 3: Add edge case tests
// Step 4: Refactor if needed
// Step 5: Verify all tests still pass
```

### 11.3 Verification Checklist

Before marking any feature complete:

```markdown
## Feature Verification Checklist

### Tests Written
- [ ] Unit tests for any new pure functions
- [ ] HTTP scenario tests for the feature flow
- [ ] Edge case tests (empty input, invalid data, auth failures)
- [ ] Multi-role tests if feature involves role interactions

### Tests Passing
- [ ] `npm run test` - All unit and scenario tests pass
- [ ] No test warnings or skipped tests
- [ ] Coverage meets threshold (see section 13)

### Architecture Compliance
- [ ] No direct API calls in pages (use hooks)
- [ ] No mock data in page files
- [ ] UI components from components/ui/ used
- [ ] Loading and error states handled
- [ ] Component props are typed

### Documentation
- [ ] API endpoints documented if new
- [ ] Complex logic has inline comments
- [ ] README updated if setup changed
```

---

## 12. AI Operations Testing

### 12.1 Testing Strategy for AI

AI operations are HTTP endpoints with structured I/O. Test them like any other endpoint:

```
INPUT (controlled)  →  AI ENDPOINT  →  OUTPUT (validated)
     ↓                                        ↓
  Test Data                            Schema + Quality
```

### 12.2 Three Levels of AI Testing

| Level | What | When | Speed |
|-------|------|------|-------|
| **Schema** | Output matches Zod schema | Every commit | Fast (mocked LLM) |
| **Quality** | Output meets quality criteria | Every commit | Fast (mocked LLM) |
| **Real LLM** | Actual AI integration works | Nightly | Slow |

### 12.3 Schema Validation Tests

```typescript
// tests/ai/schema-validation.test.ts
import { describe, it, expect, vi } from 'vitest';
import { BehaviorSuggestionSchema } from '@/lib/ai/schemas';

// Mock the LLM client to return predictable responses
vi.mock('@/lib/ai/client', () => ({
  generateStructured: vi.fn().mockResolvedValue({
    behaviors: [
      {
        name: 'Suggest Wine Pairing',
        description: 'Recommend wine with entree orders',
        category: 'REVENUE',
        targetPerShift: 8,
        points: 3,
        rationale: 'Increases average check by $15-25'
      }
    ]
  })
}));

describe('AI Schema Validation', () => {
  it('behavior suggestions match schema', async () => {
    const response = await client.post('/api/ai/generate-behaviors', {
      industry: 'restaurant',
      role: 'server',
      focusKpis: ['AVERAGE_CHECK']
    }, { token: adminToken });

    const validation = BehaviorSuggestionSchema.safeParse(response.body);
    expect(validation.success).toBe(true);
  });

  it('handles missing optional fields', async () => {
    // Mock returns minimal response
    vi.mocked(generateStructured).mockResolvedValueOnce({
      behaviors: [{ name: 'Test', description: 'Test', category: 'REVENUE' }]
    });

    const response = await client.post('/api/ai/generate-behaviors', {
      industry: 'restaurant',
      role: 'server'
    }, { token: adminToken });

    // Should still pass schema validation with defaults
    expect(response.status).toBe(200);
  });
});
```

### 12.4 Quality Assertion Tests

```typescript
// tests/ai/quality-assertions.test.ts
describe('AI Quality Assertions', () => {
  it('behavior names are specific, not generic', async () => {
    const response = await client.post('/api/ai/generate-behaviors', {
      industry: 'restaurant',
      role: 'server',
      focusKpis: ['AVERAGE_CHECK']
    }, { token: adminToken });

    for (const behavior of response.body.behaviors) {
      // Names should be action-oriented
      expect(behavior.name).toMatch(/^(Suggest|Offer|Recommend|Present|Upsell)/);

      // Names should not be generic
      expect(behavior.name).not.toMatch(/^(Be better|Improve|Do more)/i);

      // Names should be concise
      expect(behavior.name.length).toBeLessThanOrEqual(50);
    }
  });

  it('recommendations are actionable', async () => {
    const response = await client.post('/api/ai/insights', {
      revenue: 4500,
      avgCheck: 55,
      adoptionRate: 78
    }, { token: adminToken });

    for (const insight of response.body.insights) {
      if (insight.recommendations) {
        for (const rec of insight.recommendations) {
          // Should contain action verbs
          const actionVerbs = ['should', 'try', 'consider', 'increase', 'focus', 'implement'];
          const hasAction = actionVerbs.some(v => rec.toLowerCase().includes(v));
          expect(hasAction).toBe(true);
        }
      }
    }
  });
});
```

---

## 13. Coverage Requirements

### 13.1 Coverage Targets

| Component | Line | Branch | Function |
|-----------|------|--------|----------|
| **Calculation Engine** | 95% | 90% | 100% |
| **API Routes** | 80% | 75% | 90% |
| **Hooks** | 85% | 80% | 90% |
| **AI Modules** | 80% | 75% | 90% |
| **Utilities** | 90% | 85% | 95% |

### 13.2 Measuring Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

### 13.3 Coverage Enforcement in CI

```yaml
# In CI workflow
- run: |
    npm run test:coverage
    # Fail if coverage drops below thresholds
    npx vitest run --coverage.thresholds.lines=80 \
                   --coverage.thresholds.branches=75 \
                   --coverage.thresholds.functions=85
```

---

## 14. Required Calculation Tests

### 14.1 Calculation Test Requirements

Every calculation in `docs/08-CALCULATION-ENGINE.md` MUST have unit tests. The agent implementing features should cross-reference that document.

**Mandatory Calculation Tests:**

| Category | Function | Edge Cases to Test |
|----------|----------|-------------------|
| **Benchmark** | `calculateDailyRevenueBenchmark` | daysOpenPerWeek=0, large revenue |
| **Benchmark** | `calculateAverageCheckBenchmark` | covers=0, industry fallback |
| **Benchmark** | `getMonthlyRevenueBenchmark` | no historical data, leap year |
| **KPI** | `calculateAverageCheck` | covers=0, fractional cents |
| **KPI** | `calculateCostOfSalesPercent` | revenue=0 |
| **KPI** | `calculateGOP` | all zeros, negative values |
| **KPI** | `calculateLaborPercent` | revenue=0 |
| **KPI** | `calculatePrimeCost` | revenue=0 |
| **KPI** | `calculateVariance` | budget=0, exact match (within 2%) |
| **Adoption** | `calculateAdoptionRate` | no behaviors, no users, no shifts |
| **Adoption** | `calculateUserAdoptionRate` | new user (no history) |
| **Adoption** | `calculateBehaviorAdoptionRate` | behavior not assigned to anyone |
| **Variance** | `calculatePeriodVariance` | previous=0, same values |
| **Variance** | `calculateBenchmarkVariance` | benchmark=0 |
| **Game State** | `determineGameState` | before open, after close, exactly on target |
| **Game State** | `determineMonthlyGameState` | first day of month, last day |
| **Correlation** | `calculatePearsonCorrelation` | n<3, perfect correlation, no correlation |
| **Correlation** | `calculateLaggedCorrelation` | lag > data length |
| **Correlation** | `findOptimalLag` | all negative correlations |
| **Leaderboard** | `calculateBehaviorLeaderboard` | ties, single user |
| **Leaderboard** | `calculateAvgCheckLeaderboard` | covers < minCovers |
| **Points** | `calculateBehaviorPoints` | max streak cap |
| **Points** | `calculateStreak` | first day, broken streak |
| **Fraud** | `detectBehaviorKpiMismatch` | new employee, team of 1 |
| **Fraud** | `detectStatisticalAnomaly` | < 7 days history |
| **Fraud** | `detectPatternChange` | first week of employment |

### 14.2 Calculation Test Pattern

```typescript
// tests/unit/calculations/[category].test.ts
describe('calculateAverageCheck', () => {
  // Happy path
  it('calculates correctly with valid inputs', () => {
    expect(calculateAverageCheck(5000, 100)).toBe(50);
  });

  // Edge: zero divisor
  it('returns 0 when covers is 0', () => {
    expect(calculateAverageCheck(5000, 0)).toBe(0);
  });

  // Edge: rounding
  it('rounds to 2 decimal places', () => {
    expect(calculateAverageCheck(333, 7)).toBe(47.57);
  });

  // Edge: large numbers
  it('handles large revenue values', () => {
    expect(calculateAverageCheck(1000000, 10000)).toBe(100);
  });

  // Edge: fractional inputs
  it('handles fractional covers', () => {
    expect(calculateAverageCheck(100, 3)).toBe(33.33);
  });
});
```

---

## 15. Edge Case Discovery Patterns

### 15.1 Systematic Edge Case Checklist

When implementing ANY feature, systematically check these edge cases:

#### Universal Edge Cases (Always Test)

| Category | Edge Cases |
|----------|-----------|
| **Zero/Empty** | 0, [], {}, null, undefined, '' |
| **Boundary** | Min value, max value, exactly at threshold |
| **Division** | Denominator = 0 |
| **Negative** | Negative numbers where positive expected |
| **Type** | Wrong type passed (string instead of number) |
| **Large** | Very large numbers, very long strings |
| **Unicode** | Special characters, emojis in names |

#### Topline-Specific Edge Cases

| Domain | Edge Cases |
|--------|-----------|
| **New Organization** | No historical data, no benchmarks set |
| **New Employee** | First day, no behavior history, no comparison data |
| **New Behavior** | Just added, no adoption data yet |
| **Time Boundaries** | First day of month, last day, leap year, DST changes |
| **Role Transitions** | Staff promoted to manager, access changes mid-session |
| **Empty Periods** | No revenue day, holiday, closed unexpectedly |
| **Single Data Point** | Only 1 user, only 1 behavior, only 1 day of data |

### 15.2 Edge Case Discovery Questions

Before writing tests, ask these questions:

```markdown
## Edge Case Discovery Checklist

### Inputs
- [ ] What happens with zero input?
- [ ] What happens with negative input?
- [ ] What happens with very large input?
- [ ] What happens with null/undefined?
- [ ] What happens with wrong type?

### State
- [ ] What happens on first use (empty database)?
- [ ] What happens with a single record?
- [ ] What happens at boundaries (start/end of period)?

### Time
- [ ] What happens at midnight?
- [ ] What happens on first/last day of month?
- [ ] What happens during DST transition?
- [ ] What happens with different timezones?

### Permissions
- [ ] What happens if user lacks permission?
- [ ] What happens if user's role changed?
- [ ] What happens if resource belongs to other org?

### Concurrency
- [ ] What happens if two users edit same thing?
- [ ] What happens if data changed during operation?
```

### 15.3 Edge Case Test Examples

```typescript
describe('Daily Briefing', () => {
  // New organization - no history
  it('handles organization with no historical data', async () => {
    const newOrg = await generateOrganization(prisma, { settings: {} });
    const response = await manager.getBriefingData();
    expect(response.yesterdayMetrics).toBeNull();
    expect(response.benchmarks).toEqual(DEFAULT_BENCHMARKS);
  });

  // First day of month
  it('calculates MTD correctly on first day of month', async () => {
    const firstOfMonth = new Date(2024, 5, 1); // June 1
    mockDate(firstOfMonth);
    const response = await manager.getBriefingData();
    expect(response.mtdRevenue).toBe(0);
    expect(response.mtdTarget).toBeGreaterThan(0);
  });

  // No staff scheduled
  it('handles day with no staff on schedule', async () => {
    await prisma.schedule.deleteMany({ where: { date: today } });
    const response = await manager.getBriefingData();
    expect(response.expectedStaff).toEqual([]);
    expect(response.canComplete).toBe(true); // Still completable
  });
});

describe('Correlation Analysis', () => {
  // Insufficient data
  it('returns null correlation with less than 3 data points', async () => {
    const data = await generateCorrelatedData(prisma, { days: 2 });
    const result = await admin.getCorrelations();
    expect(result.correlations).toEqual([]);
    expect(result.message).toContain('insufficient data');
  });

  // Perfect correlation
  it('detects perfect positive correlation', async () => {
    const data = await generateCorrelatedData(prisma, {
      targetCorrelation: 1.0,
      days: 30
    });
    const result = await admin.getCorrelations();
    expect(result.correlations[0].value).toBeGreaterThan(0.95);
  });
});
```

---

## 16. Multi-Role Interaction Matrix

### 16.1 Role Interaction Requirements

Topline has complex workflows where actions by one role affect others. These interactions MUST have multi-role tests.

**Role Interaction Matrix:**

| Action | Staff | Manager | Admin | Test Required |
|--------|-------|---------|-------|---------------|
| Log behavior | Creates | Sees pending | Sees all | Multi-role |
| Verify behavior | Sees status | Performs | Can override | Multi-role |
| Submit daily entry | N/A | Performs | Can edit | Single-role |
| Complete briefing | Sees attendance | Performs | N/A | Multi-role |
| View leaderboard | Sees own rank | Sees team | Sees all | Multi-role |
| Generate insights | N/A | Sees team | Sees all | Multi-role |
| Create behavior | N/A | N/A | Performs | Single-role |
| Update settings | N/A | N/A | Performs | Single-role |

### 16.2 Required Multi-Role Test Scenarios

Each of these workflows MUST have a multi-role scenario test:

```markdown
## Must-Have Multi-Role Tests

### Behavior Verification Flow
1. Staff logs behavior → status is 'pending'
2. Manager sees it in pending queue
3. Manager verifies → status is 'verified'
4. Staff sees it as 'verified'
5. Points awarded to staff

### Behavior Rejection Flow
1. Staff logs behavior
2. Manager rejects with reason
3. Staff sees rejection reason
4. Points NOT awarded

### Daily Entry Flow
1. Manager submits daily entry (revenue, covers)
2. Staff dashboard updates with new avg check
3. Leaderboard recalculates
4. Game state updates

### Briefing Attendance Flow
1. Manager marks staff as present
2. Staff sees they were marked present
3. Attendance affects adoption calculations

### Fraud Detection Flow
1. Staff logs unusually high behaviors
2. System generates fraud alert
3. Manager/Admin sees alert
4. Staff does NOT see alert

### Leaderboard Privacy
1. Staff sees own position and neighbors
2. Manager sees full team leaderboard
3. Admin sees all organizations
```

### 16.3 Multi-Role Test Template

```typescript
// tests/scenarios/[workflow].test.ts
describe('[Workflow Name] - Multi-Role', () => {
  let org: Organization;
  let staffUser: User;
  let managerUser: User;
  let adminUser: User;
  let staff: StaffActions;
  let manager: ManagerActions;
  let admin: AdminActions;

  beforeEach(async () => {
    // Setup all roles
    org = await generateOrganization(prisma);
    const users = await generateUsers(prisma, org.id);
    staffUser = users.staff[0];
    managerUser = users.managers[0];
    adminUser = users.admins[0];

    staff = createStaffActions(client, await getToken(staffUser));
    manager = createManagerActions(client, await getToken(managerUser));
    admin = createAdminActions(client, await getToken(adminUser));
  });

  it('[action] by staff → [visible change] for manager', async () => {
    // Staff performs action
    const result = await staff.someAction();

    // Manager sees the effect
    const managerView = await manager.getRelevantData();
    expect(managerView).toContain(result);
  });

  it('[action] by manager → [visible change] for staff', async () => {
    // Setup: Staff does prerequisite
    const item = await staff.createSomething();

    // Manager performs action
    await manager.actOnItem(item.id);

    // Staff sees the effect
    const staffView = await staff.getMyItems();
    expect(staffView[0].status).toBe('expected_status');
  });

  it('respects role boundaries', async () => {
    // Staff cannot perform manager action
    const response = await staff.tryManagerAction();
    expect(response.status).toBe(403);

    // Manager cannot perform admin action
    const response2 = await manager.tryAdminAction();
    expect(response2.status).toBe(403);
  });
});
```

### 16.4 Cross-Organization Tests

Organizations must be isolated. Always test:

```typescript
describe('Organization Isolation', () => {
  let org1: Organization;
  let org2: Organization;
  let staff1: StaffActions;
  let staff2: StaffActions;
  let manager1: ManagerActions;

  beforeEach(async () => {
    org1 = await generateOrganization(prisma, { name: 'Org 1' });
    org2 = await generateOrganization(prisma, { name: 'Org 2' });
    // ... setup users for both orgs
  });

  it('staff cannot see other org data', async () => {
    // Staff 2 logs behavior in org 2
    await staff2.logBehavior(behaviorId);

    // Staff 1 cannot see it
    const logs = await staff1.getMyLogs();
    expect(logs).toHaveLength(0);
  });

  it('manager cannot verify other org logs', async () => {
    // Staff 2 logs behavior
    const log = await staff2.logBehavior(behaviorId);

    // Manager 1 cannot verify it
    const response = await manager1.verify(log.id);
    expect(response.status).toBe(404); // Or 403
  });

  it('leaderboard only shows own org', async () => {
    // Both orgs have activity
    await staff1.logBehavior(behaviorId);
    await staff2.logBehavior(behaviorId);

    // Leaderboard for org 1 only shows org 1 users
    const leaderboard = await manager1.getLeaderboard();
    expect(leaderboard.every(e => e.organizationId === org1.id)).toBe(true);
  });
});
```

---

## Summary

The Topline testing strategy is built on pragmatic principles:

| Principle | Implementation |
|-----------|----------------|
| **HTTP-First** | Test through API endpoints, not mocks |
| **Real Database** | Use test database for integration tests |
| **Data Generators** | Generate realistic, controllable test data |
| **Multi-Role** | Test complete workflows across user roles |
| **AI as HTTP** | Test AI like any endpoint - input/output |
| **Minimal E2E** | Browser tests only for critical visual flows |

This approach provides comprehensive coverage with minimal complexity, enabling confident feature development and rapid iteration.

---

*This document is part of the Topline documentation suite. See [00-INDEX.md](./00-INDEX.md) for the complete list.*
