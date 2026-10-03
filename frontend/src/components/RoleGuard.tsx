import type { ReactNode } from 'react';
import { useRole } from '../hooks/usePermissions';
import type { Role } from '../config/permissions';

const RoleGuard = ({ roles, children, fallback = null }: { roles: Role[]; children: ReactNode; fallback?: ReactNode }) => {
  const role = useRole();
  return role && roles.includes(role) ? <>{children}</> : <>{fallback}</>;
};

export default RoleGuard;
