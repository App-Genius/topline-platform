# Topline: Database Schema Specification

## Overview

This document provides the complete database schema specification for the Topline system, including all tables, relationships, indexes, constraints, and data modeling decisions.

---

## Table of Contents

1. [Schema Design Principles](#1-schema-design-principles)
2. [Entity Overview](#2-entity-overview)
3. [Core Entities](#3-core-entities)
4. [Behavior System](#4-behavior-system)
5. [KPI & Metrics](#5-kpi--metrics)
6. [Budget System](#6-budget-system)
7. [Training System](#7-training-system)
8. [Questionnaire](#8-questionnaire)
9. [Future Entities](#9-future-entities)
10. [Indexes & Performance](#10-indexes--performance)
11. [Data Integrity](#11-data-integrity)
12. [Migration Strategy](#12-migration-strategy)
13. [Seed Data](#13-seed-data)

---

## 1. Schema Design Principles

### 1.1 Design Goals

| Principle | Description |
|-----------|-------------|
| **Multi-tenancy** | All data scoped to organization via `organizationId` |
| **Soft Deletes** | Use `isActive` flags instead of hard deletes where appropriate |
| **Audit Trail** | `createdAt` and `updatedAt` on all entities |
| **Type Safety** | Enums for categorical data, strong foreign keys |
| **Normalization** | 3NF for transactional data, denormalization for reporting |
| **Scalability** | Designed for horizontal scaling via organization sharding |

### 1.2 Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Tables | PascalCase | `BehaviorLog` |
| Columns | camelCase | `organizationId` |
| Foreign Keys | `{table}Id` | `userId`, `behaviorId` |
| Timestamps | `*At` suffix | `createdAt`, `verifiedAt` |
| Booleans | `is*` or `has*` prefix | `isActive`, `hasCompleted` |
| Enums | SCREAMING_SNAKE_CASE | `RESTAURANT`, `AVERAGE_CHECK` |

### 1.3 Common Patterns

```prisma
// Standard entity pattern
model Entity {
  id             String   @id @default(cuid())
  organizationId String
  // ... fields
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
}
```

---

## 2. Entity Overview

### 2.1 Entity Relationship Diagram

```
                                ┌─────────────────┐
                                │  Organization   │
                                └────────┬────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                │               │               │                │
        ▼                ▼               ▼               ▼                ▼
┌───────────────┐ ┌───────────┐ ┌───────────────┐ ┌───────────┐ ┌───────────────┐
│   Location    │ │   User    │ │   Behavior    │ │    Kpi    │ │    Budget     │
└───────┬───────┘ └─────┬─────┘ └───────┬───────┘ └─────┬─────┘ └───────┬───────┘
        │               │               │               │               │
        │               │               ▼               ▼               ▼
        │               │       ┌───────────────┐ ┌───────────┐ ┌───────────────┐
        │               │       │ BehaviorLog   │ │DailyKpiVal│ │BudgetLineItem │
        │               └──────►│               │ └───────────┘ └───────────────┘
        │                       └───────────────┘
        ▼
┌───────────────┐
│  DailyEntry   │
└───────────────┘

Additional Entities:
- Role (links User to permissions and behaviors)
- Benchmark (annual baseline data)
- TrainingTopic, TrainingSession, TrainingAttendance
- QuestionnaireSubmission
```

### 2.2 Entity Summary

| Entity | Purpose | Key Relationships |
|--------|---------|-------------------|
| **Organization** | Multi-tenant container | Parent of all entities |
| **User** | System users (all roles) | → Organization, Role |
| **Role** | User role definitions | → Organization, ↔ Behaviors |
| **Location** | Physical locations | → Organization |
| **Behavior** | Lead measure definitions | → Organization, ↔ Roles |
| **BehaviorLog** | Behavior instances | → User, Behavior, Location |
| **Kpi** | Lag measure definitions | → Organization |
| **DailyKpiValue** | Daily KPI values | → Kpi, Location |
| **DailyEntry** | Daily revenue/covers | → Location |
| **Benchmark** | Annual baselines | → Organization |
| **Budget** | Budget periods | → Organization |
| **BudgetLineItem** | Budget line items | → Budget, Location |
| **TrainingTopic** | Training content | → Organization |
| **TrainingSession** | Training instances | → TrainingTopic |
| **TrainingAttendance** | Attendance records | → Session, User |

---

## 3. Core Entities

### 3.1 Organization

The root entity for multi-tenancy. All data belongs to exactly one organization.

```prisma
model Organization {
  id        String   @id @default(cuid())
  name      String
  industry  Industry @default(RESTAURANT)
  settings  Json     @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  users          User[]
  roles          Role[]
  behaviors      Behavior[]
  kpis           Kpi[]
  locations      Location[]
  benchmarks     Benchmark[]
  budgets        Budget[]
  trainingTopics TrainingTopic[]
}

enum Industry {
  RESTAURANT
  RETAIL
  HOSPITALITY
  OTHER
}
```

**Settings JSON Structure:**
```typescript
interface OrganizationSettings {
  // Display preferences
  scoreboard: {
    showRevenue: boolean       // Privacy: hide actual revenue
    primaryMetric: 'avgCheck' | 'behaviors' | 'rating'
    refreshInterval: number    // Seconds
  }

  // Game state thresholds
  gameState: {
    winningThreshold: number   // % above benchmark
    losingThreshold: number    // % below benchmark
  }

  // Notification preferences
  notifications: {
    dailyReminder: boolean
    weeklyReport: boolean
    budgetAlerts: boolean
  }

  // Feature flags
  features: {
    aiInsights: boolean
    receiptScanning: boolean
    anonymousFeedback: boolean
  }
}
```

### 3.2 User

All system users including owners, managers, and staff.

```prisma
model User {
  id             String   @id @default(cuid())
  email          String   @unique
  passwordHash   String
  name           String
  avatar         String?              // Emoji avatar
  pin            String?              // 4-digit PIN for staff login
  organizationId String
  roleId         String
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization       Organization         @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  role               Role                 @relation(fields: [roleId], references: [id])
  behaviorLogs       BehaviorLog[]
  verifiedLogs       BehaviorLog[]        @relation("VerifiedBy")
  trainingAttendance TrainingAttendance[]
  dailyEntriesCreated DailyEntry[]        @relation("CreatedBy")

  @@index([organizationId])
  @@index([pin, organizationId])
}
```

**Key Behaviors:**
- `email` is globally unique across all organizations
- `pin` is unique within an organization (validated at application level)
- `passwordHash` uses bcrypt with cost factor 12
- `avatar` stores emoji string (e.g., "👨‍🍳")

### 3.3 Role

Defines user roles with permissions and associated behaviors.

```prisma
model Role {
  id             String   @id @default(cuid())
  name           String
  type           RoleType
  permissions    Json     @default("[]")  // Array of permission strings
  organizationId String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  users        User[]
  behaviors    Behavior[]   @relation("RoleBehaviors")

  @@unique([organizationId, name])
  @@index([organizationId])
}

enum RoleType {
  ADMIN       // Full system access
  MANAGER     // Operational management
  SERVER      // Frontline - serves customers
  HOST        // Frontline - greeting/seating
  BARTENDER   // Frontline - bar service
  BUSSER      // Frontline - table clearing
  PURCHASER   // Back office - procurement
  CHEF        // Back office - kitchen
  ACCOUNTANT  // Back office - finance
  FACILITIES  // Back office - maintenance
  CUSTOM      // Custom role
}
```

**Permission System:**
```typescript
// Permission string format: "resource:action"
const permissions = [
  'org:view',
  'org:edit',
  'users:view',
  'users:create',
  'users:edit',
  'users:delete',
  'roles:view',
  'roles:manage',
  'behaviors:view',
  'behaviors:log',
  'behaviors:verify',
  'behaviors:manage',
  'entries:view',
  'entries:create',
  'entries:edit',
  'reports:view',
  'reports:export',
  'budget:view',
  'budget:manage',
  'settings:view',
  'settings:edit',
]
```

### 3.4 Location

Physical business locations (supports multi-location organizations).

```prisma
model Location {
  id             String   @id @default(cuid())
  name           String
  address        String?
  timezone       String   @default("America/New_York")
  organizationId String
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization  Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  dailyEntries  DailyEntry[]
  behaviorLogs  BehaviorLog[]
  kpiValues     DailyKpiValue[]
  budgetItems   BudgetLineItem[]

  @@unique([organizationId, name])
  @@index([organizationId])
}
```

---

## 4. Behavior System

### 4.1 Behavior (Lead Measures)

Defines behaviors that staff can log. These are the "lead measures" in 4DX.

```prisma
model Behavior {
  id             String   @id @default(cuid())
  name           String
  description    String?
  category       BehaviorCategory @default(REVENUE)
  frequency      BehaviorFrequency @default(PER_SHIFT)
  targetPerDay   Int      @default(0)    // Expected daily count
  points         Int      @default(1)    // Points per behavior
  kpiId          String?                 // Associated KPI (optional)
  isActive       Boolean  @default(true)
  organizationId String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  roles        Role[]        @relation("RoleBehaviors")
  logs         BehaviorLog[]
  kpi          Kpi?          @relation(fields: [kpiId], references: [id])

  @@unique([organizationId, name])
  @@index([organizationId])
  @@index([category])
}

enum BehaviorCategory {
  REVENUE         // Upselling, cross-selling
  COST_CONTROL    // Vendor comparisons, waste reduction
  QUALITY         // Customer service, standards
  COMPLIANCE      // Procedures, safety, documentation
}

enum BehaviorFrequency {
  PER_SHIFT       // Each shift (default for staff)
  PER_DAY         // Once per day
  PER_WEEK        // Once per week
  PER_MONTH       // Once per month
}
```

**Category Examples:**

| Category | Example Behaviors |
|----------|-------------------|
| REVENUE | Upsell appetizer, Suggest wine pairing, Offer dessert |
| COST_CONTROL | Compare vendor prices, Document waste, Energy check |
| QUALITY | Table touch, Customer feedback request, Standards check |
| COMPLIANCE | Opening checklist, Closing checklist, Safety inspection |

### 4.2 BehaviorLog

Records each instance of a behavior being logged by a user.

```prisma
model BehaviorLog {
  id           String    @id @default(cuid())
  userId       String
  behaviorId   String
  locationId   String?
  metadata     Json      @default("{}")
  verified     Boolean   @default(false)
  verifiedById String?
  verifiedAt   DateTime?
  createdAt    DateTime  @default(now())

  // Relations
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  behavior   Behavior  @relation(fields: [behaviorId], references: [id], onDelete: Cascade)
  location   Location? @relation(fields: [locationId], references: [id])
  verifiedBy User?     @relation("VerifiedBy", fields: [verifiedById], references: [id])

  @@index([userId, createdAt])
  @@index([behaviorId, createdAt])
  @@index([locationId, createdAt])
  @@index([verified, createdAt])
}
```

**Metadata JSON Structure:**
```typescript
interface BehaviorLogMetadata {
  // Optional context
  tableNumber?: string
  checkAmount?: number
  notes?: string

  // Receipt data (if scanned)
  receipt?: {
    imageUrl: string
    extractedTotal: number
    extractedCovers: number
    extractedItems: string[]
    confidence: number
  }

  // Device info
  device?: {
    type: 'tablet' | 'phone' | 'desktop'
    os: string
  }
}
```

### 4.3 Role-Behavior Junction

The many-to-many relationship between roles and behaviors is managed via Prisma's implicit many-to-many:

```prisma
// In Role
behaviors Behavior[] @relation("RoleBehaviors")

// In Behavior
roles     Role[]     @relation("RoleBehaviors")
```

This creates an implicit junction table `_RoleBehaviors` with columns:
- `A` → `Behavior.id`
- `B` → `Role.id`

---

## 5. KPI & Metrics

### 5.1 Kpi (Lag Measures)

Defines the KPIs that the organization tracks. These are the "lag measures" in 4DX.

```prisma
model Kpi {
  id             String   @id @default(cuid())
  name           String
  type           KpiType
  target         Float?               // Target value
  warningThreshold Float?             // Warning level
  criticalThreshold Float?            // Critical level
  unit           String?              // "$", "%", "count"
  displayFormat  String   @default("number")  // "currency", "percent", "number"
  isActive       Boolean  @default(true)
  organizationId String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  dailyValues  DailyKpiValue[]
  behaviors    Behavior[]

  @@unique([organizationId, type])
  @@index([organizationId])
}

enum KpiType {
  // Revenue metrics
  REVENUE
  AVERAGE_CHECK
  COVERS

  // Operational metrics
  RATING
  BEHAVIOR_COUNT

  // Financial metrics
  GROSS_OPERATING_PROFIT
  COST_OF_SALES
  FOOD_COST
  LABOR_COST
  UTILITIES
  CASH_FLOW
  ACCOUNTS_RECEIVABLE
  BUDGET_VARIANCE
}
```

**KPI Type Details:**

| Type | Unit | Input Method | Calculation |
|------|------|--------------|-------------|
| REVENUE | $ | Manual/POS | Sum of daily revenue |
| AVERAGE_CHECK | $ | Calculated | Revenue / Covers |
| COVERS | count | Manual | Direct entry |
| RATING | 1-5 | External API | Average of reviews |
| BEHAVIOR_COUNT | count | Calculated | Sum of verified behaviors |
| GROSS_OPERATING_PROFIT | % | Calculated | (Revenue - Costs) / Revenue |
| COST_OF_SALES | % | Manual | COGS / Revenue |
| FOOD_COST | % | Manual | Food COGS / Revenue |
| LABOR_COST | % | Manual | Labor / Revenue |
| UTILITIES | $ | Manual | Direct entry |
| CASH_FLOW | $ | Manual | Net cash position |
| ACCOUNTS_RECEIVABLE | days | Calculated | Outstanding / Daily Revenue |
| BUDGET_VARIANCE | % | Calculated | (Actual - Budget) / Budget |

### 5.2 DailyKpiValue

Stores the daily values for each KPI by location.

```prisma
model DailyKpiValue {
  id         String   @id @default(cuid())
  kpiId      String
  locationId String
  date       DateTime @db.Date
  value      Float
  notes      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Relations
  kpi      Kpi      @relation(fields: [kpiId], references: [id], onDelete: Cascade)
  location Location @relation(fields: [locationId], references: [id], onDelete: Cascade)

  @@unique([kpiId, locationId, date])
  @@index([date])
  @@index([locationId, date])
}
```

### 5.3 DailyEntry

The primary daily data entry for revenue and covers.

```prisma
model DailyEntry {
  id           String   @id @default(cuid())
  locationId   String
  date         DateTime @db.Date
  totalRevenue Float    @default(0)
  totalCovers  Int      @default(0)
  notes        String?
  createdById  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  location  Location @relation(fields: [locationId], references: [id], onDelete: Cascade)
  createdBy User?    @relation("CreatedBy", fields: [createdById], references: [id])
  reviews   Review[]

  @@unique([locationId, date])
  @@index([date])
}
```

### 5.4 Review

Stores customer reviews from external sources.

```prisma
model Review {
  id           String   @id @default(cuid())
  dailyEntryId String
  source       ReviewSource
  rating       Float
  text         String?
  reviewerName String?
  externalId   String?          // ID from external system
  reviewedAt   DateTime?
  createdAt    DateTime @default(now())

  // Relations
  dailyEntry DailyEntry @relation(fields: [dailyEntryId], references: [id], onDelete: Cascade)

  @@index([source, externalId])
}

enum ReviewSource {
  GOOGLE
  TRIPADVISOR
  YELP
  MANUAL
}
```

### 5.5 Benchmark

Stores annual baseline data for comparison.

```prisma
model Benchmark {
  id               String   @id @default(cuid())
  organizationId   String
  year             Int
  totalRevenue     Float
  daysOpen         Int
  baselineAvgCheck Float
  baselineRating   Float    @default(4.0)
  baselineCosPercent Float?  @default(30)
  baselineGopPercent Float?  @default(15)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([organizationId, year])
  @@index([organizationId])
}
```

**Derived Calculations:**

```typescript
// Daily revenue benchmark
const dailyRevenueBenchmark = benchmark.totalRevenue / benchmark.daysOpen

// Daily covers benchmark (estimated)
const dailyCoversBenchmark = dailyRevenueBenchmark / benchmark.baselineAvgCheck
```

---

## 6. Budget System

### 6.1 Budget

Defines budget periods for tracking actual vs. budgeted performance.

```prisma
model Budget {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  periodStart    DateTime @db.Date
  periodEnd      DateTime @db.Date
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  lineItems    BudgetLineItem[]

  @@index([periodStart, periodEnd])
  @@index([organizationId])
}
```

### 6.2 BudgetLineItem

Individual line items within a budget.

```prisma
model BudgetLineItem {
  id         String         @id @default(cuid())
  budgetId   String
  locationId String?                      // Null for org-wide
  category   BudgetCategory
  name       String
  budgeted   Float
  actual     Float          @default(0)
  notes      String?
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt

  // Relations
  budget   Budget    @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  location Location? @relation(fields: [locationId], references: [id])

  @@index([budgetId])
  @@index([category])
}

enum BudgetCategory {
  REVENUE       // Expected revenue
  COGS          // Cost of goods sold
  LABOR         // Payroll and benefits
  UTILITIES     // Electric, gas, water
  RENT          // Rent and CAM
  MARKETING     // Advertising and promotion
  MAINTENANCE   // Repairs and upkeep
  OTHER         // Miscellaneous
}
```

**Budget Calculations:**

```typescript
// Variance calculation
interface BudgetVariance {
  budgeted: number
  actual: number
  variance: number        // actual - budgeted
  variancePercent: number // ((actual - budgeted) / budgeted) * 100
  status: 'under' | 'on-track' | 'over'
}

function calculateVariance(budgeted: number, actual: number): BudgetVariance {
  const variance = actual - budgeted
  const variancePercent = budgeted === 0 ? 0 : (variance / budgeted) * 100

  let status: 'under' | 'on-track' | 'over'
  if (variancePercent < -5) status = 'under'
  else if (variancePercent > 5) status = 'over'
  else status = 'on-track'

  return { budgeted, actual, variance, variancePercent, status }
}
```

---

## 7. Training System

### 7.1 TrainingTopic

Defines training content that can be delivered during briefings.

```prisma
model TrainingTopic {
  id             String   @id @default(cuid())
  name           String
  description    String?
  content        String?  @db.Text    // Markdown content
  videoUrl       String?
  duration       Int?                 // Minutes
  roleTypes      RoleType[]           // Which roles this applies to
  priority       Int      @default(0) // For scheduling rotation
  organizationId String
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization Organization      @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  sessions     TrainingSession[]

  @@unique([organizationId, name])
  @@index([organizationId])
}
```

### 7.2 TrainingSession

Records when training is delivered (during daily briefings).

```prisma
model TrainingSession {
  id          String   @id @default(cuid())
  topicId     String
  locationId  String
  date        DateTime @db.Date
  completed   Boolean  @default(false)
  notes       String?
  photoUrl    String?              // Signed attendance sheet
  completedBy String?              // Manager who completed it
  completedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  topic      TrainingTopic        @relation(fields: [topicId], references: [id], onDelete: Cascade)
  attendance TrainingAttendance[]

  @@unique([topicId, locationId, date])
  @@index([date])
  @@index([locationId, date])
}
```

### 7.3 TrainingAttendance

Tracks individual attendance at training sessions.

```prisma
model TrainingAttendance {
  id        String   @id @default(cuid())
  sessionId String
  userId    String
  present   Boolean  @default(false)
  signature String?              // Digital signature (future)
  createdAt DateTime @default(now())

  // Relations
  session TrainingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user    User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([sessionId, userId])
}
```

---

## 8. Questionnaire

### 8.1 QuestionnaireSubmission

Stores pre-qualification questionnaire responses.

```prisma
model QuestionnaireSubmission {
  id             String   @id @default(cuid())
  email          String
  companyName    String
  industry       Industry
  employeeCount  String
  responses      Json                // Structured answers
  scores         Json                // Calculated scores per category
  contacted      Boolean  @default(false)
  convertedToOrg String?             // Organization ID if converted
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([email])
  @@index([createdAt])
  @@index([contacted])
}
```

**Responses JSON Structure:**

```typescript
interface QuestionnaireResponses {
  // Revenue section
  revenueGrowth: 1 | 2 | 3 | 4 | 5    // Rate concern (1=not concerned, 5=very)
  revenueConcern: boolean              // Specific revenue concern?

  // Cost section
  costIncrease: 1 | 2 | 3 | 4 | 5     // Rate cost concern
  trackCostOfSales: boolean            // Currently tracking CoS?

  // Team section
  teamContribution: 1 | 2 | 3 | 4 | 5 // Team awareness rating
  retentionIssues: boolean             // Experiencing turnover?

  // Process section
  regularMeetings: boolean             // Daily meetings?
  existingRoles: string[]              // Current tracked roles
}
```

**Scores JSON Structure:**

```typescript
interface QuestionnaireScores {
  revenue: number        // 0-100
  costControl: number    // 0-100
  teamEngagement: number // 0-100
  processMaturity: number // 0-100
  overall: number        // 0-100 (weighted average)
  readinessLevel: 'low' | 'medium' | 'high'
}
```

---

## 9. Future Entities

### 9.1 Incentive (Future)

For gamification and reward tracking.

```prisma
model Incentive {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  description    String?
  type           IncentiveType
  threshold      Float               // Points/value needed
  reward         String              // Description of reward
  periodStart    DateTime?
  periodEnd      DateTime?
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id])
  awards       IncentiveAward[]

  @@index([organizationId])
}

enum IncentiveType {
  DAILY_GOAL      // Hit daily behavior target
  WEEKLY_GOAL     // Hit weekly target
  STREAK          // Consecutive days
  LEADERBOARD     // Top performer
  TEAM_GOAL       // Team-wide achievement
}

model IncentiveAward {
  id          String   @id @default(cuid())
  incentiveId String
  userId      String
  awardedAt   DateTime @default(now())
  notes       String?

  incentive Incentive @relation(fields: [incentiveId], references: [id])
  user      User      @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

### 9.2 Feedback (Future)

For anonymous employee feedback.

```prisma
model Feedback {
  id             String   @id @default(cuid())
  organizationId String
  locationId     String?
  category       FeedbackCategory
  content        String   @db.Text
  isAnonymous    Boolean  @default(true)
  userId         String?             // Only if not anonymous
  status         FeedbackStatus @default(NEW)
  response       String?
  respondedAt    DateTime?
  createdAt      DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id])
  location     Location?    @relation(fields: [locationId], references: [id])

  @@index([organizationId, status])
}

enum FeedbackCategory {
  SUGGESTION
  CONCERN
  EQUIPMENT
  SCHEDULING
  OTHER
}

enum FeedbackStatus {
  NEW
  REVIEWED
  IN_PROGRESS
  RESOLVED
  CLOSED
}
```

### 9.3 AuditLog (Future)

For compliance and audit trail.

```prisma
model AuditLog {
  id             String   @id @default(cuid())
  organizationId String
  userId         String?
  action         String              // e.g., "user.create", "behavior.delete"
  entityType     String              // e.g., "User", "Behavior"
  entityId       String
  oldValue       Json?
  newValue       Json?
  ipAddress      String?
  userAgent      String?
  createdAt      DateTime @default(now())

  @@index([organizationId, createdAt])
  @@index([entityType, entityId])
  @@index([userId])
}
```

---

## 10. Indexes & Performance

### 10.1 Primary Indexes

All tables have:
- Primary key index on `id` (automatic)
- Foreign key indexes (automatic with Prisma)

### 10.2 Query-Optimized Indexes

```prisma
// BehaviorLog - high-traffic queries
@@index([userId, createdAt])           // User's behavior history
@@index([behaviorId, createdAt])       // Behavior usage over time
@@index([locationId, createdAt])       // Location activity
@@index([verified, createdAt])         // Pending verifications

// DailyEntry - date-based queries
@@index([date])                        // Date range queries

// DailyKpiValue - KPI tracking
@@index([date])                        // Date range queries
@@index([locationId, date])            // Location KPI history

// Budget - period queries
@@index([periodStart, periodEnd])      // Budget period lookups

// User - authentication
@@index([organizationId])              // Org user list
@@index([pin, organizationId])         // PIN login lookup
```

### 10.3 Composite Indexes

```prisma
// Unique constraints that also serve as indexes
@@unique([organizationId, name])       // Role, Behavior, Location
@@unique([locationId, date])           // DailyEntry
@@unique([kpiId, locationId, date])    // DailyKpiValue
@@unique([sessionId, userId])          // TrainingAttendance
@@unique([organizationId, year])       // Benchmark
```

### 10.4 Query Patterns

**High-Frequency Queries:**

```sql
-- Staff dashboard: Today's behavior count
SELECT COUNT(*) FROM "BehaviorLog"
WHERE "userId" = ? AND "createdAt" >= ? AND "createdAt" < ?;

-- Manager verification: Pending behaviors
SELECT * FROM "BehaviorLog"
WHERE "locationId" = ? AND "verified" = false
ORDER BY "createdAt" DESC;

-- Dashboard: Weekly KPI values
SELECT date, value FROM "DailyKpiValue"
WHERE "kpiId" = ? AND "locationId" = ? AND date >= ? AND date <= ?
ORDER BY date;

-- Leaderboard: User behavior counts
SELECT u.id, u.name, COUNT(bl.id) as count
FROM "User" u
LEFT JOIN "BehaviorLog" bl ON bl."userId" = u.id
  AND bl."createdAt" >= ? AND bl."createdAt" < ?
WHERE u."organizationId" = ?
GROUP BY u.id
ORDER BY count DESC;
```

---

## 11. Data Integrity

### 11.1 Foreign Key Constraints

All foreign keys use `onDelete: Cascade` for child entities to ensure clean deletion.

```prisma
// Example: Deleting an organization cascades to all children
organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
```

### 11.2 Unique Constraints

| Entity | Unique Fields | Purpose |
|--------|---------------|---------|
| User | email | Global uniqueness |
| Role | organizationId + name | Per-org unique names |
| Behavior | organizationId + name | Per-org unique names |
| Location | organizationId + name | Per-org unique names |
| Kpi | organizationId + type | One KPI per type per org |
| DailyEntry | locationId + date | One entry per location per day |
| DailyKpiValue | kpiId + locationId + date | One value per KPI per location per day |
| Benchmark | organizationId + year | One benchmark per year per org |
| TrainingTopic | organizationId + name | Per-org unique topics |

### 11.3 Validation Rules

Application-level validation (via Zod):

```typescript
// User PIN uniqueness within organization
const isPinUnique = await prisma.user.findFirst({
  where: {
    organizationId,
    pin,
    id: { not: userId }, // Exclude current user for updates
  },
})
if (isPinUnique) throw new ConflictError('PIN already in use')

// Date range validation
if (budget.periodEnd <= budget.periodStart) {
  throw new ValidationError('End date must be after start date')
}

// Non-negative values
const amountSchema = z.number().min(0)
```

### 11.4 Data Retention

| Data | Retention | Policy |
|------|-----------|--------|
| BehaviorLog | Indefinite | Core analytics data |
| DailyEntry | Indefinite | Historical KPI tracking |
| DailyKpiValue | Indefinite | Trend analysis |
| TrainingAttendance | 7 years | Compliance records |
| Budget/BudgetLineItem | 7 years | Financial records |
| AuditLog | 3 years | Audit trail |
| User (deleted) | 90 days | Grace period |

---

## 12. Migration Strategy

### 12.1 Migration Workflow

```bash
# Development: Push changes directly
npm run db:push

# Production: Create migration
npm run db:migrate -- --name add_behavior_category

# Review migration
cat packages/db/prisma/migrations/*/migration.sql

# Apply migration (auto on deploy)
npx prisma migrate deploy
```

### 12.2 Safe Migration Practices

**Adding Columns:**
```prisma
// Add with default or nullable
newField String @default("default")
// OR
newField String?
```

**Renaming Columns:**
```sql
-- Use custom migration SQL
ALTER TABLE "User" RENAME COLUMN "oldName" TO "newName";
```

**Removing Columns:**
```sql
-- First: Remove from schema, deploy code
-- Then: Drop column in separate migration
ALTER TABLE "User" DROP COLUMN "deprecatedField";
```

### 12.3 Rollback Strategy

```bash
# List migrations
npx prisma migrate status

# Rollback (manual)
# 1. Revert code
# 2. Create down migration
# 3. Deploy
```

---

## 13. Seed Data

### 13.1 Seed Script

```typescript
// packages/db/prisma/seed.ts
import { prisma } from '../src'
import { hash } from 'bcryptjs'

async function main() {
  console.log('Seeding database...')

  // Create demo organization
  const org = await prisma.organization.create({
    data: {
      name: 'Demo Restaurant',
      industry: 'RESTAURANT',
      settings: {
        scoreboard: { showRevenue: true, primaryMetric: 'avgCheck' },
        features: { aiInsights: true, receiptScanning: true },
      },
    },
  })

  // Create location
  const location = await prisma.location.create({
    data: {
      name: 'Main Street',
      address: '123 Main Street, Anytown, USA',
      organizationId: org.id,
    },
  })

  // Create roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'Owner',
      type: 'ADMIN',
      organizationId: org.id,
      permissions: ['*'], // All permissions
    },
  })

  const managerRole = await prisma.role.create({
    data: {
      name: 'Floor Manager',
      type: 'MANAGER',
      organizationId: org.id,
      permissions: [
        'behaviors:view', 'behaviors:verify',
        'entries:view', 'entries:create',
        'reports:view',
      ],
    },
  })

  const serverRole = await prisma.role.create({
    data: {
      name: 'Server',
      type: 'SERVER',
      organizationId: org.id,
      permissions: ['behaviors:view', 'behaviors:log'],
    },
  })

  // Create users
  const passwordHash = await hash('password123', 12)

  await prisma.user.create({
    data: {
      email: 'owner@demo.com',
      passwordHash,
      name: 'Demo Owner',
      avatar: '👔',
      organizationId: org.id,
      roleId: adminRole.id,
    },
  })

  await prisma.user.create({
    data: {
      email: 'manager@demo.com',
      passwordHash,
      name: 'Demo Manager',
      avatar: '📋',
      pin: '1234',
      organizationId: org.id,
      roleId: managerRole.id,
    },
  })

  const staffUsers = [
    { name: 'Alice Server', avatar: '👩‍🍳', pin: '1111' },
    { name: 'Bob Server', avatar: '👨‍🍳', pin: '2222' },
    { name: 'Carol Server', avatar: '👩', pin: '3333' },
  ]

  for (const user of staffUsers) {
    await prisma.user.create({
      data: {
        email: `${user.name.toLowerCase().replace(' ', '.')}@demo.com`,
        passwordHash,
        name: user.name,
        avatar: user.avatar,
        pin: user.pin,
        organizationId: org.id,
        roleId: serverRole.id,
      },
    })
  }

  // Create behaviors
  const behaviors = [
    { name: 'Upsell Appetizer', category: 'REVENUE', targetPerDay: 10, points: 2 },
    { name: 'Suggest Wine Pairing', category: 'REVENUE', targetPerDay: 5, points: 3 },
    { name: 'Offer Dessert', category: 'REVENUE', targetPerDay: 10, points: 2 },
    { name: 'Table Touch', category: 'QUALITY', targetPerDay: 20, points: 1 },
    { name: 'Request Feedback', category: 'QUALITY', targetPerDay: 5, points: 2 },
  ]

  for (const behavior of behaviors) {
    await prisma.behavior.create({
      data: {
        ...behavior,
        organizationId: org.id,
        roles: {
          connect: [{ id: serverRole.id }],
        },
      },
    })
  }

  // Create KPIs
  const kpis = [
    { name: 'Daily Revenue', type: 'REVENUE', target: 2000, unit: '$' },
    { name: 'Average Check', type: 'AVERAGE_CHECK', target: 35, unit: '$' },
    { name: 'Covers', type: 'COVERS', target: 60, unit: 'guests' },
    { name: 'Rating', type: 'RATING', target: 4.5, unit: 'stars' },
  ]

  for (const kpi of kpis) {
    await prisma.kpi.create({
      data: {
        ...kpi,
        organizationId: org.id,
      },
    })
  }

  // Create benchmark
  await prisma.benchmark.create({
    data: {
      organizationId: org.id,
      year: 2023,
      totalRevenue: 600000,
      daysOpen: 312,
      baselineAvgCheck: 32.50,
      baselineRating: 4.2,
    },
  })

  // Create training topics
  const topics = [
    { name: 'Wine Service Basics', duration: 10 },
    { name: 'Upselling Techniques', duration: 15 },
    { name: 'Handling Complaints', duration: 10 },
    { name: 'Food Allergen Awareness', duration: 20 },
  ]

  for (const topic of topics) {
    await prisma.trainingTopic.create({
      data: {
        ...topic,
        organizationId: org.id,
        content: `Training content for ${topic.name}...`,
      },
    })
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### 13.2 Demo Data

For demonstration purposes, we also seed:
- 30 days of behavior logs
- 30 days of daily entries
- Sample budget with line items
- Sample training sessions

```typescript
// Generate demo behavior logs
const users = await prisma.user.findMany({
  where: { role: { type: 'SERVER' } },
})
const behaviors = await prisma.behavior.findMany()

for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
  const date = subDays(new Date(), daysAgo)

  for (const user of users) {
    // Random 5-15 behaviors per user per day
    const count = Math.floor(Math.random() * 10) + 5

    for (let i = 0; i < count; i++) {
      const behavior = behaviors[Math.floor(Math.random() * behaviors.length)]
      const hour = 11 + Math.floor(Math.random() * 10) // 11am - 9pm

      await prisma.behaviorLog.create({
        data: {
          userId: user.id,
          behaviorId: behavior.id,
          locationId: location.id,
          verified: Math.random() > 0.2, // 80% verified
          createdAt: set(date, { hours: hour, minutes: Math.random() * 60 }),
        },
      })
    }
  }
}
```

---

## Appendix A: Complete Schema

See `packages/db/prisma/schema.prisma` for the complete, up-to-date schema.

---

## Appendix B: Type Definitions

All TypeScript types are generated by Prisma and re-exported:

```typescript
import {
  Organization,
  User,
  Role,
  RoleType,
  Location,
  Behavior,
  BehaviorLog,
  Kpi,
  KpiType,
  DailyKpiValue,
  DailyEntry,
  Benchmark,
  Budget,
  BudgetLineItem,
  BudgetCategory,
  TrainingTopic,
  TrainingSession,
  TrainingAttendance,
  QuestionnaireSubmission,
  Industry,
} from '@topline/db'
```
