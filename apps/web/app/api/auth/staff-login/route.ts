import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/auth/session'

/**
 * POST /api/auth/staff-login
 * Authenticate a staff member using their 4-digit PIN
 *
 * This endpoint is designed for shared devices (tablets near POS)
 * where staff select their profile and enter their PIN.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, pin } = body

    if (!userId || !pin) {
      return NextResponse.json(
        { message: 'User ID and PIN are required' },
        { status: 400 }
      )
    }

    // Validate PIN format (4 digits)
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { message: 'PIN must be 4 digits' },
        { status: 400 }
      )
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        organization: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { message: 'Account is disabled' },
        { status: 403 }
      )
    }

    if (!user.pin) {
      return NextResponse.json(
        { message: 'PIN login not configured for this user' },
        { status: 400 }
      )
    }

    // Verify PIN
    // Note: In production, PINs should be hashed with bcrypt
    // For now, we do a simple comparison
    if (user.pin !== pin) {
      return NextResponse.json(
        { message: 'Incorrect PIN. Try again.' },
        { status: 401 }
      )
    }

    // Create session
    await createSession({
      userId: user.id,
      email: user.email,
      orgId: user.organizationId,
      roleType: user.role.type,
      permissions: Array.isArray(user.role.permissions)
        ? user.role.permissions as string[]
        : [],
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        roleType: user.role.type,
      },
    })
  } catch (error) {
    console.error('Staff login error:', error)
    return NextResponse.json(
      { message: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
