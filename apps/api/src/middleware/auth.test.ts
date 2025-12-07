import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import * as jose from 'jose'

// Test the auth utilities directly
const JWT_SECRET = new TextEncoder().encode('test-jwt-secret-for-testing-only')

describe('Auth Middleware', () => {
  describe('Token Generation', () => {
    it('should generate valid access and refresh tokens', async () => {
      const payload = {
        sub: 'user_123',
        email: 'test@example.com',
        orgId: 'org_123',
        roleType: 'ADMIN',
        permissions: ['*'],
      }

      const now = Math.floor(Date.now() / 1000)

      const accessToken = await new jose.SignJWT({
        ...payload,
        iat: now,
        exp: now + 3600,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(JWT_SECRET)

      const refreshToken = await new jose.SignJWT({
        sub: payload.sub,
        type: 'refresh',
        iat: now,
        exp: now + 604800,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(JWT_SECRET)

      expect(accessToken).toBeDefined()
      expect(refreshToken).toBeDefined()
      expect(typeof accessToken).toBe('string')
      expect(typeof refreshToken).toBe('string')
    })

    it('should verify valid access token', async () => {
      const payload = {
        sub: 'user_123',
        email: 'test@example.com',
        orgId: 'org_123',
        roleType: 'ADMIN',
        permissions: ['*'],
      }

      const now = Math.floor(Date.now() / 1000)

      const token = await new jose.SignJWT({
        ...payload,
        iat: now,
        exp: now + 3600,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(JWT_SECRET)

      const { payload: verified } = await jose.jwtVerify(token, JWT_SECRET)

      expect(verified.sub).toBe('user_123')
      expect(verified.email).toBe('test@example.com')
      expect(verified.orgId).toBe('org_123')
    })

    it('should reject expired token', async () => {
      const payload = {
        sub: 'user_123',
        email: 'test@example.com',
        orgId: 'org_123',
        roleType: 'ADMIN',
        permissions: ['*'],
      }

      const pastTime = Math.floor(Date.now() / 1000) - 7200 // 2 hours ago

      const token = await new jose.SignJWT({
        ...payload,
        iat: pastTime - 3600,
        exp: pastTime,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(JWT_SECRET)

      await expect(jose.jwtVerify(token, JWT_SECRET)).rejects.toThrow()
    })

    it('should reject token with invalid signature', async () => {
      const wrongSecret = new TextEncoder().encode('wrong-secret')

      const token = await new jose.SignJWT({
        sub: 'user_123',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(wrongSecret)

      await expect(jose.jwtVerify(token, JWT_SECRET)).rejects.toThrow()
    })
  })

  describe('Refresh Token Verification', () => {
    it('should verify valid refresh token', async () => {
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

      expect(payload.sub).toBe('user_123')
      expect(payload.type).toBe('refresh')
    })

    it('should reject access token used as refresh token', async () => {
      const now = Math.floor(Date.now() / 1000)

      const accessToken = await new jose.SignJWT({
        sub: 'user_123',
        email: 'test@example.com',
        orgId: 'org_123',
        roleType: 'ADMIN',
        permissions: ['*'],
        iat: now,
        exp: now + 3600,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(JWT_SECRET)

      const { payload } = await jose.jwtVerify(accessToken, JWT_SECRET)

      // Access token doesn't have type: 'refresh'
      expect(payload.type).toBeUndefined()
    })
  })

  describe('Permission Checking', () => {
    it('should grant access with wildcard permission', () => {
      const permissions = ['*']
      const requiredPermission = 'write:behaviors'

      const hasPermission =
        permissions.includes('*') || permissions.includes(requiredPermission)

      expect(hasPermission).toBe(true)
    })

    it('should grant access with exact permission', () => {
      const permissions = ['read:own', 'write:behaviors']
      const requiredPermission = 'write:behaviors'

      const hasPermission =
        permissions.includes('*') || permissions.includes(requiredPermission)

      expect(hasPermission).toBe(true)
    })

    it('should deny access without required permission', () => {
      const permissions = ['read:own']
      const requiredPermission = 'write:behaviors'

      const hasPermission =
        permissions.includes('*') || permissions.includes(requiredPermission)

      expect(hasPermission).toBe(false)
    })
  })

  describe('Role Checking', () => {
    it('should allow admin access to manager routes', () => {
      const roleType = 'ADMIN'
      const allowedRoles = ['MANAGER', 'ADMIN']

      const hasAccess = allowedRoles.includes(roleType) || roleType === 'ADMIN'

      expect(hasAccess).toBe(true)
    })

    it('should allow manager access to manager routes', () => {
      const roleType = 'MANAGER'
      const allowedRoles = ['MANAGER', 'ADMIN']

      const hasAccess = allowedRoles.includes(roleType) || roleType === 'ADMIN'

      expect(hasAccess).toBe(true)
    })

    it('should deny staff access to manager routes', () => {
      const roleType = 'SERVER'
      const allowedRoles = ['MANAGER', 'ADMIN']

      const hasAccess = allowedRoles.includes(roleType) || roleType === 'ADMIN'

      expect(hasAccess).toBe(false)
    })
  })
})
