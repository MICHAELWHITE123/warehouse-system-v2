import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { 
  Package, 
  Users, 
  Truck, 
  FolderOpen, 
  MapPin, 
  Settings, 
  FileText
} from "lucide-react";
import { UserPermissions, UserRole, DEFAULT_PERMISSIONS } from "../../types/permissions";
import { toast } from "sonner";

interface PermissionsManagerProps {
  userRole: UserRole;
  currentPermissions: UserPermissions;
  onPermissionsChange: (permissions: UserPermissions) => void;
  isReadOnly?: boolean;
}

export function PermissionsManager({
  userRole,
  currentPermissions,
  onPermissionsChange,
  isReadOnly = false
}: PermissionsManagerProps) {
  const [permissions, setPermissions] = useState<UserPermissions>(currentPermissions);

  const handlePermissionChange = (
    section: keyof UserPermissions,
    action: string,
    value: boolean
  ) => {
    const newPermissions = {
      ...permissions,
      [section]: {
        ...permissions[section],
        [action]: value
      }
    } as UserPermissions;
    
    setPermissions(newPermissions);
    onPermissionsChange(newPermissions);
  };

  const resetToDefault = () => {
    const defaultPerms = DEFAULT_PERMISSIONS[userRole];
    setPermissions(defaultPerms);
    onPermissionsChange(defaultPerms);
    toast.success("Права сброшены к значениям по умолчанию для роли");
  };

  const applyToAll = (section: keyof UserPermissions, value: boolean) => {
    const sectionPermissions = permissions[section];
    if (typeof sectionPermissions === 'object' && sectionPermissions !== null) {
      const newSectionPermissions = Object.keys(sectionPermissions).reduce((acc, key) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, boolean>);
      
      const newPermissions = {
        ...permissions,
        [section]: newSectionPermissions
      } as UserPermissions;
      
      setPermissions(newPermissions);
      onPermissionsChange(newPermissions);
      toast.success(`Все права в разделе "${getSectionLabel(section)}" установлены в ${value ? 'включено' : 'выключено'}`);
    }
  };

  const getSectionLabel = (section: keyof UserPermissions): string => {
    const labels: Record<keyof UserPermissions, string> = {
      equipment: "Оборудование",
      stacks: "Стеки",
      shipments: "Отгрузки",
      categories: "Категории",
      locations: "Местоположения",
      admin: "Администрирование",
      additional: "Дополнительные"
    };
    return labels[section];
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      view: "Просмотр",
      create: "Создание",
      edit: "Редактирование",
      delete: "Удаление",
      export: "Экспорт",
      approve: "Утверждение",
      userManagement: "Управление пользователями",
      systemSettings: "Настройки системы",
      auditLogs: "Журналы аудита",
      statistics: "Статистика",
      qrScanning: "QR-сканирование",
      pdfExport: "PDF экспорт",
      bulkOperations: "Массовые операции",
      dataImport: "Импорт данных"
    };
    return labels[action] || action;
  };

  const getSectionIcon = (section: keyof UserPermissions) => {
    const icons: Record<keyof UserPermissions, any> = {
      equipment: Package,
      stacks: Users,
      shipments: Truck,
      categories: FolderOpen,
      locations: MapPin,
      admin: Settings,
      additional: FileText
    };
    return icons[section];
  };

  const renderPermissionSection = (
    section: keyof UserPermissions,
    sectionPermissions: any
  ) => {
    const IconComponent = getSectionIcon(section);
    
    return (
      <Card key={section} className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconComponent className="h-5 w-5" />
              <CardTitle className="text-lg">{getSectionLabel(section)}</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyToAll(section, true)}
                disabled={isReadOnly}
              >
                Все включить
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyToAll(section, false)}
                disabled={isReadOnly}
              >
                Все выключить
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(sectionPermissions).map(([action, value]) => (
              <div key={action} className="flex items-center space-x-3">
                <Switch
                  checked={value as boolean}
                  onCheckedChange={(checked) => 
                    handlePermissionChange(section, action, checked)
                  }
                  disabled={isReadOnly}
                />
                <Label className="text-sm font-medium">
                  {getActionLabel(action)}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Управление правами доступа</h3>
          <p className="text-sm text-muted-foreground">
            Настройка детальных прав для роли: <Badge variant="outline">{userRole}</Badge>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={resetToDefault}
            disabled={isReadOnly}
          >
            Сбросить к умолчанию
          </Button>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6">
        {Object.entries(permissions).map(([section, sectionPermissions]) =>
          renderPermissionSection(section as keyof UserPermissions, sectionPermissions)
        )}
      </div>

      {isReadOnly && (
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Режим просмотра. Для изменения прав обратитесь к администратору.
          </p>
        </div>
      )}
    </div>
  );
}
