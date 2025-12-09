# Topline: Security & Compliance

## Overview

This document defines the security architecture, authentication mechanisms, authorization policies, data protection measures, and compliance requirements for the Topline system.

---

## Table of Contents

1. [Security Architecture](#1-security-architecture)
2. [Authentication](#2-authentication)
3. [Authorization](#3-authorization)
4. [Data Protection](#4-data-protection)
5. [API Security](#5-api-security)
6. [Infrastructure Security](#6-infrastructure-security)
7. [Compliance](#7-compliance)
8. [Security Operations](#8-security-operations)

---

## 1. Security Architecture

### 1.1 Security Principles

| Principle | Implementation |
|-----------|----------------|
| **Defense in Depth** | Multiple layers of security controls |
| **Least Privilege** | Users get minimum necessary permissions |
| **Zero Trust** | Verify every request, trust nothing implicitly |
| **Secure by Default** | Security enabled out of the box |
| **Fail Secure** | Errors default to denying access |

### 1.2 Security Layers

```
                    +---------------------------+
                    |      WAF / DDoS          |  Layer 1: Edge
                    |     (Cloudflare)          |
                    +---------------------------+
                              |
                    +---------------------------+
                    |     TLS 1.3 / HTTPS       |  Layer 2: Transport
                    +---------------------------+
                              |
                    +---------------------------+
                    |     Rate Limiting         |  Layer 3: API Gateway
                    |     Request Validation    |
                    +---------------------------+
                              |
                    +---------------------------+
                    |     Authentication        |  Layer 4: Identity
                    |     (JWT / Sessions)      |
                    +---------------------------+
                              |
                    +---------------------------+
                    |     Authorization         |  Layer 5: Access Control
                    |     (RBAC / Policies)     |
                    +---------------------------+
                              |
                    +---------------------------+
                    |     Input Validation      |  Layer 6: Application
                    |     Output Encoding       |
                    +---------------------------+
                              |
                    +---------------------------+
                    |     Encryption at Rest    |  Layer 7: Data
                    |     Database Security     |
                    +---------------------------+
```

### 1.3 Trust Boundaries

```
+------------------------------------------------------------------+
|  INTERNET (Untrusted)                                             |
|                                                                   |
|  +-------------------+                                           |
|  | User Browser/App  |                                           |
|  +-------------------+                                           |
+------------------------------------------------------------------+
                    | HTTPS Only
                    v
+------------------------------------------------------------------+
|  DMZ (Semi-trusted)                                               |
|                                                                   |
|  +-------------------+    +-------------------+                   |
|  |   CDN / WAF       |    |   Load Balancer   |                   |
|  +-------------------+    +-------------------+                   |
+------------------------------------------------------------------+
                    | VPC Internal
                    v
+------------------------------------------------------------------+
|  APPLICATION TIER (Trusted)                                       |
|                                                                   |
|  +-------------------+    +-------------------+                   |
|  |   API Server      |    |   Web Server      |                   |
|  +-------------------+    +-------------------+                   |
+------------------------------------------------------------------+
                    | Private Subnet
                    v
+------------------------------------------------------------------+
|  DATA TIER (Highly Trusted)                                       |
|                                                                   |
|  +-------------------+    +-------------------+                   |
|  |   PostgreSQL      |    |   Redis Cache     |                   |
|  +-------------------+    +-------------------+                   |
+------------------------------------------------------------------+
```

---

## 2. Authentication

### 2.1 Authentication Methods

| Method | Use Case | Security Level |
|--------|----------|----------------|
| **Email + Password** | Owner/Manager login | High |
| **PIN (4-digit)** | Staff quick login | Medium |
| **Magic Link** | Password reset | High |
| **OAuth (future)** | SSO integration | High |

### 2.2 JWT Token System

```typescript
interface JWTPayload {
  sub: string;         // User ID
  org: string;         // Organization ID
  role: UserRole;      // admin | manager | staff
  permissions: string[]; // Specific permissions
  iat: number;         // Issued at
  exp: number;         // Expiration
  jti: string;         // Unique token ID
}

// Token configuration
const TOKEN_CONFIG = {
  accessToken: {
    expiresIn: '15m',           // Short-lived
    algorithm: 'RS256'          // Asymmetric signing
  },
  refreshToken: {
    expiresIn: '7d',            // Longer-lived
    algorithm: 'RS256'
  },
  staffToken: {
    expiresIn: '8h',            // Shift-length
    algorithm: 'RS256'
  }
};
```

### 2.3 Password Security

```typescript
// Password requirements
const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,        // Recommended but not required
  preventCommonPasswords: true,
  preventUserInfo: true         // Can't contain email/name
};

// Password hashing
import { hash, verify } from '@node-rs/argon2';

async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 65536,          // 64 MB
    timeCost: 3,                // 3 iterations
    parallelism: 4              // 4 threads
  });
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return verify(hash, password);
}
```

### 2.4 PIN Security

```typescript
// PIN configuration
const PIN_CONFIG = {
  length: 4,
  allowedChars: '0123456789',
  maxAttempts: 3,
  lockoutDuration: 30,          // seconds
  hashAlgorithm: 'argon2id'
};

// PIN validation
async function validatePIN(
  userId: string,
  pin: string
): Promise<AuthResult> {
  const user = await getUser(userId);

  // Check lockout
  if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
    return {
      success: false,
      error: 'Account temporarily locked',
      lockedUntil: user.pinLockedUntil
    };
  }

  // Verify PIN
  const isValid = await verifyPassword(pin, user.pinHash);

  if (!isValid) {
    const attempts = user.pinAttempts + 1;

    if (attempts >= PIN_CONFIG.maxAttempts) {
      await lockAccount(userId, PIN_CONFIG.lockoutDuration);
      return { success: false, error: 'Account locked' };
    }

    await incrementPinAttempts(userId);
    return { success: false, error: 'Invalid PIN' };
  }

  // Success - reset attempts
  await resetPinAttempts(userId);
  return { success: true, user };
}
```

### 2.5 Session Management

```typescript
// Session configuration
const SESSION_CONFIG = {
  cookie: {
    name: 'topline_session',
    httpOnly: true,
    secure: true,               // HTTPS only
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60    // 7 days
  },
  sliding: true,                // Extend on activity
  absoluteTimeout: 30 * 24 * 60 * 60  // 30 days max
};

// Token refresh logic
async function refreshAccessToken(
  refreshToken: string
): Promise<TokenPair | null> {
  try {
    const payload = await verifyToken(refreshToken);

    // Check if refresh token is revoked
    if (await isTokenRevoked(payload.jti)) {
      return null;
    }

    // Check if user still valid
    const user = await getUser(payload.sub);
    if (!user || user.status !== 'active') {
      return null;
    }

    // Generate new tokens
    return generateTokenPair(user);
  } catch (error) {
    return null;
  }
}
```

---

## 3. Authorization

### 3.1 Role-Based Access Control (RBAC)

```typescript
enum UserRole {
  ADMIN = 'admin',      // Owner - full access
  MANAGER = 'manager',  // Manager - operational access
  STAFF = 'staff'       // Staff - limited access
}

interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'verify';
  scope: 'own' | 'team' | 'organization';
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    { resource: '*', action: '*', scope: 'organization' }
  ],

  [UserRole.MANAGER]: [
    { resource: 'users', action: 'read', scope: 'team' },
    { resource: 'users', action: 'create', scope: 'team' },
    { resource: 'behaviors', action: 'read', scope: 'organization' },
    { resource: 'behaviorLogs', action: 'read', scope: 'team' },
    { resource: 'behaviorLogs', action: 'verify', scope: 'team' },
    { resource: 'dailyEntries', action: 'create', scope: 'organization' },
    { resource: 'dailyEntries', action: 'read', scope: 'organization' },
    { resource: 'briefings', action: '*', scope: 'organization' },
    { resource: 'reports', action: 'read', scope: 'organization' }
  ],

  [UserRole.STAFF]: [
    { resource: 'behaviors', action: 'read', scope: 'own' },
    { resource: 'behaviorLogs', action: 'create', scope: 'own' },
    { resource: 'behaviorLogs', action: 'read', scope: 'own' },
    { resource: 'profile', action: 'read', scope: 'own' },
    { resource: 'profile', action: 'update', scope: 'own' },
    { resource: 'scoreboard', action: 'read', scope: 'organization' }
  ]
};
```

### 3.2 Authorization Middleware

```typescript
import { Context, Next } from 'hono';

interface AuthorizationOptions {
  resource: string;
  action: string;
  getResourceOwnerId?: (ctx: Context) => Promise<string | null>;
}

function authorize(options: AuthorizationOptions) {
  return async (ctx: Context, next: Next) => {
    const user = ctx.get('user');

    if (!user) {
      return ctx.json({ error: 'Unauthorized' }, 401);
    }

    const permissions = ROLE_PERMISSIONS[user.role];

    // Check if user has required permission
    const hasPermission = permissions.some(p => {
      const resourceMatch = p.resource === '*' || p.resource === options.resource;
      const actionMatch = p.action === '*' || p.action === options.action;
      return resourceMatch && actionMatch;
    });

    if (!hasPermission) {
      return ctx.json({ error: 'Forbidden' }, 403);
    }

    // Check scope if needed
    if (options.getResourceOwnerId) {
      const ownerId = await options.getResourceOwnerId(ctx);
      const permission = permissions.find(p =>
        p.resource === options.resource && p.action === options.action
      );

      if (permission?.scope === 'own' && ownerId !== user.id) {
        return ctx.json({ error: 'Forbidden' }, 403);
      }
    }

    await next();
  };
}
```

### 3.3 Resource-Level Authorization

```typescript
// Behavior log authorization
async function canAccessBehaviorLog(
  user: User,
  logId: string
): Promise<boolean> {
  const log = await prisma.behaviorLog.findUnique({
    where: { id: logId },
    include: { user: true }
  });

  if (!log) return false;

  // Same organization check
  if (log.user.organizationId !== user.organizationId) {
    return false;
  }

  switch (user.role) {
    case 'admin':
      return true;  // Full access within org

    case 'manager':
      return true;  // Can view/verify team logs

    case 'staff':
      return log.userId === user.id;  // Own logs only

    default:
      return false;
  }
}

// Organization data isolation
function scopeToOrganization<T extends { organizationId: string }>(
  user: User
): { organizationId: string } {
  return { organizationId: user.organizationId };
}
```

---

## 4. Data Protection

### 4.1 Encryption at Rest

```typescript
// Database encryption configuration
const DATABASE_ENCRYPTION = {
  provider: 'AWS RDS',
  encryption: 'AES-256',
  keyManagement: 'AWS KMS',
  keyRotation: '90 days'
};

// Sensitive field encryption
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.FIELD_ENCRYPTION_KEY!;
const ALGORITHM = 'aes-256-gcm';

function encryptField(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptField(ciphertext: string): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### 4.2 Encryption in Transit

```typescript
// TLS configuration
const TLS_CONFIG = {
  minVersion: 'TLSv1.3',
  ciphers: [
    'TLS_AES_128_GCM_SHA256',
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256'
  ],
  preferServerCipherOrder: true,
  hsts: {
    maxAge: 31536000,           // 1 year
    includeSubDomains: true,
    preload: true
  }
};
```

### 4.3 Data Classification

| Classification | Examples | Protection |
|----------------|----------|------------|
| **Public** | Marketing content | None required |
| **Internal** | Org settings, behaviors | Auth required |
| **Confidential** | Revenue, staff data | Auth + encryption |
| **Restricted** | Passwords, PINs | Encrypted + hashed |

### 4.4 Data Retention

```typescript
const DATA_RETENTION_POLICY = {
  behaviorLogs: {
    retention: '3 years',
    aggregation: 'After 1 year, aggregate to daily summaries'
  },
  dailyEntries: {
    retention: '7 years',     // Tax compliance
    aggregation: 'None'
  },
  auditLogs: {
    retention: '7 years',
    aggregation: 'None'
  },
  sessionData: {
    retention: '30 days',
    aggregation: 'Delete completely'
  },
  anonymousFeedback: {
    retention: '1 year',
    aggregation: 'Aggregate after 90 days'
  }
};

// Automated data cleanup
async function runDataRetention(): Promise<void> {
  const now = new Date();

  // Delete old sessions
  await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: now }
    }
  });

  // Aggregate old behavior logs
  const oneYearAgo = subYears(now, 1);
  await aggregateBehaviorLogs(oneYearAgo);

  // Archive old audit logs
  const sevenYearsAgo = subYears(now, 7);
  await archiveAuditLogs(sevenYearsAgo);
}
```

### 4.5 PII Handling

```typescript
// PII fields in the system
const PII_FIELDS = {
  User: ['email', 'name', 'phone', 'pin'],
  Organization: ['billingEmail', 'address'],
  Feedback: []  // Anonymous
};

// PII export for GDPR/CCPA
async function exportUserData(userId: string): Promise<UserDataExport> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      behaviorLogs: true,
      sessions: true
    }
  });

  return {
    profile: sanitizeForExport(user),
    behaviors: user.behaviorLogs,
    exportedAt: new Date()
  };
}

