# Topline: System Architecture Specification

## Overview

This document provides a comprehensive technical architecture specification for the Topline system. It covers the monorepo structure, technology stack, data flow patterns, security architecture, and deployment strategies.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Technology Stack](#3-technology-stack)
4. [Package Architecture](#4-package-architecture)
5. [API Architecture](#5-api-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Database Architecture](#7-database-architecture)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Data Flow Patterns](#9-data-flow-patterns)
10. [Real-time & Background Jobs](#10-real-time--background-jobs)
11. [File Storage & Media](#11-file-storage--media)
12. [Caching Strategy](#12-caching-strategy)
13. [Error Handling](#13-error-handling)
14. [Monitoring & Observability](#14-monitoring--observability)
15. [Deployment Architecture](#15-deployment-architecture)
16. [Security Architecture](#16-security-architecture)
17. [Performance Optimization](#17-performance-optimization)
18. [Development Workflow](#18-development-workflow)

---

## 1. Architecture Overview

### 1.1 High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Staff iPad  │  │ Manager     │  │ Owner       │  │ Scoreboard  │        │
│  │ (Mobile)    │  │ (Tablet)    │  │ (Desktop)   │  │ (TV/Kiosk)  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CDN / EDGE                                        │
│                        (Vercel Edge Network)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  - Static asset caching                                                      │
│  - Middleware execution                                                      │
│  - Geographic distribution                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
          ┌────────────────────────┴────────────────────────┐
          │                                                 │
          ▼                                                 ▼
┌─────────────────────────────┐          ┌─────────────────────────────┐
│      NEXT.JS FRONTEND       │          │        HONO API             │
│      (apps/web)             │          │        (apps/api)           │
├─────────────────────────────┤          ├─────────────────────────────┤
│  - Server Components        │          │  - REST Endpoints           │
│  - Client Components        │          │  - OpenAPI/Swagger          │
│  - App Router               │          │  - JWT Auth                 │
│  - React Query              │          │  - Zod Validation           │
│  - Tailwind CSS             │          │  - Rate Limiting            │
└──────────────┬──────────────┘          └──────────────┬──────────────┘
               │                                        │
               │                                        │
               │         ┌───────────────────┐          │
               │         │   SHARED PACKAGE  │          │
               └────────►│   (packages/shared)│◄─────────┘
                         ├───────────────────┤
                         │  - Zod Schemas    │
                         │  - TypeScript Types│
                         │  - Utility Funcs  │
                         └───────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE PACKAGE                                     │
│                         (packages/db)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  - Prisma ORM                                                                │
│  - PostgreSQL                                                                │
│  - Migrations                                                                │
│  - Seed Data                                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
          ┌────────────────────────┴────────────────────────┐
          │                                                 │
          ▼                                                 ▼
┌─────────────────────────────┐          ┌─────────────────────────────┐
│      PRIMARY DATABASE       │          │      REDIS CACHE            │
│      (PostgreSQL)           │          │      (Future)               │
├─────────────────────────────┤          ├─────────────────────────────┤
│  - Neon / Supabase          │          │  - Session cache            │
│  - Connection pooling       │          │  - Rate limiting            │
│  - Read replicas (future)   │          │  - Real-time pub/sub        │
└─────────────────────────────┘          └─────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ AI Provider │  │ File Storage│  │ Email       │  │ Analytics   │        │
│  │ (OpenRouter)│  │ (S3/R2)     │  │ (Resend)    │  │ (PostHog)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles

| Principle | Description |
|-----------|-------------|
| **Monorepo** | Single repository with Turborepo for build orchestration |
| **Type Safety** | End-to-end TypeScript with Zod validation |
| **Schema First** | Shared Zod schemas define the contract between API and frontend |
| **Separation of Concerns** | Clear boundaries between packages |
| **Progressive Enhancement** | Core functionality works without JS |
| **Mobile First** | Designed for tablet/mobile primary use |

---

## 2. Monorepo Structure

### 2.1 Directory Layout

```
topline/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/               # App Router pages
│   │   │   ├── (app)/         # Authenticated routes
│   │   │   │   ├── admin/     # Owner/Admin pages
│   │   │   │   ├── manager/   # Manager pages
│   │   │   │   ├── staff/     # Staff pages
│   │   │   │   └── scoreboard/# Public scoreboard
│   │   │   ├── (auth)/        # Auth routes
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   └── questionnaire/ # Public questionnaire
│   │   ├── components/        # React components
│   │   │   ├── ui/            # Design system
│   │   │   ├── layout/        # Layout components
│   │   │   └── features/      # Feature components
│   │   ├── hooks/             # Custom hooks
│   │   │   ├── queries/       # React Query hooks
│   │   │   └── mutations/     # Mutation hooks
│   │   ├── lib/               # Utility libraries
│   │   ├── context/           # React contexts
│   │   ├── providers/         # Provider components
│   │   └── types/             # Frontend-specific types
│   │
│   └── api/                    # Hono API server
│       ├── src/
│       │   ├── routes/        # API route handlers
│       │   ├── middleware/    # Express-like middleware
│       │   ├── services/      # Business logic
│       │   └── utils/         # API utilities
│       └── tests/             # API tests
│
├── packages/
│   ├── db/                     # Database package
│   │   ├── prisma/
│   │   │   ├── schema.prisma  # Database schema
│   │   │   ├── migrations/    # Migration history
│   │   │   └── seed.ts        # Seed data
│   │   └── src/
│   │       └── index.ts       # Prisma client export
│   │
│   └── shared/                 # Shared code
│       └── src/
│           ├── schemas/       # Zod schemas
│           ├── types/         # TypeScript types
│           └── utils/         # Shared utilities
│
├── docs/                       # Documentation
├── turbo.json                  # Turborepo config
├── package.json                # Root package.json
└── .env.example                # Environment template
```

### 2.2 Package Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                         apps/web                                 │
│                      (Next.js Frontend)                          │
├─────────────────────────────────────────────────────────────────┤
│  Depends on: @topline/shared                                     │
│  Does NOT depend on: @topline/db, @topline/api                  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ imports
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       packages/shared                            │
│                     (Schemas & Types)                            │
├─────────────────────────────────────────────────────────────────┤
│  Depends on: zod                                                 │
│  No internal dependencies                                        │
└─────────────────────────────────────────────────────────────────┘
         ▲
         │ imports
         │
┌─────────────────────────────────────────────────────────────────┐
│                         apps/api                                 │
│                       (Hono API)                                 │
├─────────────────────────────────────────────────────────────────┤
│  Depends on: @topline/shared, @topline/db                       │
└─────────────────────────────────────────────────────────────────┘
         │
         │ imports
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        packages/db                               │
│                      (Prisma ORM)                                │
├─────────────────────────────────────────────────────────────────┤
│  Depends on: @prisma/client                                      │
│  No internal dependencies                                        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Turborepo Configuration

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    }
  }
}
```

---

## 3. Technology Stack

### 3.1 Core Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Next.js | 16.x | React framework with App Router |
| **UI Library** | React | 19.x | Component library |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **State** | React Query | 5.x | Server state management |
| **API Framework** | Hono | 4.x | Lightweight API framework |
| **Validation** | Zod | 3.x | Schema validation |
| **ORM** | Prisma | 6.x | Database ORM |
| **Database** | PostgreSQL | 15+ | Primary database |
| **Auth** | JOSE | 5.x | JWT handling |
| **Build** | Turborepo | 2.x | Monorepo build system |
| **Runtime** | Node.js | 20+ | Server runtime |
| **Language** | TypeScript | 5.x | Type safety |

### 3.2 Development Tools

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit testing |
| **Playwright** | E2E testing |
| **Testing Library** | Component testing |
| **MSW** | API mocking |
| **ESLint** | Linting |
| **Prettier** | Code formatting |

### 3.3 External Services

| Service | Provider Options | Purpose |
|---------|-----------------|---------|
| **Database** | Neon, Supabase, Railway | PostgreSQL hosting |
| **File Storage** | Cloudflare R2, AWS S3 | Receipt images, photos |
| **AI** | OpenRouter, OpenAI, Anthropic | AI features |
| **Email** | Resend, SendGrid | Transactional email |
| **Analytics** | PostHog, Mixpanel | Product analytics |
| **Hosting** | Vercel, Railway | Application hosting |

---

## 4. Package Architecture

### 4.1 @topline/shared

The shared package contains all type definitions, Zod schemas, and utilities used by both frontend and API.

```typescript
// packages/shared/src/index.ts
export * from './schemas'
export * from './types'
export * from './utils'
```

**Schema Categories:**

```typescript
// packages/shared/src/schemas/index.ts

// Enums
export const industrySchema = z.enum(['RESTAURANT', 'RETAIL', 'HOSPITALITY', 'OTHER'])
export const roleTypeSchema = z.enum([
  'ADMIN', 'MANAGER', 'SERVER', 'HOST', 'BARTENDER',
  'BUSSER', 'PURCHASER', 'CHEF', 'ACCOUNTANT', 'FACILITIES', 'CUSTOM'
])
export const kpiTypeSchema = z.enum([
  'REVENUE', 'AVERAGE_CHECK', 'COVERS', 'RATING', 'BEHAVIOR_COUNT',
  'GROSS_OPERATING_PROFIT', 'COST_OF_SALES', 'UTILITIES', 'CASH_FLOW',
  'ACCOUNTS_RECEIVABLE', 'BUDGET_VARIANCE', 'FOOD_COST', 'LABOR_COST'
])

// Entity Schemas
export const organizationSchema = z.object({...})
export const userSchema = z.object({...})
export const roleSchema = z.object({...})
export const behaviorSchema = z.object({...})
export const behaviorLogSchema = z.object({...})
export const dailyEntrySchema = z.object({...})
export const benchmarkSchema = z.object({...})

// Input Schemas
export const createUserSchema = z.object({...})
export const updateUserSchema = z.object({...})
export const loginSchema = z.object({...})

// API Response Schemas
export const paginationSchema = z.object({...})
export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) => ...
export const apiErrorSchema = z.object({...})
```

**Utility Functions:**

```typescript
// packages/shared/src/utils/index.ts

export function calculateAverageCheck(revenue: number, covers: number): number {
  if (covers === 0) return 0
  return revenue / covers
}

export function calculateDailyBenchmark(annualRevenue: number, daysPerYear: number): number {
  return annualRevenue / daysPerYear
}

export function calculateVariance(actual: number, expected: number): number {
  if (expected === 0) return 0
  return ((actual - expected) / expected) * 100
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}
```

### 4.2 @topline/db

Database package with Prisma client and schema.

```typescript
// packages/db/src/index.ts
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = globalThis.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export * from '@prisma/client'
```

---

## 5. API Architecture

### 5.1 Route Structure

```typescript
// apps/api/src/index.ts
import { OpenAPIHono } from '@hono/zod-openapi'

const app = new OpenAPIHono<Env>()

// Public routes (no auth)
app.route('/auth', auth)
app.route('/questionnaire', questionnaire)

// Protected routes (require auth)
app.use('/api/*', authMiddleware)
app.route('/api/organizations', organizations)
app.route('/api/users', users)
app.route('/api/roles', roles)
app.route('/api/behaviors', behaviors)
app.route('/api/behavior-logs', behaviorLogs)
app.route('/api/daily-entries', dailyEntries)
app.route('/api/kpis', kpis)
app.route('/api/budgets', budgets)
app.route('/api/briefings', briefings)
app.route('/api/training', training)
app.route('/api/reports', reports)
app.route('/api/insights', insights)
```

### 5.2 Route Handler Pattern

Each route follows a consistent pattern with OpenAPI documentation:

```typescript
// apps/api/src/routes/behaviors.ts
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { behaviorSchema, createBehaviorSchema } from '@topline/shared'
import { prisma } from '@topline/db'

const route = new OpenAPIHono<Env>()

// List behaviors
const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Behaviors'],
  summary: 'List all behaviors',
  request: {
    query: z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
      roleId: z.string().optional(),
      isActive: z.coerce.boolean().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of behaviors',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(behaviorSchema),
            meta: z.object({
              total: z.number(),
              page: z.number(),
              limit: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
  },
})

route.openapi(listRoute, async (c) => {
  const { organizationId } = c.get('auth')
  const { page, limit, roleId, isActive } = c.req.valid('query')

  const where = {
    organizationId,
    ...(roleId && { roles: { some: { id: roleId } } }),
    ...(isActive !== undefined && { isActive }),
  }

  const [data, total] = await Promise.all([
    prisma.behavior.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: { roles: true },
      orderBy: { name: 'asc' },
    }),
    prisma.behavior.count({ where }),
  ])

  return c.json({
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
})

// Create behavior
const createRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Behaviors'],
  summary: 'Create a new behavior',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createBehaviorSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created behavior',
      content: {
        'application/json': {
          schema: behaviorSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
    },
  },
})

route.openapi(createRoute, async (c) => {
  const { organizationId } = c.get('auth')
  const body = c.req.valid('json')

  const behavior = await prisma.behavior.create({
    data: {
      ...body,
      organizationId,
      roles: body.roleIds ? {
        connect: body.roleIds.map(id => ({ id }))
      } : undefined,
    },
    include: { roles: true },
  })

  return c.json(behavior, 201)
})

export default route
```

### 5.3 Middleware Stack

```typescript
// apps/api/src/middleware/auth.ts
import { createMiddleware } from 'hono/factory'
import { jwtVerify } from 'jose'

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    c.set('auth', {
      userId: payload.sub as string,
      organizationId: payload.organizationId as string,
      roleType: payload.roleType as string,
    })

    await next()
  } catch {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)
  }
})
```

```typescript
// apps/api/src/middleware/error-handler.ts
import { createMiddleware } from 'hono/factory'
import { ZodError } from 'zod'
import { Prisma } from '@topline/db'

export const errorHandler = createMiddleware(async (c, next) => {
  try {
    await next()
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.flatten(),
        },
      }, 400)
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return c.json({
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'A record with this value already exists',
          },
        }, 409)
      }
      if (error.code === 'P2025') {
        return c.json({
          error: {
            code: 'NOT_FOUND',
            message: 'Record not found',
          },
        }, 404)
      }
    }

    console.error('Unhandled error:', error)
    return c.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, 500)
  }
})
```

### 5.4 API Endpoint Summary

| Category | Endpoint | Methods | Description |
|----------|----------|---------|-------------|
| **Auth** | `/auth/login` | POST | Email/password login |
| | `/auth/register` | POST | Create account |
| | `/auth/pin` | POST | PIN-based staff login |
| | `/auth/refresh` | POST | Refresh JWT |
| **Organizations** | `/api/organizations` | GET, PATCH | Manage organization |
| | `/api/organizations/settings` | GET, PATCH | Organization settings |
| **Users** | `/api/users` | GET, POST | List/create users |
| | `/api/users/:id` | GET, PATCH, DELETE | Manage user |
| | `/api/users/:id/pin` | PATCH | Update PIN |
| **Roles** | `/api/roles` | GET, POST | List/create roles |
| | `/api/roles/:id` | GET, PATCH, DELETE | Manage role |
| **Behaviors** | `/api/behaviors` | GET, POST | List/create behaviors |
| | `/api/behaviors/:id` | GET, PATCH, DELETE | Manage behavior |
| **Behavior Logs** | `/api/behavior-logs` | GET, POST | List/log behaviors |
| | `/api/behavior-logs/:id` | GET, DELETE | Manage log |
| | `/api/behavior-logs/:id/verify` | PATCH | Verify behavior |
| **Daily Entries** | `/api/daily-entries` | GET, POST | List/create entries |
| | `/api/daily-entries/:id` | GET, PATCH | Manage entry |
| **KPIs** | `/api/kpis` | GET, POST | List/create KPIs |
| | `/api/kpis/:id` | PATCH, DELETE | Manage KPI |
| | `/api/kpis/values` | GET, POST | KPI daily values |
| **Budgets** | `/api/budgets` | GET, POST | List/create budgets |
| | `/api/budgets/:id` | GET, PATCH, DELETE | Manage budget |
| | `/api/budgets/:id/items` | GET, POST | Budget line items |
| | `/api/budgets/:id/variance` | GET | Variance report |
| **Briefings** | `/api/briefings/today` | GET | Today's briefing |
| | `/api/briefings/complete` | POST | Complete briefing |
| | `/api/briefings/history` | GET | Briefing history |
| **Training** | `/api/training/topics` | GET, POST | Training topics |
| | `/api/training/sessions` | GET, POST | Training sessions |
| | `/api/training/attendance` | PATCH | Mark attendance |
| **Reports** | `/api/reports/weekly` | GET | Weekly summary |
| | `/api/reports/monthly` | GET | Monthly summary |
| | `/api/reports/correlation` | GET | Correlation analysis |
| **Insights** | `/api/insights/generate` | POST | Generate AI insight |
| | `/api/insights/coach` | POST | AI coach message |
| **Questionnaire** | `/questionnaire` | POST | Submit questionnaire |

---

## 6. Frontend Architecture

### 6.1 App Router Structure

```
apps/web/app/
├── (app)/                      # Authenticated layout
│   ├── layout.tsx              # Sidebar + header
│   ├── admin/                  # Owner/Admin section
│   │   ├── page.tsx            # Dashboard
│   │   ├── behaviors/          # Behavior management
│   │   ├── budget/             # Budget management
│   │   ├── insights/           # AI insights
│   │   ├── roles/              # Role management
│   │   ├── settings/           # Organization settings
│   │   └── users/              # User management
│   ├── manager/                # Manager section
│   │   ├── page.tsx            # Manager dashboard
│   │   ├── briefing/           # Daily briefing
│   │   ├── daily-entry/        # End of day entry
│   │   └── verification/       # Behavior verification
│   ├── staff/                  # Staff section
│   │   ├── page.tsx            # Staff dashboard
│   │   └── quick-log/          # Quick behavior log
│   └── scoreboard/             # Scoreboard display
│       └── page.tsx
├── (auth)/                     # Auth layout
│   ├── layout.tsx              # Minimal layout
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── questionnaire/              # Public questionnaire
│   └── page.tsx
├── layout.tsx                  # Root layout
├── page.tsx                    # Landing/redirect
├── globals.css                 # Global styles
└── error.tsx                   # Error boundary
```

### 6.2 Component Architecture

**Design System (`components/ui/`):**

```typescript
// Core UI components
Button          // Primary, secondary, ghost, danger variants
Input           // Text, number, password, with validation
Select          // Native select with styling
Textarea        // Multi-line input
Checkbox        // With label support
Radio           // Radio groups
Toggle          // Boolean toggle
Card            // Container with header/body/footer
Modal           // Dialog overlay
Toast           // Notification system
Badge           // Status indicators
Avatar          // User avatar with emoji fallback
Spinner         // Loading indicator
Progress        // Progress bars
Tabs            // Tab navigation
Table           // Data table with sorting/pagination
Chart           // Recharts wrapper for consistent styling
```

**Layout Components (`components/layout/`):**

```typescript
Sidebar         // Navigation sidebar
Header          // Top header bar
PageContainer   // Standard page wrapper
PageHeader      // Title + actions
Section         // Content section with heading
Grid            // Responsive grid layouts
Stack           // Flex stack (vertical/horizontal)
```

**Feature Components (`components/features/`):**

```typescript
// Staff
BehaviorButton        // Large tap target for logging
BehaviorGrid          // Grid of behavior buttons
QuickLogModal         // Quick log with metadata
ProgressIndicator     // Daily progress ring
StreakDisplay         // Streak counter

