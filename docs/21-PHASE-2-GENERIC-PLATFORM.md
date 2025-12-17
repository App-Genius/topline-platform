# Phase 2: Generic Platform

## Overview

Phase 2 transforms Topline from a hotel-specific MVP into a configurable platform that serves any service business. This phase enables self-service onboarding, dynamic configuration, and advanced AI features.

**Target Customers:** Restaurants, Retail, Hotels, Spas, Gyms, any service business
**Prerequisites:** Phase 1 complete and validated at AC Hotel
**Goal:** Scalable SaaS platform for any industry

---

## Table of Contents

1. [Phase 2 Goals](#1-phase-2-goals)
2. [Multi-Industry Support](#2-multi-industry-support)
3. [Onboarding Questionnaire](#3-onboarding-questionnaire)
4. [Dynamic Role Configuration](#4-dynamic-role-configuration)
5. [Dynamic Behavior Generation](#5-dynamic-behavior-generation)
6. [Configurable Dashboards](#6-configurable-dashboards)
7. [Advanced AI Features](#7-advanced-ai-features)
8. [Multi-Location Support](#8-multi-location-support)
9. [Integrations](#9-integrations)
10. [Business Model](#10-business-model)

---

## 1. Phase 2 Goals

### 1.1 Transform from Hard-coded to Dynamic

| Phase 1 (Hard-coded) | Phase 2 (Dynamic) |
|---------------------|-------------------|
| Hotel roles only | Any industry roles |
| Pre-defined behaviors | AI-generated behaviors |
| Fixed dashboard | Configurable widgets |
| Manual setup | Questionnaire-driven onboarding |
| Single location | Multi-location support |

### 1.2 Success Criteria

- [ ] New customer can onboard in < 10 minutes
- [ ] Questionnaire auto-recommends KPIs and behaviors
- [ ] AI generates industry-appropriate behaviors
- [ ] Dashboard is customizable per role
- [ ] Multi-location customers can see roll-up views
- [ ] POS/PMS integrations reduce manual data entry

---

## 2. Multi-Industry Support

### 2.1 Industry Types

Expand the Industry enum to support more verticals:

```typescript
enum Industry {
  // Existing
  RESTAURANT = 'RESTAURANT',
  RETAIL = 'RETAIL',
  HOSPITALITY = 'HOSPITALITY',
  OTHER = 'OTHER',

  // New in Phase 2
  SPA_WELLNESS = 'SPA_WELLNESS',
  FITNESS = 'FITNESS',
  AUTOMOTIVE = 'AUTOMOTIVE',
  SALON = 'SALON',
  HEALTHCARE = 'HEALTHCARE',
  PROFESSIONAL_SERVICES = 'PROFESSIONAL_SERVICES',
}
```

### 2.2 Industry Defaults

Each industry has default configurations:

| Industry | Default KPIs | Default Roles | Example Behaviors |
|----------|--------------|---------------|-------------------|
| Restaurant | Revenue, Avg Check, Covers, Rating | Server, Host, Bartender, Chef | Upsell wine, Suggest dessert |
| Retail | Sales, Units/Transaction, Conversion | Sales Associate, Cashier | Suggest add-on, Mention warranty |
| Hospitality | RevPAR, ADR, Occupancy, Rating | Front Desk, Housekeeping, F&B | Offer upgrade, Suggest amenity |
| Spa | Revenue, Rebooking Rate, Rating | Therapist, Receptionist | Recommend treatment, Sell product |
| Fitness | Revenue, Retention, Class Fill | Trainer, Front Desk | Upsell PT, Suggest class |
| Salon | Revenue, Rebooking, Retail Ratio | Stylist, Receptionist | Recommend product, Book next |

### 2.3 Industry Selection Flow

```
Signup Flow:
├── Enter email
├── Create password
├── Select industry ← NEW
│   ├── Show industry options with icons
│   ├── Brief description of each
│   └── "Most popular for your business"
├── Company name
├── Industry-specific questions
└── Dashboard with recommended setup
```

### 2.4 Files to Create

| File | Purpose |
|------|---------|
| `lib/industries/index.ts` | Industry definitions and defaults |
| `lib/industries/restaurant.ts` | Restaurant-specific config |
| `lib/industries/hospitality.ts` | Hotel-specific config |
| `lib/industries/retail.ts` | Retail-specific config |
| `lib/industries/spa.ts` | Spa-specific config |
| `components/features/onboarding/IndustrySelector.tsx` | Industry selection UI |

---

## 3. Onboarding Questionnaire

### 3.1 Purpose

The questionnaire serves multiple purposes:
1. **Lead Qualification** - Score potential customers
2. **Auto-Configuration** - Set up appropriate KPIs and behaviors
3. **Baseline Collection** - Gather benchmark data
4. **Education** - Introduce Topline concepts

### 3.2 Questionnaire Flow

```
Section 1: REVENUE HEALTH
├── Q1: Revenue growth last 3 years? (Scale 1-5)
│   └── Score: Declining=1, Flat=2, 5%=3, 10%=4, 20%+=5
├── Q2: Revenue your biggest concern? (Y/N)
│   └── Concern=True suggests higher engagement
└── Impact: Sets revenue KPI priority

Section 2: COST MANAGEMENT
├── Q3: Costs increased faster than revenue? (Scale 1-5)
│   └── Much faster=1, Faster=2, Same=3, Slower=4, Much slower=5
├── Q4: Do you track Cost of Sales? (Y/N)
│   └── No=Opportunity for COGS tracking
└── Impact: Sets cost KPIs, purchaser behaviors

Section 3: TEAM ENGAGEMENT
├── Q5: Team contributes to revenue growth? (Scale 1-5)
│   └── Never=1, Rarely=2, Sometimes=3, Often=4, Always=5
├── Q6: High staff turnover? (Y/N)
│   └── Yes=Need retention focus
└── Impact: Sets behavior targets, incentive suggestions

Section 4: CURRENT PRACTICES
├── Q7: Daily pre-shift meetings? (Y/N)
│   └── No=Introduce briefing system
├── Q8: Which roles exist? (Multi-select)
│   └── Server, Host, Bartender, Manager, etc.
└── Impact: Creates roles, assigns behaviors

Section 5: CONTACT INFO
├── Q9: Company name
├── Q10: Industry
├── Q11: Employee count (1-10, 11-50, 51-200, 200+)
└── Q12: Email
```

### 3.3 Scoring Algorithm

```typescript
interface QuestionnaireScores {
  revenueHealth: number;      // 0-100
  costManagement: number;     // 0-100
  teamEngagement: number;     // 0-100
  overallReadiness: number;   // 0-100
}

function calculateScores(responses: QuestionnaireResponses): QuestionnaireScores {
  const revenueHealth =
    (responses.revenueGrowth * 15) +
    (responses.revenueConcern ? 25 : 0);

  const costManagement =
    ((5 - responses.costIncrease) * 15) +
    (responses.trackCostOfSales ? 25 : 0);

  const teamEngagement =
    (responses.teamContribution * 15) +
    (responses.retentionIssues ? 0 : 25);

  const overallReadiness = Math.round(
    (revenueHealth + costManagement + teamEngagement) / 3
  );

  return { revenueHealth, costManagement, teamEngagement, overallReadiness };
}
```

### 3.4 Auto-Configuration Based on Answers

| Score Range | Configuration |
|-------------|---------------|
| Revenue < 40 | Emphasize revenue behaviors, add revenue KPIs to dashboard |
| Cost < 40 | Add cost tracking, purchaser/chef behaviors, COGS KPI |
| Team < 40 | Lower behavior targets, add incentive system |
| Overall > 70 | Premium upsell opportunity |

### 3.5 Files to Create

| File | Purpose |
|------|---------|
| `app/(public)/questionnaire/page.tsx` | Questionnaire UI |
| `actions/questionnaire.ts` | Submit and score questionnaire |
| `lib/questionnaire/scoring.ts` | Scoring algorithm |
| `lib/questionnaire/configuration.ts` | Auto-configuration logic |

---

## 4. Dynamic Role Configuration

### 4.1 Custom Role Creation

Allow organizations to create custom roles beyond the defaults:

```typescript
interface CustomRole {
  id: string;
  name: string;
  type: 'CUSTOM'; // Uses CUSTOM enum value
  baseType?: RoleType; // Optional: inherit from base type
  permissions: Permission[];
  defaultBehaviors: string[]; // Behavior IDs
  kpiAccess: string[]; // Which KPIs this role sees
  dashboardLayout: string; // Layout template ID
}
```

### 4.2 Role Configuration UI

```
Role Management Page:
├── Role List
│   ├── Name, Type, User Count
│   ├── Edit button
│   └── Delete button (if no users)
├── Create Role Button
└── Role Editor Modal
    ├── Name input
    ├── Base type selector (optional)
    ├── Permissions checklist
    ├── Default behaviors multi-select
    ├── KPI access multi-select
    └── Dashboard layout selector
```

### 4.3 Permission System

```typescript
enum Permission {
  // Dashboard
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  VIEW_ALL_KPIS = 'VIEW_ALL_KPIS',
  VIEW_REVENUE = 'VIEW_REVENUE',
  VIEW_COSTS = 'VIEW_COSTS',

  // Behaviors
  LOG_BEHAVIORS = 'LOG_BEHAVIORS',
  VERIFY_BEHAVIORS = 'VERIFY_BEHAVIORS',
  CREATE_BEHAVIORS = 'CREATE_BEHAVIORS',
  DELETE_BEHAVIORS = 'DELETE_BEHAVIORS',

  // Users
  VIEW_USERS = 'VIEW_USERS',
  CREATE_USERS = 'CREATE_USERS',
  EDIT_USERS = 'EDIT_USERS',
  DELETE_USERS = 'DELETE_USERS',

  // Settings
  EDIT_SETTINGS = 'EDIT_SETTINGS',
  MANAGE_ROLES = 'MANAGE_ROLES',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',

  // Briefings
  CONDUCT_BRIEFING = 'CONDUCT_BRIEFING',
  VIEW_BRIEFING_HISTORY = 'VIEW_BRIEFING_HISTORY',
}
```

### 4.4 Role Templates by Industry

```typescript
const restaurantRoleTemplates: RoleTemplate[] = [
  {
    name: 'Server',
    type: 'SERVER',
    permissions: ['LOG_BEHAVIORS', 'VIEW_DASHBOARD'],
    defaultBehaviors: ['Upsell Wine', 'Suggest Dessert', 'Offer Appetizer'],
  },
  {
    name: 'Bartender',
    type: 'BARTENDER',
    permissions: ['LOG_BEHAVIORS', 'VIEW_DASHBOARD'],
    defaultBehaviors: ['Suggest Premium', 'Recommend Cocktail'],
  },
  // ...
];
```

---

## 5. Dynamic Behavior Generation

### 5.1 Full AI-Powered Behavior Creation

Expand beyond suggestions to full generation:

```typescript
// AI generates complete behavior definitions
interface GeneratedBehavior {
  name: string;
  description: string;
  category: 'REVENUE' | 'COST' | 'QUALITY' | 'EFFICIENCY';
  points: number;
  targetPerDay: number;
  verificationMethod: string;
  expectedOutcome: string;
  correlatedKPI: string;
}
```

### 5.2 Correlation-Based Recommendations

After collecting enough data (30+ days), AI recommends behaviors based on actual correlations:

```typescript
interface BehaviorRecommendation {
  behavior: Behavior;
  correlationScore: number; // -1 to 1 (Pearson)
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: 'INCREASE' | 'MAINTAIN' | 'DECREASE' | 'RETIRE';
  explanation: string;
}

// Example output:
// "Wine upsells have 0.72 correlation with average check.
// Recommend increasing target from 5/day to 8/day."
```

### 5.3 Performance-Based Suggestions

AI monitors performance and suggests new behaviors:

```
Performance Analysis:
├── Average check declining → Suggest upsell behaviors
├── Customer ratings dropping → Suggest quality behaviors
├── Food cost increasing → Suggest cost behaviors
├── Staff turnover high → Suggest engagement behaviors
└── Revenue plateaued → Suggest new revenue behaviors
```

### 5.4 Files to Create

| File | Purpose |
|------|---------|
| `lib/ai/behavior-generation.ts` | Full behavior generation |
| `lib/ai/correlation-analysis.ts` | Behavior-KPI correlation |
| `lib/ai/recommendations.ts` | Performance recommendations |
| `actions/ai-recommendations.ts` | Server actions for AI suggestions |

---

## 6. Configurable Dashboards

### 6.1 Dashboard Builder

Drag-and-drop dashboard configuration:

```
Dashboard Builder:
├── Widget Library (sidebar)
│   ├── KPI Cards
│   ├── Charts (Line, Bar, Pie)
│   ├── Leaderboards
│   ├── Activity Feeds
│   └── AI Insight Cards
├── Canvas (main area)
│   ├── Grid layout
│   ├── Drop zones
│   └── Widget preview
├── Widget Settings (panel)
│   ├── Data source
│   ├── Time range
│   ├── Formatting
│   └── Thresholds
└── Save/Publish
```

### 6.2 Widget Types

| Widget | Data Source | Customization |
|--------|-------------|---------------|
| KPI Card | Any KPI | Thresholds, comparison period |
| Line Chart | Time series KPI | Date range, multiple series |
| Bar Chart | Category comparison | Grouping, sorting |
| Pie Chart | Breakdown | Categories, colors |
| Leaderboard | User rankings | Metric, time period |
| Activity Feed | Behavior logs | Filters, count |
| AI Insight | Generated insights | Refresh interval |
| Progress Ring | Target vs actual | Target, colors |
| Game State | Current state | Size, animation |

### 6.3 Role-Based Dashboard Views

Different roles see different default dashboards:

| Role | Default Widgets |
|------|-----------------|
| Admin/Owner | All KPIs, revenue chart, AI insights, leaderboard |
| Manager | Team performance, verification queue, briefing status |
| Staff | Personal progress, leaderboard position, AI tips |
| TV/Scoreboard | Large game state, leaderboard, behaviors today |

### 6.4 Dashboard Schema

```typescript
interface DashboardConfig {
  id: string;
  name: string;
  organizationId: string;
  roleId?: string; // If role-specific
  isDefault: boolean;
  layout: {
    columns: number;
    rows: number;
    widgets: WidgetConfig[];
  };
}

interface WidgetConfig {
  id: string;
  type: WidgetType;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>; // Widget-specific config
}
```

---

## 7. Advanced AI Features

### 7.1 Receipt Scanning (Vision API)

Staff can photograph receipts for automatic data extraction:

```
Receipt Scanning Flow:
├── Staff taps "Scan Receipt"
├── Camera opens
├── Capture photo
├── AI extracts:
│   ├── Total amount
│   ├── Line items
│   ├── Date/time
│   └── Payment method
├── Staff reviews/corrects
├── Link to behaviors logged
└── Save to system
```

```typescript
// actions/receipt-scan.ts
export async function scanReceipt(imageBase64: string) {
  const response = await openrouter.chat.completions.create({
    model: 'anthropic/claude-3.5-sonnet', // Vision capable
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        { type: 'text', text: 'Extract: total, subtotal, tax, tip, items, date, time. Return JSON.' }
      ]
    }],
  });

  return receiptSchema.parse(JSON.parse(response.choices[0].message.content));
}
```

### 7.2 Real-Time AI Coach

Personalized coaching messages throughout the day:

```typescript
interface CoachMessage {
  type: 'ENCOURAGEMENT' | 'TIP' | 'REMINDER' | 'CELEBRATION';
  message: string;
  context: 'low_behaviors' | 'streak_at_risk' | 'target_reached' | 'shift_start';
}

// Examples:
// "You're 2 behaviors away from hitting your daily target!"
// "Great job! You've logged 15 behaviors today - that's your best this week!"
// "Tip: Wine upsells work best when you mention food pairings."
```

### 7.3 Daily Training Topic Generation

AI generates relevant training content:

```typescript
interface TrainingTopic {
  title: string;
  duration: '2min' | '5min' | '10min';
  content: string; // Markdown
  discussionPoints: string[];
  relatedBehaviors: string[];
}

// AI considers:
// - Recent performance data
// - Common mistakes
// - Seasonal relevance
// - Industry best practices
```

### 7.4 Feedback Synthesis

Weekly AI synthesis of staff feedback:

```typescript
interface FeedbackSynthesis {
  period: { start: Date; end: Date };
  totalFeedback: number;
  themes: Array<{
    theme: string;
    count: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    examples: string[];
    recommendation: string;
  }>;
  summary: string;
}
```

### 7.5 Fraud Detection Insights

AI identifies suspicious patterns:

```
Fraud Signals:
├── High behaviors + Low avg check = Logging without selling
├── Clustered timestamps = Batch logging at shift end
├── Missing correlations = Behaviors don't match revenue
├── Outlier performers = Way above average (verify or celebrate)
└── Manager favoritism = One manager always verifies same person
```

---

## 8. Multi-Location Support

### 8.1 Location Hierarchy

```typescript
interface LocationHierarchy {
  organization: {
    id: string;
    name: string;
    locations: Location[];
  };
}

interface Location {
  id: string;
  name: string;
  address: string;
  timezone: string;
  managerId: string;
  settings: LocationSettings;
}
```

### 8.2 Location-Specific Features

| Feature | Scope |
|---------|-------|
| Users | Assigned to location(s) |
| Behaviors | Can be location-specific |
| Benchmarks | Per-location targets |
| Briefings | Per-location, per-shift |
| Leaderboards | Per-location or cross-location |

### 8.3 Roll-Up Reporting

Organization-wide views:

```
Organization Dashboard:
├── Total revenue (all locations)
├── Location comparison chart
├── Best performing location
├── Worst performing location
├── Cross-location leaderboard
└── Aggregated AI insights
```

### 8.4 Cross-Location Benchmarking

Compare similar locations:

```typescript
interface LocationBenchmark {
  locationId: string;
  metric: string;
  value: number;
  rank: number;
  percentile: number;
  comparedTo: 'organization' | 'industry' | 'region';
}
```

---

## 9. Integrations

### 9.1 POS System Integration

Auto-import sales data:

| POS | Integration Method | Data Imported |
|-----|-------------------|---------------|
| Square | API | Sales, items, payments |
| Toast | API | Sales, checks, staff |
| Clover | API | Sales, items, labor |
| Lightspeed | API | Sales, inventory |
| Custom | CSV Upload | Configurable |

```typescript
interface POSIntegration {
  provider: string;
  credentials: EncryptedCredentials;
  syncSchedule: 'realtime' | 'hourly' | 'daily';
  dataMapping: {
    revenue: string;
    covers: string;
    avgCheck: string;
    staffSales: string;
  };
}
```

### 9.2 Property Management System (PMS)

For hotels:

| PMS | Integration Method | Data Imported |
|-----|-------------------|---------------|
| Opera | API | Occupancy, ADR, RevPAR |
| Cloudbeds | API | Reservations, rates |
| Mews | API | Guests, revenue |

### 9.3 Review Platforms

Auto-import customer ratings:

| Platform | Integration | Data |
|----------|-------------|------|
| Google Business | API | Rating, reviews, response |
| TripAdvisor | API | Rating, reviews |
| Yelp | API | Rating, reviews |

### 9.4 Accounting Software

Export financial data:

| Software | Integration | Features |
|----------|-------------|----------|
| QuickBooks | API | Export daily entries, budget sync |
| Xero | API | Export transactions |
| Sage | API | Export P&L data |

### 9.5 Integration Architecture

```
Integration Flow:
├── OAuth connection
├── Initial data sync
├── Scheduled sync (configurable)
├── Webhook for real-time (if available)
├── Error handling & retry
├── Manual sync trigger
└── Data mapping configuration
```

---

## 10. Business Model

### 10.1 Pricing Structure

| Component | Price | Notes |
|-----------|-------|-------|
| Setup Fee | $1,000 | One-time, includes configuration |
| License | $50/user/month | Per active user |
| Revenue Share | 1% of incremental | Optional, replaces license |

### 10.2 Example Customer Scenarios

**Small Restaurant (5 users):**
- Setup: $1,000
- Monthly: $250 (5 x $50)
- Annual: $3,000 + setup = $4,000 first year

**Hotel (20 users):**
- Setup: $1,000
- Monthly: $1,000 (20 x $50)
- Annual: $12,000 + setup = $13,000 first year

**Restaurant Group (50 users, 5 locations):**
- Setup: $1,000
- Monthly: $2,500 (50 x $50)
- Annual: $30,000 + setup = $31,000 first year

### 10.3 Revenue Share Alternative

For larger customers, offer 1% of incremental revenue:

```
If Topline helps generate $100K additional revenue/year:
- Revenue share: $1,000/year
- vs License (20 users): $12,000/year
- Customer wins if incremental < $1.2M
```

### 10.4 Upsell Features (Premium)

| Feature | Price | Target |
|---------|-------|--------|
| AI Coach (real-time) | +$10/user/month | All |
| Receipt Scanning | +$5/user/month | F&B |
| POS Integration | +$200/month | All |
| Multi-Location | +$100/location/month | Groups |
| White Label | +$500/month | Enterprise |
| API Access | +$300/month | Enterprise |

---

## Appendix: Phase 2 Dependencies

### Technical Prerequisites

- [ ] Phase 1 complete and stable
- [ ] AC Hotel using system for 30+ days
- [ ] Correlation data collected
- [ ] Performance baseline established

### Infrastructure Requirements

| Component | Phase 1 | Phase 2 |
|-----------|---------|---------|
| Database | Single org | Multi-tenant |
| Storage | Local uploads | S3/CDN |
| AI | Basic suggestions | Full generation + vision |
| Auth | Cookie JWT | + API keys for integrations |
| Caching | In-memory | Redis |

### Team Requirements

| Role | Phase 1 | Phase 2 |
|------|---------|---------|
| Frontend | 1 dev | 2 devs |
| Backend | 1 dev | 2 devs |
| AI/ML | Part-time | Full-time |
| Design | Part-time | Full-time |
| QA | As-needed | Dedicated |

---

## Appendix: Migration Path

### Phase 1 → Phase 2 Migration

Existing Phase 1 customers (AC Hotel) migrate automatically:

1. **Roles** - Hard-coded roles become templates
2. **Behaviors** - Seeded behaviors remain, can add custom
3. **Dashboard** - Default layout becomes customizable
4. **Data** - All historical data preserved
5. **Settings** - New settings added with sensible defaults

### Database Migrations

```
Phase 2 Schema Changes:
├── Add Industry defaults table
├── Add Dashboard configs table
├── Add Widget configs table
├── Add Integration credentials table
├── Add Location hierarchy
├── Add Custom role permissions
└── Add AI generation logs
```

---

## Summary

Phase 2 transforms Topline from a single-purpose hotel tool into a comprehensive platform that:

1. **Serves any industry** through multi-industry support and dynamic configuration
2. **Onboards customers quickly** via questionnaire-driven setup
3. **Generates custom behaviors** with advanced AI
4. **Provides flexible dashboards** with drag-and-drop builder
5. **Scales to enterprises** with multi-location support
6. **Integrates with existing systems** (POS, PMS, reviews, accounting)

The business model supports both SMB (per-user licensing) and enterprise (revenue share) customers, with premium upsells for advanced features.