// PII deletion (right to be forgotten)
async function deleteUserData(userId: string): Promise<void> {
  await prisma.$transaction([
    // Delete personal data
    prisma.session.deleteMany({ where: { userId } }),
    prisma.auditLog.updateMany({
      where: { userId },
      data: { userId: 'DELETED' }
    }),
    // Anonymize behavior logs (keep for analytics)
    prisma.behaviorLog.updateMany({
      where: { userId },
      data: { userId: 'ANONYMIZED' }
    }),
    // Delete user record
    prisma.user.delete({ where: { id: userId } })
  ]);
}
```

---

## 5. API Security

### 5.1 Input Validation

```typescript
import { z } from 'zod';

// Request validation schemas
const BehaviorLogSchema = z.object({
  behaviorId: z.string().uuid(),
  tableNumber: z.string().max(10).optional(),
  covers: z.number().int().min(0).max(100),
  checkAmount: z.number().min(0).max(100000),
  accepted: z.boolean().optional(),
  notes: z.string().max(500).optional()
});

// Validation middleware
function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (ctx: Context, next: Next) => {
    try {
      const body = await ctx.req.json();
      const validated = schema.parse(body);
      ctx.set('validatedBody', validated);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ctx.json({
          error: 'Validation failed',
          details: error.errors
        }, 400);
      }
      throw error;
    }
  };
}
```

### 5.2 Rate Limiting

```typescript
import { rateLimiter } from 'hono-rate-limiter';