// Manager
BriefingWizard        // Multi-step briefing
VerificationList      // Behaviors to verify
DailyEntryForm        // Revenue/covers form
TeamSelector          // Select team for briefing

// Owner
KpiCard               // KPI metric display
TrendChart            // Recharts line/area chart
LeaderboardTable      // Ranked staff list
InsightCard           // AI-generated insight
BudgetTable           // Budget vs actual
VarianceIndicator     // Variance with color coding

// Common
Scoreboard            // Main scoreboard display
GameStateIndicator    // Winning/Losing/Neutral
MetricTile            // Single metric with trend
DateRangePicker       // Date range selection
SearchFilter          // Search + filter bar
EmptyState            // No data placeholder
```

### 6.3 State Management

**React Query for Server State:**

```typescript
// apps/web/hooks/queries/useBehaviors.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Behavior, CreateBehaviorInput } from '@topline/shared'

// Query keys
export const behaviorKeys = {
  all: ['behaviors'] as const,
  lists: () => [...behaviorKeys.all, 'list'] as const,
  list: (filters: BehaviorFilters) => [...behaviorKeys.lists(), filters] as const,
  details: () => [...behaviorKeys.all, 'detail'] as const,
  detail: (id: string) => [...behaviorKeys.details(), id] as const,
}

