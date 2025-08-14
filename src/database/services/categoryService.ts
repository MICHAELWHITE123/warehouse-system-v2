import { getDatabase } from '../index';
import type { DbCategory, CreateCategory, UpdateCategory } from '../types';
import type { BrowserDatabase } from '../browserDatabase';

export class CategoryService {
  private get db(): BrowserDatabase {
    return getDatabase();
  }

  // Получить все категории
  getAllCategories(): DbCategory[] {
    return this.db.selectAll('categories') as DbCategory[];
  }

  // Получить категорию по ID
  getCategoryById(id: number): DbCategory | null {
    return this.db.selectById('categories', id) as DbCategory | null;
  }

  // Получить категорию по имени
  getCategoryByName(name: string): DbCategory | null {
    const categories = this.db.selectWhere('categories', cat => cat.name === name);
    return categories.length > 0 ? categories[0] as DbCategory : null;
  }

  // Создать новую категорию
  createCategory(category: CreateCategory): DbCategory {
    const now = new Date().toISOString();
    const newCategory = {
      ...category,
      created_at: now,
      updated_at: now
    };

    return this.db.insert('categories', newCategory) as DbCategory;
  }

  // Обновить категорию
  updateCategory(id: number, category: UpdateCategory): DbCategory | null {
    const now = new Date().toISOString();
    const updatedCategory = {
      ...category,
      updated_at: now
    };

    return this.db.update('categories', id, updatedCategory) as DbCategory | null;
  }

  // Проверить, используется ли категория
  isCategoryInUse(id: number): boolean {
    const equipmentCount = this.db.count('equipment', eq => eq.category_id === id);
    return equipmentCount > 0;
  }

  // Удалить категорию
  deleteCategory(id: number): boolean {
    return this.db.delete('categories', id);
  }

  // Получить количество оборудования в категории
  getEquipmentCountByCategory(id: number): number {
    return this.db.count('equipment', eq => eq.category_id === id);
  }

  // Получить статистику по категориям
  getCategoryStats(): Array<{ category: DbCategory; equipmentCount: number }> {
    const categories = this.getAllCategories();
    return categories.map(category => ({
      category,
      equipmentCount: this.getEquipmentCountByCategory(category.id)
    }));
  }

  // Поиск категорий
  searchCategories(query: string): DbCategory[] {
    return this.db.selectWhere('categories', cat => 
      cat.name.toLowerCase().includes(query.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(query.toLowerCase()))
    ) as DbCategory[];
  }
}