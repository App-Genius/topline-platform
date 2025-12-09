# Topline: Implementation Roadmap

## Overview

This document provides the phased implementation plan for building the complete Topline system. Each phase builds on the previous, delivering incremental value while maintaining system stability.

---

## Table of Contents

1. [Implementation Principles](#1-implementation-principles)
2. [Current State Assessment](#2-current-state-assessment)
3. [Phase 0: Foundation Fixes](#3-phase-0-foundation-fixes)
4. [Phase 1: Core CRUD Operations](#4-phase-1-core-crud-operations)
5. [Phase 2: Manager Operations](#5-phase-2-manager-operations)
6. [Phase 3: Staff Experience](#6-phase-3-staff-experience)
7. [Phase 4: Analytics & Insights](#7-phase-4-analytics--insights)
8. [Phase 5: Advanced Features](#8-phase-5-advanced-features)
9. [Phase 6: Scale & Optimize](#9-phase-6-scale--optimize)
10. [Dependency Map](#10-dependency-map)
11. [Risk Mitigation](#11-risk-mitigation)

---

## 1. Implementation Principles

### 1.1 Guiding Principles

| Principle | Description |
|-----------|-------------|
| **Business Value First** | Each phase delivers usable functionality |
| **Vertical Slices** | Complete features end-to-end before moving on |
| **Test as You Go** | Every feature has tests before moving forward |
| **Iterative Refinement** | Build simple, then enhance |
| **User Feedback Loops** | Deploy early, gather feedback |

### 1.2 Definition of Done

Each task is complete when:
- [ ] Code written and reviewed
- [ ] Unit tests passing
- [ ] Integration tests passing (if applicable)
- [ ] E2E tests for critical paths
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Accessible (keyboard, screen reader basics)
- [ ] Documented (if API/hook)

---

## 2. Current State Assessment

### 2.1 What Exists

| Component | Status | Notes |
|-----------|--------|-------|
| **Monorepo Structure** | ✅ Complete | Turborepo, proper package structure |
| **Database Schema** | ✅ Complete | Prisma schema with all entities |
| **API Framework** | ✅ Complete | Hono with OpenAPI |
| **Auth System** | ✅ Complete | JWT + PIN login |
| **Frontend Framework** | ✅ Complete | Next.js 16 App Router |
| **Design System** | 🟡 Partial | Basic components exist |
| **React Query Setup** | ✅ Complete | Provider and basic hooks |

### 2.2 What's Broken

| Issue | Severity | Root Cause |
|-------|----------|------------|
| Manager Briefing page crash | P0 | Unknown - needs debugging |
| Settings page empty | P1 | Not implemented |
| Hydration errors | P1 | Math.random() in SSR |
| Budget page mock data | P2 | No real API |

### 2.3 What's Missing

| Feature | Priority | Complexity |
|---------|----------|------------|
| Budget CRUD API | High | Medium |
| KPI Configuration UI | High | Medium |
| Role Templates | Medium | Low |
| Training CRUD | Medium | Medium |
| Briefing Photo Upload | Medium | Medium |
| Receipt Scanning | Low | High |
| AI Insights | Low | High |
| Correlation Analysis | Low | High |

---

## 3. Phase 0: Foundation Fixes

**Goal:** Fix all broken functionality before adding new features.

### 3.1 Fix Manager Briefing Page

**Problem:** Page throws error before rendering

**Tasks:**
1. Debug the error (check console, error boundary)
2. Fix `useBriefing` hook to handle missing data
3. Add proper loading and error states
4. Test with empty data, partial data, full data

**Files:**
- `apps/web/app/(app)/manager/briefing/page.tsx`
- `apps/web/hooks/queries/useBriefing.ts`

### 3.2 Fix Settings Page

**Problem:** Page renders but no content

**Tasks:**
1. Implement settings sections UI
2. Wire up `useSettings` and `useUpdateSettings` hooks
3. Add form validation
4. Test save functionality

**Files:**
- `apps/web/app/(app)/admin/settings/page.tsx`
- `apps/web/hooks/queries/useSettings.ts`

### 3.3 Fix Hydration Errors

**Problem:** Server/client mismatch from random values

**Tasks:**
1. Identify all uses of `Math.random()` and `Date.now()` in demo data
2. Move random generation to `useEffect` or seed on server
3. Add hydration error logging
4. Test all affected pages

**Files:**
- `apps/web/app/(app)/admin/page.tsx`
- `apps/web/app/(app)/scoreboard/page.tsx`

### 3.4 Acceptance Criteria

- [ ] All pages load without errors
- [ ] No console errors or warnings
- [ ] Settings can be viewed and saved
- [ ] Briefing page shows appropriate content or empty state

---

## 4. Phase 1: Core CRUD Operations

**Goal:** Complete all basic data management functionality.

### 4.1 Budget System

**API Endpoints:**
```
POST   /api/budgets              - Create budget
GET    /api/budgets              - List budgets
GET    /api/budgets/:id          - Get budget with items
PATCH  /api/budgets/:id          - Update budget
DELETE /api/budgets/:id          - Delete budget
POST   /api/budgets/:id/items    - Add line item
PATCH  /api/budget-items/:id     - Update line item
DELETE /api/budget-items/:id     - Delete line item
GET    /api/budgets/:id/variance - Get variance report
```

**Frontend:**
- Budget list page with create/edit
- Budget detail page with line items
- Variance visualization
- Budget alerts

**Tasks:**
1. Create API route handlers
2. Create React Query hooks
3. Build UI components
4. Add variance calculations
5. Implement budget alerts

### 4.2 KPI Configuration

**API Endpoints:**
```
POST   /api/kpis                 - Create KPI
GET    /api/kpis                 - List KPIs
PATCH  /api/kpis/:id             - Update KPI
DELETE /api/kpis/:id             - Delete KPI
POST   /api/kpis/values          - Record value
GET    /api/kpis/:id/values      - Get historical values
```

**Frontend:**
- KPI management page
- KPI target configuration
- Threshold settings

**Tasks:**
1. Create API route handlers
2. Build KPI management UI
3. Add target/threshold editing
4. Connect to dashboard

### 4.3 Enhanced Role Management

**Features:**
- Role templates by type
- Default behaviors per role type
- Permission presets

**Tasks:**
1. Create role templates data
2. Add template selection to role create
3. Auto-assign behaviors based on template
4. Update role edit to show behaviors

### 4.4 Behavior Enhancements

**Features:**
- Behavior categories
- Frequency configuration
- KPI association

**Tasks:**
1. Add category field to behaviors
2. Add frequency field
3. Add KPI link (optional)
4. Update UI to show categories

### 4.5 Acceptance Criteria

- [ ] Budget CRUD fully functional
- [ ] KPI configuration works
- [ ] Role templates available
- [ ] Behavior categories implemented

---

## 5. Phase 2: Manager Operations

**Goal:** Complete daily operational workflows for managers.

### 5.1 Daily Briefing Flow

**Complete Flow:**
1. Open briefing for today
2. Show yesterday's metrics
3. Display today's targets
4. Show training topic
5. Set upsell focus items
6. Record attendees
7. Upload photo (optional)
8. Complete briefing

**API Endpoints:**
```
GET    /api/briefings/today       - Get today's briefing data
POST   /api/briefings/complete    - Mark briefing complete
POST   /api/briefings/photo       - Upload attendance photo
GET    /api/briefings/history     - View past briefings
```

**Tasks:**
1. Build briefing wizard component
2. Implement attendance tracking
3. Add photo upload
4. Store briefing records
5. Show completion history

### 5.2 Behavior Verification

**Enhancements:**
- Bulk verification
- Filter by behavior, user, time
- Notes on verification
- Reject with reason

**Tasks:**
1. Add bulk verify API endpoint
2. Build multi-select UI
3. Add filter controls
4. Implement reject flow

### 5.3 Daily Entry Enhancement

**Features:**
- Per-staff revenue breakdown (optional)
- Cost entries
- Review summary
- Game state display

**Tasks:**
1. Add cost entry fields
2. Build staff breakdown UI
3. Show game state after save
4. Celebration trigger

### 5.4 Acceptance Criteria

- [ ] Complete briefing workflow functional
- [ ] Photo upload works
- [ ] Bulk verification available
- [ ] Daily entry saves correctly
- [ ] Game state updates

---

## 6. Phase 3: Staff Experience

**Goal:** Optimize the mobile staff experience.

### 6.1 Quick Log Optimization

**Features:**
- Large touch targets
- Quick log without metadata
- Instant feedback animation
- Progress indicator
- Streak display

**Tasks:**
1. Redesign behavior buttons
2. Add progress ring
3. Implement streak tracking
4. Add success animations
5. Optimize for touch

### 6.2 Staff Dashboard

**Features:**
- Today's progress
- Personal stats
- Leaderboard position
- AI coach tips
- Recent behaviors

**Tasks:**
1. Build progress dashboard
2. Add personal stats cards
3. Show leaderboard snippet
4. Implement AI coach API
5. Display recent activity

### 6.3 PIN Login Enhancement

**Features:**
- Remember device option
- Quick user switch
- Organization selector

**Tasks:**
1. Implement device remember
2. Build user switch UI
3. Add org selection for multi-org

### 6.4 Receipt Scanning (Optional)

**Features:**
- Camera capture
- AI extraction
- Manual correction
- Auto-link to behavior

**Tasks:**
1. Add camera component
2. Implement AI extraction API
3. Build review/edit UI
4. Link to behavior log

### 6.5 Acceptance Criteria

- [ ] Staff can log behaviors quickly
- [ ] Progress visible at glance
- [ ] Animations provide feedback
- [ ] PIN login is smooth

---

## 7. Phase 4: Analytics & Insights

**Goal:** Deliver actionable business intelligence.

### 7.1 Dashboard Calculations

**Features:**
- Real KPI calculations (not mock)
- Benchmark comparisons
- Trend indicators
- Game state

**Tasks:**
1. Implement all calculation functions
2. Connect to real data
3. Add benchmark comparison
4. Calculate game state
5. Add trend arrows

### 7.2 Correlation Analysis

**Features:**
- Behavior-KPI correlations
- Statistical significance
- AI interpretation
- Anomaly detection

**Tasks:**
1. Implement Pearson correlation
2. Add significance testing
3. Build correlation matrix UI
4. Integrate AI interpretation
5. Add anomaly alerts

### 7.3 Leaderboard

**Features:**
- Multiple metrics (behaviors, points, avg check)
- Time periods (day, week, month)
- Rank changes
- Streak tracking

**Tasks:**
1. Build leaderboard API
2. Create ranking UI
3. Add metric toggle
4. Show rank changes
5. Display streaks

### 7.4 Reports

**Features:**
- Weekly summary
- Monthly report
- Behavior adoption
- Budget variance

**Tasks:**
1. Build report generation API
2. Create report templates
3. Add PDF export
4. Email scheduling (future)

### 7.5 AI Insights

**Features:**
- Dashboard insights
- Trend analysis
- Recommendations
- AI coach messages

**Tasks:**
1. Implement insight generation
2. Build insight cards
3. Add recommendation engine
4. Create AI coach API

### 7.6 Acceptance Criteria

- [ ] Dashboard shows real data
- [ ] Correlations calculated correctly
- [ ] Leaderboard updates in real-time
- [ ] Reports generate properly
- [ ] AI insights are relevant

---

## 8. Phase 5: Advanced Features

**Goal:** Add differentiating features.

### 8.1 Scoreboard Configuration

**Features:**
- Choose displayed metrics
- Privacy controls
- Refresh rate
- Display themes

**Tasks:**
1. Add scoreboard settings
2. Build metric selector
3. Implement privacy mode
4. Add display themes

### 8.2 Training System

**Features:**
- Topic management
- Session tracking
- Attendance records
- Rotation scheduling

**Tasks:**
1. Build training CRUD
2. Create session tracking
3. Add attendance UI
4. Implement rotation logic

### 8.3 Feedback Collection

**Features:**
- Anonymous feedback
- Category selection
- Owner response
- Weekly synthesis

**Tasks:**
1. Create feedback API
2. Build submission form
3. Add owner dashboard
4. Implement AI synthesis

### 8.4 Incentive System

**Features:**
- Define incentives
- Track progress
- Award badges
- Leaderboard prizes

**Tasks:**
1. Design incentive schema
2. Build incentive CRUD
3. Create tracking logic
4. Add award UI

### 8.5 Acceptance Criteria

- [ ] Scoreboard is configurable
- [ ] Training system complete
- [ ] Feedback flows work
- [ ] Incentives trackable

---

## 9. Phase 6: Scale & Optimize

**Goal:** Production readiness and performance.

### 9.1 Performance Optimization

**Tasks:**
1. Add database indexes
2. Implement caching
3. Optimize queries
4. Add pagination
5. Lazy load components

### 9.2 Multi-Location Support

**Features:**
- Location-specific data
- Cross-location reports
- Location selector

**Tasks:**
1. Add location filters
2. Build location comparison
3. Create roll-up reports

### 9.3 POS Integration (Future)

**Features:**
- Auto-import sales
- Staff attribution
- Item-level tracking

### 9.4 Review Integration (Future)

**Features:**
- Google Business API
- TripAdvisor API
- Aggregate ratings

### 9.5 Acceptance Criteria

- [ ] Page load < 2 seconds
- [ ] API response < 200ms
- [ ] Multi-location works
- [ ] No N+1 queries

---

## 10. Dependency Map

```
Phase 0 (Foundation)
    │
    ├── Fix Briefing Page
    ├── Fix Settings Page
    └── Fix Hydration
            │
            ▼
Phase 1 (Core CRUD)
    │
    ├── Budget System ─────┐
    ├── KPI Configuration ─┼─── Required for Phase 4
    ├── Role Templates     │
    └── Behavior Categories┘
            │
            ▼
Phase 2 (Manager Ops) ◄──── Depends on Phase 1 KPIs
    │
    ├── Briefing Flow ─────┐
    ├── Verification       ├─── Required for Phase 3
    └── Daily Entry ───────┘
            │
            ▼
Phase 3 (Staff Experience)
    │
    ├── Quick Log ─────────┐
    ├── Staff Dashboard    ├─── Required for Phase 4
    └── Receipt Scanning ──┘
            │
            ▼
Phase 4 (Analytics)
    │
    ├── Dashboard Calcs ───┐
    ├── Correlations       │
    ├── Leaderboard        ├─── Required for Phase 5
    ├── Reports            │
    └── AI Insights ───────┘
            │
            ▼
Phase 5 (Advanced)
    │
    ├── Scoreboard Config
    ├── Training System
    ├── Feedback
    └── Incentives
            │
            ▼
Phase 6 (Scale)
    │
    ├── Performance
    ├── Multi-Location
    └── Integrations
```

---

## 11. Risk Mitigation

### 11.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Database performance | High | Add indexes early, monitor queries |
| AI costs | Medium | Implement caching, rate limiting |
| Mobile performance | High | Test on real devices regularly |
| Data loss | Critical | Regular backups, soft deletes |

### 11.2 Schedule Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep | High | Strict phase boundaries |
| Underestimation | Medium | Add buffer, prioritize MVP |
| Dependency delays | Medium | Parallel work where possible |

### 11.3 Quality Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Bugs in production | High | Comprehensive testing |
| Poor UX | Medium | Regular user testing |
| Accessibility issues | Medium | Accessibility audit per phase |

---

## Appendix A: Task Breakdown Template

Each task should be broken down as:

```markdown
### Task: [Name]

**Description:** What needs to be done

**Files Affected:**
- path/to/file1.ts
- path/to/file2.tsx

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

**Dependencies:**
- Task X must be complete

**Estimated Effort:** Small / Medium / Large
```

---

## Appendix B: Testing Checklist

For each feature:

```markdown
### Feature: [Name]

**Unit Tests:**
- [ ] Hook logic tested
- [ ] Utility functions tested
- [ ] Validation tested

**Integration Tests:**
- [ ] API endpoints tested
- [ ] Database operations tested

**E2E Tests:**
- [ ] Happy path tested
- [ ] Error states tested
- [ ] Edge cases tested

**Manual Testing:**
- [ ] Desktop Chrome
- [ ] Mobile Safari
- [ ] Tablet
- [ ] Screen reader
```
