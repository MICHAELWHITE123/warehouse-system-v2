import { BaseModel } from './BaseModel';
import { User, CreateUser, UpdateUser, PaginatedResponse, PasswordHistory } from '../types/database';

interface FindAllOptions {
  page: number;
  limit: number;
  offset: number;
  search?: string;
  role?: string;
  is_active?: boolean;
}

export class UserModel extends BaseModel {
  async findAll(options: FindAllOptions): Promise<PaginatedResponse<User>> {
    const { page, limit, search, role, is_active } = options;
    
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    const conditions: string[] = [];

    if (search) {
      conditions.push(`(username ILIKE $${paramIndex} OR login ILIKE $${paramIndex} OR nickname ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      conditions.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramIndex}`);
      params.push(is_active);
      paramIndex++;
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    // Получить общее количество
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const totalResult = await this.executeQuerySingle<{ total: string }>(countQuery, params);
    const total = parseInt(totalResult?.total || '0');

    // Получить данные с пагинацией
    const dataQuery = `
      SELECT id, uuid, username, login, nickname, email, password_hash, full_name, role, is_active, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, (page - 1) * limit);

    const users = await this.executeQuery<User>(dataQuery, params);

    return {
      data: users,
      pagination: this.calculatePagination(page, limit, total)
    };
  }

  async findById(id: number): Promise<User | null> {
    const query = `
      SELECT id, uuid, username, login, nickname, email, password_hash, full_name, role, is_active, created_at, updated_at
      FROM users 
      WHERE id = $1
    `;
    return this.executeQuerySingle<User>(query, [id]);
  }

  async findByUsernameOrEmail(usernameOrEmail: string): Promise<User | null> {
    const query = `
      SELECT id, uuid, username, login, nickname, email, password_hash, full_name, role, is_active, created_at, updated_at
      FROM users 
      WHERE username = $1 OR login = $1 OR email = $1
    `;
    return this.executeQuerySingle<User>(query, [usernameOrEmail]);
  }

  async create(userData: CreateUser & { password: string }): Promise<User> {
    const query = `
      INSERT INTO users (username, login, nickname, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, uuid, username, login, nickname, email, password_hash, full_name, role, is_active, created_at, updated_at
    `;
    
    const values = [
      userData.username,
      userData.login,
      userData.nickname,
      userData.email,
      userData.password,
      userData.full_name || null,
      userData.role || 'user'
    ];

    return this.executeQuerySingle<User>(query, values) as Promise<User>;
  }

  async update(id: number, updateData: UpdateUser & { password?: string }): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.username !== undefined) {
      fields.push(`username = $${paramIndex++}`);
      values.push(updateData.username);
    }

    if (updateData.login !== undefined) {
      fields.push(`login = $${paramIndex++}`);
      values.push(updateData.login);
    }

    if (updateData.nickname !== undefined) {
      fields.push(`nickname = $${paramIndex++}`);
      values.push(updateData.nickname);
    }

    if (updateData.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(updateData.email);
    }

    if (updateData.password !== undefined) {
      fields.push(`password_hash = $${paramIndex++}`);
      values.push(updateData.password);
      
      // Сохраняем старый пароль в историю перед обновлением
      const currentUser = await this.findById(id);
      if (currentUser) {
        await this.addPasswordToHistory(id, currentUser.password_hash, 'password_change');
      }
    }

    if (updateData.full_name !== undefined) {
      fields.push(`full_name = $${paramIndex++}`);
      values.push(updateData.full_name);
    }

    if (updateData.role !== undefined) {
      fields.push(`role = $${paramIndex++}`);
      values.push(updateData.role);
    }

    if (updateData.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(updateData.is_active);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, uuid, username, login, nickname, email, password_hash, full_name, role, is_active, created_at, updated_at
    `;

    return this.executeQuerySingle<User>(query, values) as Promise<User>;
  }

  async delete(id: number): Promise<void> {
    const query = 'DELETE FROM users WHERE id = $1';
    await this.executeQuery(query, [id]);
  }

  // Новые методы для работы с историей паролей
  async addPasswordToHistory(userId: number, passwordHash: string, reason: string = 'password_change', changedBy?: number): Promise<void> {
    const query = `
      INSERT INTO password_history (user_id, password_hash, change_reason, changed_by)
      VALUES ($1, $2, $3, $4)
    `;
    
    await this.executeQuery(query, [userId, passwordHash, reason, changedBy]);
  }

  async getPasswordHistory(userId: number, limit: number = 10): Promise<PasswordHistory[]> {
    const query = `
      SELECT id, user_id, password_hash, changed_by, change_reason, created_at
      FROM password_history 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    return this.executeQuery<PasswordHistory>(query, [userId, limit]);
  }

  async clearPasswordHistory(userId: number): Promise<void> {
    const query = 'DELETE FROM password_history WHERE user_id = $1';
    await this.executeQuery(query, [userId]);
  }
}
