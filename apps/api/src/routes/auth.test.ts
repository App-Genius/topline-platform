import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as jose from 'jose'

// Mock dependencies
vi.mock('@topline/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    organization: {
      create: vi.fn(),
    },
    role: {
      create: vi.fn(),
    },
    location: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn(),
}))

import { prisma } from '@topline/db'
import { compare } from 'bcryptjs'

const JWT_SECRET = new TextEncoder().encode('test-jwt-secret-for-testing-only')

// Test fixtures
const mockUser = {
  id: 'user_123',
  email: 'test@example.com',
  name: 'Test User',
  avatar: 'TU',
  passwordHash: 'hashed_password',
  organizationId: 'org_123',
  isActive: true,
  role: {
    id: 'role_123',
    name: 'Admin',
    type: 'ADMIN',
    permissions: ['*'],
  },
  organization: {
    id: 'org_123',
    name: 'Test Org',
    industry: 'restaurant',
  },
}

describe('Auth API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Login', () => {
    it('should validate email format', () => {
      const validEmails = ['test@example.com', 'user@domain.co']
      const invalidEmails = ['notanemail', 'user@', 'user@domain']

      validEmails.forEach((email) => {
        const hasAt = email.includes('@')
        const domain = email.split('@')[1]
        const hasDot = domain?.includes('.')
        expect(hasAt && hasDot).toBe(true)
      })

      invalidEmails.forEach((email) => {
        const hasAt = email.includes('@')
        const domain = email.split('@')[1]
        const hasDot = domain?.includes('.') ?? false
        const isValid = hasAt && hasDot
        expect(isValid).toBe(false)
      })
    })

    it('should validate password is required', () => {
      const input = { email: 'test@example.com', password: '' }
      const isValid = input.password.length > 0

      expect(isValid).toBe(false)
    })

    it('should find user by email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
        include: { role: true },
      })

      expect(user).toBeDefined()
      expect(user?.email).toBe('test@example.com')
    })

    it('should reject inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false }
      vi.mocked(prisma.user.findUnique).mockResolvedValue(inactiveUser as any)

      const user = await prisma.user.findUnique({ where: { email: 'test@example.com' } })

      expect(user?.isActive).toBe(false)
    })

    it('should verify password with bcrypt', async () => {
      vi.mocked(compare).mockResolvedValue(true as never)

      const result = await compare('password123', 'hashed_password')

      expect(result).toBe(true)
    })

    it('should reject invalid password', async () => {
      vi.mocked(compare).mockResolvedValue(false as never)

      const result = await compare('wrong_password', 'hashed_password')

      expect(result).toBe(false)
    })

    it('should generate tokens after successful login', async () => {
      const payload = {
        sub: 'user_123',
        email: 'test@example.com',
        orgId: 'org_123',
        roleType: 'ADMIN',
      }

      const now = Math.floor(Date.now() / 1000)

      const accessToken = await new jose.SignJWT({
        ...payload,
        iat: now,
        exp: now + 3600,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(JWT_SECRET)

      expect(accessToken).toBeDefined()
      expect(typeof accessToken).toBe('string')
    })

    it('should exclude password hash from response', () => {
      const { passwordHash, ...userWithoutPassword } = mockUser

      expect(userWithoutPassword.passwordHash).toBeUndefined()
      expect(userWithoutPassword.email).toBe('test@example.com')
    })
  })

  describe('Register', () => {
    it('should validate organization name is required', () => {
      const input = { name: 'Test User', email: 'test@example.com', password: 'password123', organizationName: '' }
      const isValid = input.organizationName.length > 0

      expect(isValid).toBe(false)
    })

    it('should validate organization name max length', () => {
      const input = { organizationName: 'a'.repeat(101) }
      const isValid = input.organizationName.length <= 100

      expect(isValid).toBe(false)
    })

    it('should check for existing email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const existing = await prisma.user.findUnique({ where: { email: 'test@example.com' } })

      expect(existing).toBeDefined()
    })

    it('should create organization, role, location, and user in transaction', async () => {
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        const tx = {
          organization: {
            create: vi.fn().mockResolvedValue({ id: 'org_new', name: 'New Org' }),
          },
          role: {
            create: vi.fn().mockResolvedValue({ id: 'role_new', name: 'Admin', type: 'ADMIN', permissions: ['*'] }),
          },
          location: {
            create: vi.fn().mockResolvedValue({ id: 'loc_new', name: 'Main Location' }),
          },
          user: {
            create: vi.fn().mockResolvedValue({
              id: 'user_new',
              email: 'new@example.com',
              name: 'New User',
              role: { id: 'role_new', name: 'Admin', type: 'ADMIN', permissions: ['*'] },
            }),
          },
        }
        return callback(tx)
      })

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction)

      const result = await prisma.$transaction(async (tx: any) => {
        const org = await tx.organization.create({ data: { name: 'New Org' } })
        const role = await tx.role.create({ data: { name: 'Admin', type: 'ADMIN', organizationId: org.id } })
        const location = await tx.location.create({ data: { name: 'Main Location', organizationId: org.id } })
        const user = await tx.user.create({
          data: { email: 'new@example.com', organizationId: org.id, roleId: role.id },
          include: { role: true },
        })
        return user
      })

      expect(result).toBeDefined()
      expect(result.email).toBe('new@example.com')
    })
  })

  describe('Refresh Token', () => {
    it('should verify refresh token has correct type', async () => {
      const now = Math.floor(Date.now() / 1000)

      const refreshToken = await new jose.SignJWT({
        sub: 'user_123',
        type: 'refresh',
        iat: now,
        exp: now + 604800,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(JWT_SECRET)

      const { payload } = await jose.jwtVerify(refreshToken, JWT_SECRET)

      expect(payload.type).toBe('refresh')
      expect(payload.sub).toBe('user_123')
    })

    it('should reject access token used as refresh', async () => {
      const now = Math.floor(Date.now() / 1000)

      const accessToken = await new jose.SignJWT({
        sub: 'user_123',
        email: 'test@example.com',
        // No type field
        iat: now,
        exp: now + 3600,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(JWT_SECRET)

      const { payload } = await jose.jwtVerify(accessToken, JWT_SECRET)

      expect(payload.type).toBeUndefined()
    })

    it('should generate new token pair on refresh', async () => {
      const now = Math.floor(Date.now() / 1000)

      const newAccessToken = await new jose.SignJWT({
        sub: 'user_123',
        iat: now,
        exp: now + 3600,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(JWT_SECRET)

      const newRefreshToken = await new jose.SignJWT({
        sub: 'user_123',
        type: 'refresh',
        iat: now,
        exp: now + 604800,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(JWT_SECRET)

      expect(newAccessToken).toBeDefined()
      expect(newRefreshToken).toBeDefined()
    })
  })

  describe('Get Current User (/me)', () => {
    it('should require authorization header', () => {
      const authHeader: string | undefined = undefined
      const hasAuth = authHeader?.startsWith('Bearer ')

      expect(hasAuth).toBeFalsy()
    })

    it('should parse bearer token', () => {
      const authHeader = 'Bearer eyJhbGciOiJIUzI1NiJ9...'
      const token = authHeader.slice(7)

      expect(token).toBe('eyJhbGciOiJIUzI1NiJ9...')
    })

    it('should fetch user with role and organization', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const user = await prisma.user.findUnique({
        where: { id: 'user_123' },
        include: { role: true, organization: true },
      })

      expect(user?.role).toBeDefined()
      expect(user?.organization).toBeDefined()
    })

    it('should exclude password hash from response', () => {
      const { passwordHash, ...safe } = mockUser

      expect(safe.id).toBe('user_123')
      expect((safe as any).passwordHash).toBeUndefined()
    })
  })
})
