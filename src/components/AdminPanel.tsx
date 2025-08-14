import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  Users, 
  Settings, 
  FileText, 
  Shield, 
  Activity, 
  Database,
  Key,
  Info,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { UserManagement } from "./admin/UserManagement";
import { SystemSettings } from "./admin/SystemSettings";
import { AuditLogs } from "./admin/AuditLogs";
import { SystemInfo } from "./admin/SystemInfo";

interface AdminPanelProps {
  user: {
    username: string;
    role: string;
    displayName: string;
  };
}

export function AdminPanel({ user }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Проверка прав доступа
  if (user.role !== "admin") {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Доступ запрещен
            </CardTitle>
            <CardDescription>
              У вас недостаточно прав для доступа к панели администратора
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const systemStats = {
    totalUsers: 12,
    activeUsers: 8,
    totalEquipment: 156,
    systemUptime: "99.9%",
    lastBackup: "2 часа назад",
    databaseSize: "245 MB"
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Панель администратора</h1>
        <p className="text-muted-foreground">
          Управление системой учета техники на складе
        </p>
      </div>

      {/* Табы */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Обзор
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Пользователи
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Настройки
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Аудит
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Система
          </TabsTrigger>
        </TabsList>

        {/* Обзор */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{systemStats.activeUsers} активных</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Оборудование</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalEquipment}</div>
                <p className="text-xs text-muted-foreground">
                  единиц в системе
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Время работы</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.systemUptime}</div>
                <p className="text-xs text-muted-foreground">
                  за последний месяц
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">База данных</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.databaseSize}</div>
                <p className="text-xs text-muted-foreground">
                  размер данных
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Быстрые действия */}
          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
              <CardDescription>
                Часто используемые административные операции
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button 
                onClick={() => setActiveTab("users")}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Управление пользователями
              </Button>
              <Button 
                variant="outline"
                onClick={() => setActiveTab("settings")}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Системные настройки
              </Button>
              <Button 
                variant="outline"
                onClick={() => setActiveTab("audit")}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Просмотр логов
              </Button>
            </CardContent>
          </Card>

          {/* Последняя активность */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Последняя активность
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">СОЗДАНИЕ</Badge>
                    <span className="text-sm">Добавлено новое оборудование "Ноутбук Dell"</span>
                  </div>
                  <span className="text-xs text-muted-foreground">5 мин назад</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">ОБНОВЛЕНИЕ</Badge>
                    <span className="text-sm">Изменен статус пользователя "operator"</span>
                  </div>
                  <span className="text-xs text-muted-foreground">15 мин назад</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">СИСТЕМА</Badge>
                    <span className="text-sm">Выполнено резервное копирование БД</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{systemStats.lastBackup}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Системные уведомления */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Системные уведомления
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Требуется обновление системы</p>
                    <p className="text-xs text-muted-foreground">
                      Доступна новая версия с исправлениями безопасности
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Плановое обслуживание</p>
                    <p className="text-xs text-muted-foreground">
                      Запланировано на воскресенье в 02:00
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Управление пользователями */}
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        {/* Системные настройки */}
        <TabsContent value="settings">
          <SystemSettings />
        </TabsContent>

        {/* Аудит и логи */}
        <TabsContent value="audit">
          <AuditLogs />
        </TabsContent>

        {/* Системная информация */}
        <TabsContent value="system">
          <SystemInfo />
        </TabsContent>
      </Tabs>
    </div>
  );
}
