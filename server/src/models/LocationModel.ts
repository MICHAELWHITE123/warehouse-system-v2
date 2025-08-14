import { BaseModel } from './BaseModel';
import { Location, CreateLocation, PaginatedResponse } from '../types/database';

interface FindAllOptions {
  page: number;
  limit: number;
  offset: number;
  search?: string;
}

export class LocationModel extends BaseModel {
  async findAll(options: FindAllOptions): Promise<PaginatedResponse<Location>> {
    const { page, limit, search } = options;
    
    let whereClause = '';
    const params: any[] = [];

    if (search) {
      whereClause = 'WHERE name ILIKE $1 OR description ILIKE $1 OR address ILIKE $1';
      params.push(`%${search}%`);
    }

    // Получить общее количество
    const countQuery = `SELECT COUNT(*) as total FROM locations ${whereClause}`;
    const totalResult = await this.executeQuerySingle<{ total: string }>(countQuery, params);
    const total = parseInt(totalResult?.total || '0');

    // Получить данные с пагинацией
    const dataQuery = `
      SELECT id, uuid, name, description, address, created_at, updated_at
      FROM locations 
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, (page - 1) * limit);

    const locations = await this.executeQuery<Location>(dataQuery, params);

    return {
      data: locations,
      pagination: this.calculatePagination(page, limit, total)
    };
  }

  async findById(id: number): Promise<Location | null> {
    const query = `
      SELECT id, uuid, name, description, address, created_at, updated_at
      FROM locations 
      WHERE id = $1
    `;
    return this.executeQuerySingle<Location>(query, [id]);
  }

  async findByName(name: string): Promise<Location | null> {
    const query = `
      SELECT id, uuid, name, description, address, created_at, updated_at
      FROM locations 
      WHERE name = $1
    `;
    return this.executeQuerySingle<Location>(query, [name]);
  }

  async create(locationData: CreateLocation): Promise<Location> {
    const query = `
      INSERT INTO locations (name, description, address)
      VALUES ($1, $2, $3)
      RETURNING id, uuid, name, description, address, created_at, updated_at
    `;
    
    const values = [
      locationData.name,
      locationData.description || null,
      locationData.address || null
    ];

    return this.executeQuerySingle<Location>(query, values) as Promise<Location>;
  }

  async update(id: number, updateData: Partial<CreateLocation>): Promise<Location> {
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

    if (updateData.address !== undefined) {
      fields.push(`address = $${paramIndex++}`);
      values.push(updateData.address);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const query = `
      UPDATE locations 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, uuid, name, description, address, created_at, updated_at
    `;

    return this.executeQuerySingle<Location>(query, values) as Promise<Location>;
  }

  async delete(id: number): Promise<void> {
    const query = 'DELETE FROM locations WHERE id = $1';
    await this.executeQuery(query, [id]);
  }

  async getEquipmentCount(locationId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM equipment WHERE location_id = $1';
    const result = await this.executeQuerySingle<{ count: string }>(query, [locationId]);
    return parseInt(result?.count || '0');
  }
}
