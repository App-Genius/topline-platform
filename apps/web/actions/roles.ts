'use server'

import { prisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth/session'
import type { ActionResult, PaginatedResponse } from '@/lib/types'
import { revalidatePath } from 'next/cache'

interface RoleWithCount {
  id: string
  name: string
  type: string
  permissions: unknown
  organizationId: string
  createdAt: Date
  updatedAt: Date
  _count: {
    users: number
  }
}

interface RoleListParams {
  page?: number
  limit?: number
}

/**
 * Get paginated list of roles (Admin only)
 */
export async function getRoles(
  params?: RoleListParams
): Promise<ActionResult<PaginatedResponse<RoleWithCount>>> {
  try {
    await requireRole('ADMIN')
    const session = await requireAuth()

    const page = params?.page ?? 1
    const limit = params?.limit ?? 20

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where: { organizationId: session.orgId },
        include: { _count: { select: { users: true } } },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.role.count({ where: { organizationId: session.orgId } }),
    ])

    return {
      success: true,
      data: {
        data: roles,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch roles',
    }
  }
}

/**
 * Get a single role by ID (Admin only)
 */
export async function getRole(
  id: string
): Promise<ActionResult<RoleWithCount & { behaviors: Array<{ id: string; name: string }> }>> {
  try {
    await requireRole('ADMIN')
    const session = await requireAuth()

    const role = await prisma.role.findFirst({
      where: { id, organizationId: session.orgId },
      include: {
        _count: { select: { users: true } },
        behaviors: { select: { id: true, name: true } },
      },
    })

    if (!role) {
      return { success: false, error: 'Role not found' }
    }

    return { success: true, data: role }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch role',
    }
  }
}

/**
 * Create a new role (Admin only)
 */
export async function createRole(data: {
  name: string
  type: string
  permissions?: string[]
}): Promise<ActionResult<RoleWithCount>> {
  try {
    await requireRole('ADMIN')
    const session = await requireAuth()

    const role = await prisma.role.create({
      data: {
        name: data.name,
        type: data.type as any,
        permissions: data.permissions || [],
        organizationId: session.orgId,
      },
      include: { _count: { select: { users: true } } },
    })

    revalidatePath('/admin/roles')
    return { success: true, data: role }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { success: false, error: 'Role with this name already exists' }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create role',
    }
  }
}

/**
 * Update a role (Admin only)
 */
export async function updateRole(
  id: string,
  data: {
    name?: string
    type?: string
    permissions?: string[]
  }
): Promise<ActionResult<RoleWithCount>> {
  try {
    await requireRole('ADMIN')
    const session = await requireAuth()

    // Verify role exists and belongs to org
    const existing = await prisma.role.findFirst({
      where: { id, organizationId: session.orgId },
    })

    if (!existing) {
      return { success: false, error: 'Role not found' }
    }

    const role = await prisma.role.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type as any }),
        ...(data.permissions && { permissions: data.permissions }),
      },
      include: { _count: { select: { users: true } } },
    })

    revalidatePath('/admin/roles')
    return { success: true, data: role }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update role',
    }
  }
}

/**
 * Delete a role (Admin only)
 */
export async function deleteRole(id: string): Promise<ActionResult<{ message: string }>> {
  try {
    await requireRole('ADMIN')
    const session = await requireAuth()

    const role = await prisma.role.findFirst({
      where: { id, organizationId: session.orgId },
      include: { _count: { select: { users: true } } },
    })

    if (!role) {
      return { success: false, error: 'Role not found' }
    }

    if (role._count.users > 0) {
      return {
        success: false,
        error: 'Cannot delete role with assigned users. Reassign users first.',
      }
    }

    await prisma.role.delete({ where: { id } })

    revalidatePath('/admin/roles')
    return { success: true, data: { message: 'Role deleted successfully' } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete role',
    }
  }
}
