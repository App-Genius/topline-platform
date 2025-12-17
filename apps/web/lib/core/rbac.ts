/**
 * Role-Based Access Control Logic
 *
 * Pure functions for permission checking.
 * No database calls - these work with role types and user IDs directly.
 */

import type { RoleType, DeletePermission, VerificationFields } from './types';

// =============================================================================
// Role Classification
// =============================================================================

/**
 * Roles that have management permissions
 */
const MANAGER_ROLES: RoleType[] = ['ADMIN', 'MANAGER'];

/**
 * Roles that are front-line staff
 */
const STAFF_ROLES: RoleType[] = [
  'SERVER',
  'HOST',
  'BARTENDER',
  'BUSSER',
  'CHEF',
  'FRONT_DESK',
  'HOUSEKEEPING',
];

/**
 * Back-office roles (non-customer-facing)
 */
const BACKOFFICE_ROLES: RoleType[] = ['PURCHASER', 'ACCOUNTANT', 'FACILITIES'];

// =============================================================================
// Role Checking
// =============================================================================

/**
 * Check if role is a manager-level role
 *
 * @param role - Role to check
 * @returns True if manager or admin
 *
 * @example
 * isManagerRole('ADMIN')   // => true
 * isManagerRole('MANAGER') // => true
 * isManagerRole('SERVER')  // => false
 */
export function isManagerRole(role: RoleType): boolean {
  return MANAGER_ROLES.includes(role);
}

/**
 * Check if role is a staff-level role
 *
 * @param role - Role to check
 * @returns True if front-line staff
 *
 * @example
 * isStaffRole('SERVER')     // => true
 * isStaffRole('FRONT_DESK') // => true
 * isStaffRole('ADMIN')      // => false
 */
export function isStaffRole(role: RoleType): boolean {
  return STAFF_ROLES.includes(role);
}

/**
 * Check if role is back-office
 *
 * @param role - Role to check
 * @returns True if back-office role
 */
export function isBackofficeRole(role: RoleType): boolean {
  return BACKOFFICE_ROLES.includes(role);
}

/**
 * Check if role is admin
 *
 * @param role - Role to check
 * @returns True if admin
 */
export function isAdminRole(role: RoleType): boolean {
  return role === 'ADMIN';
}

// =============================================================================
// User ID Resolution
// =============================================================================

/**
 * Get effective user ID based on requesting user's role
 *
 * Managers can query any user, staff can only query themselves.
 *
 * @param requestingUserRole - Role of the user making the request
 * @param requestingUserId - ID of the user making the request
 * @param requestedUserId - Optional ID of the user being queried
 * @returns Effective user ID to use in query
 *
 * @example
 * // Manager querying another user
 * getEffectiveUserId('MANAGER', 'mgr-1', 'user-2') // => 'user-2'
 *
 * // Staff trying to query another user (denied, returns own ID)
 * getEffectiveUserId('SERVER', 'user-1', 'user-2') // => 'user-1'
 */
export function getEffectiveUserId(
  requestingUserRole: RoleType,
  requestingUserId: string,
  requestedUserId?: string
): string {
  // Managers can query any user
  if (isManagerRole(requestingUserRole)) {
    return requestedUserId || requestingUserId;
  }
  // Staff can only query themselves
  return requestingUserId;
}

// =============================================================================
// Permission Checks
// =============================================================================

/**
 * Check if staff can delete their behavior log
 *
 * Rules:
 * - Staff can only delete their own logs
 * - Staff cannot delete verified logs
 * - Managers/Admins can delete any log
 *
 * @param isStaff - Whether the user is staff role
 * @param isLogOwner - Whether the user owns the log
 * @param isVerified - Whether the log is verified
 * @returns Delete permission result
 *
 * @example
 * canStaffDeleteLog(true, true, false)  // => { canDelete: true }
 * canStaffDeleteLog(true, false, false) // => { canDelete: false, reason: '...' }
 * canStaffDeleteLog(true, true, true)   // => { canDelete: false, reason: '...' }
 */
export function canStaffDeleteLog(
  isStaff: boolean,
  isLogOwner: boolean,
  isVerified: boolean
): DeletePermission {
  if (isStaff && !isLogOwner) {
    return { canDelete: false, reason: 'Can only delete your own logs' };
  }
  if (isStaff && isVerified) {
    return { canDelete: false, reason: 'Cannot delete verified logs' };
  }
  return { canDelete: true };
}