// Rate limit configuration
const RATE_LIMITS = {
  auth: {
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: 5,                      // 5 attempts
    message: 'Too many login attempts'
  },
  api: {
    windowMs: 60 * 1000,         // 1 minute
    max: 100,                    // 100 requests
    message: 'Rate limit exceeded'
  },
  staffLogin: {
    windowMs: 60 * 1000,         // 1 minute
    max: 10,                     // 10 attempts
    message: 'Too many PIN attempts'
  }
};

// Apply rate limiting
app.use('/auth/login', rateLimiter(RATE_LIMITS.auth));
app.use('/auth/staff-login', rateLimiter(RATE_LIMITS.staffLogin));
app.use('/api/*', rateLimiter(RATE_LIMITS.api));
```

### 5.3 Security Headers

```typescript
import { secureHeaders } from 'hono/secure-headers';

app.use(secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://api.topline.app'],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"]
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: ['self'],
    microphone: [],
    geolocation: []
  }
}));
```

### 5.4 CORS Configuration

```typescript
import { cors } from 'hono/cors';

app.use(cors({
  origin: [
    'https://app.topline.app',
    'https://admin.topline.app'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400                  // 24 hours
}));
```

---

## 6. Infrastructure Security

### 6.1 Network Security

```yaml
# VPC Configuration
vpc:
  cidr: 10.0.0.0/16
  subnets:
    public:
      - 10.0.1.0/24    # Load balancers
      - 10.0.2.0/24
    private:
      - 10.0.10.0/24   # Application servers
      - 10.0.11.0/24
    database:
      - 10.0.20.0/24   # Database servers
      - 10.0.21.0/24

# Security Groups
securityGroups:
  loadBalancer:
    inbound:
      - port: 443, source: 0.0.0.0/0
      - port: 80, source: 0.0.0.0/0   # Redirect to HTTPS
    outbound:
      - port: 3000, destination: appServers

  appServers:
    inbound:
      - port: 3000, source: loadBalancer
    outbound:
      - port: 5432, destination: database
      - port: 6379, destination: redis
      - port: 443, destination: 0.0.0.0/0  # External APIs

  database:
    inbound:
      - port: 5432, source: appServers
    outbound: []
```

### 6.2 Secrets Management

```typescript
// Environment variables (never in code)
const REQUIRED_SECRETS = [
  'DATABASE_URL',
  'JWT_PRIVATE_KEY',
  'JWT_PUBLIC_KEY',
  'FIELD_ENCRYPTION_KEY',
  'AI_API_KEY'
];

// Secrets validation on startup
function validateSecrets(): void {
  const missing = REQUIRED_SECRETS.filter(
    key => !process.env[key]
  );

  if (missing.length > 0) {
    throw new Error(`Missing required secrets: ${missing.join(', ')}`);
  }
}

// AWS Secrets Manager integration
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

async function loadSecrets(): Promise<void> {
  const client = new SecretsManagerClient({ region: 'us-east-1' });

  const response = await client.send(
    new GetSecretValueCommand({ SecretId: 'topline/production' })
  );

  const secrets = JSON.parse(response.SecretString!);

  for (const [key, value] of Object.entries(secrets)) {
    process.env[key] = value as string;
  }
}
```

### 6.3 Logging & Monitoring

```typescript
// Audit logging
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, unknown>;
  success: boolean;
}

