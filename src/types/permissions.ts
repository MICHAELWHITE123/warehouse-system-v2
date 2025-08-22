// Система прав доступа для пользователей

// Основные роли пользователей
export type UserRole = "admin" | "manager" | "operator" | "viewer";

// Детальные права доступа
export interface UserPermissions {
  // Управление оборудованием
  equipment: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
  };
  
  // Управление стеками
  stacks: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  
  // Управление отгрузками
  shipments: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
    export: boolean;
  };
  
  // Управление категориями
  categories: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  
  // Управление местоположениями
  locations: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  
  // Административные функции
  admin: {
    userManagement: boolean;
    systemSettings: boolean;
    auditLogs: boolean;
    statistics: boolean;
  };
  
  // Дополнительные права
  additional: {
    qrScanning: boolean;
    pdfExport: boolean;
    bulkOperations: boolean;
    dataImport: boolean;
  };
}

// Расширенный интерфейс пользователя
export interface UserWithPermissions {
  id: string;
  username: string;
  login: string;
  nickname: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: UserPermissions;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  notes?: string;
}

// Предустановленные наборы прав для ролей
export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    equipment: { view: true, create: true, edit: true, delete: true, export: true },
    stacks: { view: true, create: true, edit: true, delete: true },
    shipments: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    categories: { view: true, create: true, edit: true, delete: true },
    locations: { view: true, create: true, edit: true, delete: true },
    admin: { userManagement: true, systemSettings: true, auditLogs: true, statistics: true },
    additional: { qrScanning: true, pdfExport: true, bulkOperations: true, dataImport: true }
  },
  
  manager: {
    equipment: { view: true, create: true, edit: true, delete: false, export: true },
    stacks: { view: true, create: true, edit: true, delete: false },
    shipments: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    categories: { view: true, create: true, edit: true, delete: false },
    locations: { view: true, create: true, edit: true, delete: false },
    admin: { userManagement: false, systemSettings: false, auditLogs: true, statistics: true },
    additional: { qrScanning: true, pdfExport: true, bulkOperations: true, dataImport: false }
  },
  
  operator: {
    equipment: { view: true, create: false, edit: false, delete: false, export: false },
    stacks: { view: true, create: false, edit: false, delete: false },
    shipments: { view: true, create: true, edit: false, delete: false, approve: false, export: false },
    categories: { view: true, create: false, edit: false, delete: false },
    locations: { view: true, create: false, edit: false, delete: false },
    admin: { userManagement: false, systemSettings: false, auditLogs: false, statistics: false },
    additional: { qrScanning: true, pdfExport: false, bulkOperations: false, dataImport: false }
  },
  
  viewer: {
    equipment: { view: true, create: false, edit: false, delete: false, export: false },
    stacks: { view: true, create: false, edit: false, delete: false },
    shipments: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    categories: { view: true, create: false, edit: false, delete: false },
    locations: { view: true, create: false, edit: false, delete: false },
    admin: { userManagement: false, systemSettings: false, auditLogs: false, statistics: false },
    additional: { qrScanning: false, pdfExport: false, bulkOperations: false, dataImport: false }
  }
};

// Функция для получения прав по роли
export function getPermissionsForRole(role: UserRole): UserPermissions {
  return DEFAULT_PERMISSIONS[role];
}

// Функция для проверки права доступа
export function hasPermission(
  userPermissions: UserPermissions,
  section: keyof UserPermissions,
  action: string
): boolean {
  const sectionPermissions = userPermissions[section];
  if (typeof sectionPermissions === 'object' && sectionPermissions !== null) {
    return (sectionPermissions as any)[action] === true;
  }
  return false;
}

// Функция для проверки множественных прав
export function hasAnyPermission(
  userPermissions: UserPermissions,
  section: keyof UserPermissions,
  actions: string[]
): boolean {
  return actions.some(action => hasPermission(userPermissions, section, action));
}

// Функция для проверки всех прав
export function hasAllPermissions(
  userPermissions: UserPermissions,
  section: keyof UserPermissions,
  actions: string[]
): boolean {
  return actions.every(action => hasPermission(userPermissions, section, action));
}
