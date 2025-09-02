import { getPool } from '../config/database';
import { supabaseAdmin } from '../config/supabase';

export abstract class BaseModel {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected getDb() {
    if (process.env.NODE_ENV === 'production') {
      return supabaseAdmin;
    } else {
      return getPool();
    }
  }

  protected async query(sql: string, params?: any[]) {
    if (process.env.NODE_ENV === 'production') {
      // В продакшене используем Supabase
      const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
        sql_query: sql, 
        sql_params: params 
      });
      if (error) throw error;
      return { rows: data };
    } else {
      // В разработке используем PostgreSQL
      return await getPool().query(sql, params);
    }
  }

  protected async queryOne(sql: string, params?: any[]) {
    const result = await this.query(sql, params);
    return result.rows?.[0] || null;
  }

  protected async queryAll(sql: string, params?: any[]) {
    const result = await this.query(sql, params);
    return result.rows || [];
  }

  async findById(id: string) {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    return await this.queryOne(sql, [id]);
  }

  async findAll() {
    const sql = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`;
    return await this.queryAll(sql);
  }

  async create(data: any) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    
    const sql = `
      INSERT INTO ${this.tableName} (${columns.join(', ')}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;
    
    return await this.queryOne(sql, values);
  }

  async update(id: string, data: any) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, index) => `${col} = $${index + 2}`).join(', ');
    
    const sql = `
      UPDATE ${this.tableName} 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;
    
    return await this.queryOne(sql, [id, ...values]);
  }

  async delete(id: string) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = $1`;
    return await this.query(sql, [id]);
  }

  async count() {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const result = await this.queryOne(sql);
    return parseInt(result?.count || '0');
  }
}