/**
 * Check if role can be deleted
 *
 * Roles with assigned users cannot be deleted.
 *
 * @param userCount - Number of users assigned to this role
 * @returns Delete permission result
 *
 * @example
 * canDeleteRole(0) // => { canDelete: true }
 * canDeleteRole(5) // => { canDelete: false, reason: '...' }
 */
export function canDeleteRole(userCount: number): DeletePermission {
  if (userCount > 0) {
    return {
      canDelete: false,
      reason: `Cannot delete role with ${userCount} assigned user${userCount === 1 ? '' : 's'}`,
    };
  }
  return { canDelete: true };
}

/**
 * Check if user can verify behavior logs
 *
 * Only managers and admins can verify logs.
 *
 * @param role - User's role
 * @returns True if can verify
 */
export function canVerifyLogs(role: RoleType): boolean {
  return isManagerRole(role);
}

/**
 * Check if user can view all users
 *
 * @param role - User's role
 * @returns True if can view all users
 */
export function canViewAllUsers(role: RoleType): boolean {
  return isManagerRole(role);
}

/**
 * Check if user can edit user profiles
 *
 * @param role - User's role
 * @param isOwnProfile - Whether editing own profile
 * @returns True if can edit
 */
export function canEditUserProfile(
  role: RoleType,
  isOwnProfile: boolean
): boolean {
  // Users can edit their own profile
  if (isOwnProfile) return true;
  // Managers can edit any profile
  return isManagerRole(role);
}

/**
 * Check if user can access admin features
 *
 * @param role - User's role
 * @returns True if can access admin
 */
export function canAccessAdmin(role: RoleType): boolean {
  return isAdminRole(role);
}

/**
 * Check if user can access manager features
 *
 * @param role - User's role
 * @returns True if can access manager features
 */
export function canAccessManager(role: RoleType): boolean {
  return isManagerRole(role);
}

// =============================================================================
// Verification Helpers
// =============================================================================

/**
 * Get verification update fields
 *
 * Returns the fields needed to update verification status on a log.
 *
 * @param verified - Whether to verify or unverify
 * @param userId - ID of the user doing the verification
 * @returns Verification fields for database update
 *
 * @example
 * getVerificationUpdate(true, 'mgr-123')
 * // => { verified: true, verifiedById: 'mgr-123', verifiedAt: Date }
 */
export function getVerificationUpdate(
  verified: boolean,
  userId: string
): VerificationFields {
  return {
    verified,
    verifiedById: verified ? userId : null,
    verifiedAt: verified ? new Date() : null,
  };
}

// =============================================================================
// Organization Access
// =============================================================================

/**
 * Check if user can access resource in organization
 *
 * Basic organization isolation check.
 *
 * @param userOrgId - User's organization ID
 * @param resourceOrgId - Resource's organization ID
 * @returns True if user can access
 *
 * @example
 * canAccessOrganization('org-1', 'org-1') // => true
 * canAccessOrganization('org-1', 'org-2') // => false
 */
export function canAccessOrganization(
  userOrgId: string,
  resourceOrgId: string
): boolean {
  return userOrgId === resourceOrgId;
}

// =============================================================================
// Feature Access
// =============================================================================

/**
 * Check if user can access a specific feature
 *
 * @param role - User's role
 * @param feature - Feature to check
 * @returns True if user can access feature
 */
export function canAccessFeature(
  role: RoleType,
  feature:
    | 'briefings'
    | 'verification'
    | 'analytics'
    | 'settings'
    | 'users'
    | 'roles'
): boolean {
  switch (feature) {
    case 'briefings':
      return true; // All roles can see briefings
    case 'verification':
      return isManagerRole(role);
    case 'analytics':
      return isManagerRole(role);
    case 'settings':
      return isAdminRole(role);
    case 'users':
      return isManagerRole(role);
    case 'roles':
      return isAdminRole(role);
    default:
      return false;
  }
}

/**
 * Get allowed routes for a role
 *
 * @param role - User's role
 * @returns Array of allowed route paths
 */
export function getAllowedRoutes(role: RoleType): string[] {
  const baseRoutes = ['/staff', '/scoreboard'];

  if (isManagerRole(role)) {
    return [...baseRoutes, '/manager', '/admin', '/strategy'];
  }

  return baseRoutes;
}

/**
 * Get redirect path for unauthorized access
 *
 * @param role - User's role
 * @param attemptedPath - Path user tried to access
 * @returns Path to redirect to
 */
export function getUnauthorizedRedirect(
  role: RoleType,
  attemptedPath: string
): string {
  if (isManagerRole(role)) {
    return '/admin'; // Managers go to admin
  }
  return '/staff'; // Staff go to staff page
}
