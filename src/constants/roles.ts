export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  FINANCE: 'finance'
} as const;

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'مدير النظام',
  [ROLES.SUPERVISOR]: 'مراقب منطقة',
  [ROLES.FINANCE]: 'قسم الرواتب'
} as const;

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ['read', 'write', 'delete', 'approve'],
  [ROLES.SUPERVISOR]: ['read', 'write_own_region'],
  [ROLES.FINANCE]: ['read_approved', 'generate_payroll']
} as const;
