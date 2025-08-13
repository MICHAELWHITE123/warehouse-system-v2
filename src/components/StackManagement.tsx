import { useState } from "react";
import { Plus, Package, Edit, Trash2, Eye, Search, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { Equipment } from "./EquipmentList";
import { toast } from "sonner";

export interface EquipmentStack {
  id: string;
  name: string;
  description: string;
  equipmentIds: string[];
  createdAt: string;
  createdBy: string;
  tags: string[];
}

interface StackManagementProps {
  stacks: EquipmentStack[];
  equipment: Equipment[];
  onStacksChange: (stacks: EquipmentStack[]) => void;
  onCreateStack: () => void;
  onEditStack: (stack: EquipmentStack) => void;
}

export function StackManagement({
  stacks,
  equipment,
  onStacksChange,
  onCreateStack,
  onEditStack
}: StackManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStack, setSelectedStack] = useState<EquipmentStack | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Фильтруем стеки по поисковому запросу
  const filteredStacks = stacks.filter(stack =>
    stack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stack.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stack.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Получаем оборудование для стека
  const getStackEquipment = (stack: EquipmentStack) => {
    return equipment.filter(item => stack.equipmentIds.includes(item.id));
  };

  // Проверяем доступность стека (все ли единицы техники доступны)
  const isStackAvailable = (stack: EquipmentStack) => {
    const stackEquipment = getStackEquipment(stack);
    return stackEquipment.every(item => item.status === "available");
  };

  // Получаем статус стека
  const getStackStatus = (stack: EquipmentStack) => {
    const stackEquipment = getStackEquipment(stack);
    if (stackEquipment.length === 0) return "empty";
    
    const availableCount = stackEquipment.filter(item => item.status === "available").length;
    const inUseCount = stackEquipment.filter(item => item.status === "in-use").length;
    const maintenanceCount = stackEquipment.filter(item => item.status === "maintenance").length;

    if (availableCount === stackEquipment.length) return "available";
    if (inUseCount > 0) return "partial-use";
    if (maintenanceCount > 0) return "maintenance";
    return "mixed";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Доступен</Badge>;
      case "partial-use":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Частично используется</Badge>;
      case "maintenance":
        return <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Обслуживание</Badge>;
      case "mixed":
        return <Badge variant="outline">Смешанный статус</Badge>;
      case "empty":
        return <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">Пустой</Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  const handleDeleteStack = (stackId: string) => {
    const updatedStacks = stacks.filter(stack => stack.id !== stackId);
    onStacksChange(updatedStacks);
    toast.success("Стек успешно удален");
  };

  const handleViewStack = (stack: EquipmentStack) => {
    setSelectedStack(stack);
    setIsViewDialogOpen(true);
  };

  // Статистика
  const totalStacks = stacks.length;
  const availableStacks = stacks.filter(stack => getStackStatus(stack) === "available").length;
  const totalEquipmentInStacks = stacks.reduce((total, stack) => total + stack.equipmentIds.length, 0);

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка создания */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Управление стеками</h1>
          <p className="text-muted-foreground mt-2">
            Создавайте и управляйте стеками техники для удобной организации оборудования
          </p>
        </div>
        <Button onClick={onCreateStack} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Создать стек
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Всего стеков</p>
                <p className="text-2xl font-bold">{totalStacks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Доступных стеков</p>
                <p className="text-2xl font-bold">{availableStacks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Единиц в стеках</p>
                <p className="text-2xl font-bold">{totalEquipmentInStacks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Поиск */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Поиск стеков..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Список стеков */}
      {filteredStacks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {stacks.length === 0 ? "Стеки не созданы" : "Стеки не найдены"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {stacks.length === 0 
                ? "Создайте свой первый стек техники для удобной организации оборудования"
                : "Попробуйте изменить поисковый запрос"
              }
            </p>
            {stacks.length === 0 && (
              <Button onClick={onCreateStack} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Создать первый стек
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStacks.map((stack) => {
            const stackEquipment = getStackEquipment(stack);
            const stackStatus = getStackStatus(stack);

            return (
              <Card key={stack.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{stack.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {stack.description}
                      </CardDescription>
                    </div>
                    {getStatusBadge(stackStatus)}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Информация о стеке */}
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Единиц техники</p>
                        <p className="font-semibold">{stackEquipment.length}</p>
                      </div>
                    </div>

                    {/* Теги */}
                    {stack.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {stack.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {stack.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{stack.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Краткий список оборудования */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Оборудование:</p>
                      <div className="space-y-1">
                        {stackEquipment.slice(0, 2).map((item) => (
                          <div key={item.id} className="text-xs flex items-center justify-between">
                            <span className="truncate">{item.name}</span>
                            <Badge variant="outline" className="text-xs ml-2">
                              {item.status === "available" ? "Доступно" : 
                               item.status === "in-use" ? "Используется" : "Обслуживание"}
                            </Badge>
                          </div>
                        ))}
                        {stackEquipment.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{stackEquipment.length - 2} единиц
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewStack(stack)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditStack(stack)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteStack(stack.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(stack.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Диалог просмотра стека */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {selectedStack?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedStack?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedStack && (
            <div className="space-y-4">
              {/* Информация о стеке */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Статус</p>
                  {getStatusBadge(getStackStatus(selectedStack))}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Единиц техники</p>
                  <p className="font-semibold">{getStackEquipment(selectedStack).length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Создан</p>
                  <p>{new Date(selectedStack.createdAt).toLocaleDateString('ru-RU')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Автор</p>
                  <p>{selectedStack.createdBy}</p>
                </div>
              </div>

              {/* Теги */}
              {selectedStack.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Теги</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStack.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Список оборудования */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Оборудование ({getStackEquipment(selectedStack).length} единиц)
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {getStackEquipment(selectedStack).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.category} • {item.serialNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {item.status === "available" ? "Доступно" : 
                           item.status === "in-use" ? "Используется" : "Обслуживание"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Предупреждения */}
              {getStackEquipment(selectedStack).length === 0 && (
                <Alert>
                  <AlertDescription>
                    В этом стеке нет оборудования. Добавьте технику через редактирование стека.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}