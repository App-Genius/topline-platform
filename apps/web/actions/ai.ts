'use server'

import { prisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth/session'
import type { ActionResult } from '@/lib/types'
import {
  generateBehaviorSuggestions,
  type BehaviorSuggestion,
} from '@/lib/ai/behavior-suggestions'
import { isConfigured } from '@/lib/ai'

// ============================================
// TYPES
// ============================================

export type { BehaviorSuggestion }

export interface AIStatusResponse {
  configured: boolean
  model: string
}

// ============================================
// SERVER ACTIONS
// ============================================

/**
 * Check if AI features are configured and available
 */
export async function getAIStatus(): Promise<ActionResult<AIStatusResponse>> {
  try {
    await requireAuth()

    return {
      success: true,
      data: {
        configured: isConfigured(),
        model: 'anthropic/claude-3.5-sonnet',
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get AI status',
    }
  }
}

/**
 * Generate behavior suggestions for a role
 * Manager/Admin only
 */
export async function suggestBehaviors(params: {
  roleId: string;
  count?: number;
}): Promise<ActionResult<BehaviorSuggestion[]>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    // Check if AI is configured
    if (!isConfigured()) {
      return {
        success: false,
        error: 'AI features are not configured. Please add OPENROUTER_API_KEY to your environment.',
      }
    }

    // Get the role
    const role = await prisma.role.findFirst({
      where: {
        id: params.roleId,
        organizationId: session.orgId,
      },
    })

    if (!role) {
      return { success: false, error: 'Role not found' }
    }

    // Get organization for industry context
    const org = await prisma.organization.findUnique({
      where: { id: session.orgId },
    })

    if (!org) {
      return { success: false, error: 'Organization not found' }
    }

    // Get existing behaviors for this role
    const existingBehaviors = await prisma.behavior.findMany({
      where: {
        organizationId: session.orgId,
        isActive: true,
        roles: { some: { id: params.roleId } },
      },
      select: { name: true },
    })

    // Generate suggestions
    const response = await generateBehaviorSuggestions({
      role: role.type,
      industry: org.industry,
      existingBehaviors: existingBehaviors.map((b) => b.name),
      count: params.count || 3,
    })

    return { success: true, data: response.behaviors }
  } catch (error) {
    console.error('Suggest behaviors error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate suggestions',
    }
  }
}

/**
 * Create a behavior from an AI suggestion
 * Manager/Admin only
 */
export async function createBehaviorFromSuggestion(params: {
  suggestion: BehaviorSuggestion;
  roleIds: string[];
  points?: number;
  targetPerDay?: number;
}): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    const { suggestion, roleIds, points, targetPerDay } = params

    // Verify all roles belong to the organization
    const roles = await prisma.role.findMany({
      where: {
        id: { in: roleIds },
        organizationId: session.orgId,
      },
    })

    if (roles.length !== roleIds.length) {
      return { success: false, error: 'Some roles not found in organization' }
    }

    // Check for duplicate behavior name
    const existing = await prisma.behavior.findFirst({
      where: {
        organizationId: session.orgId,
        name: suggestion.name,
      },
    })

    if (existing) {
      return { success: false, error: 'A behavior with this name already exists' }
    }

    // Create the behavior
    const behavior = await prisma.behavior.create({
      data: {
        name: suggestion.name,
        description: suggestion.description,
        points: points ?? suggestion.suggestedPoints,
        targetPerDay: targetPerDay ?? suggestion.suggestedTarget,
        organizationId: session.orgId,
        roles: { connect: roleIds.map((id) => ({ id })) },
      },
    })

    return {
      success: true,
      data: {
        id: behavior.id,
        name: behavior.name,
      },
    }
  } catch (error) {
    console.error('Create behavior from suggestion error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create behavior',
    }
  }
}
