import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { PasswordStrength } from "../ui/password-strength";
import { PasswordGenerator } from "../../utils/passwordGenerator";
import { PasswordHistory } from "./PasswordHistory";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  User, 
  Eye,
  EyeOff,
  Shield,
  Key,
  RefreshCw,
  History
} from "lucide-react";
import { toast } from "sonner";
import { PermissionsManager } from "./PermissionsManager";
import { UserWithPermissions, UserRole, DEFAULT_PERMISSIONS, getPermissionsForRole } from "../../types/permissions";

// Используем расширенный интерфейс с правами доступа
type User = UserWithPermissions;

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      username: "admin",
      login: "admin",
      nickname: "Администратор",
      email: "admin@warehouse.com",
      fullName: "Администратор Системы",
      role: "admin",
      permissions: DEFAULT_PERMISSIONS.admin,
      isActive: true,
      lastLogin: "2024-01-15 10:30",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01"
    },
    {
      id: "2",
      username: "manager",
      login: "manager",
      nickname: "Менеджер",
      email: "manager@warehouse.com",
      fullName: "Менеджер Склада",
      role: "manager",
      permissions: DEFAULT_PERMISSIONS.manager,
      isActive: true,
      lastLogin: "2024-01-15 09:15",
      createdAt: "2024-01-02",
      updatedAt: "2024-01-02"
    },
    {
      id: "3",
      username: "operator",
      login: "operator",
      nickname: "Оператор",
      email: "operator@warehouse.com",
      fullName: "Оператор Склада",
      role: "operator",
      permissions: DEFAULT_PERMISSIONS.operator,
      isActive: true,
      lastLogin: "2024-01-15 08:45",
      createdAt: "2024-01-03",
      updatedAt: "2024-01-03"
    },
    {
      id: "4",
      username: "ivan.petrov",
      login: "ivan.petrov",
      nickname: "Иван",
      email: "ivan.petrov@warehouse.com",
      fullName: "Иван Петров",
      role: "operator",
      permissions: DEFAULT_PERMISSIONS.operator,
      isActive: false,
      lastLogin: "2024-01-10 16:20",
      createdAt: "2024-01-05",
      updatedAt: "2024-01-05"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isPasswordHistoryDialogOpen, setIsPasswordHistoryDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetPassword, setResetPassword] = useState("");

  // Форма нового пользователя
  const [newUser, setNewUser] = useState({
    username: "",
    login: "",
    nickname: "",
    email: "",
    fullName: "",
    role: "operator" as UserRole,
    password: "",
    isActive: true
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Администратор";
      case "manager": return "Менеджер";
      case "operator": return "Оператор";
      case "viewer": return "Просмотрщик";
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "manager": return "default";
      case "operator": return "secondary";
      case "viewer": return "outline";
      default: return "outline";
    }
  };

  const getUserInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getSectionLabel = (section: string): string => {
    const labels: Record<string, string> = {
      equipment: "Оборудование",
      stacks: "Стеки",
      shipments: "Отгрузки",
      categories: "Категории",
      locations: "Местоположения",
      admin: "Администрирование",
      additional: "Дополнительные"
    };
    return labels[section] || section;
  };

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.login || !newUser.nickname || !newUser.email || !newUser.fullName || !newUser.password) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      username: newUser.username,
      login: newUser.login,
      nickname: newUser.nickname,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      permissions: getPermissionsForRole(newUser.role),
      isActive: newUser.isActive,
      lastLogin: "-",
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setUsers([...users, user]);
    setNewUser({
      username: "",
      login: "",
      nickname: "",
      email: "",
      fullName: "",
      role: "operator",
      password: "",
      isActive: true
    });
    setIsCreateDialogOpen(false);
    toast.success("Пользователь успешно создан");
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleManagePermissions = (user: User) => {
    setSelectedUser(user);
    setIsPermissionsDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;

    setUsers(users.map(user => 
      user.id === selectedUser.id ? selectedUser : user
    ));
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    toast.success("Пользователь успешно обновлен");
  };

  const handleUpdatePermissions = (permissions: any) => {
    if (!selectedUser) return;

    const updatedUser = {
      ...selectedUser,
      permissions,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setUsers(users.map(user => 
      user.id === selectedUser.id ? updatedUser : user
    ));
    setSelectedUser(updatedUser);
    toast.success("Права доступа успешно обновлены");
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    ));
    toast.success("Статус пользователя изменен");
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
    toast.success("Пользователь удален");
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setResetPassword("");
    setIsResetPasswordDialogOpen(true);
  };

  const handleConfirmResetPassword = () => {
    if (!selectedUser || !resetPassword) {
      toast.error("Введите новый пароль");
      return;
    }

    // Здесь можно добавить API вызов для сброса пароля
    // Пока просто показываем уведомление
    toast.success(`Пароль для пользователя ${selectedUser.fullName} успешно сброшен`);
    setIsResetPasswordDialogOpen(false);
    setResetPassword("");
    setSelectedUser(null);
  };

  const generatePassword = () => {
    const newPassword = PasswordGenerator.generateStrong();
    setNewUser({ ...newUser, password: newPassword });
    toast.success("Сгенерирован новый пароль");
  };

  const generateResetPassword = () => {
    const newPassword = PasswordGenerator.generateStrong();
    setResetPassword(newPassword);
    toast.success("Сгенерирован новый пароль");
  };

  const handleShowPasswordHistory = (user: User) => {
    setSelectedUser(user);
    setIsPasswordHistoryDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и статистика */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Управление пользователями</h2>
          <p className="text-muted-foreground">
            Создание, редактирование и управление пользователями системы
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Создать пользователя
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Создание нового пользователя</DialogTitle>
              <DialogDescription>
                Заполните информацию для создания нового пользователя системы
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Имя пользователя *</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="ivan.petrov"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login">Логин *</Label>
                  <Input
                    id="login"
                    value={newUser.login}
                    onChange={(e) => setNewUser({ ...newUser, login: e.target.value })}
                    placeholder="ivan.petrov"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">Никнейм *</Label>
                  <Input
                    id="nickname"
                    value={newUser.nickname}
                    onChange={(e) => setNewUser({ ...newUser, nickname: e.target.value })}
                    placeholder="Иван"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="ivan@company.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Полное имя *</Label>
                <Input
                  id="fullName"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  placeholder="Иван Петров"
                />
              </div>
                                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Роль</Label>
                      <Select value={newUser.role} onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Просмотрщик</SelectItem>
                          <SelectItem value="operator">Оператор</SelectItem>
                          <SelectItem value="manager">Менеджер</SelectItem>
                          <SelectItem value="admin">Администратор</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                <div className="space-y-2">
                  <Label>Статус</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      checked={newUser.isActive}
                      onCheckedChange={(checked) => setNewUser({ ...newUser, isActive: checked })}
                    />
                    <Label className="text-sm">
                      {newUser.isActive ? "Активен" : "Неактивен"}
                    </Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Введите пароль"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePassword}
                    className="flex-shrink-0"
                    title="Сгенерировать пароль"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                {newUser.password && (
                  <PasswordStrength password={newUser.password} />
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreateUser}>
                Создать пользователя
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Всего пользователей</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Активных</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.role === "admin").length}
            </div>
            <p className="text-xs text-muted-foreground">Администраторов</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {users.filter(u => u.role === "manager").length}
            </div>
            <p className="text-xs text-muted-foreground">Менеджеров</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {users.filter(u => u.role === "viewer").length}
            </div>
            <p className="text-xs text-muted-foreground">Просмотрщиков</p>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Поиск по имени, email или логину..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Все роли" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все роли</SelectItem>
                <SelectItem value="admin">Администраторы</SelectItem>
                <SelectItem value="manager">Менеджеры</SelectItem>
                <SelectItem value="operator">Операторы</SelectItem>
                <SelectItem value="viewer">Просмотрщики</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Таблица пользователей */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Логин</TableHead>
                <TableHead>Никнейм</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Последний вход</TableHead>
                <TableHead>Создан</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getUserInitials(user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.login}</TableCell>
                  <TableCell>{user.nickname}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role) as any}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={() => handleToggleUserStatus(user.id)}
                      />
                      <span className={`text-sm ${user.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                        {user.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.lastLogin}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.createdAt}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="h-8 w-8 p-0"
                        title="Редактировать пользователя"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleManagePermissions(user)}
                        className="h-8 w-8 p-0"
                        title="Управление правами"
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetPassword(user)}
                        className="h-8 w-8 p-0"
                        title="Сбросить пароль"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShowPasswordHistory(user)}
                        className="h-8 w-8 p-0"
                        title="История паролей"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      {user.role !== "admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Удалить пользователя"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Диалог редактирования */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редактирование пользователя</DialogTitle>
            <DialogDescription>
              Изменение информации о пользователе
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-username">Имя пользователя</Label>
                  <Input
                    id="edit-username"
                    value={selectedUser.username}
                    onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-login">Логин</Label>
                  <Input
                    id="edit-login"
                    value={selectedUser.login}
                    onChange={(e) => setSelectedUser({ ...selectedUser, login: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nickname">Никнейм</Label>
                  <Input
                    id="edit-nickname"
                    value={selectedUser.nickname}
                    onChange={(e) => setSelectedUser({ ...selectedUser, nickname: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Полное имя</Label>
                <Input
                  id="edit-fullName"
                  value={selectedUser.fullName}
                  onChange={(e) => setSelectedUser({ ...selectedUser, fullName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Роль</Label>
                  <Select 
                    value={selectedUser.role} 
                    onValueChange={(value: any) => setSelectedUser({ ...selectedUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                                      <SelectContent>
                    <SelectItem value="viewer">Просмотрщик</SelectItem>
                    <SelectItem value="operator">Оператор</SelectItem>
                    <SelectItem value="manager">Менеджер</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                  </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Статус</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      checked={selectedUser.isActive}
                      onCheckedChange={(checked) => setSelectedUser({ ...selectedUser, isActive: checked })}
                    />
                    <Label className="text-sm">
                      {selectedUser.isActive ? "Активен" : "Неактивен"}
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleUpdateUser}>
              Сохранить изменения
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог управления правами */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Управление правами доступа</DialogTitle>
            <DialogDescription>
              Детальная настройка прав для пользователя: {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <Tabs defaultValue="permissions" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="permissions">Права доступа</TabsTrigger>
                  <TabsTrigger value="summary">Сводка прав</TabsTrigger>
                </TabsList>
                
                <TabsContent value="permissions" className="mt-6">
                  <PermissionsManager
                    userRole={selectedUser.role}
                    currentPermissions={selectedUser.permissions}
                    onPermissionsChange={handleUpdatePermissions}
                    isReadOnly={false}
                  />
                </TabsContent>
                
                <TabsContent value="summary" className="mt-6">
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-3">Информация о пользователе</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Имя:</span> {selectedUser.fullName}
                          </div>
                          <div>
                            <span className="font-medium">Роль:</span> {getRoleLabel(selectedUser.role)}
                          </div>
                          <div>
                            <span className="font-medium">Email:</span> {selectedUser.email}
                          </div>
                          <div>
                            <span className="font-medium">Статус:</span> 
                            <Badge variant={selectedUser.isActive ? "default" : "secondary"} className="ml-2">
                              {selectedUser.isActive ? "Активен" : "Неактивен"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-3">Статистика прав</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(selectedUser.permissions).map(([section, sectionPermissions]) => {
                            if (typeof sectionPermissions === 'object' && sectionPermissions !== null) {
                              const totalPermissions = Object.keys(sectionPermissions).length;
                              const enabledPermissions = Object.values(sectionPermissions).filter(Boolean).length;
                              return (
                                <div key={section} className="text-center">
                                  <div className="text-2xl font-bold text-blue-600">{enabledPermissions}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {getSectionLabel(section)} ({enabledPermissions}/{totalPermissions})
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>
              Закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог сброса пароля */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Сброс пароля пользователя</DialogTitle>
            <DialogDescription>
              Установите новый пароль для пользователя: {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password">Новый пароль *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="reset-password"
                    type={showPassword ? "text" : "password"}
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Введите новый пароль"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateResetPassword}
                  className="flex-shrink-0"
                  title="Сгенерировать пароль"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {resetPassword && (
                <PasswordStrength password={resetPassword} />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleConfirmResetPassword}>
              Сбросить пароль
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог истории паролей */}
      <Dialog open={isPasswordHistoryDialogOpen} onOpenChange={setIsPasswordHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>История паролей пользователя</DialogTitle>
            <DialogDescription>
              История изменений паролей для пользователя: {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <PasswordHistory 
              userId={parseInt(selectedUser.id)} 
              userName={selectedUser.fullName}
              userLogin={selectedUser.login}
              userNickname={selectedUser.nickname}
              isOpen={isPasswordHistoryDialogOpen}
              onClose={() => setIsPasswordHistoryDialogOpen(false)}
            />
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsPasswordHistoryDialogOpen(false)}>
              Закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
