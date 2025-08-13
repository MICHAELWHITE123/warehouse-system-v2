import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CheckCircle2, Circle, Plus, Trash2, Edit, AlertTriangle, User, Clock } from "lucide-react";
import { ChecklistItem } from "./ShipmentList";
import { toast } from "sonner";

interface ShipmentChecklistProps {
  checklist: ChecklistItem[];
  onChecklistChange: (checklist: ChecklistItem[]) => void;
  isEditable?: boolean;
  responsiblePersons?: string[];
}

const defaultTemplates = [
  {
    name: "Стандартная погрузка",
    items: [
      { title: "Проверить упаковку оборудования", description: "Убедиться в целостности упаковки", isRequired: true },
      { title: "Сверить серийные номера", description: "Проверить соответствие серийных номеров", isRequired: true },
      { title: "Проверить комплектность", description: "Убедиться в наличии всех комплектующих", isRequired: true },
      { title: "Загрузить в транспорт", description: "Аккуратно разместить в транспортном средстве", isRequired: true },
      { title: "Закрепить груз", description: "Обеспечить надежное крепление груза", isRequired: true },
      { title: "Оформить документы", description: "Заполнить необходимые документы", isRequired: true }
    ]
  },
  {
    name: "Хрупкое оборудование",
    items: [
      { title: "Проверить специальную упаковку", description: "Убедиться в защите от ударов", isRequired: true },
      { title: "Нанести маркировку 'Хрупкое'", description: "Пометить груз соответствующими знаками", isRequired: true },
      { title: "Проверить температурный режим", description: "Убедиться в соблюдении температуры", isRequired: false },
      { title: "Использовать мягкие крепления", description: "Избежать жестких креплений", isRequired: true },
      { title: "Инструктаж водителя", description: "Провести инструктаж по осторожной перевозке", isRequired: true }
    ]
  },
  {
    name: "IT-оборудование",
    items: [
      { title: "Проверить антистатическую упаковку", description: "Убедиться в защите от статики", isRequired: true },
      { title: "Создать резервную копию данных", description: "Сохранить важные данные (если применимо)", isRequired: false },
      { title: "Отключить от сети", description: "Безопасно отключить все соединения", isRequired: true },
      { title: "Упаковать кабели отдельно", description: "Аккуратно упаковать все кабели", isRequired: true },
      { title: "Проверить целостность портов", description: "Убедиться в отсутствии повреждений", isRequired: true }
    ]
  }
];

