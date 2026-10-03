export type Role = 'super_admin' | 'district_admin' | 'shelter_manager' | 'rescue_team' | 'volunteer' | 'citizen';
export type Module = 'dashboard' | 'disasters' | 'sos' | 'shelters' | 'missing-persons' | 'volunteers' | 'rescue-teams' | 'resources' | 'alerts' | 'users';
export type Action = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'reject' | 'assign' | 'open' | 'close' | 'export';

const ALL: Role[] = ['super_admin', 'district_admin', 'shelter_manager', 'rescue_team', 'volunteer', 'citizen'];
const OPERATIONS: Role[] = ['super_admin', 'district_admin'];

export const normalizeRole = (role?: string): Role | undefined => {
  if (role === 'admin') return 'super_admin';
  if (role === 'ngo') return 'district_admin';
  return ALL.includes(role as Role) ? role as Role : undefined;
};

export const permissionConfig: Record<Module, Partial<Record<Action, Role[]>>> = {
  dashboard: { view: ALL },
  users: { view: ['super_admin'], edit: ['super_admin'], delete: ['super_admin'] },
  disasters: { view: ALL, create: OPERATIONS, edit: OPERATIONS, delete: OPERATIONS, assign: OPERATIONS, export: OPERATIONS },
  sos: { view: ALL, create: ALL, edit: ['super_admin', 'district_admin', 'rescue_team'], delete: OPERATIONS, assign: OPERATIONS, export: OPERATIONS },
  shelters: { view: ALL, create: OPERATIONS, edit: ['super_admin', 'district_admin', 'shelter_manager'], delete: ['super_admin', 'district_admin', 'shelter_manager'], open: ['super_admin', 'district_admin', 'shelter_manager'], close: ['super_admin', 'district_admin', 'shelter_manager'], export: OPERATIONS },
  'missing-persons': { view: ALL, create: ALL, edit: ['super_admin', 'district_admin', 'rescue_team'], delete: OPERATIONS, approve: OPERATIONS, reject: OPERATIONS, export: OPERATIONS },
  volunteers: { view: ALL, create: ALL, edit: OPERATIONS, delete: OPERATIONS, approve: OPERATIONS, reject: OPERATIONS, assign: OPERATIONS, export: OPERATIONS },
  'rescue-teams': { view: ALL, create: OPERATIONS, edit: OPERATIONS, delete: OPERATIONS, assign: OPERATIONS, export: OPERATIONS },
  resources: { view: ALL, create: ['super_admin', 'district_admin', 'shelter_manager'], edit: ['super_admin', 'district_admin', 'shelter_manager'], delete: ['super_admin', 'district_admin', 'shelter_manager'], assign: ['super_admin', 'district_admin', 'shelter_manager'], export: OPERATIONS },
  alerts: { view: ALL, create: OPERATIONS, edit: OPERATIONS, delete: OPERATIONS, approve: OPERATIONS, export: OPERATIONS },
};

export const hasPermission = (role: string | undefined, module: Module, action: Action): boolean => {
  const normalized = normalizeRole(role);
  return !!normalized && (permissionConfig[module][action] || []).includes(normalized);
};
