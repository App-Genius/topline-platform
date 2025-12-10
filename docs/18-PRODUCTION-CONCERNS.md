# Production Concerns

This document tracks technical requirements for deploying Topline to a live environment.

**Deployment Context:** Multi-million dollar hotel, 200 employees, financial data management, live changes during operation.

---

## MVP Requirements (Pre-Launch)

These items are **required before going live**. They protect against data loss, security issues, and deployment failures.

### 1. Rate Limiting

**Why Required for MVP:** Prevents a buggy client or accidental loop from overwhelming the API during service hours.

**Implementation:**
```typescript
// apps/api/src/middleware/rate-limit.ts
import { rateLimiter } from 'hono-rate-limiter'

// General API rate limit
export const apiRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per user
  keyGenerator: (c) => c.get('userId') || c.req.header('x-forwarded-for') || 'anonymous'
})

// Stricter limit for auth endpoints
export const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  keyGenerator: (c) => c.req.header('x-forwarded-for') || 'anonymous'
})
```

**Apply to routes:**
```typescript
// apps/api/src/index.ts
app.use('/api/*', apiRateLimit)
app.use('/api/auth/login', authRateLimit)
app.use('/api/auth/pin', authRateLimit)
```

**Effort:** 1-2 hours

---

### 2. PIN Hashing

**Why Required for MVP:** 4-digit PINs have only 10,000 combinations. Plain text storage allows brute-force guessing. System manages financial data.

**Current State:** PIN stored as plain text string in database.

**Implementation:**
```typescript
// packages/shared/src/utils/pin.ts
import bcrypt from 'bcryptjs'

const PIN_SALT_ROUNDS = 10

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, PIN_SALT_ROUNDS)
}

export async function verifyPin(pin: string, hashedPin: string): Promise<boolean> {
  return bcrypt.compare(pin, hashedPin)
}
```

**Database Migration:**
```sql
-- Migration: hash_existing_pins
-- Run ONCE after deploying new code

-- Note: This requires application-level migration
-- because bcrypt hashing must happen in Node.js
```

**Migration Script:**
```typescript
// scripts/migrate-pins.ts
import { prisma } from '@topline/db'
import { hashPin } from '@topline/shared'

async function migratePins() {
  const users = await prisma.user.findMany({
    where: { pin: { not: null } }
  })

  for (const user of users) {
    if (user.pin && user.pin.length === 4) { // Unhashed PIN
      const hashed = await hashPin(user.pin)
      await prisma.user.update({
        where: { id: user.id },
        data: { pin: hashed }
      })
    }
  }

  console.log(`Migrated ${users.length} PINs`)
}
```

**Effort:** 1-2 hours

---

### 3. Database Migrations

**Why Required for MVP:** Without migration files, you cannot safely rollback a bad schema change. Live changes require rollback capability.

**Current State:** Using `prisma db push` (no migration history).

**Setup:**
```bash
# Initialize migrations from current schema
npx prisma migrate dev --name init

# This creates:
# - prisma/migrations/[timestamp]_init/migration.sql
# - Migration history in database
```

**Workflow After Setup:**
```bash
# For schema changes during development
npx prisma migrate dev --name add_feature_x

# For production deployment
npx prisma migrate deploy
```

**Rollback Capability:**
```bash
# If deployment fails, rollback to previous migration
npx prisma migrate resolve --rolled-back [migration_name]
```

**Add to package.json:**
```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:migrate:status": "prisma migrate status"
  }
}
```

**Effort:** 1 hour

---

### 4. Health Endpoint

**Why Required for MVP:** After deployment, you need to verify the system is working. Health checks enable automated monitoring and deployment verification.

**Implementation:**
```typescript
// apps/api/src/routes/health.ts
import { Hono } from 'hono'
import { prisma } from '@topline/db'

const health = new Hono()

// Basic health check (for load balancers)
health.get('/', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Deep health check (verifies database)
health.get('/ready', async (c) => {
  try {
    // Verify database connection
    await prisma.$queryRaw`SELECT 1`

    return c.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected'
      }
    })
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'disconnected'
      }
    }, 503)
  }
})

export default health
```

**Register route:**
```typescript
// apps/api/src/index.ts
import health from './routes/health'

app.route('/health', health)
```

**Usage:**
- `/health` - Quick check for load balancers (no DB query)
- `/health/ready` - Full check including database connectivity

**Effort:** 30 minutes

---

### MVP Pre-Launch Checklist

Before deploying to the hotel:

- [ ] Rate limiting configured on all API routes
- [ ] Auth endpoints have stricter rate limits (5 attempts/15min)
- [ ] All PINs hashed with bcrypt
- [ ] PIN migration script run on production data
- [ ] Database migrations initialized (`prisma migrate dev --name init`)
- [ ] Health endpoint responding at `/health` and `/health/ready`
- [ ] Deployment tested: deploy → check `/health/ready` → verify

---

## Post-MVP Items

These items are deferred from MVP but should be addressed as the system scales.

---

## 1. Performance & Scalability

### 1.1 Caching Strategy

**Why Needed:** Reduce database load, improve response times.

**Layers:**
1. **HTTP Cache Headers** - Static assets, infrequently changing data
2. **Redis Cache** - Session data, computed aggregations
3. **React Query Cache** - Already configured (5 min stale time)

**What to Cache:**
| Data Type | TTL | Invalidation |
|-----------|-----|--------------|
| Organization settings | 5 min | On update |
| Behavior definitions | 5 min | On CRUD |
| Leaderboard | 30 sec | On behavior log |
| Dashboard aggregations | 1 min | On daily entry |

### 1.2 Database Optimization

