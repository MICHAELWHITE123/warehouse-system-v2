import { BaseModel } from './BaseModel';
import { Equipment, EquipmentWithRelations, CreateEquipment, UpdateEquipment, PaginatedResponse } from '../types/database';

interface FindAllOptions {
  page: number;
  limit: number;
  offset: number;
  search?: string;
  category_id?: number;
  location_id?: number;
  status?: string;
}

export class EquipmentModel extends BaseModel {
  async findAll(options: FindAllOptions): Promise<PaginatedResponse<EquipmentWithRelations>> {
    const { page, limit, search, category_id, location_id, status } = options;
    
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    const conditions: string[] = [];

    if (search) {
      conditions.push(`(e.name ILIKE $${paramIndex} OR e.serial_number ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category_id) {
      conditions.push(`e.category_id = $${paramIndex}`);
      params.push(category_id);
      paramIndex++;
    }

    if (location_id) {
      conditions.push(`e.location_id = $${paramIndex}`);
      params.push(location_id);
      paramIndex++;
    }

    if (status) {
      conditions.push(`e.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    // Получить общее количество
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM equipment e 
      ${whereClause}
    `;
    const totalResult = await this.executeQuerySingle<{ total: string }>(countQuery, params);
    const total = parseInt(totalResult?.total || '0');

    // Получить данные с пагинацией
    const dataQuery = `
      SELECT 
        e.id, e.uuid, e.name, e.category_id, e.serial_number, e.status, 
        e.location_id, e.purchase_date, e.last_maintenance, e.assigned_to, 
        e.description, e.specifications, e.created_by, e.created_at, e.updated_at,
        c.name as category_name,
        l.name as location_name,
        u.username as created_by_name
      FROM equipment e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN locations l ON e.location_id = l.id
      LEFT JOIN users u ON e.created_by = u.id
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, (page - 1) * limit);

    const equipment = await this.executeQuery<EquipmentWithRelations>(dataQuery, params);

    return {
      data: equipment,
      pagination: this.calculatePagination(page, limit, total)
    };
  }

  async findById(id: number): Promise<EquipmentWithRelations | null> {
    const query = `
      SELECT 
        e.id, e.uuid, e.name, e.category_id, e.serial_number, e.status, 
        e.location_id, e.purchase_date, e.last_maintenance, e.assigned_to, 
        e.description, e.specifications, e.created_by, e.created_at, e.updated_at,
        c.name as category_name,
        l.name as location_name,
        u.username as created_by_name
      FROM equipment e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN locations l ON e.location_id = l.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = $1
    `;
    return this.executeQuerySingle<EquipmentWithRelations>(query, [id]);
  }

  async findBySerialNumber(serialNumber: string): Promise<Equipment | null> {
    const query = `
      SELECT id, uuid, name, category_id, serial_number, status, location_id,
             purchase_date, last_maintenance, assigned_to, description, 
             specifications, created_by, created_at, updated_at
      FROM equipment 
      WHERE serial_number = $1
    `;
    return this.executeQuerySingle<Equipment>(query, [serialNumber]);
  }

  async search(searchTerm: string, limit: number = 10): Promise<EquipmentWithRelations[]> {
    const query = `
      SELECT 
        e.id, e.uuid, e.name, e.category_id, e.serial_number, e.status, 
        e.location_id, e.purchase_date, e.last_maintenance, e.assigned_to, 
        e.description, e.specifications, e.created_by, e.created_at, e.updated_at,
        c.name as category_name,
        l.name as location_name,
        u.username as created_by_name
      FROM equipment e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN locations l ON e.location_id = l.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.name ILIKE $1 OR e.serial_number ILIKE $1 OR e.description ILIKE $1
      ORDER BY e.name ASC
      LIMIT $2
    `;
    return this.executeQuery<EquipmentWithRelations>(query, [`%${searchTerm}%`, limit]);
  }

  async create(equipmentData: CreateEquipment & { created_by?: number }): Promise<Equipment> {
    const query = `
      INSERT INTO equipment (
        name, category_id, serial_number, status, location_id, 
        purchase_date, last_maintenance, assigned_to, description, 
        specifications, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, uuid, name, category_id, serial_number, status, location_id,
                purchase_date, last_maintenance, assigned_to, description, 
                specifications, created_by, created_at, updated_at
    `;
    
    const values = [
      equipmentData.name,
      equipmentData.category_id || null,
      equipmentData.serial_number || null,
      equipmentData.status || 'available',
      equipmentData.location_id || null,
      equipmentData.purchase_date || null,
      equipmentData.last_maintenance || null,
      equipmentData.assigned_to || null,
      equipmentData.description || null,
      equipmentData.specifications ? JSON.stringify(equipmentData.specifications) : null,
      equipmentData.created_by || null
    ];

    return this.executeQuerySingle<Equipment>(query, values) as Promise<Equipment>;
  }

  async update(id: number, updateData: UpdateEquipment): Promise<Equipment> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updateData.name);
    }

    if (updateData.category_id !== undefined) {
      fields.push(`category_id = $${paramIndex++}`);
      values.push(updateData.category_id);
    }

    if (updateData.serial_number !== undefined) {
      fields.push(`serial_number = $${paramIndex++}`);
      values.push(updateData.serial_number);
    }

    if (updateData.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updateData.status);
    }

    if (updateData.location_id !== undefined) {
      fields.push(`location_id = $${paramIndex++}`);
      values.push(updateData.location_id);
    }

    if (updateData.purchase_date !== undefined) {
      fields.push(`purchase_date = $${paramIndex++}`);
      values.push(updateData.purchase_date);
    }

    if (updateData.last_maintenance !== undefined) {
      fields.push(`last_maintenance = $${paramIndex++}`);
      values.push(updateData.last_maintenance);
    }

    if (updateData.assigned_to !== undefined) {
      fields.push(`assigned_to = $${paramIndex++}`);
      values.push(updateData.assigned_to);
    }

    if (updateData.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updateData.description);
    }

    if (updateData.specifications !== undefined) {
      fields.push(`specifications = $${paramIndex++}`);
      values.push(updateData.specifications ? JSON.stringify(updateData.specifications) : null);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const query = `
      UPDATE equipment 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, uuid, name, category_id, serial_number, status, location_id,
                purchase_date, last_maintenance, assigned_to, description, 
                specifications, created_by, created_at, updated_at
    `;

    return this.executeQuerySingle<Equipment>(query, values) as Promise<Equipment>;
  }

  async delete(id: number): Promise<void> {
    const query = 'DELETE FROM equipment WHERE id = $1';
    await this.executeQuery(query, [id]);
  }

  async isUsedInStacks(equipmentId: number): Promise<boolean> {
    const query = 'SELECT COUNT(*) as count FROM stack_equipment WHERE equipment_id = $1';
    const result = await this.executeQuerySingle<{ count: string }>(query, [equipmentId]);
    return parseInt(result?.count || '0') > 0;
  }

  async isUsedInShipments(equipmentId: number): Promise<boolean> {
    const query = 'SELECT COUNT(*) as count FROM shipment_equipment WHERE equipment_id = $1';
    const result = await this.executeQuerySingle<{ count: string }>(query, [equipmentId]);
    return parseInt(result?.count || '0') > 0;
  }
}
