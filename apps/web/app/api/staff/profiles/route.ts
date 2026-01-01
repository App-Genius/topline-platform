import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

/**
 * GET /api/staff/profiles
 * Returns list of staff profiles for PIN login selection
 *
 * If authenticated, returns profiles from user's organization
 * If not authenticated, returns profiles from the first organization (demo mode)
 */
export async function GET() {
  try {
    let orgId: string | null = null

    // Try to get organization from session
    const session = await getSession()
    if (session) {
      orgId = session.orgId
    }

    // If no session, get first organization (for demo/shared device)
    if (!orgId) {
      const firstOrg = await prisma.organization.findFirst({
        orderBy: { createdAt: 'asc' },
      })
      if (!firstOrg) {
        return NextResponse.json({ profiles: [] })
      }
      orgId = firstOrg.id
    }

    // Get all staff users with PINs from this organization
    const users = await prisma.user.findMany({
      where: {
        organizationId: orgId,
        isActive: true,
        pin: { not: null }, // Only users with PINs can use staff login
      },
      include: {
        role: true,
      },
      orderBy: { name: 'asc' },
    })

    const profiles = users.map(user => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar || user.name.split(' ').map(n => n[0]).join(''),
      roleType: user.role.type,
    }))

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Failed to fetch staff profiles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    )
  }
}
