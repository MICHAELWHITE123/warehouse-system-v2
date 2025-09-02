import { getDatabase } from '../index';
import type {
  DbEquipmentStack,
  CreateEquipmentStack,
  UpdateEquipmentStack,
  StackWithEquipment
} from '../types';
import type { BrowserDatabase } from '../browserDatabase';

export class StackService {
  private get db(): BrowserDatabase {
    return getDatabase();
  }

  // Получить все стеки
  getAllStacks(): DbEquipmentStack[] {
    return this.db.selectAll('equipment_stacks') as DbEquipmentStack[];
  }

  // Получить стек по ID
  getStackById(id: number): DbEquipmentStack | null {
    return this.db.selectById('equipment_stacks', id) as DbEquipmentStack | null;
  }

  // Получить стек по UUID
  getStackByUuid(uuid: string): DbEquipmentStack | null {
    const stacks = this.db.selectWhere('equipment_stacks', stack => stack.uuid === uuid);
    return stacks.length > 0 ? stacks[0] as DbEquipmentStack : null;
  }

  // Получить все стеки с оборудованием
  getAllStacksWithEquipment(): StackWithEquipment[] {
    const stacks = this.getAllStacks();
    
    return stacks.map(stack => {
      const stackEquipment = this.db.selectWhere('stack_equipment', se => se.stack_id === stack.id);
      const equipment = stackEquipment.map(se => {
        const eq = this.db.selectById('equipment', se.equipment_id);
        if (!eq) return null;
        
        const categories = this.db.selectAll('categories');
        const locations = this.db.selectAll('locations');
        
        return {
          ...eq,
          category_name: categories.find(c => c.id === eq.category_id)?.name || '',
          location_name: locations.find(l => l.id === eq.location_id)?.name || ''
        };
      }).filter(Boolean);

      return {
        ...stack,
        equipment
      };
    }) as StackWithEquipment[];
  }

  // Получить стек с оборудованием по ID
  getStackWithEquipmentById(id: number): StackWithEquipment | null {
    const stack = this.getStackById(id);
    if (!stack) return null;

    const stackEquipment = this.db.selectWhere('stack_equipment', se => se.stack_id === stack.id);
    const equipment = stackEquipment.map(se => {
      const eq = this.db.selectById('equipment', se.equipment_id);
      if (!eq) return null;
      
      const categories = this.db.selectAll('categories');
      const locations = this.db.selectAll('locations');
      
      return {
        ...eq,
        category_name: categories.find(c => c.id === eq.category_id)?.name || '',
        location_name: locations.find(l => l.id === eq.location_id)?.name || ''
      };
    }).filter(Boolean);

    return {
      ...stack,
      equipment
    } as StackWithEquipment;
  }

  // Создать новый стек
  createStack(stack: CreateEquipmentStack): DbEquipmentStack {
    const now = new Date().toISOString();
    const newStack = {
      ...stack,
      created_at: now,
      updated_at: now
    };

    return this.db.insert('equipment_stacks', newStack) as DbEquipmentStack;
  }

  // Обновить стек
  updateStack(stack: UpdateEquipmentStack & { id: number }): DbEquipmentStack | null {
    const updatedStack: UpdateEquipmentStack = {
      ...stack
    };

    return this.db.update('equipment_stacks', stack.id, updatedStack) as DbEquipmentStack | null;
  }

  // Удалить стек
  deleteStack(id: number): boolean {
    // Сначала удаляем связи с оборудованием
    const stackEquipment = this.db.selectWhere('stack_equipment', se => se.stack_id === id);
    stackEquipment.forEach(se => {
      this.db.delete('stack_equipment', se.id);
    });

    // Затем удаляем сам стек
    return this.db.delete('equipment_stacks', id);
  }