async function auditLog(event: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
  await prisma.auditLog.create({
    data: {
      ...event,
      timestamp: new Date()
    }
  });
}

// Security event logging
const SECURITY_EVENTS = [
  'auth.login.success',
  'auth.login.failure',
  'auth.logout',
  'auth.password.reset',
  'auth.pin.failure',
  'auth.account.locked',
  'user.create',
  'user.delete',
  'permission.denied',
  'data.export',
  'data.delete'
];
```

---

## 7. Compliance

### 7.1 GDPR Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Lawful Basis** | Consent for marketing, Contract for service |
| **Right to Access** | Data export endpoint |
| **Right to Rectification** | Profile update endpoint |
| **Right to Erasure** | Account deletion with data purge |
| **Data Portability** | JSON export format |
| **Breach Notification** | 72-hour notification process |

### 7.2 CCPA Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Right to Know** | Data export endpoint |
| **Right to Delete** | Account deletion endpoint |
| **Right to Opt-Out** | No data selling |
| **Non-Discrimination** | Equal service regardless of privacy choices |

### 7.3 PCI DSS Considerations

```
Note: Topline does NOT store, process, or transmit cardholder data.

Payment processing is handled by:
- Stripe (for subscription billing)

PCI scope is minimized by:
- Using Stripe Elements for card entry
- Never touching raw card numbers
- Using tokenized payment methods
```

### 7.4 SOC 2 Controls

| Control Area | Implementation |
|--------------|----------------|
| **Security** | Access controls, encryption, monitoring |
| **Availability** | Multi-AZ deployment, 99.9% SLA |
| **Confidentiality** | Data classification, encryption |
| **Processing Integrity** | Input validation, audit logging |
| **Privacy** | GDPR/CCPA compliance, consent management |

---

## 8. Security Operations

### 8.1 Vulnerability Management

```yaml
# Dependency scanning
dependabot:
  schedule: daily
  target-branch: main
  auto-merge: patch

