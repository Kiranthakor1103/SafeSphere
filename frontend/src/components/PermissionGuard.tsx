import type { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import type { Action, Module } from '../config/permissions';

interface PermissionGuardProps {
  module: Module;
  action: Action;
  children: ReactNode;
  fallback?: ReactNode;
}

/** Hides UI that the current role must not use. API authorization remains mandatory. */
const PermissionGuard = ({ module, action, children, fallback = null }: PermissionGuardProps) => {
  const { hasPermission } = usePermissions();
  return hasPermission(module, action) ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGuard;
