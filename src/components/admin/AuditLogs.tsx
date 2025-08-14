import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { 
  FileText, 
  Search, 
  Download, 
  Filter,
  Calendar as CalendarIcon,
  User,
  Database,
  Settings,
  Shield,
  Package,
  Truck,
  FolderOpen,
  MoreHorizontal,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: "success" | "error" | "warning";
  changes?: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
}

export function AuditLogs() {
  const [logs] = useState<AuditLog[]>([
    {
      id: "1",
      timestamp: "2024-01-15 10:30:15",
      user: "admin",
      action: "CREATE",
      resource: "equipment",
      resourceId: "eq-001",
      details: "Создано новое оборудование 'Ноутбук Dell Latitude'",
      ipAddress: "192.168.1.100",
      userAgent: "Chrome/121.0.0.0",
      status: "success",
      changes: [
        { field: "name", oldValue: "", newValue: "Ноутбук Dell Latitude" },
        { field: "category", oldValue: "", newValue: "Компьютеры" },
        { field: "status", oldValue: "", newValue: "available" }
      ]
    },
    {
      id: "2",
      timestamp: "2024-01-15 10:15:32",
      user: "manager",
      action: "UPDATE",
      resource: "user",
      resourceId: "user-003",
      details: "Изменена роль пользователя operator",
      ipAddress: "192.168.1.101",
      userAgent: "Firefox/121.0",
      status: "success",
      changes: [
        { field: "role", oldValue: "operator", newValue: "manager" }
      ]
    },
    {
      id: "3",
      timestamp: "2024-01-15 09:45:22",
      user: "operator",
      action: "LOGIN",
      resource: "auth",
      resourceId: "session-456",
      details: "Вход в систему",
      ipAddress: "192.168.1.102",
      userAgent: "Safari/17.0",
      status: "success"
    },
    {
      id: "4",
      timestamp: "2024-01-15 09:30:11",
      user: "unknown",
      action: "LOGIN",
      resource: "auth",
      resourceId: "session-failed",
      details: "Неудачная попытка входа с логином 'admin'",
      ipAddress: "192.168.1.200",
      userAgent: "Chrome/121.0.0.0",
      status: "error"
    },
    {
      id: "5",
      timestamp: "2024-01-15 08:20:45",
      user: "admin",
      action: "DELETE",
      resource: "equipment",
      resourceId: "eq-old-001",
      details: "Удалено устаревшее оборудование",
      ipAddress: "192.168.1.100",
      userAgent: "Chrome/121.0.0.0",
      status: "warning"
    },
    {
      id: "6",
      timestamp: "2024-01-14 18:30:00",
      user: "system",
      action: "BACKUP",
      resource: "database",
      resourceId: "backup-daily",
      details: "Автоматическое резервное копирование",
      ipAddress: "127.0.0.1",
      userAgent: "System",
      status: "success"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = selectedAction === "all" || log.action === selectedAction;
    const matchesStatus = selectedStatus === "all" || log.status === selectedStatus;
    const matchesUser = selectedUser === "all" || log.user === selectedUser;
    
    // Фильтр по дате (упрощенный)
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const logDate = new Date(log.timestamp);
      if (dateFrom && logDate < dateFrom) matchesDate = false;
      if (dateTo && logDate > dateTo) matchesDate = false;
    }
    
    return matchesSearch && matchesAction && matchesStatus && matchesUser && matchesDate;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE": return <Package className="h-4 w-4 text-green-500" />;
      case "UPDATE": return <Settings className="h-4 w-4 text-blue-500" />;
      case "DELETE": return <Trash2 className="h-4 w-4 text-red-500" />;
      case "LOGIN": return <User className="h-4 w-4 text-purple-500" />;
      case "LOGOUT": return <User className="h-4 w-4 text-gray-500" />;
      case "BACKUP": return <Database className="h-4 w-4 text-indigo-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Успех
        </Badge>;
      case "error":
        return <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Ошибка
        </Badge>;
      case "warning":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
          <Clock className="h-3 w-3 mr-1" />
          Предупреждение
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case "equipment": return <Package className="h-4 w-4" />;
      case "user": return <User className="h-4 w-4" />;
      case "auth": return <Shield className="h-4 w-4" />;
      case "shipment": return <Truck className="h-4 w-4" />;
      case "category": return <FolderOpen className="h-4 w-4" />;
      case "database": return <Database className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const uniqueUsers = [...new Set(logs.map(log => log.user))];
  const uniqueActions = [...new Set(logs.map(log => log.action))];

  const handleExportLogs = () => {
    // Здесь будет логика экспорта логов
    console.log("Exporting logs...");
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Журнал аудита</h2>
          <p className="text-muted-foreground">
            Детальный журнал всех действий пользователей и системных событий
          </p>
        </div>
        <Button onClick={handleExportLogs} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Экспорт логов
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">Всего записей</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {logs.filter(l => l.status === "success").length}
            </div>
            <p className="text-xs text-muted-foreground">Успешных операций</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {logs.filter(l => l.status === "error").length}
            </div>
            <p className="text-xs text-muted-foreground">Ошибок</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {uniqueUsers.length}
            </div>
            <p className="text-xs text-muted-foreground">Активных пользователей</p>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Поиск по описанию, пользователю или ресурсу..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Действие" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все действия</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="success">Успех</SelectItem>
                <SelectItem value="error">Ошибка</SelectItem>
                <SelectItem value="warning">Предупреждение</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Пользователь" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все пользователи</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user} value={user}>{user}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[150px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd.MM.yyyy", { locale: ru }) : "От"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[150px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd.MM.yyyy", { locale: ru }) : "До"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedAction("all");
                  setSelectedStatus("all");
                  setSelectedUser("all");
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Сбросить
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Таблица логов */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Время</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Действие</TableHead>
                <TableHead>Ресурс</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>IP адрес</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {log.timestamp}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{log.user}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span className="font-medium">{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getResourceIcon(log.resource)}
                      <span>{log.resource}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {log.details}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(log.status)}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {log.ipAddress}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(log)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Детали лога */}
      {selectedLog && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Детали записи аудита
            </CardTitle>
            <CardDescription>
              Подробная информация о действии {selectedLog.id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Время</Label>
                <p className="font-mono">{selectedLog.timestamp}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Пользователь</Label>
                <p>{selectedLog.user}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Действие</Label>
                <div className="flex items-center gap-2">
                  {getActionIcon(selectedLog.action)}
                  <span>{selectedLog.action}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Ресурс</Label>
                <div className="flex items-center gap-2">
                  {getResourceIcon(selectedLog.resource)}
                  <span>{selectedLog.resource}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">ID ресурса</Label>
                <p className="font-mono">{selectedLog.resourceId}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Статус</Label>
                {getStatusBadge(selectedLog.status)}
              </div>
              <div>
                <Label className="text-sm font-medium">IP адрес</Label>
                <p className="font-mono">{selectedLog.ipAddress}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">User Agent</Label>
                <p className="text-sm text-muted-foreground truncate">{selectedLog.userAgent}</p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Описание</Label>
              <p className="mt-1">{selectedLog.details}</p>
            </div>

            {selectedLog.changes && selectedLog.changes.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Изменения</Label>
                <div className="mt-2 space-y-2">
                  {selectedLog.changes.map((change, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{change.field}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-red-600">- {change.oldValue || "(пусто)"}</span>
                        </div>
                        <div>
                          <span className="text-green-600">+ {change.newValue}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Закрыть
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
