import { useAuth } from "./useAuth";
import { hasPermission, hasAnyPermission, hasAllPermissions, UserPermissions, getPermissionsForRole } from "../types/permissions";

export const usePermissions = () => {
  const { user } = useAuth();

  // Get user permissions, fallback to default permissions based on role
  const getUserPermissions = (): UserPermissions | null => {
    if (!user) return null;
    
    if (user.permissions) {
      return user.permissions;
    }
    
    // Fallback to default permissions based on role
    if (user.role) {
      return getPermissionsForRole(user.role as any);
    }
    
    return null;
  };

  // Проверка конкретного права
  const can = (section: keyof UserPermissions, action: string): boolean => {
    const permissions = getUserPermissions();
    if (!permissions) return false;
    return hasPermission(permissions, section, action);
  };

  // Проверка множественных прав (любое из)
  const canAny = (section: keyof UserPermissions, actions: string[]): boolean => {
    const permissions = getUserPermissions();
    if (!permissions) return false;
    return hasAnyPermission(permissions, section, actions);
  };

  // Проверка всех прав
  const canAll = (section: keyof UserPermissions, actions: string[]): boolean => {
    const permissions = getUserPermissions();
    if (!permissions) return false;
    return hasAllPermissions(permissions, section, actions);
  };

  // Проверка роли
  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  // Проверка административных прав
  const isAdmin = (): boolean => {
    return user?.role === "admin";
  };

  // Проверка менеджерских прав
  const isManager = (): boolean => {
    return user?.role === "admin" || user?.role === "manager";
  };

  // Проверка операторских прав
  const isOperator = (): boolean => {
    return user?.role === "admin" || user?.role === "manager" || user?.role === "operator";
  };

  // Проверка прав на просмотр
  const canView = (): boolean => {
    return user?.role === "admin" || user?.role === "manager" || user?.role === "operator" || user?.role === "viewer";
  };

  return {
    can,
    canAny,
    canAll,
    hasRole,
    isAdmin,
    isManager,
    isOperator,
    canView,
    user
  };
};
