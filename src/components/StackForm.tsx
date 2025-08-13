import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { X, Plus, Search, Package, ArrowLeft } from "lucide-react";
import { Equipment } from "./EquipmentList";
import { EquipmentStack } from "./StackManagement";
import { toast } from "sonner";

interface StackFormProps {
  stack?: EquipmentStack;
  equipment: Equipment[];
  onSave: (stack: Omit<EquipmentStack, 'id'>) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export function StackForm({
  stack,
  equipment,
  onSave,
  onCancel,
  isEditing
}: StackFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    equipmentIds: [] as string[],
    tags: [] as string[],
    createdBy: "admin" // В реальном приложении получать из контекста пользователя
  });

  const [newTag, setNewTag] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Инициализация формы при редактировании
  useEffect(() => {
    if (stack && isEditing) {
      setFormData({
        name: stack.name,
        description: stack.description,
        equipmentIds: stack.equipmentIds,
        tags: stack.tags,
        createdBy: stack.createdBy
      });
    }
  }, [stack, isEditing]);

  // Получаем доступное оборудование (исключаем уже используемое в других стеках)
  const availableEquipment = equipment.filter(item => {
    // Если редактируем стек, показываем его текущее оборудование
    if (isEditing && stack && stack.equipmentIds.includes(item.id)) {
      return true;
    }
    // Показываем только доступное оборудование
    return item.status === "available";
  });

  // Фильтруем оборудование по поиску и категории
  const filteredEquipment = availableEquipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Получаем уникальные категории
  const categories = Array.from(new Set(availableEquipment.map(item => item.category)));

  // Получаем выбранное оборудование
  const selectedEquipment = equipment.filter(item => formData.equipmentIds.includes(item.id));

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleEquipmentToggle = (equipmentId: string) => {
    setFormData(prev => ({
      ...prev,
      equipmentIds: prev.equipmentIds.includes(equipmentId)
        ? prev.equipmentIds.filter(id => id !== equipmentId)
        : [...prev.equipmentIds, equipmentId]
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Название стека обязательно";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Описание стека обязательно";
    }

    if (formData.equipmentIds.length === 0) {
      newErrors.equipment = "Выберите хотя бы одну единицу техники";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Пожалуйста, исправьте ошибки в форме");
      return;
    }

    const stackData: Omit<EquipmentStack, 'id'> = {
      ...formData,
      createdAt: stack?.createdAt || new Date().toISOString()
    };

    onSave(stackData);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? "Редактировать стек" : "Создать новый стек"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Измените параметры стека техники" : "Создайте новый стек для группировки оборудования"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка - Основная информация */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
                <CardDescription>
                  Укажите название и описание стека
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Название стека *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Например: Комплект разработчика"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Описание *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Опишите назначение и состав стека"
                    rows={3}
                    className={errors.description ? "border-red-500" : ""}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Теги */}
                <div>
                  <Label htmlFor="tags">Теги</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="tags"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Добавить тег"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                    />
                    <Button type="button" onClick={handleAddTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Статистика выбранного оборудования */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Выбранное оборудование
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Единиц техники:</span>
                    <span className="font-semibold">{selectedEquipment.length}</span>
                  </div>
                  {errors.equipment && (
                    <p className="text-sm text-red-500">{errors.equipment}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Правая колонка - Выбор оборудования */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Выбор оборудования</CardTitle>
                <CardDescription>
                  Выберите технику для включения в стек
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Поиск и фильтры */}
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Поиск по названию, серийному номеру или категории..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="all">Все категории</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Список оборудования */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredEquipment.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchTerm || selectedCategory !== "all" 
                        ? "Оборудование не найдено" 
                        : "Нет доступного оборудования"
                      }
                    </div>
                  ) : (
                    filteredEquipment.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          checked={formData.equipmentIds.includes(item.id)}
                          onCheckedChange={() => handleEquipmentToggle(item.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{item.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {item.status === "available" ? "Доступно" : 
                               item.status === "in-use" ? "Используется" : "Обслуживание"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.category} • {item.serialNumber} • {item.location}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit">
            {isEditing ? "Сохранить изменения" : "Создать стек"}
          </Button>
        </div>
      </form>
    </div>
  );
}