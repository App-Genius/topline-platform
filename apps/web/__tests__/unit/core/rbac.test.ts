import { describe, it, expect } from 'vitest';
import {
  isManagerRole,
  isStaffRole,
  isBackofficeRole,
  isAdminRole,
  getEffectiveUserId,
  canStaffDeleteLog,
  canDeleteRole,
  canVerifyLogs,
  canViewAllUsers,
  canEditUserProfile,
  canAccessAdmin,
  canAccessManager,
  getVerificationUpdate,
  canAccessOrganization,
  canAccessFeature,
  getAllowedRoutes,
  getUnauthorizedRedirect,
} from '@/lib/core/rbac';
import type { RoleType } from '@/lib/core/types';

describe('isManagerRole', () => {
  it('returns true for ADMIN', () => {
    expect(isManagerRole('ADMIN')).toBe(true);
  });

  it('returns true for MANAGER', () => {
    expect(isManagerRole('MANAGER')).toBe(true);
  });

  it('returns false for staff roles', () => {
    expect(isManagerRole('SERVER')).toBe(false);
    expect(isManagerRole('HOST')).toBe(false);
    expect(isManagerRole('BARTENDER')).toBe(false);
    expect(isManagerRole('BUSSER')).toBe(false);
    expect(isManagerRole('CHEF')).toBe(false);
  });

  it('returns false for hotel roles', () => {
    expect(isManagerRole('FRONT_DESK')).toBe(false);
    expect(isManagerRole('HOUSEKEEPING')).toBe(false);
  });

  it('returns false for backoffice roles', () => {
    expect(isManagerRole('PURCHASER')).toBe(false);
    expect(isManagerRole('ACCOUNTANT')).toBe(false);
    expect(isManagerRole('FACILITIES')).toBe(false);
  });

  it('returns false for CUSTOM role', () => {
    expect(isManagerRole('CUSTOM')).toBe(false);
  });
});

describe('isStaffRole', () => {
  it('returns true for front-line staff roles', () => {
    expect(isStaffRole('SERVER')).toBe(true);
    expect(isStaffRole('HOST')).toBe(true);
    expect(isStaffRole('BARTENDER')).toBe(true);
    expect(isStaffRole('BUSSER')).toBe(true);
    expect(isStaffRole('CHEF')).toBe(true);
    expect(isStaffRole('FRONT_DESK')).toBe(true);
    expect(isStaffRole('HOUSEKEEPING')).toBe(true);
  });

  it('returns false for manager roles', () => {
    expect(isStaffRole('ADMIN')).toBe(false);
    expect(isStaffRole('MANAGER')).toBe(false);
  });

  it('returns false for backoffice roles', () => {
    expect(isStaffRole('PURCHASER')).toBe(false);
    expect(isStaffRole('ACCOUNTANT')).toBe(false);
  });
});

describe('isBackofficeRole', () => {
  it('returns true for backoffice roles', () => {
    expect(isBackofficeRole('PURCHASER')).toBe(true);
    expect(isBackofficeRole('ACCOUNTANT')).toBe(true);
    expect(isBackofficeRole('FACILITIES')).toBe(true);
  });

  it('returns false for other roles', () => {
    expect(isBackofficeRole('ADMIN')).toBe(false);
    expect(isBackofficeRole('SERVER')).toBe(false);
  });
});

describe('isAdminRole', () => {
  it('returns true for ADMIN only', () => {
    expect(isAdminRole('ADMIN')).toBe(true);
  });

  it('returns false for MANAGER', () => {
    expect(isAdminRole('MANAGER')).toBe(false);
  });

  it('returns false for all other roles', () => {
    const otherRoles: RoleType[] = [
      'MANAGER',
      'SERVER',
      'HOST',
      'BARTENDER',
      'BUSSER',
      'CHEF',
      'FRONT_DESK',
      'HOUSEKEEPING',
      'PURCHASER',
      'ACCOUNTANT',
      'FACILITIES',
      'CUSTOM',
    ];
    otherRoles.forEach((role) => {
      expect(isAdminRole(role)).toBe(false);
    });
  });
});

describe('getEffectiveUserId', () => {
  it('admin can query any user', () => {
    expect(getEffectiveUserId('ADMIN', 'admin-1', 'user-2')).toBe('user-2');
  });

  it('manager can query any user', () => {
    expect(getEffectiveUserId('MANAGER', 'mgr-1', 'user-2')).toBe('user-2');
  });

  it('staff can only query themselves', () => {
    expect(getEffectiveUserId('SERVER', 'user-1', 'user-2')).toBe('user-1');
  });

  it('manager defaults to own ID if no requested user', () => {
    expect(getEffectiveUserId('MANAGER', 'mgr-1', undefined)).toBe('mgr-1');
  });

  it('staff always returns own ID', () => {
    expect(getEffectiveUserId('SERVER', 'user-1', undefined)).toBe('user-1');
  });
});

