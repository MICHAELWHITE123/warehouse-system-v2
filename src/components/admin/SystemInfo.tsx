import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { 
  Info,
  Server,
  Database,
  Cpu,
  HardDrive,
  Zap,
  Clock,
  RefreshCw,
  Download,
  Activity,
  CheckCircle,
  AlertTriangle,
  Wifi,
  Shield,
  Package
} from "lucide-react";

interface SystemInfo {
  version: string;
  environment: string;
  uptime: string;
  lastRestart: string;
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
  database: {
    type: string;
    version: string;
    size: string;
    connections: number;
    maxConnections: number;
    lastBackup: string;
  };
  system: {
    os: string;
    nodeVersion: string;
    timezone: string;
    locale: string;
  };
  security: {
    httpsEnabled: boolean;
    corsEnabled: boolean;
    rateLimitEnabled: boolean;
    authTokenExpiry: string;
  };
  dependencies: {
    name: string;
    version: string;
    latest: string;
    status: "current" | "outdated" | "major";
  }[];
}

export function SystemInfo() {
  const [systemInfo] = useState<SystemInfo>({
    version: "1.2.3",
    environment: "production",
    uptime: "15 дней 8 часов 32 минуты",
    lastRestart: "2024-01-01 02:00:00",
    performance: {
      cpuUsage: 45,
      memoryUsage: 62,
      diskUsage: 78,
      networkLatency: 15
    },
    database: {
      type: "SQLite",
      version: "3.45.0",
      size: "245 MB",
      connections: 12,
      maxConnections: 100,
      lastBackup: "2024-01-15 02:00:00"
    },
    system: {
      os: "Linux Ubuntu 22.04 LTS",
      nodeVersion: "18.19.0",
      timezone: "Europe/Moscow",
      locale: "ru_RU"
    },
    security: {
      httpsEnabled: true,
      corsEnabled: true,
      rateLimitEnabled: true,
      authTokenExpiry: "8 часов"
    },
    dependencies: [
      { name: "react", version: "18.2.0", latest: "18.2.0", status: "current" },
      { name: "typescript", version: "5.3.3", latest: "5.3.3", status: "current" },
      { name: "vite", version: "5.0.8", latest: "5.0.10", status: "outdated" },
      { name: "tailwindcss", version: "3.4.0", latest: "3.4.1", status: "outdated" },
      { name: "express", version: "4.18.2", latest: "4.18.2", status: "current" },
      { name: "sqlite3", version: "5.1.6", latest: "5.1.7", status: "outdated" }
    ]
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Симуляция обновления данных
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };



  const getStatusBadge = (status: string) => {
    switch (status) {
      case "current":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Актуальная
        </Badge>;
      case "outdated":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
          <Clock className="h-3 w-3 mr-1" />
          Устаревшая
        </Badge>;
      case "major":
        return <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Критично
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEnvironmentBadge = (env: string) => {
    switch (env) {
      case "production":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          Продакшн
        </Badge>;
      case "development":
        return <Badge variant="secondary">Разработка</Badge>;
      case "staging":
        return <Badge variant="outline">Тестирование</Badge>;
      default:
        return <Badge variant="outline">{env}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Системная информация</h2>
          <p className="text-muted-foreground">
            Подробная информация о состоянии системы и производительности
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Общая информация */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Общая информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Версия системы</span>
              <Badge variant="outline">v{systemInfo.version}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Среда</span>
              {getEnvironmentBadge(systemInfo.environment)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Время работы</span>
              <span className="text-sm text-muted-foreground">{systemInfo.uptime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Последний перезапуск</span>
              <span className="text-sm text-muted-foreground font-mono">{systemInfo.lastRestart}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Системные характеристики
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Операционная система</span>
              <span className="text-sm text-muted-foreground">{systemInfo.system.os}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Node.js версия</span>
              <span className="text-sm text-muted-foreground">v{systemInfo.system.nodeVersion}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Часовой пояс</span>
              <span className="text-sm text-muted-foreground">{systemInfo.system.timezone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Локаль</span>
              <span className="text-sm text-muted-foreground">{systemInfo.system.locale}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Производительность */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Производительность системы
          </CardTitle>
          <CardDescription>
            Текущее использование ресурсов сервера
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    <span className="text-sm font-medium">Процессор</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{systemInfo.performance.cpuUsage}%</span>
                </div>
                <Progress 
                  value={systemInfo.performance.cpuUsage} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm font-medium">Память</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{systemInfo.performance.memoryUsage}%</span>
                </div>
                <Progress 
                  value={systemInfo.performance.memoryUsage} 
                  className="h-2"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    <span className="text-sm font-medium">Диск</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{systemInfo.performance.diskUsage}%</span>
                </div>
                <Progress 
                  value={systemInfo.performance.diskUsage} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm font-medium">Сеть</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{systemInfo.performance.networkLatency}ms</span>
                </div>
                <Progress 
                  value={Math.min(systemInfo.performance.networkLatency / 100 * 100, 100)} 
                  className="h-2"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* База данных и безопасность */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              База данных
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Тип БД</span>
              <span className="text-sm text-muted-foreground">{systemInfo.database.type}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Версия</span>
              <span className="text-sm text-muted-foreground">{systemInfo.database.version}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Размер</span>
              <span className="text-sm text-muted-foreground">{systemInfo.database.size}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Соединения</span>
              <span className="text-sm text-muted-foreground">
                {systemInfo.database.connections}/{systemInfo.database.maxConnections}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Последний бэкап</span>
              <span className="text-sm text-muted-foreground font-mono">{systemInfo.database.lastBackup}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Безопасность
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">HTTPS</span>
              <Badge variant={systemInfo.security.httpsEnabled ? "default" : "destructive"}>
                {systemInfo.security.httpsEnabled ? "Включен" : "Отключен"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">CORS</span>
              <Badge variant={systemInfo.security.corsEnabled ? "default" : "destructive"}>
                {systemInfo.security.corsEnabled ? "Включен" : "Отключен"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Rate Limiting</span>
              <Badge variant={systemInfo.security.rateLimitEnabled ? "default" : "destructive"}>
                {systemInfo.security.rateLimitEnabled ? "Включен" : "Отключен"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Токены истекают через</span>
              <span className="text-sm text-muted-foreground">{systemInfo.security.authTokenExpiry}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Зависимости */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Зависимости системы
          </CardTitle>
          <CardDescription>
            Версии основных библиотек и пакетов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {systemInfo.dependencies.map((dep, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{dep.name}</span>
                  <span className="text-sm text-muted-foreground font-mono">v{dep.version}</span>
                  {dep.version !== dep.latest && (
                    <span className="text-xs text-muted-foreground">
                      (последняя: v{dep.latest})
                    </span>
                  )}
                </div>
                {getStatusBadge(dep.status)}
              </div>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Статус зависимостей</p>
              <p className="text-xs text-muted-foreground">
                {systemInfo.dependencies.filter(d => d.status === "current").length} актуальных, {" "}
                {systemInfo.dependencies.filter(d => d.status === "outdated").length} устаревших
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Обновить пакеты
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