**Tasks:**
- [ ] Add read replicas for reporting queries
- [ ] Implement connection pooling (PgBouncer)
- [ ] Add database-level caching
- [ ] Review and optimize slow queries
- [ ] Add database monitoring (query performance)

### 1.3 Load Testing

**Tools:** k6, Artillery, or Locust

**Scenarios to Test:**
- 100 concurrent staff logging behaviors
- Dashboard queries under load
- Bulk verification (100+ logs)
- AI endpoint response times

**Target SLAs:**
- API response < 200ms (p95)
- Page load < 2 seconds
- AI endpoints < 5 seconds

---

## 2. Observability & Monitoring

### 2.1 Error Tracking

**Recommended:** Sentry

**Implementation:**
```typescript
// apps/api/src/index.ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
})
```

**What to Track:**
- Unhandled exceptions
- API errors (4xx, 5xx)
- AI operation failures
- Database connection issues

### 2.2 Application Performance Monitoring (APM)

**Options:** Datadog, New Relic, or Sentry Performance

**Metrics to Track:**
- Request duration by endpoint
- Database query time
- External API latency (AI providers)
- Error rates by endpoint

### 2.3 Logging

**Current:** Console logs (development)
**Production:** Structured JSON logs

```typescript
// Structured logging
logger.info({
  event: 'behavior_logged',
  userId: user.id,
  behaviorId: behavior.id,
  organizationId: org.id,
  duration: 45
})
```

**Log Aggregation:** CloudWatch, Datadog Logs, or Loki

### 2.4 Uptime Monitoring

**Tools:** Better Uptime, Pingdom, UptimeRobot

**Endpoints to Monitor:**
- `/health` - Basic health check
- `/api/health` - API health with DB check
- Key user flows (synthetic monitoring)

---

## 3. Security Hardening

### 3.1 HTTPS & TLS

- [ ] Force HTTPS redirects
- [ ] TLS 1.2+ only
- [ ] HSTS headers enabled
- [ ] Certificate auto-renewal (Let's Encrypt)

### 3.2 Security Headers

```typescript
// Hono security middleware
app.use('*', secureHeaders({
  contentSecurityPolicy: { ... },
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin'
}))
```

### 3.3 Secrets Management

**Current:** Environment variables
**Production:** AWS Secrets Manager, HashiCorp Vault, or Vercel encrypted env vars

### 3.4 Dependency Auditing

**Automation:**
```bash
# Add to CI pipeline
npm audit --audit-level=high
```

**Tools:** Dependabot, Snyk

---

## 4. Compliance Considerations

### 4.1 Data Retention

- [ ] Define retention periods for behavior logs
- [ ] Implement automated data purging
- [ ] Document retention policy

### 4.2 Data Deletion (Right to be Forgotten)

- [ ] User account deletion endpoint
- [ ] Cascade delete all user data
- [ ] Audit trail for deletions

### 4.3 Data Export

- [ ] User data export endpoint (GDPR)
- [ ] Organization data export for admins

### 4.4 Privacy Policy Requirements

- [ ] Document what data is collected
- [ ] Document how AI processes data
- [ ] Cookie consent (if applicable)

---

## 5. Infrastructure

### 5.1 CI/CD Pipeline

**Current:** Manual deployment
**Production:**
- [ ] Automated testing on PR
- [ ] Staging environment
- [ ] Blue-green or canary deployments
- [ ] Rollback capability

### 5.2 Backup Strategy

- [ ] Daily database backups
- [ ] Point-in-time recovery enabled
- [ ] Backup retention policy (30 days)
- [ ] Backup restoration tested

### 5.3 Disaster Recovery

- [ ] Document recovery procedures
- [ ] Define RTO (Recovery Time Objective)
- [ ] Define RPO (Recovery Point Objective)
- [ ] Test recovery procedures

---

## 6. Contract Testing (Optional Enhancement)

### What It Is
Contract testing verifies that frontend and backend agree on API shapes. Tools like Pact create formal contracts.

### When to Consider
- Multiple frontend clients (web, mobile)
- Multiple teams working on frontend/backend
- Breaking API changes are common

### For Topline MVP
**Not required.** Zod schemas already provide type safety. Consider if:
- Adding mobile app
- Opening API to third parties
- Team grows significantly

---

## 7. Visual Regression Testing (Optional)

### What It Is
Screenshot comparison to catch unintended UI changes.

### Tools
- Percy, Chromatic, or BackstopJS

### When to Consider
- Design system stabilizes
- Multiple developers touching UI
- Design consistency is critical

### For Topline MVP
**Not required.** Focus on functional testing first.

---

## Implementation Priority for Production

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| P0 | Error tracking (Sentry) | Low | High |
| P0 | Database backups | Low | Critical |
| P0 | HTTPS enforcement | Low | Critical |
| P1 | Rate limiting | Medium | High |
| P1 | APM/monitoring | Medium | High |
| P1 | Structured logging | Medium | Medium |
| P2 | Caching layer | Medium | Medium |
| P2 | Load testing | Medium | Medium |
| P2 | Security headers | Low | Medium |
| P3 | Data retention automation | Medium | Low |
| P3 | Contract testing | High | Low |
| P3 | Visual regression | Medium | Low |

---

## Checklist Before Production Launch

- [ ] Error tracking configured and tested
- [ ] Database backups verified
- [ ] HTTPS enforced
- [ ] Rate limiting on sensitive endpoints
- [ ] Monitoring dashboards set up
- [ ] Security headers configured
- [ ] Secrets in secure storage
- [ ] Dependency audit passing
- [ ] Load testing completed
- [ ] Runbook for common issues documented
