import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Plus, Edit, Trash2, Save, X, FolderOpen, Tags } from "lucide-react";
import { toast } from "sonner";

interface CategoryManagementProps {
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
  equipmentCount: { [category: string]: number };
}

export function CategoryManagement({ categories, onCategoriesChange, equipmentCount }: CategoryManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
    
    if (categories.some(cat => cat.toLowerCase() === trimmedName.toLowerCase())) {
      return "Категория с таким названием уже существует";
    }
    
    return "";
  };

  const handleAddCategory = () => {
    const error = validateCategoryName(newCategoryName);
    
    if (error) {
      setErrors({ add: error });
      return;
    }
    
    const trimmedName = newCategoryName.trim();
    onCategoriesChange([...categories, trimmedName]);
    setNewCategoryName("");
    setIsAddDialogOpen(false);
    setErrors({});
    toast.success(`Категория "${trimmedName}" успешно добавлена`);
  };

  const handleEditCategory = () => {
    if (!editingCategory) return;
    
    const error = validateCategoryName(editCategoryName, true, editingCategory);
    
    if (error) {
      setErrors({ edit: error });
      return;
    }
    
    const trimmedName = editCategoryName.trim();
    const updatedCategories = categories.map(cat => 
      cat === editingCategory ? trimmedName : cat
    );
    
    onCategoriesChange(updatedCategories);
    setEditingCategory(null);
    setEditCategoryName("");
    setIsEditDialogOpen(false);
    setErrors({});
    toast.success(`Категория переименована в "${trimmedName}"`);
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    const count = equipmentCount[categoryToDelete] || 0;
    
    if (count > 0) {
      toast.error(`Невозможно удалить категорию "${categoryToDelete}". В ней находится ${count} единиц оборудования.`);
      return;
    }
    
    const updatedCategories = categories.filter(cat => cat !== categoryToDelete);
    onCategoriesChange(updatedCategories);
    toast.success(`Категория "${categoryToDelete}" успешно удалена`);
  };

  const startEditCategory = (category: string) => {
    setEditingCategory(category);
    setEditCategoryName(category);
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
                />
                {errors.add && <p className="text-sm text-destructive">{errors.add}</p>}
              </div>
              <div className="flex gap-3">
                <Button onClick={handleAddCategory} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить
                </Button>
                <Button variant="outline" onClick={handleAddDialogClose}>
                  <X className="h-4 w-4 mr-2" />
                  Отмена
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Список категорий ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tags className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Категории не найдены</p>
              <p className="text-sm">Добавьте первую категорию для начала работы</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const count = equipmentCount[category] || 0;
                return (
                  <div
                    key={category}
                    className="flex items-center justify-between p-4 border rounded-lg bg-card"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{category}</h4>
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
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Удалить"
                            disabled={count > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Вы уверены, что хотите удалить категорию "{category}"? 
                              Это действие нельзя отменить.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(category)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Удалить
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
              Измените название категории "{editingCategory}"
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
              />
              {errors.edit && <p className="text-sm text-destructive">{errors.edit}</p>}
            </div>
            <div className="flex gap-3">
              <Button onClick={handleEditCategory} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Сохранить
              </Button>
              <Button variant="outline" onClick={handleEditDialogClose}>
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