// Fetch behaviors
export function useBehaviors(filters: BehaviorFilters = {}) {
  return useQuery({
    queryKey: behaviorKeys.list(filters),
    queryFn: () => api.behaviors.list(filters),
  })
}

// Fetch single behavior
export function useBehavior(id: string) {
  return useQuery({
    queryKey: behaviorKeys.detail(id),
    queryFn: () => api.behaviors.get(id),
    enabled: !!id,
  })
}

// Create behavior mutation
export function useCreateBehavior() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBehaviorInput) => api.behaviors.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: behaviorKeys.lists() })
    },
  })
}

// Update behavior mutation
export function useUpdateBehavior() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBehaviorInput }) =>
      api.behaviors.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: behaviorKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: behaviorKeys.lists() })
    },
  })
}
```

**React Context for Client State:**

```typescript
// apps/web/context/AppContext.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react'

interface AppState {
  gameState: 'winning' | 'losing' | 'neutral' | 'celebrating'
  isCelebrating: boolean
  selectedLocationId: string | null
  dateRange: { start: Date; end: Date }
}

type AppAction =
  | { type: 'SET_GAME_STATE'; payload: AppState['gameState'] }
  | { type: 'START_CELEBRATION' }
  | { type: 'END_CELEBRATION' }
  | { type: 'SET_LOCATION'; payload: string | null }
  | { type: 'SET_DATE_RANGE'; payload: { start: Date; end: Date } }

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload }
    case 'START_CELEBRATION':
      return { ...state, isCelebrating: true, gameState: 'celebrating' }
    case 'END_CELEBRATION':
      return { ...state, isCelebrating: false }
    case 'SET_LOCATION':
      return { ...state, selectedLocationId: action.payload }
    case 'SET_DATE_RANGE':
      return { ...state, dateRange: action.payload }
    default:
      return state
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    gameState: 'neutral',
    isCelebrating: false,
    selectedLocationId: null,
    dateRange: {
      start: new Date(new Date().setDate(new Date().getDate() - 7)),
      end: new Date(),
    },
  })

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
```

### 6.4 API Client

```typescript
// apps/web/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

