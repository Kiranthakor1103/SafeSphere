/** Single source of truth for frontend RBAC. API authorization mirrors these rules. */
export type Role = 'super_admin' | 'district_admin' | 'shelter_manager' | 'rescue_team' | 'volunteer' | 'citizen';
export type LegacyRole = 'admin' | 'ngo';
export type AppRole = Role | LegacyRole;

export type Module =
  | 'dashboard' | 'disasters' | 'sos' | 'shelters' | 'missing-persons'
  | 'volunteers' | 'rescue-teams' | 'resources' | 'alerts' | 'users';
export type Action = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'reject' | 'assign' | 'open' | 'close' | 'export';
export type Permission = `${Module}:${Action}`;

const ALL_ROLES: Role[] = ['super_admin', 'district_admin', 'shelter_manager', 'rescue_team', 'volunteer', 'citizen'];
const OPERATIONS: Role[] = ['super_admin', 'district_admin'];

/** Converts accounts created with the original project roles without breaking access. */
export const normalizeRole = (role?: string): Role | undefined => {
  if (!role) return undefined;
  if (role === 'admin') return 'super_admin';
  if (role === 'ngo') return 'district_admin';
  return ALL_ROLES.includes(role as Role) ? (role as Role) : undefined;
};

/** Capitalizes and formats human-readable role labels for UI display */
export const formatRoleLabel = (role?: string): string => {
  if (!role) return 'Guest';
  const normalized = normalizeRole(role) || role;
  return normalized
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const permissions: Record<Module, Partial<Record<Action, Role[]>>> = {
  dashboard: { view: ALL_ROLES },
  users: { view: ['super_admin'], edit: ['super_admin'], delete: ['super_admin'] },
  disasters: {
    view: ALL_ROLES,
    create: OPERATIONS, edit: OPERATIONS, delete: OPERATIONS, assign: OPERATIONS, export: OPERATIONS,
  },
  sos: {
    view: ALL_ROLES, create: ALL_ROLES,
    edit: ['super_admin', 'district_admin', 'rescue_team'], delete: OPERATIONS, assign: OPERATIONS, export: OPERATIONS,
  },
  shelters: {
    view: ALL_ROLES, create: OPERATIONS, edit: ['super_admin', 'district_admin', 'shelter_manager'],
    delete: ['super_admin', 'district_admin', 'shelter_manager'], open: ['super_admin', 'district_admin', 'shelter_manager'],
    close: ['super_admin', 'district_admin', 'shelter_manager'], export: OPERATIONS,
  },
  'missing-persons': {
    view: ALL_ROLES,
    create: ALL_ROLES, edit: ['super_admin', 'district_admin', 'rescue_team'],
    delete: OPERATIONS, approve: OPERATIONS, reject: OPERATIONS, export: OPERATIONS,
  },
  volunteers: {
    view: ALL_ROLES,
    create: ALL_ROLES, edit: ['super_admin', 'district_admin'], delete: OPERATIONS, approve: OPERATIONS, reject: OPERATIONS, assign: OPERATIONS, export: OPERATIONS,
  },
  'rescue-teams': {
    view: ALL_ROLES,
    create: OPERATIONS, edit: OPERATIONS, delete: OPERATIONS, assign: OPERATIONS, export: OPERATIONS,
  },
  resources: {
    view: ALL_ROLES,
    create: ['super_admin', 'district_admin', 'shelter_manager'], edit: ['super_admin', 'district_admin', 'shelter_manager'],
    delete: ['super_admin', 'district_admin', 'shelter_manager'], assign: ['super_admin', 'district_admin', 'shelter_manager'], export: OPERATIONS,
  },
  alerts: {
    view: ALL_ROLES, create: OPERATIONS, edit: OPERATIONS, delete: OPERATIONS, approve: OPERATIONS, export: OPERATIONS,
  },
};

export const hasPermission = (role: string | undefined, module: Module, action: Action): boolean => {
  const normalizedRole = normalizeRole(role);
  return !!normalizedRole && (permissions[module][action] || []).includes(normalizedRole);
};

export const can = (role: string | undefined, permission: Permission): boolean => {
  const [module, action] = permission.split(':') as [Module, Action];
  return hasPermission(role, module, action);
};

export const canAccessModule = (role: string | undefined, module: Module): boolean =>
  hasPermission(role, module, 'view');
