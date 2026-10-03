import { useAuth } from '../context/AuthContext';
import { can, canAccessModule, hasPermission, normalizeRole, type Action, type Module, type Role } from '../config/permissions';

export const useRole = (): Role | undefined => {
  const { user } = useAuth();
  return normalizeRole(user?.role);
};

export const usePermissions = () => {
  const { user } = useAuth();
  return {
    role: normalizeRole(user?.role),
    hasPermission: (module: Module, action: Action) => hasPermission(user?.role, module, action),
    can: (permission: Parameters<typeof can>[1]) => can(user?.role, permission),
    canAccessModule: (module: Module) => canAccessModule(user?.role, module),
  };
};