class ApiClient {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new ApiError(response.status, error.error?.message || 'Request failed')
    }

    return response.json()
  }

  // Auth
  auth = {
    login: (data: LoginInput) =>
      this.fetch<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    register: (data: RegisterInput) =>
      this.fetch<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    pinLogin: (pin: string) =>
      this.fetch<{ token: string; user: User }>('/auth/pin', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      }),
  }

  // Behaviors
  behaviors = {
    list: (params?: BehaviorFilters) =>
      this.fetch<PaginatedResponse<Behavior>>(`/api/behaviors?${qs(params)}`),
    get: (id: string) =>
      this.fetch<Behavior>(`/api/behaviors/${id}`),
    create: (data: CreateBehaviorInput) =>
      this.fetch<Behavior>('/api/behaviors', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateBehaviorInput) =>
      this.fetch<Behavior>(`/api/behaviors/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.fetch<void>(`/api/behaviors/${id}`, { method: 'DELETE' }),
  }

  // Similar patterns for other resources...
}

export const api = new ApiClient()

// Helper for query params
function qs(params?: Record<string, any>): string {
  if (!params) return ''
  return new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString()
}

// Custom error class
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}
```

---

## 7. Database Architecture

### 7.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│  Organization   │       │     Location    │
├─────────────────┤       ├─────────────────┤
│ id              │───┬───│ organizationId  │
│ name            │   │   │ name            │
│ industry        │   │   │ address         │
│ settings        │   │   └─────────────────┘
└─────────────────┘   │           │
        │             │           │
        │             │           ▼
        │             │   ┌─────────────────┐
        │             │   │   DailyEntry    │
        │             │   ├─────────────────┤
        │             │   │ locationId      │
        │             │   │ date            │
        │             │   │ totalRevenue    │
        │             │   │ totalCovers     │
        │             │   └─────────────────┘
        │             │
        ▼             │
┌─────────────────┐   │   ┌─────────────────┐
│      User       │   │   │    Benchmark    │
├─────────────────┤   │   ├─────────────────┤
│ organizationId  │◄──┼───│ organizationId  │
│ email           │   │   │ year            │
│ roleId          │   │   │ totalRevenue    │
│ name            │   │   │ daysOpen        │
└─────────────────┘   │   │ baselineAvgCheck│
        │             │   └─────────────────┘
        │             │
        ▼             │
┌─────────────────┐   │   ┌─────────────────┐
│      Role       │   │   │    Behavior     │
├─────────────────┤   │   ├─────────────────┤
│ organizationId  │◄──┼───│ organizationId  │
│ name            │   │   │ name            │
│ type            │   │   │ targetPerDay    │
│ permissions     │◄─────►│ points          │
└─────────────────┘   │   └─────────────────┘
                      │           │
                      │           │
                      │           ▼
┌─────────────────┐   │   ┌─────────────────┐
│   BehaviorLog   │   │   │       Kpi       │
├─────────────────┤   │   ├─────────────────┤
│ userId          │   │───│ organizationId  │
│ behaviorId      │   │   │ name            │
│ locationId      │   │   │ type            │
│ verified        │   │   │ target          │
│ verifiedById    │   │   └─────────────────┘
└─────────────────┘   │           │
                      │           ▼
                      │   ┌─────────────────┐
                      │   │  DailyKpiValue  │
                      │   ├─────────────────┤
                      │   │ kpiId           │
                      │   │ locationId      │
                      │   │ date            │
                      │   │ value           │
                      │   └─────────────────┘
                      │
                      │   ┌─────────────────┐
                      │   │     Budget      │
                      │   ├─────────────────┤
                      │───│ organizationId  │
                      │   │ periodStart     │
                      │   │ periodEnd       │
                      │   └─────────────────┘
                      │           │
                      │           ▼
                      │   ┌─────────────────┐
                      │   │ BudgetLineItem  │
                      │   ├─────────────────┤
                      │   │ budgetId        │
                      │   │ category        │
                      │   │ budgeted        │
                      │   │ actual          │
                      │   └─────────────────┘
                      │
                      │   ┌─────────────────┐
                      │   │ TrainingTopic   │
                      │   ├─────────────────┤
                      │───│ organizationId  │
                          │ name            │
                          │ content         │
                          └─────────────────┘
                                  │
                                  ▼
                          ┌─────────────────┐
                          │TrainingSession  │
                          ├─────────────────┤
                          │ topicId         │
                          │ date            │
                          │ completed       │
                          └─────────────────┘
                                  │
                                  ▼
                          ┌─────────────────┐
                          │TrainingAttendance│
                          ├─────────────────┤
                          │ sessionId       │
                          │ userId          │
                          │ present         │
                          └─────────────────┘
```

### 7.2 Indexing Strategy

```prisma
// High-traffic query indexes

// Behavior logs - queried by user and date range
@@index([userId, createdAt])
@@index([behaviorId, createdAt])
@@index([locationId, createdAt])

// Daily entries - queried by location and date
@@unique([locationId, date])
@@index([date])

// KPI values - queried by KPI and date
@@unique([kpiId, locationId, date])
@@index([date])

// Training - queried by date
@@index([date])

// Budget - queried by period
@@index([periodStart, periodEnd])
```

### 7.3 Data Retention Policy

| Data Type | Retention | Reason |
|-----------|-----------|--------|
| Behavior Logs | Forever | Historical analysis |
| Daily Entries | Forever | KPI tracking |
| KPI Values | Forever | Trend analysis |
| Training Records | Forever | Compliance |
| Budget Data | 7 years | Financial records |
| User Data | Until deletion | Privacy |

---

## 8. Authentication & Authorization

### 8.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    OWNER/MANAGER LOGIN                           │
├─────────────────────────────────────────────────────────────────┤
│  1. User enters email + password                                 │
│  2. Server validates credentials via bcrypt                      │
│  3. Server creates JWT with:                                     │
│     - sub: userId                                                │
│     - organizationId                                             │
│     - roleType                                                   │
│     - exp: 7 days                                                │
│  4. Token returned to client                                     │
│  5. Client stores in localStorage + cookie                       │
│  6. All API requests include Authorization: Bearer {token}       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      STAFF PIN LOGIN                             │
├─────────────────────────────────────────────────────────────────┤
│  1. Staff enters 4-digit PIN on shared device                    │
│  2. Server looks up user by PIN within organization              │
│  3. Server creates JWT with limited scope:                       │
│     - sub: userId                                                │
│     - organizationId                                             │
│     - roleType: staff type                                       │
│     - exp: 8 hours (shift duration)                              │
│  4. Token returned to client                                     │
│  5. Client stores in sessionStorage only                         │
│  6. Token clears on browser close                                │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 JWT Structure

```typescript
// Token payload
interface JWTPayload {
  sub: string           // userId
  organizationId: string
  roleType: RoleType
  permissions: string[]
  iat: number           // Issued at
  exp: number           // Expiration
}

// Generate token
async function generateToken(user: User): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)

  return await new SignJWT({
    sub: user.id,
    organizationId: user.organizationId,
    roleType: user.role.type,
    permissions: user.role.permissions,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(user.role.type === 'ADMIN' ? '7d' : '8h')
    .sign(secret)
}
```

### 8.3 Role-Based Access Control

```typescript
// Permission constants
const PERMISSIONS = {
  // Organization
  ORG_VIEW: 'org:view',
  ORG_EDIT: 'org:edit',

  // Users
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',

  // Roles
  ROLES_VIEW: 'roles:view',
  ROLES_MANAGE: 'roles:manage',

  // Behaviors
  BEHAVIORS_VIEW: 'behaviors:view',
  BEHAVIORS_LOG: 'behaviors:log',
  BEHAVIORS_VERIFY: 'behaviors:verify',
  BEHAVIORS_MANAGE: 'behaviors:manage',

  // Daily Entries
  ENTRIES_VIEW: 'entries:view',
  ENTRIES_CREATE: 'entries:create',
  ENTRIES_EDIT: 'entries:edit',

  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',

  // Budget
  BUDGET_VIEW: 'budget:view',
  BUDGET_MANAGE: 'budget:manage',

  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
} as const

// Default permissions by role type
const ROLE_DEFAULTS: Record<RoleType, string[]> = {
  ADMIN: Object.values(PERMISSIONS), // All permissions
  MANAGER: [
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.ROLES_VIEW,
    PERMISSIONS.BEHAVIORS_VIEW,
    PERMISSIONS.BEHAVIORS_VERIFY,
    PERMISSIONS.ENTRIES_VIEW,
    PERMISSIONS.ENTRIES_CREATE,
    PERMISSIONS.ENTRIES_EDIT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.BUDGET_VIEW,
  ],
  SERVER: [
    PERMISSIONS.BEHAVIORS_VIEW,
    PERMISSIONS.BEHAVIORS_LOG,
  ],
  // Similar for other role types...
}
```

### 8.4 Authorization Middleware

```typescript
// apps/api/src/middleware/authorize.ts
import { createMiddleware } from 'hono/factory'

export function requirePermission(...permissions: string[]) {
  return createMiddleware<Env>(async (c, next) => {
    const auth = c.get('auth')

    if (!auth) {
      return c.json({ error: { code: 'UNAUTHORIZED' } }, 401)
    }

    // Admins have all permissions
    if (auth.roleType === 'ADMIN') {
      return await next()
    }

    const hasPermission = permissions.every(p =>
      auth.permissions.includes(p)
    )

    if (!hasPermission) {
      return c.json({ error: { code: 'FORBIDDEN' } }, 403)
    }

    await next()
  })
}

// Usage in routes
route.use('/behaviors', requirePermission(PERMISSIONS.BEHAVIORS_VIEW))
route.post('/behaviors', requirePermission(PERMISSIONS.BEHAVIORS_MANAGE))
```

---

## 9. Data Flow Patterns

### 9.1 Behavior Logging Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Staff  │     │ Frontend│     │   API   │     │   DB    │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │  Tap button   │               │               │
     │──────────────►│               │               │
     │               │               │               │
     │               │  POST /api/   │               │
     │               │  behavior-logs│               │
     │               │──────────────►│               │
     │               │               │               │
     │               │               │  INSERT log   │
     │               │               │──────────────►│
     │               │               │               │
     │               │               │  Return log   │
     │               │◄──────────────│◄──────────────│
     │               │               │               │
     │  Update UI    │               │               │
     │  + animation  │               │               │
     │◄──────────────│               │               │
     │               │               │               │
     │               │  Invalidate   │               │
     │               │  queries      │               │
     │               │──────────────►│               │
     │               │               │               │
```

### 9.2 Daily Entry Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Manager │     │ Frontend│     │   API   │     │   DB    │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │  Enter data   │               │               │
     │──────────────►│               │               │
     │               │               │               │
     │               │  POST /api/   │               │
     │               │  daily-entries│               │
     │               │──────────────►│               │
     │               │               │               │
     │               │               │  Create/Update│
     │               │               │  DailyEntry   │
     │               │               │──────────────►│
     │               │               │               │
     │               │               │  Calculate    │
     │               │               │  derived KPIs │
     │               │               │──────────────►│
     │               │               │               │
     │               │               │  Update       │
     │               │               │  DailyKpiValue│
     │               │               │──────────────►│
     │               │               │               │
     │               │               │  Check game   │
     │               │               │  state        │
     │               │               │──────────────►│
     │               │               │               │
     │               │  Return with  │               │
     │               │  game state   │               │
     │◄──────────────│◄──────────────│               │
     │               │               │               │
     │  Celebration? │               │               │
     │◄──────────────│               │               │
```

### 9.3 Verification Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Manager │     │ Frontend│     │   API   │     │   DB    │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │  View pending │               │               │
     │──────────────►│               │               │
     │               │               │               │
     │               │  GET /api/    │               │
     │               │  behavior-logs│               │
     │               │  ?verified=   │               │
     │               │  false        │               │
     │               │──────────────►│               │
     │               │               │  Query logs   │
     │               │◄──────────────│◄──────────────│
     │               │               │               │
     │  Display list │               │               │
     │◄──────────────│               │               │
     │               │               │               │
     │  Verify log   │               │               │
     │──────────────►│               │               │
     │               │               │               │
     │               │  PATCH /api/  │               │
     │               │  behavior-logs│               │
     │               │  /:id/verify  │               │
     │               │──────────────►│               │
     │               │               │               │
     │               │               │  Update log   │
     │               │               │  verified=true│
     │               │               │  verifiedById │
     │               │               │  verifiedAt   │
     │               │               │──────────────►│
     │               │               │               │
     │               │               │  Update user  │
     │               │               │  points       │
     │               │               │──────────────►│
     │               │               │               │
     │  Update UI    │◄──────────────│◄──────────────│
     │◄──────────────│               │               │
```

---

## 10. Real-time & Background Jobs

### 10.1 Real-time Updates (Future)

For real-time scoreboard updates, we'll implement Server-Sent Events (SSE):

```typescript
// apps/api/src/routes/events.ts
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'

const events = new Hono<Env>()

events.get('/scoreboard/:orgId', async (c) => {
  const { orgId } = c.req.param()

  return streamSSE(c, async (stream) => {
    // Send initial data
    const data = await getScoreboardData(orgId)
    await stream.writeSSE({ data: JSON.stringify(data), event: 'scoreboard' })

    // Subscribe to updates
    const unsubscribe = subscribe(orgId, async (update) => {
      await stream.writeSSE({ data: JSON.stringify(update), event: 'update' })
    })

    // Clean up on disconnect
    stream.onAbort(() => {
      unsubscribe()
    })

    // Keep connection alive
    while (true) {
      await stream.writeSSE({ data: '', event: 'ping' })
      await new Promise(resolve => setTimeout(resolve, 30000))
    }
  })
})
```

### 10.2 Background Jobs

For scheduled tasks, we'll use a job queue:

```typescript
// Job types
interface Job {
  id: string
  type: JobType
  payload: unknown
  scheduledFor: Date
  status: 'pending' | 'running' | 'completed' | 'failed'
}

type JobType =
  | 'GENERATE_WEEKLY_REPORT'
  | 'GENERATE_INSIGHTS'
  | 'SYNC_REVIEWS'
  | 'SEND_REMINDER'
  | 'CLEANUP_OLD_DATA'

// Job handlers
const jobHandlers: Record<JobType, (payload: any) => Promise<void>> = {
  GENERATE_WEEKLY_REPORT: async ({ organizationId }) => {
    const report = await generateWeeklyReport(organizationId)
    await sendReportEmail(organizationId, report)
  },

  GENERATE_INSIGHTS: async ({ organizationId }) => {
    const insights = await generateAIInsights(organizationId)
    await storeInsights(organizationId, insights)
  },

  SYNC_REVIEWS: async ({ organizationId }) => {
    const reviews = await fetchGoogleReviews(organizationId)
    await storeReviews(organizationId, reviews)
  },

  SEND_REMINDER: async ({ userId, type }) => {
    const message = getReminderMessage(type)
    await sendPushNotification(userId, message)
  },

  CLEANUP_OLD_DATA: async ({ organizationId }) => {
    await pruneOldSessions(organizationId)
  },
}
```

### 10.3 Scheduled Jobs

```typescript
// Cron schedule
const SCHEDULES = {
  // Weekly reports - Monday 6 AM
  'GENERATE_WEEKLY_REPORT': '0 6 * * 1',

  // Insights - Daily 2 AM
  'GENERATE_INSIGHTS': '0 2 * * *',

  // Review sync - Every 6 hours
  'SYNC_REVIEWS': '0 */6 * * *',

  // Cleanup - Sunday 3 AM
  'CLEANUP_OLD_DATA': '0 3 * * 0',
}
```

---

## 11. File Storage & Media

### 11.1 Storage Architecture

```typescript
// Storage configuration
const storageConfig = {
  provider: 'cloudflare-r2', // or 'aws-s3'
  bucket: process.env.STORAGE_BUCKET,
  region: 'auto',
  publicUrl: process.env.STORAGE_PUBLIC_URL,
}

// File types and limits
const FILE_LIMITS = {
  receipt: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  attendance: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png'],
  },
  avatar: {
    maxSize: 1 * 1024 * 1024, // 1MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
}
```

### 11.2 Upload Flow

```typescript
// apps/api/src/routes/uploads.ts
import { Hono } from 'hono'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const uploads = new Hono<Env>()

// Generate presigned URL for direct upload
uploads.post('/presign', async (c) => {
  const { filename, contentType, category } = await c.req.json()
  const { organizationId } = c.get('auth')

  const limits = FILE_LIMITS[category]
  if (!limits.allowedTypes.includes(contentType)) {
    return c.json({ error: 'Invalid file type' }, 400)
  }

  const key = `${organizationId}/${category}/${Date.now()}-${filename}`

  const command = new PutObjectCommand({
    Bucket: storageConfig.bucket,
    Key: key,
    ContentType: contentType,
  })

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

  return c.json({
    uploadUrl: url,
    publicUrl: `${storageConfig.publicUrl}/${key}`,
    key,
  })
})
```

---

## 12. Caching Strategy

### 12.1 Cache Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      CACHING LAYERS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Browser Cache (HTTP headers)                                 │
│     - Static assets: 1 year (immutable)                         │
│     - API responses: no-store (dynamic)                         │
│                                                                  │
│  2. React Query Cache (Client)                                   │
│     - staleTime: 5 minutes (configurable)                       │
│     - gcTime: 30 minutes                                        │
│                                                                  │
│  3. Edge Cache (Vercel/CDN) - Future                            │
│     - Public pages (scoreboard): 1 minute                       │
│     - Static assets: 1 year                                     │
│                                                                  │
│  4. Redis Cache - Future                                         │
│     - Session data: 24 hours                                    │
│     - Computed KPIs: 5 minutes                                  │
│     - Leaderboards: 1 minute                                    │
│                                                                  │
│  5. Database Query Cache (Prisma)                               │
│     - Connection pooling                                        │
│     - Query optimization                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 12.2 React Query Configuration

```typescript
// apps/web/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 30 * 60 * 1000,         // 30 minutes
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
})
```

### 12.3 Cache Invalidation Patterns

```typescript
// Invalidation on mutations
const useCreateBehaviorLog = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createBehaviorLog,
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['behavior-logs'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['scoreboard'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })
}
```

---

## 13. Error Handling

### 13.1 Error Types

```typescript
// packages/shared/src/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, details)
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Permission denied') {
    super('FORBIDDEN', message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409)
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('RATE_LIMIT', 'Too many requests', 429)
  }
}
```

### 13.2 Frontend Error Handling

```typescript
// apps/web/components/ErrorBoundary.tsx
'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo)
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={() => this.setState({ hasError: false })}>
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 13.3 API Error Responses

```typescript
// Standard error response format
interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

// Example responses
// 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "fieldErrors": {
        "email": ["Invalid email format"]
      }
    }
  }
}

