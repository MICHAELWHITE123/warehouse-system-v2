import { useAuth } from "./useAuth";
import { hasPermission, hasAnyPermission, hasAllPermissions, UserPermissions } from "../types/permissions";

export const usePermissions = () => {
  const { user } = useAuth();

  // Проверка конкретного права
  const can = (section: keyof UserPermissions, action: string): boolean => {
    if (!user || !user.permissions) return false;
    return hasPermission(user.permissions, section, action);
  };

  // Проверка множественных прав (любое из)
  const canAny = (section: keyof UserPermissions, actions: string[]): boolean => {
    if (!user || !user.permissions) return false;
    return hasAnyPermission(user.permissions, section, actions);
  };

  // Проверка всех прав
  const canAll = (section: keyof UserPermissions, actions: string[]): boolean => {
    if (!user || !user.permissions) return false;
    return hasAllPermissions(user.permissions, section, actions);
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