  // Добавить оборудование в стек
  addEquipmentToStack(stackId: number, equipmentIds: number[]): boolean {
    try {
      equipmentIds.forEach(equipmentId => {
        // Проверяем, не добавлено ли уже это оборудование в стек
        const existing = this.db.selectWhere('stack_equipment', 
          se => se.stack_id === stackId && se.equipment_id === equipmentId
        );
        
        if (existing.length === 0) {
          this.db.insert('stack_equipment', {
            stack_id: stackId,
            equipment_id: equipmentId,
            added_at: new Date().toISOString()
          });
        }
      });
      return true;
    } catch (error) {
      console.error('Error adding equipment to stack:', error);
      return false;
    }
  }

  // Удалить оборудование из стека
  removeEquipmentFromStack(stackId: number, equipmentIds: number[]): boolean {
    try {
      equipmentIds.forEach(equipmentId => {
        const stackEquipment = this.db.selectWhere('stack_equipment', 
          se => se.stack_id === stackId && se.equipment_id === equipmentId
        );
        
        stackEquipment.forEach(se => {
          this.db.delete('stack_equipment', se.id);
        });
      });
      return true;
    } catch (error) {
      console.error('Error removing equipment from stack:', error);
      return false;
    }
  }

  // Заменить все оборудование в стеке
  replaceStackEquipment(stackId: number, equipmentIds: number[]): boolean {
    try {
      // Удаляем все текущее оборудование
      const currentEquipment = this.db.selectWhere('stack_equipment', se => se.stack_id === stackId);
      currentEquipment.forEach(se => {
        this.db.delete('stack_equipment', se.id);
      });

      // Добавляем новое оборудование
      return this.addEquipmentToStack(stackId, equipmentIds);
    } catch (error) {
      console.error('Error replacing stack equipment:', error);
      return false;
    }
  }

  // Получить оборудование в стеке
  getStackEquipment(stackId: number): any[] {
    const stackEquipment = this.db.selectWhere('stack_equipment', se => se.stack_id === stackId);
    return stackEquipment.map(se => {
      const eq = this.db.selectById('equipment', se.equipment_id);
      if (!eq) return null;
      
      const categories = this.db.selectAll('categories');
      const locations = this.db.selectAll('locations');
      
      return {
        ...eq,
        category_name: categories.find(c => c.id === eq.category_id)?.name || '',
        location_name: locations.find(l => l.id === eq.location_id)?.name || ''
      };
    }).filter(Boolean);
  }

  // Получить статистику по стекам
  getStackStats() {
    const totalStacks = this.db.count('equipment_stacks');
    const totalEquipmentInStacks = this.db.count('stack_equipment');

    return {
      totalStacks,
      totalEquipmentInStacks
    };
  }

  // Поиск стеков
  searchStacks(query: string): DbEquipmentStack[] {
    return this.db.selectWhere('equipment_stacks', stack => 
      stack.name.toLowerCase().includes(query.toLowerCase()) ||
      (stack.description && stack.description.toLowerCase().includes(query.toLowerCase()))
    ) as DbEquipmentStack[];
  }

  // Клонировать стек
  cloneStack(stackId: number, newName: string): DbEquipmentStack | null {
    const originalStack = this.getStackWithEquipmentById(stackId);
    if (!originalStack) return null;

    let tags: string[] = [];
    try {
      if (originalStack.tags && originalStack.tags.trim() !== '') {
        tags = JSON.parse(originalStack.tags);
      }
    } catch (error) {
      console.warn('Failed to parse tags for stack cloning:', stackId, error);
      tags = [];
    }

    const newStack = this.createStack({
      uuid: Date.now().toString(),
      name: newName,
      description: `Копия: ${originalStack.description || originalStack.name}`,
      created_by: originalStack.created_by,
      tags: tags.length > 0 ? JSON.stringify(tags) : undefined
    });

    if (originalStack.equipment.length > 0) {
      const equipmentIds = originalStack.equipment.map(eq => eq.id);
      this.addEquipmentToStack(newStack.id, equipmentIds);
    }

    return newStack;
  }
}