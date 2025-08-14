import { BaseModel } from './BaseModel';
import { EquipmentStack, StackWithEquipment, CreateEquipmentStack, UpdateEquipmentStack, PaginatedResponse } from '../types/database';

interface FindAllOptions {
  page: number;
  limit: number;
  offset: number;
  search?: string;
  tags?: string[];
}

export class StackModel extends BaseModel {
  async findAll(options: FindAllOptions): Promise<PaginatedResponse<StackWithEquipment>> {
    const { page, limit, search, tags } = options;
    
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    const conditions: string[] = [];

    if (search) {
      conditions.push(`(s.name ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (tags && tags.length > 0) {
      conditions.push(`s.tags && $${paramIndex}`);
      params.push(tags);
      paramIndex++;
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    // Получить общее количество
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM equipment_stacks s 
      ${whereClause}
    `;
    const totalResult = await this.executeQuerySingle<{ total: string }>(countQuery, params);
    const total = parseInt(totalResult?.total || '0');

    // Получить данные с пагинацией
    const dataQuery = `
      SELECT 
        s.id, s.uuid, s.name, s.description, s.created_by, s.tags, 
        s.created_at, s.updated_at,
        u.username as created_by_name
      FROM equipment_stacks s
      LEFT JOIN users u ON s.created_by = u.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, (page - 1) * limit);

    const stacks = await this.executeQuery<StackWithEquipment>(dataQuery, params);

    // Для каждого стека получить оборудование
    for (const stack of stacks) {
      stack.equipment = await this.getStackEquipment(stack.id);
    }

    return {
      data: stacks,
      pagination: this.calculatePagination(page, limit, total)
    };
  }

  async findById(id: number): Promise<EquipmentStack | null> {
    const query = `
      SELECT id, uuid, name, description, created_by, tags, created_at, updated_at
      FROM equipment_stacks 
      WHERE id = $1
    `;
    return this.executeQuerySingle<EquipmentStack>(query, [id]);
  }

  async findByIdWithEquipment(id: number): Promise<StackWithEquipment | null> {
    const query = `
      SELECT 
        s.id, s.uuid, s.name, s.description, s.created_by, s.tags, 
        s.created_at, s.updated_at,
        u.username as created_by_name
      FROM equipment_stacks s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = $1
    `;
    
    const stack = await this.executeQuerySingle<StackWithEquipment>(query, [id]);
    
    if (stack) {
      stack.equipment = await this.getStackEquipment(id);
    }
    
    return stack;
  }

  async findByName(name: string): Promise<EquipmentStack | null> {
    const query = `
      SELECT id, uuid, name, description, created_by, tags, created_at, updated_at
      FROM equipment_stacks 
      WHERE name = $1
    `;
    return this.executeQuerySingle<EquipmentStack>(query, [name]);
  }

  private async getStackEquipment(stackId: number) {
    const query = `
      SELECT 
        e.id, e.uuid, e.name, e.category_id, e.serial_number, e.status, 
        e.location_id, e.purchase_date, e.last_maintenance, e.assigned_to, 
        e.description, e.specifications, e.created_by, e.created_at, e.updated_at,
        c.name as category_name,
        l.name as location_name,
        u.username as created_by_name
      FROM stack_equipment se
      JOIN equipment e ON se.equipment_id = e.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN locations l ON e.location_id = l.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE se.stack_id = $1
      ORDER BY e.name ASC
    `;
    return this.executeQuery(query, [stackId]);
  }

  async create(stackData: CreateEquipmentStack & { created_by?: number }): Promise<EquipmentStack> {
    const query = `
      INSERT INTO equipment_stacks (name, description, created_by, tags)
      VALUES ($1, $2, $3, $4)
      RETURNING id, uuid, name, description, created_by, tags, created_at, updated_at
    `;
    
    const values = [
      stackData.name,
      stackData.description || null,
      stackData.created_by || null,
      stackData.tags || []
    ];

    const newStack = await this.executeQuerySingle<EquipmentStack>(query, values) as EquipmentStack;

    // Добавить оборудование в стек, если указано
    if (stackData.equipment_ids && stackData.equipment_ids.length > 0) {
      await this.addEquipment(newStack.id, stackData.equipment_ids);
    }

    return newStack;
  }

  async update(id: number, updateData: UpdateEquipmentStack): Promise<EquipmentStack> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updateData.name);
    }

    if (updateData.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updateData.description);
    }

    if (updateData.tags !== undefined) {
      fields.push(`tags = $${paramIndex++}`);
      values.push(updateData.tags || []);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const query = `
      UPDATE equipment_stacks 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, uuid, name, description, created_by, tags, created_at, updated_at
    `;

    const updatedStack = await this.executeQuerySingle<EquipmentStack>(query, values) as EquipmentStack;

    // Обновить оборудование в стеке, если указано
    if (updateData.equipment_ids !== undefined) {
      // Удалить существующие связи
      await this.executeQuery('DELETE FROM stack_equipment WHERE stack_id = $1', [id]);
      
      // Добавить новые связи
      if (updateData.equipment_ids.length > 0) {
        await this.addEquipment(id, updateData.equipment_ids);
      }
    }

    return updatedStack;
  }

  async addEquipment(stackId: number, equipmentIds: number[]): Promise<void> {
    if (equipmentIds.length === 0) return;

    const values: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const equipmentId of equipmentIds) {
      values.push(`($${paramIndex}, $${paramIndex + 1})`);
      params.push(stackId, equipmentId);
      paramIndex += 2;
    }

    const query = `
      INSERT INTO stack_equipment (stack_id, equipment_id)
      VALUES ${values.join(', ')}
      ON CONFLICT (stack_id, equipment_id) DO NOTHING
    `;

    await this.executeQuery(query, params);
  }

  async removeEquipment(stackId: number, equipmentId: number): Promise<void> {
    const query = 'DELETE FROM stack_equipment WHERE stack_id = $1 AND equipment_id = $2';
    await this.executeQuery(query, [stackId, equipmentId]);
  }

  async delete(id: number): Promise<void> {
    // Каскадное удаление обеспечивается на уровне БД
    const query = 'DELETE FROM equipment_stacks WHERE id = $1';
    await this.executeQuery(query, [id]);
  }

  async isUsedInShipments(stackId: number): Promise<boolean> {
    const query = 'SELECT COUNT(*) as count FROM shipment_stacks WHERE stack_id = $1';
    const result = await this.executeQuerySingle<{ count: string }>(query, [stackId]);
    return parseInt(result?.count || '0') > 0;
  }
}