// 401 Unauthorized
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}

// 404 Not Found
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Behavior not found"
  }
}

// 409 Conflict
{
  "error": {
    "code": "DUPLICATE_ENTRY",
    "message": "A behavior with this name already exists"
  }
}

// 500 Internal Error
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## 14. Monitoring & Observability

### 14.1 Logging Strategy

```typescript
// Structured logging
interface LogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  context?: {
    requestId?: string
    userId?: string
    organizationId?: string
    path?: string
    method?: string
    duration?: number
    error?: {
      name: string
      message: string
      stack?: string
    }
  }
}

// Logger implementation
const logger = {
  info: (message: string, context?: LogEntry['context']) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
    }))
  },

  error: (message: string, error: Error, context?: LogEntry['context']) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context: {
        ...context,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
    }))
  },
}
```

### 14.2 Metrics to Track

| Category | Metric | Description |
|----------|--------|-------------|
| **API** | Request count | Total requests by endpoint |
| | Response time | p50, p95, p99 latency |
| | Error rate | 4xx and 5xx responses |
| | Active users | Concurrent authenticated users |
| **Business** | Behaviors logged | Count per hour/day |
| | Verification rate | % of behaviors verified |
| | Active organizations | Organizations with activity |
| | DAU/WAU/MAU | Active users over time |
| **Performance** | Database query time | Slow query tracking |
| | Cache hit rate | React Query cache effectiveness |
| | Page load time | Core Web Vitals |

