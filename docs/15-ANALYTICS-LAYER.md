# Topline: Analytics Layer Specification

## Overview

This document specifies the analytics and event logging architecture for Topline. The analytics layer is designed to be **provider-agnostic** and **swappable**, enabling easy migration between analytics platforms without code changes.

> For the technical implementation details, see [04-SYSTEM-ARCHITECTURE.md](./04-SYSTEM-ARCHITECTURE.md#144-analytics-abstraction-layer).

---

## Table of Contents

1. [Analytics Philosophy](#1-analytics-philosophy)
2. [Event Taxonomy](#2-event-taxonomy)
3. [Event Naming Conventions](#3-event-naming-conventions)
4. [Property Standards](#4-property-standards)
5. [Implementation Guide](#5-implementation-guide)
6. [Provider Abstraction](#6-provider-abstraction)
7. [User Identification](#7-user-identification)
8. [Analytics Dashboard](#8-analytics-dashboard)

---

## 1. Analytics Philosophy

### 1.1 Why Analytics Matters

Analytics serves three critical functions in Topline:

1. **Product Improvement**: Understand how users interact with features
2. **Business Intelligence**: Track system health and usage patterns
3. **Self-Improvement**: Feed data back into AI for better recommendations

### 1.2 Design Principles

| Principle | Description |
|-----------|-------------|
| **Provider Agnostic** | Can switch from MixPanel to PostHog to custom with config change |
| **Type Safe** | All events and properties are typed |
| **Consistent Naming** | Strict conventions for event names and properties |
| **Privacy Aware** | No PII in event properties unless explicitly allowed |
| **Performance First** | Non-blocking, batched where possible |

### 1.3 Current Provider

Currently using **MixPanel** for production analytics. The abstraction layer allows switching to:
- PostHog (self-hosted option)
- Amplitude
- Heap
- Custom analytics backend

---

## 2. Event Taxonomy

### 2.1 Event Categories

All events are organized into categories:

```
┌─────────────────────────────────────────────────────────────────┐
│                      EVENT TAXONOMY                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BEHAVIOR_*              Actions related to behavior logging     │
│  ├── behavior_logged                                            │
│  ├── behavior_verified                                          │
│  ├── behavior_rejected                                          │
│  └── behavior_edited                                            │
│                                                                  │
│  KPI_*                   KPI-related events                      │
│  ├── kpi_viewed                                                 │
│  ├── kpi_target_set                                             │
│  ├── kpi_threshold_breached                                     │
│  └── kpi_exported                                               │
│                                                                  │
│  USER_*                  User lifecycle events                   │
│  ├── user_login                                                 │
│  ├── user_logout                                                │
│  ├── user_pin_login                                             │
│  ├── user_created                                               │
│  └── user_role_changed                                          │
│                                                                  │
│  DASHBOARD_*             Dashboard interaction events            │
│  ├── dashboard_viewed                                           │
│  ├── insight_clicked                                            │
│  ├── scoreboard_viewed                                          │
│  └── report_generated                                           │
│                                                                  │
│  AI_*                    AI operation events                     │
│  ├── ai_insight_generated                                       │
│  ├── ai_coach_message_shown                                     │
│  ├── ai_recommendation_accepted                                 │
│  └── ai_recommendation_rejected                                 │
│                                                                  │
│  ADMIN_*                 Administrative events                   │
│  ├── admin_settings_changed                                     │
│  ├── admin_user_invited                                         │
│  ├── admin_behavior_created                                     │
│  └── admin_role_configured                                      │
│                                                                  │
│  ERROR_*                 Error events                            │
│  ├── error_api                                                  │
│  ├── error_ui                                                   │
│  └── error_ai                                                   │
│                                                                  │
│  SYSTEM_*                System events                           │
│  ├── system_sync_completed                                      │
│  ├── system_integration_connected                               │
│  └── system_backup_created                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Event Criticality

Events are classified by importance for monitoring:

| Level | Description | Examples |
|-------|-------------|----------|
| **Critical** | Must be tracked, alerts on failure | `user_login`, `behavior_logged`, `error_*` |
| **Important** | Should be tracked for insights | `dashboard_viewed`, `ai_*` |
| **Standard** | Nice to have for analysis | `insight_clicked`, navigation |
| **Debug** | Development/troubleshooting only | Internal state changes |

---

## 3. Event Naming Conventions

### 3.1 General Rules

All event names follow these rules:

1. **Case**: `snake_case` only
2. **Format**: `{category}_{action}` or `{category}_{object}_{action}`
3. **Tense**: Past tense for completed actions (`logged`, `viewed`, `created`)
4. **Length**: Max 50 characters

### 3.2 Examples

```typescript
// GOOD event names
'behavior_logged'           // category_action
'kpi_target_set'           // category_object_action
'ai_recommendation_accepted'
'user_pin_login'
'dashboard_viewed'

// BAD event names
'BehaviorLogged'           // Wrong case
'log-behavior'             // Wrong separator
'userClickedButton'        // camelCase not allowed
'behavior_was_logged_by_user' // Too verbose
```

### 3.3 Action Verbs

Use these standard action verbs:

| Verb | Use Case |
|------|----------|
| `created` | New entity created |
| `updated` | Entity modified |
| `deleted` | Entity removed |
| `viewed` | Page or component viewed |
| `clicked` | Button or link clicked |
| `logged` | Behavior or activity recorded |
| `verified` | Manager verified something |
| `rejected` | Manager rejected something |
| `exported` | Data exported |
| `generated` | Report or insight generated |
| `accepted` | User accepted recommendation |
| `dismissed` | User dismissed notification |

---

## 4. Property Standards

### 4.1 Base Properties

These properties are included with EVERY event:

```typescript
interface BaseEventProperties {
  // Automatically added by analytics layer
  timestamp: string;        // ISO 8601
  sessionId: string;        // Current session
  userId?: string;          // If authenticated
  organizationId?: string;  // Current org context

  // Device/client info (auto-captured)
  platform: 'web' | 'mobile' | 'api';
  userAgent?: string;
  screenSize?: string;
}
```

### 4.2 Category-Specific Properties

Each event category has standard properties:

```typescript
// Behavior events
interface BehaviorEventProperties {
  behaviorId: string;
  behaviorName: string;
  category: 'REVENUE' | 'COST_CONTROL' | 'QUALITY' | 'COMPLIANCE';
  roleType: string;
  pointsEarned?: number;
  wasVerified?: boolean;
  verificationLatency?: number; // ms since logged
}

// KPI events
interface KPIEventProperties {
  kpiType: string;
  currentValue: number;
  targetValue?: number;
  benchmarkValue?: number;
  variance?: number;
  period: 'day' | 'week' | 'month';
}

// AI events
interface AIEventProperties {
  model: string;
  operation: string;
  tokensUsed: number;
  latencyMs: number;
  success: boolean;
  fallbackUsed?: boolean;
  qualityScore?: number;
}

// Error events
interface ErrorEventProperties {
  errorCode: string;
  errorMessage: string;
  errorStack?: string;
  endpoint?: string;
  httpStatus?: number;
  recoverable: boolean;
}
```

### 4.3 Property Naming

Property names follow these conventions:

```typescript
// GOOD property names
{
  userId: '123',              // camelCase
  behaviorId: 'abc',          // ID suffix for identifiers
  createdAt: '2024-01-01',    // At suffix for timestamps
  isVerified: true,           // is/has prefix for booleans
  verificationCount: 5,       // Count suffix for counts
  latencyMs: 200,             // Unit suffix for measurements
}

// BAD property names
{
  user_id: '123',             // snake_case not allowed
  behavior: 'abc',            // Unclear what this is
  verified: true,             // Missing boolean prefix
  verification: 5,            // Unclear - count or status?
}
```

---

## 5. Implementation Guide

### 5.1 Client-Side Tracking

```typescript
// lib/analytics/client.ts
import { analytics } from './index';

// Track page views
export function trackPageView(pageName: string, properties?: Record<string, unknown>) {
  analytics.page(pageName, {
    path: window.location.pathname,
    referrer: document.referrer,
    ...properties
  });
}

// Track behavior logging
export function trackBehaviorLogged(behavior: {
  id: string;
  name: string;
  category: string;
  points: number;
}) {
  analytics.track('behavior_logged', {
    behaviorId: behavior.id,
    behaviorName: behavior.name,
    category: behavior.category,
    pointsEarned: behavior.points,
    loggedAt: new Date().toISOString()
  });
}

// Track KPI view
export function trackKPIViewed(kpi: {
  type: string;
  value: number;
  target?: number;
}) {
  analytics.track('kpi_viewed', {
    kpiType: kpi.type,
    currentValue: kpi.value,
    targetValue: kpi.target,
    variance: kpi.target ? ((kpi.value - kpi.target) / kpi.target) * 100 : undefined
  });
}

// Track AI interaction
export function trackAIRecommendation(accepted: boolean, recommendation: {
  type: string;
  content: string;
}) {
  analytics.track(accepted ? 'ai_recommendation_accepted' : 'ai_recommendation_rejected', {
    recommendationType: recommendation.type,
    recommendationPreview: recommendation.content.slice(0, 100)
  });
}
```

### 5.2 Server-Side Tracking

```typescript
// lib/analytics/server.ts
import { serverAnalytics } from './server-provider';

// Track API operations
export function trackAPICall(
  userId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  durationMs: number
) {
  serverAnalytics.track('api_call', userId, {
    endpoint,
    method,
    statusCode,
    durationMs,
    isError: statusCode >= 400
  });
}

// Track AI operations with cost
export function trackAIOperation(
  userId: string,
  organizationId: string,
  operation: {
    type: string;
    model: string;
    tokensUsed: number;
    latencyMs: number;
    success: boolean;
  }
) {
  serverAnalytics.track('ai_operation', userId, {
    organizationId,
    operationType: operation.type,
    model: operation.model,
    tokensUsed: operation.tokensUsed,
    latencyMs: operation.latencyMs,
    success: operation.success,
    estimatedCost: calculateCost(operation.model, operation.tokensUsed)
  });
}

// Track errors
export function trackError(
  userId: string,
  error: {
    code: string;
    message: string;
    stack?: string;
    context?: Record<string, unknown>;
  }
) {
  serverAnalytics.track('error_api', userId, {
    errorCode: error.code,
    errorMessage: error.message,
    errorContext: error.context,
    timestamp: new Date().toISOString()
  });
}
```

### 5.3 React Hooks for Tracking

```typescript
// hooks/useAnalytics.ts
import { useEffect } from 'react';
import { analytics } from '@/lib/analytics';

// Track page views automatically
export function usePageView(pageName: string) {
  useEffect(() => {
    analytics.page(pageName);
  }, [pageName]);
}

// Track component mount/unmount
export function useComponentTracking(componentName: string) {
  useEffect(() => {
    analytics.track('component_mounted', { componentName });

    return () => {
      analytics.track('component_unmounted', { componentName });
    };
  }, [componentName]);
}

// Track time on component
export function useTimeTracking(componentName: string) {
  useEffect(() => {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      analytics.track('time_on_component', {
        componentName,
        durationMs: duration
      });
    };
  }, [componentName]);
}
```

---

## 6. Provider Abstraction

### 6.1 Interface Definition

```typescript
// lib/analytics/interface.ts
export interface AnalyticsProvider {
  // Initialization
  init(): void;

  // User identification
  identify(userId: string, traits?: Record<string, unknown>): void;
  reset(): void;

  // Event tracking
  track(event: string, properties?: Record<string, unknown>): void;
  page(name: string, properties?: Record<string, unknown>): void;

  // Group/organization tracking
  group(groupId: string, traits?: Record<string, unknown>): void;

  // Feature flags (if supported)
  getFeatureFlag?(flagKey: string): boolean | string | undefined;
}
```

### 6.2 MixPanel Implementation

```typescript
// lib/analytics/providers/mixpanel.ts
import mixpanel from 'mixpanel-browser';

export class MixPanelProvider implements AnalyticsProvider {
  init() {
    mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!, {
      debug: process.env.NODE_ENV === 'development',
      track_pageview: false, // We track manually
      persistence: 'localStorage',
      ignore_dnt: false
    });
  }

  identify(userId: string, traits?: Record<string, unknown>) {
    mixpanel.identify(userId);
    if (traits) {
      mixpanel.people.set(traits);
    }
  }

  reset() {
    mixpanel.reset();
  }

  track(event: string, properties?: Record<string, unknown>) {
    mixpanel.track(event, {
      ...properties,
      _timestamp: new Date().toISOString()
    });
  }

  page(name: string, properties?: Record<string, unknown>) {
    mixpanel.track('page_viewed', {
      pageName: name,
      ...properties
    });
  }

  group(groupId: string, traits?: Record<string, unknown>) {
    mixpanel.set_group('organization', groupId);
    if (traits) {
      mixpanel.get_group('organization', groupId).set(traits);
    }
  }
}
```

### 6.3 PostHog Implementation

```typescript
// lib/analytics/providers/posthog.ts
import posthog from 'posthog-js';

export class PostHogProvider implements AnalyticsProvider {
  init() {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      capture_pageview: false,
      persistence: 'localStorage'
    });
  }

  identify(userId: string, traits?: Record<string, unknown>) {
    posthog.identify(userId, traits);
  }

  reset() {
    posthog.reset();
  }

  track(event: string, properties?: Record<string, unknown>) {
    posthog.capture(event, properties);
  }

  page(name: string, properties?: Record<string, unknown>) {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      pageName: name,
      ...properties
    });
  }

  group(groupId: string, traits?: Record<string, unknown>) {
    posthog.group('organization', groupId, traits);
  }

  getFeatureFlag(flagKey: string) {
    return posthog.getFeatureFlag(flagKey);
  }
}
```

### 6.4 Provider Selection

```typescript
// lib/analytics/index.ts
import { MixPanelProvider } from './providers/mixpanel';
import { PostHogProvider } from './providers/posthog';
import { NoOpProvider } from './providers/noop';

function createProvider(): AnalyticsProvider {
  const providerName = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;

  switch (providerName) {
    case 'mixpanel':
      return new MixPanelProvider();
    case 'posthog':
      return new PostHogProvider();
    case 'none':
    default:
      return new NoOpProvider(); // For development/testing
  }
}

export const analytics = createProvider();
```

---

## 7. User Identification

### 7.1 Identification Strategy

```typescript
// When user logs in
async function onUserLogin(user: User) {
  // Identify the user
  analytics.identify(user.id, {
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  });

  // Associate with organization
  analytics.group(user.organizationId, {
    name: user.organization.name,
    industry: user.organization.industry,
    plan: user.organization.plan
  });

  // Track login event
  analytics.track('user_login', {
    method: 'email', // or 'pin', 'sso'
    isFirstLogin: user.loginCount === 1
  });
}

// When user logs out
function onUserLogout() {
  analytics.track('user_logout');
  analytics.reset();
}
```

### 7.2 Anonymous Tracking

For unauthenticated users:

```typescript
// Anonymous user tracking
function trackAnonymousAction(action: string, properties?: Record<string, unknown>) {
  analytics.track(action, {
    ...properties,
    isAnonymous: true
  });
}

// After signup, link anonymous to identified
function linkAnonymousUser(userId: string) {
  const anonymousId = getAnonymousId();
  analytics.track('user_created', {
    previousAnonymousId: anonymousId
  });
  analytics.identify(userId);
}
```

---

## 8. Analytics Dashboard

### 8.1 Key Metrics to Track

**Engagement Metrics:**
- Daily/Weekly/Monthly Active Users
- Session duration
- Feature usage rates
- Behavior logging frequency

**Business Metrics:**
- Behaviors logged per user per day
- Verification rate
- KPI improvement correlation
- AI recommendation acceptance rate

**Technical Metrics:**
- API response times
- Error rates
- AI operation costs
- Page load times

### 8.2 Recommended Dashboards

**Executive Dashboard:**
- Total behaviors logged (trend)
- Active users (trend)
- KPI improvement rates
- AI cost analysis

**Product Dashboard:**
- Feature usage heatmap
- User flow analysis
- Drop-off points
- A/B test results

**Engineering Dashboard:**
- Error rates by endpoint
- Response time percentiles
- AI operation metrics
- Integration sync status

---

## Summary

The analytics layer provides:

| Capability | Implementation |
|------------|----------------|
| **Event Tracking** | Typed events with consistent naming |
| **User Identification** | Cross-session user tracking |
| **Organization Context** | Multi-tenant analytics |
| **Provider Abstraction** | Swap between MixPanel/PostHog/custom |
| **Privacy Compliance** | No PII without consent |
| **Performance** | Non-blocking, batched tracking |

All analytics events follow strict naming conventions and property standards to ensure data quality and consistency across the platform.

---

*This document is part of the Topline documentation suite. See [00-INDEX.md](./00-INDEX.md) for the complete list.*
