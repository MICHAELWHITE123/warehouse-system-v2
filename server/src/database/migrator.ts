import { readFileSync } from 'fs';
import { join } from 'path';
import { query, queryOne } from '../config/database-sqlite';

interface Migration {
  id: number;
  filename: string;
  executed_at: Date;
}

export class DatabaseMigrator {
  private migrationsPath: string;

  constructor() {
    this.migrationsPath = join(__dirname, 'migrations');
  }

  // Создание таблицы миграций
  async createMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await query(sql);
  }

  // Получение выполненных миграций
  async getExecutedMigrations(): Promise<Migration[]> {
    const sql = 'SELECT * FROM migrations ORDER BY executed_at';
    const result = await query(sql);
    return result.rows;
  }

  // Получение списка файлов миграций
  getMigrationFiles(): string[] {
    const files = [
      '001_create_tables_sqlite.sql',
      '002_seed_data_sqlite.sql',
      '005_sync_tables_sqlite.sql'
    ];
    return files.sort();
  }

  // Выполнение миграции
  async executeMigration(filename: string): Promise<void> {
    console.log(`Executing migration: ${filename}`);
    
    try {
      // Читаем файл миграции
      const migrationPath = join(this.migrationsPath, filename);
      const migrationSQL = readFileSync(migrationPath, 'utf-8');
      
      // Выполняем SQL
      await query(migrationSQL);
      
      // Записываем в таблицу миграций
      await query(
        'INSERT INTO migrations (filename) VALUES (?)',
        [filename]
      );
      
      console.log(`✅ Migration ${filename} executed successfully`);
    } catch (error) {
      console.error(`❌ Migration ${filename} failed:`, error);
      throw error;
    }
  }

  // Выполнение всех миграций
  async runMigrations(): Promise<void> {
    try {
      // Создаем таблицу миграций
      await this.createMigrationsTable();
      
      // Получаем выполненные миграции
      const executedMigrations = await this.getExecutedMigrations();
      const executedFilenames = executedMigrations.map(m => m.filename);
      
      // Получаем все файлы миграций
      const migrationFiles = this.getMigrationFiles();
      
      // Выполняем неисполненные миграции
      for (const filename of migrationFiles) {
        if (!executedFilenames.includes(filename)) {
          await this.executeMigration(filename);
        } else {
          console.log(`⏭️  Migration ${filename} already executed, skipping`);
        }
      }
      
      console.log('🎉 All migrations completed successfully');
    } catch (error) {
      console.error('💥 Migration failed:', error);
      throw error;
    }
  }

  // Откат последней миграции (базовая реализация)
  async rollbackLastMigration(): Promise<void> {
    const lastMigration = await queryOne(
      'SELECT * FROM migrations ORDER BY executed_at DESC LIMIT 1'
    );
    
    if (!lastMigration) {
      console.log('No migrations to rollback');
      return;
    }
    
    // Удаляем запись о миграции
    await query(
      'DELETE FROM migrations WHERE filename = ?',
      [lastMigration.filename]
    );
    
    console.log(`Rolled back migration: ${lastMigration.filename}`);
    console.log('⚠️  Note: You may need to manually undo schema changes');
  }
}

export const migrator = new DatabaseMigrator();
