import { BaseModel } from './BaseModel';
import { Category, CreateCategory, PaginatedResponse } from '../types/database';

interface FindAllOptions {
  page: number;
  limit: number;
  offset: number;
  search?: string;
}

export class CategoryModel extends BaseModel {
  async findAll(options: FindAllOptions): Promise<PaginatedResponse<Category>> {
    const { page, limit, search } = options;
    
    let whereClause = '';
    const params: any[] = [];

    if (search) {
      whereClause = 'WHERE name ILIKE $1 OR description ILIKE $1';
      params.push(`%${search}%`);
    }

    // Получить общее количество
    const countQuery = `SELECT COUNT(*) as total FROM categories ${whereClause}`;
    const totalResult = await this.executeQuerySingle<{ total: string }>(countQuery, params);
    const total = parseInt(totalResult?.total || '0');

    // Получить данные с пагинацией
    const dataQuery = `
      SELECT id, uuid, name, description, created_at, updated_at
      FROM categories 
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, (page - 1) * limit);

    const categories = await this.executeQuery<Category>(dataQuery, params);

    return {
      data: categories,
      pagination: this.calculatePagination(page, limit, total)
    };
  }

  async findById(id: number): Promise<Category | null> {
    const query = `
      SELECT id, uuid, name, description, created_at, updated_at
      FROM categories 
      WHERE id = $1
    `;
    return this.executeQuerySingle<Category>(query, [id]);
  }

  async findByName(name: string): Promise<Category | null> {
    const query = `
      SELECT id, uuid, name, description, created_at, updated_at
      FROM categories 
      WHERE name = $1
    `;
    return this.executeQuerySingle<Category>(query, [name]);
  }

  async create(categoryData: CreateCategory): Promise<Category> {
    const query = `
      INSERT INTO categories (name, description)
      VALUES ($1, $2)
      RETURNING id, uuid, name, description, created_at, updated_at
    `;
    
    const values = [
      categoryData.name,
      categoryData.description || null
    ];

    return this.executeQuerySingle<Category>(query, values) as Promise<Category>;
  }

  async update(id: number, updateData: Partial<CreateCategory>): Promise<Category> {
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

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const query = `
      UPDATE categories 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, uuid, name, description, created_at, updated_at
    `;

    return this.executeQuerySingle<Category>(query, values) as Promise<Category>;
  }

  async delete(id: number): Promise<void> {
    const query = 'DELETE FROM categories WHERE id = $1';
    await this.executeQuery(query, [id]);
  }

  async getEquipmentCount(categoryId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM equipment WHERE category_id = $1';
    const result = await this.executeQuerySingle<{ count: string }>(query, [categoryId]);
    return parseInt(result?.count || '0');
  }
}