### 14.3 Health Checks

```typescript
// apps/api/src/routes/health.ts
app.get('/health', async (c) => {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkExternalServices(),
  ])

  const healthy = checks.every(c => c.status === 'fulfilled')

  return c.json({
    status: healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: {
      database: checks[0].status === 'fulfilled' ? 'ok' : 'error',
      redis: checks[1].status === 'fulfilled' ? 'ok' : 'error',
      external: checks[2].status === 'fulfilled' ? 'ok' : 'error',
    },
  }, healthy ? 200 : 503)
})
```

---

## 15. Deployment Architecture

### 15.1 Environment Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│                     ENVIRONMENTS                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LOCAL (Development)                                             │
│  ├── Next.js: localhost:3000                                    │
│  ├── API: localhost:8787                                        │
│  ├── DB: localhost:5432 (Docker)                                │
│  └── .env.local                                                 │
│                                                                  │
│  PREVIEW (PR Deployments)                                        │
│  ├── Vercel Preview URL                                         │
│  ├── API: Railway preview                                       │
│  ├── DB: Neon branch                                            │
│  └── Environment isolation                                      │
│                                                                  │
│  STAGING                                                         │
│  ├── staging.topline.app                                        │
│  ├── api-staging.topline.app                                    │
│  ├── DB: Neon staging branch                                    │
│  └── Mirrors production config                                  │
│                                                                  │
│  PRODUCTION                                                      │
│  ├── app.topline.app                                            │
│  ├── api.topline.app                                            │
│  ├── DB: Neon production                                        │
│  └── Full monitoring + alerting                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 15.2 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy-preview:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel Preview
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel Production
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-args: '--prod'
```

### 15.3 Infrastructure Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE                                │
│                     (DNS + CDN + WAF)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│     VERCEL      │  │    RAILWAY      │  │   CLOUDFLARE    │
│   (Frontend)    │  │     (API)       │  │      R2         │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ Next.js App     │  │ Hono API        │  │ File Storage    │
│ Edge Functions  │  │ Auto-scaling    │  │ Receipt images  │
│ ISR Caching     │  │ Health checks   │  │ Training photos │
└─────────────────┘  └─────────────────┘  └─────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          NEON                                    │
│                    (PostgreSQL + Branching)                      │
├─────────────────────────────────────────────────────────────────┤
│ - Production branch                                              │
│ - Preview branches (per PR)                                      │
│ - Connection pooling                                             │
│ - Automatic backups                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 16. Security Architecture

### 16.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. NETWORK LAYER                                                │
│     ├── Cloudflare WAF (DDoS protection)                        │
│     ├── TLS 1.3 everywhere                                      │
│     └── Rate limiting at edge                                   │
│                                                                  │
│  2. APPLICATION LAYER                                            │
│     ├── JWT authentication                                      │
│     ├── RBAC authorization                                      │
│     ├── Input validation (Zod)                                  │
│     ├── SQL injection prevention (Prisma)                       │
│     └── XSS prevention (React)                                  │
│                                                                  │
│  3. DATA LAYER                                                   │
│     ├── Encrypted at rest (AES-256)                             │
│     ├── Encrypted in transit (TLS)                              │
│     ├── Password hashing (bcrypt)                               │
│     └── Audit logging                                           │
│                                                                  │
│  4. INFRASTRUCTURE LAYER                                         │
│     ├── Environment isolation                                   │
│     ├── Secret management                                       │
│     ├── Least privilege access                                  │
│     └── Regular security updates                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 16.2 Data Protection

```typescript
// Sensitive field handling
const SENSITIVE_FIELDS = [
  'passwordHash',
  'pin',
  'refreshToken',
]

