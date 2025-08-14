import { Pool } from 'pg';
import { pool } from '../config/database';

export abstract class BaseModel {
  protected pool: Pool;

  constructor() {
    this.pool = pool;
  }

  protected async executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
    try {
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  protected async executeQuerySingle<T = any>(query: string, params: any[] = []): Promise<T | null> {
    const result = await this.executeQuery<T>(query, params);
    return result.length > 0 ? result[0] : null;
  }

  protected buildWhereClause(conditions: Record<string, any>): { clause: string; params: any[] } {
    const whereParts: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(conditions)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'string' && key.includes('search')) {
          whereParts.push(`${key.replace('_search', '')} ILIKE $${paramIndex}`);
          params.push(`%${value}%`);
        } else {
          whereParts.push(`${key} = $${paramIndex}`);
          params.push(value);
        }
        paramIndex++;
      }
    }

    return {
      clause: whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '',
      params
    };
  }

  protected buildPagination(page: number, limit: number): { offset: number; limitClause: string } {
    const offset = (page - 1) * limit;
    return {
      offset,
      limitClause: `LIMIT ${limit} OFFSET ${offset}`
    };
  }

  protected async getTotalCount(baseQuery: string, whereClause: string, params: any[]): Promise<number> {
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as count_table ${whereClause}`;
    const result = await this.executeQuerySingle<{ total: string }>(countQuery, params);
    return parseInt(result?.total || '0');
  }

  protected calculatePagination(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }
}
