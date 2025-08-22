import { getDatabase } from '../index';
import type { DbCategory, CreateCategory, UpdateCategory } from '../types';
import type { BrowserDatabase } from '../browserDatabase';

export class CategoryService {
  private get db(): BrowserDatabase {
    return getDatabase();
  }

  // Получить все категории
  getAllCategories(): DbCategory[] {
    try {
      return this.db.selectAll('categories') as DbCategory[];
    } catch (error) {
      console.error('Ошибка получения всех категорий:', error);
      return [];
    }
  }

  // Получить категорию по ID
  getCategoryById(id: number): DbCategory | null {
    try {
      return this.db.selectById('categories', id) as DbCategory | null;
    } catch (error) {
      console.error('Ошибка получения категории по ID:', error);
      return null;
    }
  }

  // Получить категорию по имени
  getCategoryByName(name: string): DbCategory | null {
    try {
      const categories = this.db.selectWhere('categories', (cat: any) => cat.name === name);
      return categories.length > 0 ? categories[0] as DbCategory : null;
    } catch (error) {
      console.error('Ошибка поиска категории по имени:', error);
      return null;
    }
  }

  // Создать новую категорию
  createCategory(category: CreateCategory): DbCategory {
    try {
      const now = new Date().toISOString();
      const newCategory = {
        ...category,
        created_at: now,
        updated_at: now
      };

      return this.db.insert('categories', newCategory) as DbCategory;
    } catch (error) {
      console.error('Ошибка создания категории:', error);
      throw new Error('Не удалось создать категорию');
    }
  }

  // Обновить категорию
  updateCategory(id: number, category: UpdateCategory): DbCategory | null {
    try {
      const now = new Date().toISOString();
      const updatedCategory = {
        ...category,
        updated_at: now
      };

      return this.db.update('categories', id, updatedCategory) as DbCategory | null;
    } catch (error) {
      console.error('Ошибка обновления категории:', error);
      throw new Error('Не удалось обновить категорию');
    }
  }

  // Проверить, используется ли категория
  isCategoryInUse(id: number): boolean {
    try {
      const equipmentCount = this.db.count('equipment', (eq: any) => eq.category_id === id);
      return equipmentCount > 0;
    } catch (error) {
      console.error('Ошибка проверки использования категории:', error);
      return false;
    }
  }

  // Удалить категорию
  deleteCategory(id: number): boolean {
    try {
      return this.db.delete('categories', id);
    } catch (error) {
      console.error('Ошибка удаления категории:', error);
      throw new Error('Не удалось удалить категорию');
    }
  }

  // Получить количество оборудования в категории
  getEquipmentCountByCategory(id: number): number {
    try {
      return this.db.count('equipment', (eq: any) => eq.category_id === id);
    } catch (error) {
      console.error('Ошибка подсчета оборудования по категории:', error);
      return 0;
    }
  }

  // Получить статистику по категориям
  getCategoryStats(): Array<{ category: DbCategory; equipmentCount: number }> {
    try {
      const categories = this.getAllCategories();
      return categories.map(category => ({
        category,
        equipmentCount: this.getEquipmentCountByCategory(category.id)
      }));
    } catch (error) {
      console.error('Ошибка получения статистики по категориям:', error);
      return [];
    }
  }

  // Поиск категорий
  searchCategories(query: string): DbCategory[] {
    try {
      return this.db.selectWhere('categories', (cat: any) => 
        cat.name.toLowerCase().includes(query.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(query.toLowerCase()))
      ) as DbCategory[];
    } catch (error) {
      console.error('Ошибка поиска категорий:', error);
      return [];
    }
  }

  // Метод для принудительного обновления данных
  refreshData(): void {
    try {
      this.db.refreshData();
    } catch (error) {
      console.error('Ошибка обновления данных:', error);
    }
  }
}