# Container scanning
trivy:
  schedule: daily
  severity: HIGH,CRITICAL
  ignore-unfixed: true

# Code scanning
codeql:
  languages: [javascript, typescript]
  queries: security-extended
```

### 8.2 Incident Response

```
SECURITY INCIDENT RESPONSE PLAN

1. DETECTION
   - Automated monitoring alerts
   - User reports
   - Third-party notifications

2. TRIAGE (15 min)
   - Assess severity (Critical/High/Medium/Low)
   - Assign incident commander
   - Begin documentation

3. CONTAINMENT (1 hour)
   - Isolate affected systems
   - Revoke compromised credentials
   - Block malicious IPs

4. ERADICATION (4 hours)
   - Remove threat
   - Patch vulnerabilities
   - Update security controls

5. RECOVERY (24 hours)
   - Restore services
   - Verify integrity
   - Monitor for recurrence

6. POST-INCIDENT (1 week)
   - Root cause analysis
   - Update procedures
   - Notify stakeholders
   - Regulatory reporting if required
```

### 8.3 Security Review Checklist

```markdown
## Pre-Deployment Security Review

### Authentication
- [ ] Password policy enforced
- [ ] JWT tokens properly configured
- [ ] Session management secure
- [ ] Account lockout implemented

### Authorization
- [ ] RBAC policies correct
- [ ] Resource-level checks in place
- [ ] Org isolation verified

### Data Protection
- [ ] Sensitive fields encrypted
- [ ] TLS configured correctly
- [ ] Data retention policies applied

### API Security
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] Security headers set
- [ ] CORS properly configured

### Infrastructure
- [ ] Secrets in vault
- [ ] Network segmentation correct
- [ ] Logging enabled
- [ ] Backups configured
```

---

## Appendix A: Security Contacts

| Role | Responsibility | Contact |
|------|----------------|---------|
| Security Lead | Overall security | security@topline.app |
| Incident Response | Active incidents | incidents@topline.app |
| Privacy Officer | Data protection | privacy@topline.app |

---

## Appendix B: Key Rotation Schedule

| Secret | Rotation Period | Method |
|--------|-----------------|--------|
| JWT Signing Keys | 90 days | Automated via AWS Secrets Manager |
| Database Credentials | 30 days | Automated via RDS |
| Encryption Keys | 365 days | Manual with migration |
| API Keys (external) | 90 days | Automated |

---

*This document is part of the Topline documentation suite. See [00-INDEX.md](./00-INDEX.md) for the complete list.*
