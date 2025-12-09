# Topline: API Specification

## Overview

This document provides the complete API specification for the Topline system. All endpoints follow RESTful conventions and return JSON responses.

**Base URL:** `https://api.topline.app` (production) / `http://localhost:8787` (development)

**API Documentation:** `/docs` (Swagger UI) / `/openapi.json` (OpenAPI spec)

---

## Table of Contents

1. [API Conventions](#1-api-conventions)
2. [Authentication](#2-authentication)
3. [Organizations](#3-organizations)
4. [Users](#4-users)
5. [Roles](#5-roles)
6. [Behaviors](#6-behaviors)
7. [Behavior Logs](#7-behavior-logs)
8. [Daily Entries](#8-daily-entries)
9. [KPIs](#9-kpis)
10. [Budgets](#10-budgets)
11. [Briefings](#11-briefings)
12. [Training](#12-training)
13. [Reports](#13-reports)
14. [Insights](#14-insights)
15. [Questionnaire](#15-questionnaire)
16. [Error Handling](#16-error-handling)

---

## 1. API Conventions

### 1.1 Request Format

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` - Page number (1-indexed, default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sort` - Sort field (e.g., `name`, `-createdAt` for descending)

### 1.2 Response Format

**Success Response:**
```json
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

**Single Item Response:**
```json
{
  "id": "clx...",
  "name": "...",
  ...
}
```

**Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": { ... }
  }
}
```

### 1.3 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created |
| 204 | No Content - Successful deletion |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate resource |
| 422 | Unprocessable - Validation failed |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Error - Server error |

### 1.4 Date Formats

- All dates use ISO 8601 format: `2024-12-15T10:30:00.000Z`
- Date-only fields (e.g., `date`) use: `2024-12-15`

---

## 2. Authentication

### 2.1 POST /auth/login

Email/password login for owners and managers.

**Request:**
```json
{
  "email": "owner@restaurant.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2024-12-22T10:30:00.000Z",
  "user": {
    "id": "clx1234567890",
    "email": "owner@restaurant.com",
    "name": "John Owner",
    "avatar": "👔",
    "organizationId": "clxorg123",
    "roleId": "clxrole123",
    "role": {
      "id": "clxrole123",
      "name": "Owner",
      "type": "ADMIN"
    }
  }
}
```

**Errors:**
- 400: Invalid credentials
- 401: Account disabled

---

### 2.2 POST /auth/register

Create new account and organization.

**Request:**
```json
{
  "email": "newowner@business.com",
  "password": "securepassword123",
  "name": "Jane Smith",
  "organizationName": "Jane's Bistro",
  "industry": "RESTAURANT"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2024-12-22T10:30:00.000Z",
  "user": {
    "id": "clx1234567890",
    "email": "newowner@business.com",
    "name": "Jane Smith",
    ...
  },
  "organization": {
    "id": "clxorg456",
    "name": "Jane's Bistro",
    "industry": "RESTAURANT"
  }
}
```

**Errors:**
- 400: Validation error
- 409: Email already exists

---

### 2.3 POST /auth/pin

PIN-based login for staff on shared devices.

**Request:**
```json
{
  "pin": "1234",
  "organizationId": "clxorg123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2024-12-15T18:30:00.000Z",
  "user": {
    "id": "clxstaff789",
    "name": "Alice Server",
    "avatar": "👩‍🍳",
    "role": {
      "type": "SERVER"
    }
  }
}
```

**Notes:**
- PIN tokens expire after 8 hours (shift duration)
- PIN must be unique within organization

---

### 2.4 POST /auth/refresh

Refresh an expiring token.

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2024-12-22T10:30:00.000Z"
}
```

---

## 3. Organizations

### 3.1 GET /api/organizations

Get current user's organization.

**Response (200):**
```json
{
  "id": "clxorg123",
  "name": "Demo Restaurant",
  "industry": "RESTAURANT",
  "settings": {
    "scoreboard": {
      "showRevenue": true,
      "primaryMetric": "avgCheck"
    },
    "features": {
      "aiInsights": true,
      "receiptScanning": true
    }
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-12-01T14:20:00.000Z"
}
```

---

### 3.2 PATCH /api/organizations

Update organization settings.

**Required Permission:** `org:edit`

**Request:**
```json
{
  "name": "Updated Restaurant Name",
  "settings": {
    "scoreboard": {
      "showRevenue": false
    }
  }
}
```

**Response (200):**
```json
{
  "id": "clxorg123",
  "name": "Updated Restaurant Name",
  ...
}
```

---

## 4. Users

### 4.1 GET /api/users

List users in organization.

**Query Parameters:**
- `roleId` - Filter by role
- `isActive` - Filter by active status
- `search` - Search by name or email

**Response (200):**
```json
{
  "data": [
    {
      "id": "clxuser1",
      "email": "manager@restaurant.com",
      "name": "Mike Manager",
      "avatar": "📋",
      "isActive": true,
      "role": {
        "id": "clxrole2",
        "name": "Manager",
        "type": "MANAGER"
      },
      "createdAt": "2024-06-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### 4.2 POST /api/users

Create new user.

**Required Permission:** `users:create`

**Request:**
```json
{
  "email": "newstaff@restaurant.com",
  "password": "temppassword123",
  "name": "New Staff Member",
  "avatar": "🧑",
  "roleId": "clxrole3",
  "pin": "5555"
}
```

**Response (201):**
```json
{
  "id": "clxuser789",
  "email": "newstaff@restaurant.com",
  "name": "New Staff Member",
  ...
}
```

**Errors:**
- 400: Validation error (invalid email, weak password)
- 409: Email already exists
- 409: PIN already in use

---

### 4.3 GET /api/users/:id

Get single user.

**Response (200):**
```json
{
  "id": "clxuser1",
  "email": "user@restaurant.com",
  "name": "User Name",
  "avatar": "🧑",
  "isActive": true,
  "organizationId": "clxorg123",
  "roleId": "clxrole3",
  "role": {
    "id": "clxrole3",
    "name": "Server",
    "type": "SERVER",
    "permissions": ["behaviors:view", "behaviors:log"]
  },
  "createdAt": "2024-06-01T10:00:00.000Z",
  "updatedAt": "2024-12-01T14:20:00.000Z"
}
```

---

### 4.4 PATCH /api/users/:id

Update user.

**Required Permission:** `users:edit`

**Request:**
```json
{
  "name": "Updated Name",
  "roleId": "clxrole4",
  "isActive": false
}
```

**Response (200):**
```json
{
  "id": "clxuser1",
  "name": "Updated Name",
  ...
}
```

---

### 4.5 DELETE /api/users/:id

Delete user (soft delete).

**Required Permission:** `users:delete`

**Response (204):** No content

**Notes:**
- Sets `isActive: false` rather than hard delete
- Historical data preserved

---

### 4.6 PATCH /api/users/:id/pin

Update user's PIN.

**Request:**
```json
{
  "pin": "9999"
}
```

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- 409: PIN already in use by another user

---

### 4.7 PATCH /api/users/:id/password

Update user's password.

**Request:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newsecurepassword123"
}
```

**Response (200):**
```json
{
  "success": true
}
```

---

## 5. Roles

### 5.1 GET /api/roles

List roles in organization.

**Response (200):**
```json
{
  "data": [
    {
      "id": "clxrole1",
      "name": "Owner",
      "type": "ADMIN",
      "permissions": ["*"],
      "userCount": 1,
      "behaviorCount": 0
    },
    {
      "id": "clxrole2",
      "name": "Floor Manager",
      "type": "MANAGER",
      "permissions": ["behaviors:verify", "entries:create", ...],
      "userCount": 2,
      "behaviorCount": 0
    },
    {
      "id": "clxrole3",
      "name": "Server",
      "type": "SERVER",
      "permissions": ["behaviors:view", "behaviors:log"],
      "userCount": 8,
      "behaviorCount": 5
    }
  ],
  "meta": { ... }
}
```

---

### 5.2 POST /api/roles

Create new role.

**Required Permission:** `roles:manage`

**Request:**
```json
{
  "name": "Lead Server",
  "type": "SERVER",
  "permissions": ["behaviors:view", "behaviors:log", "behaviors:verify"],
  "behaviorIds": ["clxbeh1", "clxbeh2"]
}
```

**Response (201):**
```json
{
  "id": "clxrole4",
  "name": "Lead Server",
  "type": "SERVER",
  ...
}
```

---

### 5.3 GET /api/roles/:id

Get single role with behaviors.

**Response (200):**
```json
{
  "id": "clxrole3",
  "name": "Server",
  "type": "SERVER",
  "permissions": ["behaviors:view", "behaviors:log"],
  "behaviors": [
    {
      "id": "clxbeh1",
      "name": "Upsell Appetizer",
      "targetPerDay": 10
    },
    {
      "id": "clxbeh2",
      "name": "Suggest Wine Pairing",
      "targetPerDay": 5
    }
  ],
  "users": [
    {
      "id": "clxuser1",
      "name": "Alice Server"
    }
  ]
}
```

---

### 5.4 PATCH /api/roles/:id

Update role.

**Required Permission:** `roles:manage`

**Request:**
```json
{
  "name": "Senior Server",
  "permissions": ["behaviors:view", "behaviors:log", "behaviors:verify"],
  "behaviorIds": ["clxbeh1", "clxbeh2", "clxbeh3"]
}
```

---

### 5.5 DELETE /api/roles/:id

Delete role.

**Required Permission:** `roles:manage`

**Response (204):** No content

**Errors:**
- 400: Cannot delete role with assigned users
- 400: Cannot delete system roles (ADMIN)

---

## 6. Behaviors

### 6.1 GET /api/behaviors

List behaviors in organization.

**Query Parameters:**
- `roleId` - Filter by assigned role
- `category` - Filter by category (REVENUE, COST_CONTROL, QUALITY, COMPLIANCE)
- `isActive` - Filter by active status

**Response (200):**
```json
{
  "data": [
    {
      "id": "clxbeh1",
      "name": "Upsell Appetizer",
      "description": "Suggest appetizer to table",
      "category": "REVENUE",
      "frequency": "PER_SHIFT",
      "targetPerDay": 10,
      "points": 2,
      "isActive": true,
      "roles": [
        { "id": "clxrole3", "name": "Server" }
      ],
      "todayCount": 45,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "meta": { ... }
}
```

---

### 6.2 POST /api/behaviors

Create new behavior.

**Required Permission:** `behaviors:manage`

**Request:**
```json
{
  "name": "Suggest Premium Spirits",
  "description": "Offer top-shelf options when customer orders basic spirits",
  "category": "REVENUE",
  "frequency": "PER_SHIFT",
  "targetPerDay": 5,
  "points": 3,
  "roleIds": ["clxrole4"]
}
```

**Response (201):**
```json
{
  "id": "clxbeh5",
  "name": "Suggest Premium Spirits",
  ...
}
```

---

### 6.3 GET /api/behaviors/:id

Get single behavior with stats.

**Response (200):**
```json
{
  "id": "clxbeh1",
  "name": "Upsell Appetizer",
  "description": "Suggest appetizer to table",
  "category": "REVENUE",
  "frequency": "PER_SHIFT",
  "targetPerDay": 10,
  "points": 2,
  "isActive": true,
  "roles": [
    { "id": "clxrole3", "name": "Server" }
  ],
  "stats": {
    "todayCount": 45,
    "weekCount": 280,
    "monthCount": 1200,
    "verificationRate": 0.85,
    "topPerformers": [
      { "userId": "clxuser1", "name": "Alice", "count": 12 },
      { "userId": "clxuser2", "name": "Bob", "count": 10 }
    ]
  }
}
```

---

### 6.4 PATCH /api/behaviors/:id

Update behavior.

**Required Permission:** `behaviors:manage`

**Request:**
```json
{
  "targetPerDay": 15,
  "points": 3,
  "roleIds": ["clxrole3", "clxrole4"]
}
```

---

### 6.5 DELETE /api/behaviors/:id

Delete behavior (soft delete).

**Required Permission:** `behaviors:manage`

**Response (204):** No content

**Notes:**
- Sets `isActive: false`
- Historical logs preserved

---

## 7. Behavior Logs

### 7.1 GET /api/behavior-logs

List behavior logs.

**Query Parameters:**
- `userId` - Filter by user
- `behaviorId` - Filter by behavior
- `locationId` - Filter by location
- `verified` - Filter by verification status
- `startDate` - Filter from date (inclusive)
- `endDate` - Filter to date (inclusive)

**Response (200):**
```json
{
  "data": [
    {
      "id": "clxlog1",
      "userId": "clxuser1",
      "behaviorId": "clxbeh1",
      "locationId": "clxloc1",
      "metadata": {
        "tableNumber": "14",
        "notes": "Appetizer sampler"
      },
      "verified": true,
      "verifiedById": "clxuser10",
      "verifiedAt": "2024-12-15T14:30:00.000Z",
      "createdAt": "2024-12-15T12:15:00.000Z",
      "user": {
        "id": "clxuser1",
        "name": "Alice Server",
        "avatar": "👩‍🍳"
      },
      "behavior": {
        "id": "clxbeh1",
        "name": "Upsell Appetizer",
        "points": 2
      }
    }
  ],
  "meta": { ... }
}
```

---

### 7.2 POST /api/behavior-logs

Log a behavior.

**Required Permission:** `behaviors:log`

**Request:**
```json
{
  "behaviorId": "clxbeh1",
  "locationId": "clxloc1",
  "metadata": {
    "tableNumber": "7",
    "notes": "Suggested daily special appetizer"
  }
}
```

**Response (201):**
```json
{
  "id": "clxlog123",
  "userId": "clxuser1",
  "behaviorId": "clxbeh1",
  "verified": false,
  "createdAt": "2024-12-15T14:00:00.000Z",
  "points": 2,
  "todayTotal": 8,
  "todayTarget": 10
}
```

---

### 7.3 GET /api/behavior-logs/:id

Get single behavior log.

**Response (200):**
```json
{
  "id": "clxlog1",
  "userId": "clxuser1",
  "behaviorId": "clxbeh1",
  "locationId": "clxloc1",
  "metadata": { ... },
  "verified": false,
  "createdAt": "2024-12-15T12:15:00.000Z",
  "user": { ... },
  "behavior": { ... },
  "location": { ... }
}
```

---

### 7.4 PATCH /api/behavior-logs/:id/verify

Verify or reject a behavior log.

**Required Permission:** `behaviors:verify`

**Request:**
```json
{
  "verified": true,
  "notes": "Confirmed with table check"
}
```

**Response (200):**
```json
{
  "id": "clxlog1",
  "verified": true,
  "verifiedById": "clxuser10",
  "verifiedAt": "2024-12-15T14:30:00.000Z",
  "user": {
    "id": "clxuser1",
    "name": "Alice Server",
    "pointsToday": 16,
    "pointsWeek": 85
  }
}
```

---

### 7.5 DELETE /api/behavior-logs/:id

Delete a behavior log.

**Required Permission:** `behaviors:verify` or own log within 5 minutes

**Response (204):** No content

---

### 7.6 POST /api/behavior-logs/bulk-verify

Verify multiple logs at once.

**Required Permission:** `behaviors:verify`

**Request:**
```json
{
  "logIds": ["clxlog1", "clxlog2", "clxlog3"],
  "verified": true
}
```

**Response (200):**
```json
{
  "verified": 3,
  "failed": 0
}
```

---

## 8. Daily Entries

### 8.1 GET /api/daily-entries

List daily entries.

**Query Parameters:**
- `locationId` - Filter by location
- `startDate` - Filter from date
- `endDate` - Filter to date

**Response (200):**
```json
{
  "data": [
    {
      "id": "clxentry1",
      "locationId": "clxloc1",
      "date": "2024-12-15",
      "totalRevenue": 3245.50,
      "totalCovers": 95,
      "averageCheck": 34.16,
      "notes": "Busy Saturday night",
      "createdAt": "2024-12-15T23:00:00.000Z",
      "location": {
        "id": "clxloc1",
        "name": "Main Street"
      },
      "comparison": {
        "benchmarkRevenue": 2500.00,
        "revenueVariance": 29.82,
        "benchmarkAvgCheck": 32.50,
        "avgCheckVariance": 5.11
      }
    }
  ],
  "meta": { ... }
}
```

---

### 8.2 POST /api/daily-entries

Create or update daily entry.

**Required Permission:** `entries:create`

**Request:**
```json
{
  "locationId": "clxloc1",
  "date": "2024-12-15",
  "totalRevenue": 3245.50,
  "totalCovers": 95,
  "notes": "Busy Saturday night"
}
```

**Response (201):**
```json
{
  "id": "clxentry1",
  "locationId": "clxloc1",
  "date": "2024-12-15",
  "totalRevenue": 3245.50,
  "totalCovers": 95,
  "averageCheck": 34.16,
  "gameState": "winning",
  "celebration": true
}
```

**Notes:**
- If entry exists for date/location, it updates instead
- Returns game state and triggers celebration if beating benchmark

---

### 8.3 GET /api/daily-entries/:id

Get single daily entry with details.

**Response (200):**
```json
{
  "id": "clxentry1",
  "locationId": "clxloc1",
  "date": "2024-12-15",
  "totalRevenue": 3245.50,
  "totalCovers": 95,
  "averageCheck": 34.16,
  "notes": "Busy Saturday night",
  "reviews": [
    {
      "id": "clxrev1",
      "source": "GOOGLE",
      "rating": 5,
      "text": "Great service!"
    }
  ],
  "behaviorSummary": {
    "totalLogged": 145,
    "totalVerified": 128,
    "byBehavior": [
      { "behaviorId": "clxbeh1", "name": "Upsell Appetizer", "count": 45 },
      { "behaviorId": "clxbeh2", "name": "Suggest Wine", "count": 23 }
    ]
  }
}
```

---

### 8.4 PATCH /api/daily-entries/:id

Update daily entry.

**Required Permission:** `entries:edit`

**Request:**
```json
{
  "totalRevenue": 3300.00,
  "notes": "Updated after reconciliation"
}
```

---

## 9. KPIs

### 9.1 GET /api/kpis

List KPIs for organization.

**Response (200):**
```json
{
  "data": [
    {
      "id": "clxkpi1",
      "name": "Daily Revenue",
      "type": "REVENUE",
      "target": 2500.00,
      "warningThreshold": 2000.00,
      "unit": "$",
      "displayFormat": "currency",
      "isActive": true,
      "currentValue": 3245.50,
      "trend": "up",
      "trendPercent": 12.5
    },
    {
      "id": "clxkpi2",
      "name": "Average Check",
      "type": "AVERAGE_CHECK",
      "target": 35.00,
      "unit": "$",
      "displayFormat": "currency",
      "currentValue": 34.16,
      "trend": "stable",
      "trendPercent": 1.2
    }
  ]
}
```

---

### 9.2 POST /api/kpis

Create KPI.

**Required Permission:** `settings:edit`

**Request:**
```json
{
  "name": "Food Cost %",
  "type": "FOOD_COST",
  "target": 28.0,
  "warningThreshold": 30.0,
  "criticalThreshold": 35.0,
  "unit": "%",
  "displayFormat": "percent"
}
```

**Response (201):**
```json
{
  "id": "clxkpi5",
  "name": "Food Cost %",
  ...
}
```

---

### 9.3 GET /api/kpis/:id

Get KPI with historical values.

**Query Parameters:**
- `startDate` - Start of range
- `endDate` - End of range
- `locationId` - Filter by location

**Response (200):**
```json
{
  "id": "clxkpi1",
  "name": "Daily Revenue",
  "type": "REVENUE",
  "target": 2500.00,
  "values": [
    { "date": "2024-12-15", "value": 3245.50, "locationId": "clxloc1" },
    { "date": "2024-12-14", "value": 2890.00, "locationId": "clxloc1" },
    { "date": "2024-12-13", "value": 2100.25, "locationId": "clxloc1" }
  ],
  "stats": {
    "average": 2745.25,
    "min": 2100.25,
    "max": 3245.50,
    "daysAboveTarget": 8,
    "daysBelowTarget": 4
  }
}
```

---

### 9.4 POST /api/kpis/values

Record KPI value.

**Required Permission:** `entries:create`

**Request:**
```json
{
  "kpiId": "clxkpi5",
  "locationId": "clxloc1",
  "date": "2024-12-15",
  "value": 27.5,
  "notes": "Good week for food cost"
}
```

**Response (201):**
```json
{
  "id": "clxkpival1",
  "kpiId": "clxkpi5",
  "date": "2024-12-15",
  "value": 27.5,
  "status": "on-target"
}
```

---

## 10. Budgets

### 10.1 GET /api/budgets

List budgets.

**Query Parameters:**
- `isActive` - Filter by active status
- `year` - Filter by year

**Response (200):**
```json
{
  "data": [
    {
      "id": "clxbudget1",
      "name": "Q4 2024 Budget",
      "periodStart": "2024-10-01",
      "periodEnd": "2024-12-31",
      "isActive": true,
      "summary": {
        "totalBudgeted": 250000.00,
        "totalActual": 185000.00,
        "variance": -26.0,
        "status": "on-track"
      }
    }
  ]
}
```

---

### 10.2 POST /api/budgets

Create budget.

**Required Permission:** `budget:manage`

**Request:**
```json
{
  "name": "Q1 2025 Budget",
  "periodStart": "2025-01-01",
  "periodEnd": "2025-03-31",
  "lineItems": [
    { "category": "REVENUE", "name": "Food Sales", "budgeted": 180000 },
    { "category": "REVENUE", "name": "Beverage Sales", "budgeted": 60000 },
    { "category": "COGS", "name": "Food Cost", "budgeted": 54000 },
    { "category": "LABOR", "name": "Payroll", "budgeted": 72000 }
  ]
}
```

**Response (201):**
```json
{
  "id": "clxbudget2",
  "name": "Q1 2025 Budget",
  ...
}
```

---

### 10.3 GET /api/budgets/:id

Get budget with line items.

**Response (200):**
```json
{
  "id": "clxbudget1",
  "name": "Q4 2024 Budget",
  "periodStart": "2024-10-01",
  "periodEnd": "2024-12-31",
  "lineItems": [
    {
      "id": "clxitem1",
      "category": "REVENUE",
      "name": "Food Sales",
      "budgeted": 180000.00,
      "actual": 165000.00,
      "variance": -8.33,
      "status": "on-track"
    },
    {
      "id": "clxitem2",
      "category": "COGS",
      "name": "Food Cost",
      "budgeted": 54000.00,
      "actual": 48000.00,
      "variance": -11.11,
      "status": "under"
    }
  ],
  "summary": {
    "byCategory": {
      "REVENUE": { "budgeted": 240000, "actual": 195000, "variance": -18.75 },
      "COGS": { "budgeted": 72000, "actual": 58000, "variance": -19.44 }
    }
  }
}
```

---

### 10.4 PATCH /api/budgets/:id/items/:itemId

Update budget line item actual value.

**Required Permission:** `budget:manage`

**Request:**
```json
{
  "actual": 52000.00,
  "notes": "November invoice added"
}
```

**Response (200):**
```json
{
  "id": "clxitem1",
  "actual": 52000.00,
  "variance": -3.70,
  "status": "on-track"
}
```

---

### 10.5 GET /api/budgets/:id/variance

Get detailed variance report.

**Response (200):**
```json
{
  "budgetId": "clxbudget1",
  "periodProgress": 0.75,
  "overallVariance": -12.5,
  "status": "on-track",
  "byCategory": [
    {
      "category": "REVENUE",
      "budgeted": 240000,
      "proratedBudget": 180000,
      "actual": 195000,
      "variance": 8.33,
      "status": "over",
      "note": "Revenue ahead of plan"
    },
    {
      "category": "COGS",
      "budgeted": 72000,
      "proratedBudget": 54000,
      "actual": 48000,
      "variance": -11.11,
      "status": "under",
      "note": "Cost control effective"
    }
  ],
  "alerts": [
    {
      "category": "UTILITIES",
      "message": "Utilities 15% over budget",
      "severity": "warning"
    }
  ]
}
```

---

## 11. Briefings

### 11.1 GET /api/briefings/today

Get today's briefing data.

**Response (200):**
```json
{
  "date": "2024-12-15",
  "location": {
    "id": "clxloc1",
    "name": "Main Street"
  },
  "status": "pending",
  "scheduledTopic": {
    "id": "clxtopic1",
    "name": "Wine Service Basics",
    "content": "Today we'll review...",
    "duration": 10
  },
  "yesterdayMetrics": {
    "revenue": 2890.00,
    "covers": 82,
    "averageCheck": 35.24,
    "behaviorsLogged": 145,
    "gameState": "winning"
  },
  "todayTargets": {
    "revenue": 2500.00,
    "covers": 75,
    "behaviors": 150
  },
  "upsellFocus": {
    "food": "Appetizer Sampler ($14.99)",
    "beverage": "House Cabernet ($9/glass)"
  },
  "teamOnShift": [
    { "id": "clxuser1", "name": "Alice", "avatar": "👩‍🍳" },
    { "id": "clxuser2", "name": "Bob", "avatar": "👨‍🍳" }
  ]
}
```

---

### 11.2 POST /api/briefings/complete

Mark briefing as completed.

**Required Permission:** `entries:create` (Manager)

**Request:**
```json
{
  "locationId": "clxloc1",
  "date": "2024-12-15",
  "topicId": "clxtopic1",
  "attendeeIds": ["clxuser1", "clxuser2", "clxuser3"],
  "upsellFood": "Appetizer Sampler",
  "upsellBeverage": "House Cabernet",
  "notes": "Team discussed holiday specials"
}
```

**Response (200):**
```json
{
  "id": "clxbriefing1",
  "status": "completed",
  "completedAt": "2024-12-15T10:30:00.000Z",
  "attendanceRecorded": 3
}
```

---

### 11.3 POST /api/briefings/upload-photo

Upload attendance photo.

**Required Permission:** `entries:create`

**Request:** multipart/form-data
- `briefingId`: string
- `photo`: file (JPEG, PNG)

**Response (200):**
```json
{
  "photoUrl": "https://storage.topline.app/briefings/clxbriefing1.jpg"
}
```

---

### 11.4 GET /api/briefings/history

Get briefing history.

**Query Parameters:**
- `locationId` - Filter by location
- `startDate` - Start of range
- `endDate` - End of range

**Response (200):**
```json
{
  "data": [
    {
      "id": "clxbriefing1",
      "date": "2024-12-15",
      "status": "completed",
      "completedAt": "2024-12-15T10:30:00.000Z",
      "attendeeCount": 8,
      "topic": "Wine Service Basics",
      "hasPhoto": true
    }
  ],
  "stats": {
    "completionRate": 0.95,
    "avgAttendance": 7.5
  }
}
```

---

## 12. Training

### 12.1 GET /api/training/topics

List training topics.

**Response (200):**
```json
{
  "data": [
    {
      "id": "clxtopic1",
      "name": "Wine Service Basics",
      "description": "Foundation wine knowledge",
      "duration": 10,
      "roleTypes": ["SERVER", "BARTENDER"],
      "sessionCount": 12,
      "lastDelivered": "2024-12-10"
    }
  ]
}
```

---

### 12.2 POST /api/training/topics

Create training topic.

**Required Permission:** `settings:edit`

**Request:**
```json
{
  "name": "Handling Difficult Customers",
  "description": "De-escalation techniques",
  "content": "# Overview\n\nWhen dealing with upset customers...",
  "duration": 15,
  "roleTypes": ["SERVER", "HOST", "MANAGER"]
}
```

---

### 12.3 GET /api/training/topics/today

Get scheduled topic for today's briefing.

**Response (200):**
```json
{
  "topic": {
    "id": "clxtopic3",
    "name": "Upselling Techniques",
    "content": "...",
    "duration": 15
  },
  "reason": "scheduled",
  "nextTopics": [
    { "date": "2024-12-16", "topic": "Food Allergen Awareness" },
    { "date": "2024-12-17", "topic": "Wine Service Basics" }
  ]
}
```

---

### 12.4 GET /api/training/sessions

List training sessions.

**Query Parameters:**
- `topicId` - Filter by topic
- `startDate`, `endDate` - Date range

**Response (200):**
```json
{
  "data": [
    {
      "id": "clxsession1",
      "date": "2024-12-15",
      "topic": {
        "id": "clxtopic1",
        "name": "Wine Service Basics"
      },
      "completed": true,
      "attendeeCount": 8,
      "totalTeam": 10,
      "attendanceRate": 0.80
    }
  ]
}
```

---

### 12.5 PATCH /api/training/sessions/:id/attendance

Update attendance for session.

**Request:**
```json
{
  "attendance": [
    { "userId": "clxuser1", "present": true },
    { "userId": "clxuser2", "present": true },
    { "userId": "clxuser3", "present": false }
  ]
}
```

---

## 13. Reports

### 13.1 GET /api/reports/weekly

Get weekly summary report.

**Query Parameters:**
- `weekOf` - Date within target week (defaults to current week)
- `locationId` - Optional location filter

**Response (200):**
```json
{
  "period": {
    "start": "2024-12-09",
    "end": "2024-12-15"
  },
  "revenue": {
    "total": 18500.00,
    "benchmark": 17500.00,
    "variance": 5.71,
    "byDay": [
      { "date": "2024-12-09", "revenue": 2100.00 },
      { "date": "2024-12-10", "revenue": 2300.00 }
    ]
  },
  "kpis": {
    "averageCheck": {
      "value": 34.50,
      "benchmark": 32.50,
      "variance": 6.15
    },
    "totalCovers": {
      "value": 536,
      "benchmark": 500,
      "variance": 7.20
    }
  },
  "behaviors": {
    "totalLogged": 850,
    "totalVerified": 780,
    "verificationRate": 0.918,
    "topBehaviors": [
      { "name": "Upsell Appetizer", "count": 245, "target": 200 }
    ]
  },
  "team": {
    "topPerformers": [
      { "name": "Alice", "behaviors": 98, "points": 245 }
    ],
    "trainingAttendance": 0.92
  },
  "insights": [
    {
      "type": "positive",
      "message": "Revenue up 5.7% from benchmark - strong week!"
    },
    {
      "type": "suggestion",
      "message": "Wine upsells down 12% - consider refresher training"
    }
  ]
}
```

---

### 13.2 GET /api/reports/monthly

Get monthly summary report.

**Query Parameters:**
- `month` - Month (1-12)
- `year` - Year

**Response (200):**
```json
{
  "period": {
    "month": 12,
    "year": 2024
  },
  "revenue": {
    "total": 75000.00,
    "benchmark": 70000.00,
    "variance": 7.14,
    "trend": [...]
  },
  "budget": {
    "totalBudgeted": 80000.00,
    "totalActual": 75000.00,
    "variance": -6.25,
    "byCategory": [...]
  },
  "kpis": [...],
  "behaviors": [...],
  "correlations": [
    {
      "behavior": "Upsell Appetizer",
      "kpi": "Average Check",
      "correlation": 0.72,
      "significance": "strong"
    }
  ]
}
```

---

### 13.3 GET /api/reports/correlation

Get behavior-KPI correlation analysis.

**Query Parameters:**
- `startDate`, `endDate` - Analysis period
- `behaviorId` - Specific behavior (optional)
- `kpiType` - Specific KPI (optional)

**Response (200):**
```json
{
  "period": {
    "start": "2024-10-01",
    "end": "2024-12-15"
  },
  "correlations": [
    {
      "behaviorId": "clxbeh1",
      "behaviorName": "Upsell Appetizer",
      "kpiType": "AVERAGE_CHECK",
      "correlation": 0.72,
      "pValue": 0.001,
      "significance": "strong",
      "interpretation": "Strong positive correlation: days with more appetizer upsells show higher average checks",
      "recommendation": "Continue emphasizing appetizer suggestions in briefings"
    },
    {
      "behaviorId": "clxbeh2",
      "behaviorName": "Suggest Wine Pairing",
      "kpiType": "AVERAGE_CHECK",
      "correlation": 0.85,
      "pValue": 0.0001,
      "significance": "very_strong",
      "interpretation": "Very strong positive correlation"
    }
  ],
  "anomalies": [
    {
      "userId": "clxuser5",
      "userName": "Charlie",
      "type": "high_behaviors_low_kpi",
      "description": "High behavior count but below-average check performance",
      "recommendation": "Verify behaviors and check technique"
    }
  ]
}
```

---

### 13.4 GET /api/reports/leaderboard

Get team leaderboard.

**Query Parameters:**
- `period` - `day`, `week`, `month`
- `metric` - `behaviors`, `points`, `avgCheck`

**Response (200):**
```json
{
  "period": "week",
  "metric": "points",
  "rankings": [
    {
      "rank": 1,
      "userId": "clxuser1",
      "name": "Alice Server",
      "avatar": "👩‍🍳",
      "value": 245,
      "change": 2,
      "streak": 5
    },
    {
      "rank": 2,
      "userId": "clxuser2",
      "name": "Bob Server",
      "avatar": "👨‍🍳",
      "value": 220,
      "change": -1,
      "streak": 3
    }
  ]
}
```

---

## 14. Insights

### 14.1 POST /api/insights/generate

Generate AI insights for dashboard.

**Required Permission:** `reports:view`

**Request:**
```json
{
  "type": "dashboard",
  "context": {
    "period": "week",
    "locationId": "clxloc1"
  }
}
```

**Response (200):**
```json
{
  "insights": [
    {
      "type": "trend",
      "priority": "high",
      "title": "Average Check Trending Up",
      "message": "Average check has increased 8% over the past week, correlating with higher wine upsell completion.",
      "data": {
        "currentValue": 34.50,
        "previousValue": 31.94,
        "change": 8.02
      },
      "actions": [
        "Continue wine pairing suggestions",
        "Share technique with team in briefing"
      ]
    },
    {
      "type": "alert",
      "priority": "medium",
      "title": "Appetizer Upsells Below Target",
      "message": "Appetizer suggestions are 15% below target this week.",
      "actions": [
        "Review appetizer menu highlights",
        "Add appetizer focus to next briefing"
      ]
    }
  ]
}
```

---

### 14.2 POST /api/insights/coach

Get AI coaching message for staff.

**Request:**
```json
{
  "userId": "clxuser1",
  "context": {
    "timeOfDay": "lunch",
    "currentBehaviors": 3,
    "targetBehaviors": 10
  }
}
```

**Response (200):**
```json
{
  "message": "Great start to your shift! You've logged 3 upsells already. Try suggesting the soup and salad combo to your next few tables - it's been popular today!",
  "tips": [
    "The daily special appetizer is the loaded nachos - customers love them!",
    "We have a new wine by the glass today - Pinot Grigio"
  ],
  "motivation": {
    "type": "progress",
    "current": 3,
    "target": 10,
    "message": "7 more to hit your daily goal!"
  }
}
```

---

## 15. Questionnaire

### 15.1 POST /questionnaire

Submit pre-qualification questionnaire.

**No Authentication Required**

**Request:**
```json
{
  "email": "prospect@business.com",
  "companyName": "New Restaurant",
  "industry": "RESTAURANT",
  "employeeCount": "11-50",
  "responses": {
    "revenueGrowth": 4,
    "revenueConcern": true,
    "costIncrease": 3,
    "trackCostOfSales": false,
    "teamContribution": 2,
    "retentionIssues": true,
    "regularMeetings": false,
    "existingRoles": ["server", "bartender", "host"]
  }
}
```

**Response (201):**
```json
{
  "id": "clxquest1",
  "scores": {
    "revenue": 80,
    "costControl": 60,
    "teamEngagement": 40,
    "processMaturity": 30,
    "overall": 52.5
  },
  "readinessLevel": "medium",
  "recommendations": [
    "Consider implementing daily briefings",
    "Start tracking cost of sales metrics",
    "Define clear behaviors for your team roles"
  ],
  "nextSteps": {
    "message": "Based on your responses, Topline could help improve team engagement and process maturity. Would you like to schedule a demo?",
    "calendlyLink": "https://calendly.com/topline/demo"
  }
}
```

---

## 16. Error Handling

### 16.1 Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

### 16.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_CREDENTIALS` | 400 | Wrong email/password |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `TOKEN_EXPIRED` | 401 | JWT token expired |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `DUPLICATE_ENTRY` | 409 | Resource already exists |
| `CONFLICT` | 409 | Operation conflicts with current state |
| `RATE_LIMIT` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### 16.3 Validation Error Example

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "fieldErrors": {
        "email": ["Invalid email format"],
        "password": ["Password must be at least 8 characters"]
      },
      "formErrors": []
    }
  }
}
```

### 16.4 Rate Limiting

Rate limits are enforced per endpoint category:

| Category | Limit | Window |
|----------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| General API | 100 requests | 1 minute |
| Report Generation | 10 requests | 1 minute |
| File Upload | 50 requests | 1 hour |

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702656000
```

---

## Appendix A: OpenAPI Specification

The complete OpenAPI 3.0 specification is available at `/openapi.json` and can be viewed in Swagger UI at `/docs`.

---

## Appendix B: Webhook Events (Future)

For future webhook integration:

| Event | Trigger |
|-------|---------|
| `behavior.logged` | New behavior logged |
| `behavior.verified` | Behavior verified |
| `daily_entry.created` | Daily entry submitted |
| `goal.achieved` | Daily/weekly goal hit |
| `budget.alert` | Budget threshold exceeded |
