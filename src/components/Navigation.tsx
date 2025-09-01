import { useState } from "react";
import { 
  LayoutDashboard, 
  Package, 
  Plus, 
  Truck, 
  Bell, 
  Moon, 
  Sun, 
  LogOut,
  Users,
  MapPin,
  FolderOpen,
  Menu,
  X,
  Shield,
  Activity
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { UserPermissions } from "../types/permissions";
// import lightLogoImage from 'figma:asset/b40dece314fc20504e6cf04e665a418c7def043e.png';
// import darkLogoImage from 'figma:asset/2192bd3f6c891d674f53dbe2427fa635913c50a0.png';

export interface User {
  username: string;
  role: string;
  displayName: string;
  permissions?: UserPermissions;
}

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
  notificationCount: number;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  user: User;
  onLogout: () => void;
}

export function Navigation({ 
  activeView, 
  onViewChange, 
  notificationCount, 
  isDarkMode, 
  onThemeToggle,
  user,
  onLogout
}: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      id: "dashboard",
      label: "Дашборд",
      icon: LayoutDashboard,
      description: "Общая статистика и аналитика"
    },
    {
      id: "equipment",
      label: "Оборудование",
      icon: Package,
      description: "Управление техникой на складе"
    },
    {
      id: "stacks",
      label: "Стеки техники",
      icon: Users,
      description: "Группировка оборудования в комплекты"
    },
    {
      id: "shipments",
      label: "Отгрузки",
      icon: Truck,
      description: "Отгрузочные листы и доставка"
    },
    {
      id: "add-equipment",
      label: "Добавить технику",
      icon: Plus,
      description: "Регистрация нового оборудования"
    }
  ];

  const managementItems = [
    {
      id: "categories",
      label: "Категории",
      icon: FolderOpen,
      description: "Управление категориями техники"
    },
    {
      id: "locations",
      label: "Местоположения",
      icon: MapPin,
      description: "Управление местами хранения"
    }
  ];

  const adminItems = [
    {
      id: "admin",
      label: "Админ-панель",
      icon: Shield,
      description: "Панель администратора системы"
    },
    {
      id: "diagnostics",
      label: "Диагностика",
      icon: Activity,
      description: "Проверка состояния системы"
    }
  ];

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "Администратор";
      case "manager":
        return "Менеджер";
      case "operator":
        return "Оператор";
      default:
        return role;
    }
  };

  const getUserInitials = (displayName: string | undefined) => {
    // Проверяем что displayName существует и не пустой
    if (!displayName || typeof displayName !== 'string' || displayName.trim() === '') {
      return "??"; // Возвращаем дефолтное значение
    }
    
    return displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleNavItemClick = (viewId: string) => {
    onViewChange(viewId);
    closeMobileMenu();
  };

  const NavItems = () => (
    <>
      {/* Основные разделы */}
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Основное
        </div>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavItemClick(item.id)}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title={item.description}
            >
              <Icon className="mr-3 h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === "dashboard" && notificationCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] text-xs">
                  {notificationCount}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      <Separator className="my-4" />

      {/* Управление */}
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Управление
        </div>
        {managementItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavItemClick(item.id)}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title={item.description}
            >
              <Icon className="mr-3 h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Администрирование - только для админов */}
      {user?.role === "admin" && (
        <>
          <Separator className="my-4" />
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Администрирование
            </div>
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavItemClick(item.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  title={item.description}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );

  return (
    <>
      {/* Мобильное меню - кнопка открытия */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-background/80 backdrop-blur-sm"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Мобильное меню - оверлей */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      {/* Боковая панель */}
      <div className={`
        fixed top-0 left-0 z-40 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Заголовок */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded flex items-center justify-center">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-sidebar-foreground">
                  Склад
                </h1>
                <p className="text-xs text-sidebar-foreground/60">
                  Система учета техники
                </p>
              </div>
            </div>
          </div>

          {/* Навигация */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <NavItems />
          </nav>

          {/* Нижняя панель */}
          <div className="p-4 border-t border-sidebar-border">
            {/* Информация о пользователе */}
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {getUserInitials(user?.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.displayName || user?.username || "Пользователь"}
                </p>
                <p className="text-xs text-sidebar-foreground/60">
                  {getRoleDisplayName(user?.role || "user")}
                </p>
              </div>
            </div>

            {/* Кнопки управления */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {/* Уведомления */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-sidebar-accent relative"
                  title={`Уведомления${notificationCount > 0 ? ` (${notificationCount})` : ''}`}
                >
                  <Bell className="h-4 w-4" />
                  {notificationCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                    >
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </Badge>
                  )}
                </Button>

                {/* Переключатель темы */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onThemeToggle}
                  className="h-8 w-8 p-0 hover:bg-sidebar-accent"
                  title={isDarkMode ? "Переключить на светлую тему" : "Переключить на темную тему"}
                >
                  {isDarkMode ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Выход */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                title="Выйти из системы"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Отступ для основного контента на десктопе */}
      <div className="lg:pl-64">
        {/* Контент будет здесь */}
      </div>
    </>
  );
}