// Exclude from API responses
function sanitizeUser(user: User) {
  const { passwordHash, ...safe } = user
  return safe
}

// Encryption for stored data
const encryptionKey = process.env.ENCRYPTION_KEY

function encrypt(data: string): string {
  // AES-256-GCM encryption
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv)
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`
}

function decrypt(data: string): string {
  const [ivHex, encryptedHex, tagHex] = data.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString()
}
```

### 16.3 API Security

```typescript
// Rate limiting
const rateLimits = {
  login: { window: '15m', max: 5 },      // 5 attempts per 15 minutes
  api: { window: '1m', max: 100 },       // 100 requests per minute
  upload: { window: '1h', max: 50 },     // 50 uploads per hour
}

// CORS configuration
const corsConfig = {
  origin: [
    process.env.FRONTEND_URL,
    /\.topline\.app$/,
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}

// Content Security Policy
const csp = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': ["'self'", process.env.API_URL],
}
```

---

## 17. Performance Optimization

### 17.1 Frontend Optimization

```typescript
// Code splitting
const AdminDashboard = dynamic(() => import('./AdminDashboard'), {
  loading: () => <DashboardSkeleton />,
})

// Image optimization
import Image from 'next/image'

<Image
  src={receipt.imageUrl}
  alt="Receipt"
  width={400}
  height={600}
  placeholder="blur"
  blurDataURL={receipt.thumbnail}
/>

// Route prefetching
<Link href="/admin/behaviors" prefetch={true}>
  Manage Behaviors
</Link>

// Suspense boundaries
<Suspense fallback={<CardSkeleton />}>
  <KpiCard kpiId={kpi.id} />
</Suspense>
```