describe('canStaffDeleteLog', () => {
  it('staff cannot delete others logs', () => {
    const result = canStaffDeleteLog(true, false, false);
    expect(result.canDelete).toBe(false);
    expect(result.reason).toContain('own logs');
  });

  it('staff cannot delete verified logs', () => {
    const result = canStaffDeleteLog(true, true, true);
    expect(result.canDelete).toBe(false);
    expect(result.reason).toContain('verified');
  });

  it('staff can delete their own unverified logs', () => {
    const result = canStaffDeleteLog(true, true, false);
    expect(result.canDelete).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('manager can delete any log (not staff)', () => {
    const result = canStaffDeleteLog(false, false, true);
    expect(result.canDelete).toBe(true);
  });
});

describe('canDeleteRole', () => {
  it('cannot delete role with users', () => {
    const result = canDeleteRole(5);
    expect(result.canDelete).toBe(false);
    expect(result.reason).toContain('5 assigned users');
  });

  it('handles singular user', () => {
    const result = canDeleteRole(1);
    expect(result.canDelete).toBe(false);
    expect(result.reason).toContain('1 assigned user');
    expect(result.reason).not.toContain('users');
  });

  it('can delete role with no users', () => {
    const result = canDeleteRole(0);
    expect(result.canDelete).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});

describe('canVerifyLogs', () => {
  it('allows managers to verify', () => {
    expect(canVerifyLogs('ADMIN')).toBe(true);
    expect(canVerifyLogs('MANAGER')).toBe(true);
  });

  it('denies staff from verifying', () => {
    expect(canVerifyLogs('SERVER')).toBe(false);
    expect(canVerifyLogs('HOST')).toBe(false);
  });
});

describe('canViewAllUsers', () => {
  it('allows managers to view all', () => {
    expect(canViewAllUsers('ADMIN')).toBe(true);
    expect(canViewAllUsers('MANAGER')).toBe(true);
  });

  it('denies staff from viewing all', () => {
    expect(canViewAllUsers('SERVER')).toBe(false);
  });
});

describe('canEditUserProfile', () => {
  it('allows users to edit own profile', () => {
    expect(canEditUserProfile('SERVER', true)).toBe(true);
    expect(canEditUserProfile('ADMIN', true)).toBe(true);
  });

  it('allows managers to edit any profile', () => {
    expect(canEditUserProfile('ADMIN', false)).toBe(true);
    expect(canEditUserProfile('MANAGER', false)).toBe(true);
  });

  it('denies staff from editing others', () => {
    expect(canEditUserProfile('SERVER', false)).toBe(false);
  });
});

describe('canAccessAdmin', () => {
  it('only ADMIN can access admin', () => {
    expect(canAccessAdmin('ADMIN')).toBe(true);
    expect(canAccessAdmin('MANAGER')).toBe(false);
    expect(canAccessAdmin('SERVER')).toBe(false);
  });
});

describe('canAccessManager', () => {
  it('managers and admins can access manager features', () => {
    expect(canAccessManager('ADMIN')).toBe(true);
    expect(canAccessManager('MANAGER')).toBe(true);
  });

  it('staff cannot access manager features', () => {
    expect(canAccessManager('SERVER')).toBe(false);
  });
});

describe('getVerificationUpdate', () => {
  it('returns correct fields for verification', () => {
    const result = getVerificationUpdate(true, 'mgr-123');

    expect(result.verified).toBe(true);
    expect(result.verifiedById).toBe('mgr-123');
    expect(result.verifiedAt).toBeInstanceOf(Date);
  });

  it('returns null fields for unverification', () => {
    const result = getVerificationUpdate(false, 'mgr-123');

    expect(result.verified).toBe(false);
    expect(result.verifiedById).toBeNull();
    expect(result.verifiedAt).toBeNull();
  });
});

describe('canAccessOrganization', () => {
  it('allows access to own organization', () => {
    expect(canAccessOrganization('org-1', 'org-1')).toBe(true);
  });

  it('denies access to other organization', () => {
    expect(canAccessOrganization('org-1', 'org-2')).toBe(false);
  });
});

describe('canAccessFeature', () => {
  it('briefings accessible to all', () => {
    expect(canAccessFeature('ADMIN', 'briefings')).toBe(true);
    expect(canAccessFeature('SERVER', 'briefings')).toBe(true);
  });

  it('verification requires manager', () => {
    expect(canAccessFeature('ADMIN', 'verification')).toBe(true);
    expect(canAccessFeature('MANAGER', 'verification')).toBe(true);
    expect(canAccessFeature('SERVER', 'verification')).toBe(false);
  });

  it('analytics requires manager', () => {
    expect(canAccessFeature('ADMIN', 'analytics')).toBe(true);
    expect(canAccessFeature('SERVER', 'analytics')).toBe(false);
  });

  it('settings requires admin', () => {
    expect(canAccessFeature('ADMIN', 'settings')).toBe(true);
    expect(canAccessFeature('MANAGER', 'settings')).toBe(false);
  });

  it('users requires manager', () => {
    expect(canAccessFeature('MANAGER', 'users')).toBe(true);
    expect(canAccessFeature('SERVER', 'users')).toBe(false);
  });

  it('roles requires admin', () => {
    expect(canAccessFeature('ADMIN', 'roles')).toBe(true);
    expect(canAccessFeature('MANAGER', 'roles')).toBe(false);
  });
});

describe('getAllowedRoutes', () => {
  it('returns extended routes for managers', () => {
    const routes = getAllowedRoutes('MANAGER');
    expect(routes).toContain('/staff');
    expect(routes).toContain('/scoreboard');
    expect(routes).toContain('/manager');
    expect(routes).toContain('/admin');
    expect(routes).toContain('/strategy');
  });

  it('returns base routes for staff', () => {
    const routes = getAllowedRoutes('SERVER');
    expect(routes).toContain('/staff');
    expect(routes).toContain('/scoreboard');
    expect(routes).not.toContain('/manager');
    expect(routes).not.toContain('/admin');
  });
});

describe('getUnauthorizedRedirect', () => {
  it('redirects managers to admin', () => {
    expect(getUnauthorizedRedirect('ADMIN', '/some-path')).toBe('/admin');
    expect(getUnauthorizedRedirect('MANAGER', '/some-path')).toBe('/admin');
  });

  it('redirects staff to staff page', () => {
    expect(getUnauthorizedRedirect('SERVER', '/admin')).toBe('/staff');
    expect(getUnauthorizedRedirect('HOST', '/manager')).toBe('/staff');
  });
});
