import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  Settings,
  Shield,
  Database,
  Mail,
  Bell,
  Download,
  Upload,
  RotateCcw,
  Save,
  AlertTriangle,
  CheckCircle,
  Globe,
  Lock
} from "lucide-react";
import { toast } from "sonner";

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    timezone: string;
    language: string;
    maintenanceMode: boolean;
    allowRegistration: boolean;
  };
  security: {
    sessionTimeout: number;
    passwordMinLength: number;
    requireSpecialChars: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number;
    twoFactorAuth: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    systemAlerts: boolean;
    maintenanceReminders: boolean;
    lowStockAlerts: boolean;
    smtpServer: string;
    smtpPort: number;
    smtpUsername: string;
    smtpSsl: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
    retentionDays: number;
    backupLocation: string;
    lastBackup: string;
  };
}

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: "Система учета техники",
      siteDescription: "Складской учет оборудования и техники",
      timezone: "Europe/Moscow",
      language: "ru",
      maintenanceMode: false,
      allowRegistration: false
    },
    security: {
      sessionTimeout: 480, // 8 часов в минутах
      passwordMinLength: 8,
      requireSpecialChars: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15, // в минутах
      twoFactorAuth: false
    },
    notifications: {
      emailNotifications: true,
      systemAlerts: true,
      maintenanceReminders: true,
      lowStockAlerts: true,
      smtpServer: "smtp.gmail.com",
      smtpPort: 587,
      smtpUsername: "",
      smtpSsl: true
    },
    backup: {
      autoBackup: true,
      backupFrequency: "daily",
      retentionDays: 30,
      backupLocation: "/backup/warehouse",
      lastBackup: "2024-01-15 02:00:00"
    }
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = (section: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Здесь будет вызов API для сохранения настроек
    console.log("Saving settings:", settings);
    setHasChanges(false);
    toast.success("Настройки успешно сохранены");
  };

  const handleReset = () => {
    // Сброс к значениям по умолчанию или последним сохраненным
    setHasChanges(false);
    toast.info("Настройки сброшены");
  };

  const handleBackupNow = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: "Создание резервной копии...",
        success: "Резервная копия создана успешно",
        error: "Ошибка при создании резервной копии"
      }
    );
  };

  const handleTestEmail = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: "Отправка тестового письма...",
        success: "Тестовое письмо отправлено",
        error: "Ошибка отправки письма"
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Системные настройки</h2>
          <p className="text-muted-foreground">
            Конфигурация и управление системными параметрами
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Сбросить
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Сохранить изменения
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Общие
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Безопасность
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Уведомления
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Резервные копии
          </TabsTrigger>
        </TabsList>

        {/* Общие настройки */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Основные параметры
              </CardTitle>
              <CardDescription>
                Основная информация о системе и локализация
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Название системы</Label>
                  <Input
                    id="siteName"
                    value={settings.general.siteName}
                    onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Часовой пояс</Label>
                  <Select
                    value={settings.general.timezone}
                    onValueChange={(value) => updateSetting('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Moscow">Москва (UTC+3)</SelectItem>
                      <SelectItem value="Europe/Kiev">Киев (UTC+2)</SelectItem>
                      <SelectItem value="Asia/Almaty">Алматы (UTC+6)</SelectItem>
                      <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Описание системы</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.general.siteDescription}
                  onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Язык интерфейса</Label>
                  <Select
                    value={settings.general.language}
                    onValueChange={(value) => updateSetting('general', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="uk">Українська</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Режим обслуживания</Label>
                    <p className="text-sm text-muted-foreground">
                      Временно отключить доступ к системе для всех пользователей
                    </p>
                  </div>
                  <Switch
                    checked={settings.general.maintenanceMode}
                    onCheckedChange={(checked) => updateSetting('general', 'maintenanceMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Разрешить регистрацию</Label>
                    <p className="text-sm text-muted-foreground">
                      Позволить новым пользователям самостоятельно регистрироваться
                    </p>
                  </div>
                  <Switch
                    checked={settings.general.allowRegistration}
                    onCheckedChange={(checked) => updateSetting('general', 'allowRegistration', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Настройки безопасности */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Параметры безопасности
              </CardTitle>
              <CardDescription>
                Настройки аутентификации и защиты системы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Время сессии (минуты)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Автоматический выход через {Math.floor(settings.security.sessionTimeout / 60)} ч {settings.security.sessionTimeout % 60} мин
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Минимальная длина пароля</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    max="32"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Максимум попыток входа</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="3"
                    max="10"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration">Блокировка на (минуты)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    min="5"
                    max="60"
                    value={settings.security.lockoutDuration}
                    onChange={(e) => updateSetting('security', 'lockoutDuration', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Требовать специальные символы в пароле</Label>
                    <p className="text-sm text-muted-foreground">
                      Пароль должен содержать цифры и специальные символы
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.requireSpecialChars}
                    onCheckedChange={(checked) => updateSetting('security', 'requireSpecialChars', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Двухфакторная аутентификация</Label>
                    <p className="text-sm text-muted-foreground">
                      Дополнительная защита через SMS или приложение
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">В разработке</Badge>
                    <Switch
                      checked={settings.security.twoFactorAuth}
                      onCheckedChange={(checked) => updateSetting('security', 'twoFactorAuth', checked)}
                      disabled
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Настройки уведомлений */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email уведомления
              </CardTitle>
              <CardDescription>
                Настройка SMTP сервера и типов уведомлений
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email уведомления</Label>
                    <p className="text-sm text-muted-foreground">
                      Отправка уведомлений по электронной почте
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Системные оповещения</Label>
                    <p className="text-sm text-muted-foreground">
                      Уведомления о системных событиях и ошибках
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.systemAlerts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'systemAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Напоминания о обслуживании</Label>
                    <p className="text-sm text-muted-foreground">
                      Уведомления о необходимом техобслуживании
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.maintenanceReminders}
                    onCheckedChange={(checked) => updateSetting('notifications', 'maintenanceReminders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Оповещения о низких запасах</Label>
                    <p className="text-sm text-muted-foreground">
                      Уведомления когда оборудование заканчивается
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.lowStockAlerts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'lowStockAlerts', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Настройки SMTP сервера</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpServer">SMTP сервер</Label>
                    <Input
                      id="smtpServer"
                      value={settings.notifications.smtpServer}
                      onChange={(e) => updateSetting('notifications', 'smtpServer', e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">Порт</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={settings.notifications.smtpPort}
                      onChange={(e) => updateSetting('notifications', 'smtpPort', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">Имя пользователя</Label>
                  <Input
                    id="smtpUsername"
                    value={settings.notifications.smtpUsername}
                    onChange={(e) => updateSetting('notifications', 'smtpUsername', e.target.value)}
                    placeholder="your-email@gmail.com"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Использовать SSL/TLS</Label>
                    <p className="text-sm text-muted-foreground">
                      Шифрование соединения с SMTP сервером
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.smtpSsl}
                    onCheckedChange={(checked) => updateSetting('notifications', 'smtpSsl', checked)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleTestEmail}>
                    <Mail className="h-4 w-4 mr-2" />
                    Отправить тестовое письмо
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Настройки резервного копирования */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Резервное копирование
              </CardTitle>
              <CardDescription>
                Настройка автоматического создания резервных копий
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Последняя резервная копия</p>
                    <p className="text-sm text-muted-foreground">{settings.backup.lastBackup}</p>
                  </div>
                </div>
                <Button onClick={handleBackupNow}>
                  <Download className="h-4 w-4 mr-2" />
                  Создать сейчас
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Автоматическое резервное копирование</Label>
                    <p className="text-sm text-muted-foreground">
                      Регулярное создание резервных копий по расписанию
                    </p>
                  </div>
                  <Switch
                    checked={settings.backup.autoBackup}
                    onCheckedChange={(checked) => updateSetting('backup', 'autoBackup', checked)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">Частота копирования</Label>
                    <Select
                      value={settings.backup.backupFrequency}
                      onValueChange={(value) => updateSetting('backup', 'backupFrequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Каждый час</SelectItem>
                        <SelectItem value="daily">Ежедневно</SelectItem>
                        <SelectItem value="weekly">Еженедельно</SelectItem>
                        <SelectItem value="monthly">Ежемесячно</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retentionDays">Хранить (дней)</Label>
                    <Input
                      id="retentionDays"
                      type="number"
                      min="1"
                      max="365"
                      value={settings.backup.retentionDays}
                      onChange={(e) => updateSetting('backup', 'retentionDays', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backupLocation">Папка для резервных копий</Label>
                  <Input
                    id="backupLocation"
                    value={settings.backup.backupLocation}
                    onChange={(e) => updateSetting('backup', 'backupLocation', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Операции с данными</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Download className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Экспорт данных</p>
                          <p className="text-sm text-muted-foreground">Скачать полную копию</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full">
                        Экспортировать
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Upload className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Импорт данных</p>
                          <p className="text-sm text-muted-foreground">Восстановить из копии</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full">
                        Импортировать
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-900 dark:text-orange-100">
                        Важно
                      </p>
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        Регулярно проверяйте резервные копии на целостность. 
                        Храните копии в нескольких местах для максимальной безопасности.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
