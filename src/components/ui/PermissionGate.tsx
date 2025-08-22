import { ReactNode } from "react";
import { usePermissions } from "../../hooks/usePermissions";
import { UserPermissions } from "../../types/permissions";

interface PermissionGateProps {
  children: ReactNode;
  section: keyof UserPermissions;
  action: string;
  fallback?: ReactNode;
  requireAll?: boolean;
  actions?: string[];
}

export function PermissionGate({ 
  children, 
  section, 
  action, 
  fallback = null,
  requireAll = false,
  actions
}: PermissionGateProps) {
  const { can, canAll, canAny } = usePermissions();

  let hasAccess = false;

  if (actions && actions.length > 0) {
    if (requireAll) {
      hasAccess = canAll(section, actions);
    } else {
      hasAccess = canAny(section, actions);
    }
  } else {
    hasAccess = can(section, action);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// Специализированные компоненты для частых случаев
export function CanView({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { canView } = usePermissions();
  return canView() ? <>{children}</> : <>{fallback}</>;
}

export function CanEdit({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { can } = usePermissions();
  const hasEditAccess = can("equipment", "edit") || 
                       can("stacks", "edit") || 
                       can("shipments", "edit") ||
                       can("categories", "edit") ||
                       can("locations", "edit");
  
  return hasEditAccess ? <>{children}</> : <>{fallback}</>;
}

export function CanCreate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { can } = usePermissions();
  const hasCreateAccess = can("equipment", "create") || 
                         can("stacks", "create") || 
                         can("shipments", "create") ||
                         can("categories", "create") ||
                         can("locations", "create");
  
  return hasCreateAccess ? <>{children}</> : <>{fallback}</>;
}

export function CanDelete({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { can } = usePermissions();
  const hasDeleteAccess = can("equipment", "delete") || 
                         can("stacks", "delete") || 
                         can("shipments", "delete") ||
                         can("categories", "delete") ||
                         can("locations", "delete");
  
  return hasDeleteAccess ? <>{children}</> : <>{fallback}</>;
}

export function CanExport({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { can } = usePermissions();
  const hasExportAccess = can("equipment", "export") || 
                         can("shipments", "export") ||
                         can("additional", "pdfExport");
  
  return hasExportAccess ? <>{children}</> : <>{fallback}</>;
}

export function IsAdmin({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { isAdmin } = usePermissions();
  return isAdmin() ? <>{children}</> : <>{fallback}</>;
}

export function IsManager({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { isManager } = usePermissions();
  return isManager() ? <>{children}</> : <>{fallback}</>;
}