export function ShipmentChecklist({ 
  checklist, 
  onChecklistChange, 
  isEditable = true,
  responsiblePersons = []
}: ShipmentChecklistProps) {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    isRequired: true
  });

  const completedItems = checklist.filter(item => item.isCompleted).length;
  const progress = checklist.length > 0 ? (completedItems / checklist.length) * 100 : 0;
  const requiredItems = checklist.filter(item => item.isRequired);
  const completedRequiredItems = requiredItems.filter(item => item.isCompleted).length;

  const handleToggleItem = (itemId: string, completedBy?: string) => {
    const updatedChecklist = checklist.map(item => {
      if (item.id === itemId) {
        const isCompleted = !item.isCompleted;
        return {
          ...item,
          isCompleted,
          completedBy: isCompleted ? (completedBy || "Текущий пользователь") : undefined,
          completedAt: isCompleted ? new Date().toISOString() : undefined
        };
      }
      return item;
    });
    onChecklistChange(updatedChecklist);
    
    const item = checklist.find(i => i.id === itemId);
    if (item && !item.isCompleted) {
      toast.success(`Пункт "${item.title}" отмечен как выполненный`);
    }
  };

  const handleAddItem = () => {
    if (!newItem.title.trim()) {
      toast.error("Название пункта обязательно");
      return;
    }

    const item: ChecklistItem = {
      id: Date.now().toString(),
      title: newItem.title,
      description: newItem.description || undefined,
      isCompleted: false,
      isRequired: newItem.isRequired
    };

    onChecklistChange([...checklist, item]);
    setNewItem({ title: "", description: "", isRequired: true });
    setIsAddItemOpen(false);
    toast.success("Пункт добавлен в чек-лист");
  };

  const handleEditItem = (item: ChecklistItem) => {
    setEditingItem(item);
    setNewItem({
      title: item.title,
      description: item.description || "",
      isRequired: item.isRequired
    });
    setIsAddItemOpen(true);
  };

  const handleUpdateItem = () => {
    if (!editingItem || !newItem.title.trim()) return;

    const updatedChecklist = checklist.map(item => 
      item.id === editingItem.id 
        ? { 
            ...item, 
            title: newItem.title,
            description: newItem.description || undefined,
            isRequired: newItem.isRequired
          }
        : item
    );

    onChecklistChange(updatedChecklist);
    setEditingItem(null);
    setNewItem({ title: "", description: "", isRequired: true });
    setIsAddItemOpen(false);
    toast.success("Пункт обновлен");
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedChecklist = checklist.filter(item => item.id !== itemId);
    onChecklistChange(updatedChecklist);
    toast.success("Пункт удален из чек-листа");
  };

  const handleLoadTemplate = (templateName: string) => {
    const template = defaultTemplates.find(t => t.name === templateName);
    if (!template) return;

    const templateItems: ChecklistItem[] = template.items.map((item, index) => ({
      id: `template-${Date.now()}-${index}`,
      title: item.title,
      description: item.description,
      isCompleted: false,
      isRequired: item.isRequired
    }));

    onChecklistChange([...checklist, ...templateItems]);
    toast.success(`Загружен шаблон "${templateName}"`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const canProceed = requiredItems.length === 0 || completedRequiredItems === requiredItems.length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Чек-лист погрузки
            </CardTitle>
            {isEditable && (
              <div className="flex gap-2">
                <Select onValueChange={handleLoadTemplate}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Загрузить шаблон" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultTemplates.map(template => (
                      <SelectItem key={template.name} value={template.name}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить пункт
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingItem ? "Редактирование пункта" : "Добавление пункта"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingItem ? "Изменить данные пункта чек-листа" : "Создать новый пункт для проверки"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Название пункта *</Label>
                        <Input
                          id="title"
                          value={newItem.title}
                          onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Например: Проверить упаковку оборудования"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Описание</Label>
                        <Textarea
                          id="description"
                          value={newItem.description}
                          onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Дополнительные детали или инструкции..."
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="required"
                          checked={newItem.isRequired}
                          onCheckedChange={(checked) => setNewItem(prev => ({ ...prev, isRequired: !!checked }))}
                        />
                        <Label htmlFor="required" className="text-sm">
                          Обязательный пункт
                        </Label>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={editingItem ? handleUpdateItem : handleAddItem}
                          className="flex-1"
                        >
                          {editingItem ? "Сохранить" : "Добавить"}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsAddItemOpen(false);
                            setEditingItem(null);
                            setNewItem({ title: "", description: "", isRequired: true });
                          }}
                        >
                          Отмена
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
          
          {/* Прогресс выполнения */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Прогресс выполнения</span>
              <span>{completedItems}/{checklist.length} пунктов</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {requiredItems.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                {canProceed ? (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Все обязательные пункты выполнены</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      Выполнено {completedRequiredItems}/{requiredItems.length} обязательных пунктов
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {checklist.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Чек-лист пуст</p>
              <p className="text-sm">Добавьте пункты для проверки или загрузите шаблон</p>
            </div>
          ) : (
            <div className="space-y-3">
              {checklist.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    item.isCompleted 
                      ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' 
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Checkbox
                      checked={item.isCompleted}
                      onCheckedChange={() => handleToggleItem(item.id)}
                      disabled={!isEditable}
                      className="mt-0.5"
                    />
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${item.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {item.title}
                        </h4>
                        {item.isRequired && (
                          <Badge variant="secondary" className="text-xs">
                            Обязательно
                          </Badge>
                        )}
                      </div>
                      
                      {item.description && (
                        <p className={`text-sm text-muted-foreground mt-1 ${item.isCompleted ? 'line-through' : ''}`}>
                          {item.description}
                        </p>
                      )}
                      
                      {item.isCompleted && item.completedBy && (
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{item.completedBy}</span>
                          </div>
                          {item.completedAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(item.completedAt)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isEditable && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                        title="Редактировать"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}