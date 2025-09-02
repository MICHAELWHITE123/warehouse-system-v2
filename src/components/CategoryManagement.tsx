import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Plus, Edit, Trash2, Save, X, FolderOpen, Tags } from "lucide-react";
import { toast } from "sonner";
import { CategoryService } from "../database/services/categoryService";
import type { DbCategory } from "../database/types";

interface CategoryManagementProps {
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

export function CategoryManagement({ categories, onCategoriesChange }: CategoryManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<DbCategory | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryService = new CategoryService();

  // Загружаем категории из базы данных
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    try {
      setError(null);
      const categories = categoryService.getAllCategories();
      setDbCategories(categories);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setError(errorMessage);
      toast.error('Ошибка загрузки категорий из базы данных');
    }
  };

  const validateCategoryName = (name: string, isEditing = false, originalName = "") => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return "Название категории не может быть пустым";
    }
    
    if (trimmedName.length < 2) {
      return "Название категории должно содержать минимум 2 символа";
    }
    
    if (trimmedName.length > 50) {
      return "Название категории не должно превышать 50 символов";
    }
    
    // Проверяем на дублирование только если это не редактирование той же категории
    if (isEditing && trimmedName === originalName) {
      return "";
    }
    
    // Проверяем на дублирование (регистронезависимо)
    const existingCategory = dbCategories.find(cat => 
      cat.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (existingCategory) {
      if (isEditing) {
        // При редактировании проверяем, что это не та же самая категория
        const currentCategory = dbCategories.find(cat => 
          cat.name.toLowerCase() === originalName.toLowerCase()
        );
        if (currentCategory && currentCategory.id === existingCategory.id) {
          return "";
        }
      }
      return "Категория с таким названием уже существует";
    }
    
    return "";
  };

  const handleAddCategory = async () => {
    const error = validateCategoryName(newCategoryName);
    
    if (error) {
      setErrors({ add: error });
      return;
    }
    
    // Проверяем, не существует ли уже категория с таким именем (регистронезависимо)
    const trimmedName = newCategoryName.trim();
    const existingCategoryCaseInsensitive = dbCategories.find(cat => 
      cat.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existingCategoryCaseInsensitive) {
      setErrors({ add: "Категория с таким названием уже существует" });
      return;
    }
    
    setIsLoading(true);
    try {
      const trimmedName = newCategoryName.trim();
      categoryService.createCategory({
        name: trimmedName,
        description: ""
      });
      
      setNewCategoryName("");
      setIsAddDialogOpen(false);
      setErrors({});
      
      // Перезагружаем категории и обновляем родительский компонент
      categoryService.refreshData();
      loadCategories();
      onCategoriesChange([...categories, trimmedName]);
      
      toast.success(`Категория "${trimmedName}" успешно добавлена`);
    } catch (error) {
      console.error('Ошибка создания категории:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      toast.error(`Ошибка создания категории: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory) return;
    
    // Проверяем, существует ли категория
    const existingCategory = categoryService.getCategoryById(editingCategory.id);
    if (!existingCategory) {
      toast.error(`Категория "${editingCategory.name}" не найдена`);
      setEditingCategory(null);
      setEditCategoryName("");
      setIsEditDialogOpen(false);
      loadCategories(); // Перезагружаем список категорий
      return;
    }
    
    const error = validateCategoryName(editCategoryName, true, editingCategory.name);
    
    if (error) {
      setErrors({ edit: error });
      return;
    }
    
    // Проверяем, не существует ли уже категория с таким именем (регистронезависимо)
    const trimmedName = editCategoryName.trim();
    const existingCategoryCaseInsensitive = dbCategories.find(cat => 
      cat.id !== editingCategory.id && cat.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existingCategoryCaseInsensitive) {
      setErrors({ edit: "Категория с таким названием уже существует" });
      return;
    }
    
    setIsLoading(true);
    try {
      const trimmedName = editCategoryName.trim();
      const updatedCategory = categoryService.updateCategory(editingCategory.id, {
        name: trimmedName,
        description: editingCategory.description || ""
      });
      
      if (updatedCategory) {
        setEditingCategory(null);
        setEditCategoryName("");
        setIsEditDialogOpen(false);
        setErrors({});
        
        // Перезагружаем категории и обновляем родительский компонент
        categoryService.refreshData();
        loadCategories();
        const updatedCategories = categories.map(cat => 
          cat === editingCategory.name ? trimmedName : cat
        );
        onCategoriesChange(updatedCategories);
        
        toast.success(`Категория переименована в "${trimmedName}"`);
      } else {
        toast.error('Ошибка обновления категории');
      }
    } catch (error) {
      console.error('Ошибка обновления категории:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      toast.error(`Ошибка обновления категории: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryToDelete: DbCategory) => {
    // Проверяем, существует ли категория
    const existingCategory = categoryService.getCategoryById(categoryToDelete.id);
    if (!existingCategory) {
      toast.error(`Категория "${categoryToDelete.name}" не найдена`);
      loadCategories(); // Перезагружаем список категорий
      return;
    }
    
    const count = categoryService.getEquipmentCountByCategory(categoryToDelete.id);
    
    if (count > 0) {
      toast.error(`Невозможно удалить категорию "${categoryToDelete.name}". В ней находится ${count} единиц оборудования.`);
      return;
    }
    
    setIsLoading(true);
    try {
      const success = categoryService.deleteCategory(categoryToDelete.id);
      
      if (success) {
        // Перезагружаем категории и обновляем родительский компонент
        categoryService.refreshData();
        loadCategories();
        const updatedCategories = categories.filter(cat => cat !== categoryToDelete.name);
        onCategoriesChange(updatedCategories);
        
        toast.success(`Категория "${categoryToDelete.name}" успешно удалена`);
      } else {
        toast.error('Ошибка удаления категории');
      }
    } catch (error) {
      console.error('Ошибка удаления категории:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      toast.error(`Ошибка удаления категории: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditCategory = (category: DbCategory) => {
    // Проверяем, существует ли категория
    const existingCategory = categoryService.getCategoryById(category.id);
    if (!existingCategory) {
      toast.error(`Категория "${category.name}" не найдена`);
      loadCategories(); // Перезагружаем список категорий
      return;
    }
    
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setIsEditDialogOpen(true);
    setErrors({});
  };

  const handleAddDialogClose = () => {
    setIsAddDialogOpen(false);
    setNewCategoryName("");
    setErrors({});
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditingCategory(null);
    setEditCategoryName("");
    setErrors({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Управление категориями
          </h2>
          <p className="text-muted-foreground">
            Добавляйте, редактируйте и удаляйте категории оборудования
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              categoryService.refreshData();
              loadCategories();
              toast.success('Данные обновлены');
            }}
            title="Обновить данные"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Обновить
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Добавить категорию
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить новую категорию</DialogTitle>
              <DialogDescription>
                Введите название новой категории оборудования
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Название категории</Label>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    if (errors.add) {
                      setErrors(prev => ({ ...prev, add: "" }));
                    }
                  }}
                  placeholder="Например, Серверы"
                  className={errors.add ? "border-destructive" : ""}
                  disabled={isLoading}
                />
                {errors.add && <p className="text-sm text-destructive">{errors.add}</p>}
              </div>
              <div className="flex gap-3">
                <Button onClick={handleAddCategory} className="flex-1" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Сохранение..." : "Сохранить"}
                </Button>
                <Button variant="outline" onClick={handleAddDialogClose} disabled={isLoading}>
                  <X className="h-4 w-4 mr-2" />
                  Отмена
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Список категорий ({dbCategories.length})
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-destructive">
              <Tags className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Ошибка загрузки категорий</p>
              <p className="text-sm">{error}</p>
              <Button 
                variant="outline" 
                onClick={loadCategories}
                className="mt-2"
              >
                Попробовать снова
              </Button>
            </div>
          ) : dbCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tags className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Категории не найдены</p>
              <p className="text-sm">Добавьте первую категорию для начала работы</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {dbCategories.map((category) => {
                const count = categoryService.getEquipmentCountByCategory(category.id);
                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-card"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{category.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {count} единиц оборудования
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditCategory(category)}
                        title="Редактировать"
                        disabled={isLoading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Удалить"
                            disabled={count > 0 || isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Вы уверены, что хотите удалить категорию "{category.name}"? 
                              Это действие нельзя отменить.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isLoading}>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(category)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={isLoading}
                            >
                              {isLoading ? "Удаление..." : "Удалить"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог редактирования */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать категорию</DialogTitle>
            <DialogDescription>
              Измените название категории "{editingCategory?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Название категории</Label>
              <Input
                id="edit-category-name"
                value={editCategoryName}
                onChange={(e) => {
                  setEditCategoryName(e.target.value);
                  if (errors.edit) {
                    setErrors(prev => ({ ...prev, edit: "" }));
                  }
                }}
                className={errors.edit ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.edit && <p className="text-sm text-destructive">{errors.edit}</p>}
            </div>
            <div className="flex gap-3">
              <Button onClick={handleEditCategory} className="flex-1" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Сохранение..." : "Сохранить"}
              </Button>
              <Button variant="outline" onClick={handleEditDialogClose} disabled={isLoading}>
                <X className="h-4 w-4 mr-2" />
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}