### 17.2 API Optimization

```typescript
// Query optimization
const behaviors = await prisma.behavior.findMany({
  where: { organizationId },
  select: {
    id: true,
    name: true,
    targetPerDay: true,
    _count: {
      select: { logs: true },
    },
  },
  take: 20,
  orderBy: { name: 'asc' },
})

// Parallel queries
const [behaviors, users, kpis] = await Promise.all([
  prisma.behavior.findMany({ where: { organizationId } }),
  prisma.user.findMany({ where: { organizationId } }),
  prisma.kpi.findMany({ where: { organizationId } }),
])

// Connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=10&pool_timeout=10',
    },
  },
})
```

### 17.3 Database Optimization

```sql
-- Analyze slow queries
EXPLAIN ANALYZE
SELECT b.*, COUNT(bl.id) as log_count
FROM "Behavior" b
LEFT JOIN "BehaviorLog" bl ON bl."behaviorId" = b.id
WHERE b."organizationId" = 'xxx'
GROUP BY b.id;

-- Create covering indexes
CREATE INDEX behavior_logs_covering
ON "BehaviorLog" ("userId", "behaviorId", "createdAt")
INCLUDE ("verified", "metadata");

-- Partition large tables (future)
CREATE TABLE behavior_logs (
  LIKE "BehaviorLog" INCLUDING ALL
) PARTITION BY RANGE ("createdAt");
```

---

## 18. Development Workflow

### 18.1 Local Setup

```bash
# Clone repository
git clone https://github.com/topline/topline.git
cd topline

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# Start database (Docker)
docker compose up -d

# Push schema to database
npm run db:push

# Seed database
npm run db:seed

# Start development servers
npm run dev

# Access:
# - Frontend: http://localhost:3000
# - API: http://localhost:8787
# - Swagger: http://localhost:8787/docs
# - Prisma Studio: npx prisma studio
```

### 18.2 Common Commands

```bash
# Development
npm run dev              # Start all services
npm run build            # Build all packages
npm run lint             # Run ESLint
npm run test             # Run unit tests
npm run test:e2e         # Run Playwright tests

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:migrate       # Create migration
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio

# Individual packages
npm run dev --filter=web     # Only frontend
npm run dev --filter=api     # Only API
npm run test --filter=web    # Only web tests
```

### 18.3 Code Standards

| Area | Standard |
|------|----------|
| **TypeScript** | Strict mode, no any |
| **React** | Functional components, hooks |
| **Naming** | camelCase (vars), PascalCase (components) |
| **Files** | kebab-case for files |
| **Commits** | Conventional commits |
| **Tests** | Co-located with source |
| **Comments** | JSDoc for public APIs |

### 18.4 Git Workflow

```
main (production)
│
├── develop (staging)
│   │
│   ├── feature/XXX-description
│   ├── fix/XXX-description
│   └── chore/XXX-description
│
└── hotfix/XXX-description (emergency fixes)
```

**Commit Convention:**
```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Scope: web, api, db, shared, docs

Examples:
feat(web): add behavior verification page
fix(api): handle null benchmark gracefully
docs: update API specification
```

---

## Appendix A: Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/topline

# Authentication
JWT_SECRET=your-256-bit-secret
JWT_REFRESH_SECRET=your-refresh-secret

# API
PORT=8787
CORS_ORIGINS=http://localhost:3000,https://app.topline.app

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8787

# AI
OPENROUTER_API_KEY=sk-or-xxx
OPENAI_API_KEY=sk-xxx

# Storage
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=topline-uploads
STORAGE_PUBLIC_URL=https://uploads.topline.app

# Email
RESEND_API_KEY=re_xxx

# Analytics
POSTHOG_KEY=phc_xxx
```

---

## Appendix B: API Response Examples

See [06-API-SPECIFICATION.md](./06-API-SPECIFICATION.md) for complete API documentation.

---

## Appendix C: Database Schema

See [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) for complete schema documentation.
