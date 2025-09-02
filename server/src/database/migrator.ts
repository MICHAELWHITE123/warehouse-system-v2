import { getPool } from '../config/database';
import { supabaseAdmin } from '../config/supabase';

export class Migrator {
  async runMigrations() {
    try {
      if (process.env.NODE_ENV === 'production') {
        // В продакшене миграции уже выполнены в Supabase
        console.log('✅ Supabase migrations are managed separately');
        return;
      }

      console.log('📊 Running local database migrations...');
      
      // Создаем таблицу миграций если её нет
      await this.createMigrationsTable();
      
      // Получаем список выполненных миграций
      const completedMigrations = await this.getCompletedMigrations();
      
      // Выполняем миграции
      const migrations = [
        {
          id: '001_create_tables',
          sql: `
            -- Create users table
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Create categories table
            CREATE TABLE IF NOT EXISTS categories (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Create locations table
            CREATE TABLE IF NOT EXISTS locations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                address TEXT,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Create equipment table
            CREATE TABLE IF NOT EXISTS equipment (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
                location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
                serial_number VARCHAR(100) UNIQUE,
                model VARCHAR(100),
                manufacturer VARCHAR(100),
                purchase_date DATE,
                warranty_expiry DATE,
                status VARCHAR(50) DEFAULT 'available',
                condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 5),
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Create stacks table
            CREATE TABLE IF NOT EXISTS stacks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
                capacity INTEGER DEFAULT 0,
                current_count INTEGER DEFAULT 0,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Create shipments table
            CREATE TABLE IF NOT EXISTS shipments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                shipment_number VARCHAR(100) UNIQUE NOT NULL,
                destination VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                departure_date TIMESTAMP WITH TIME ZONE,
                arrival_date TIMESTAMP WITH TIME ZONE,
                notes TEXT,
                created_by UUID REFERENCES users(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Create shipment_items table
            CREATE TABLE IF NOT EXISTS shipment_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
                equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
                quantity INTEGER DEFAULT 1,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Create audit_logs table
            CREATE TABLE IF NOT EXISTS audit_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id),
                action VARCHAR(100) NOT NULL,
                table_name VARCHAR(100),
                record_id UUID,
                old_values JSONB,
                new_values JSONB,
                ip_address INET,
                user_agent TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        },
        {
          id: '002_seed_data',
          sql: `
            -- Insert sample data
            INSERT INTO categories (name, description) VALUES 
            ('Компьютеры', 'Персональные компьютеры и ноутбуки'),
            ('Сетевое оборудование', 'Маршрутизаторы, коммутаторы, кабели'),
            ('Принтеры', 'Принтеры, сканеры, МФУ'),
            ('Мебель', 'Столы, стулья, шкафы')
            ON CONFLICT DO NOTHING;

            INSERT INTO locations (name, address, description) VALUES 
            ('Склад А', 'ул. Складская, 1', 'Основной склад'),
            ('Склад Б', 'ул. Складская, 2', 'Вспомогательный склад'),
            ('Офис', 'ул. Офисная, 1', 'Главный офис')
            ON CONFLICT DO NOTHING;
          `
        }
      ];
      
      for (const migration of migrations) {
        if (!completedMigrations.includes(migration.id)) {
          console.log(`🔄 Running migration: ${migration.id}`);
          await this.executeMigration(migration);
          console.log(`✅ Migration completed: ${migration.id}`);
        } else {
          console.log(`⏭️ Migration already completed: ${migration.id}`);
        }
      }
      
      console.log('✅ All migrations completed successfully');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  private async createMigrationsTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await getPool().query(sql);
  }

  private async getCompletedMigrations(): Promise<string[]> {
    const result = await getPool().query('SELECT id FROM migrations ORDER BY executed_at');
    return result.rows.map(row => row.id);
  }

  private async executeMigration(migration: { id: string; sql: string }) {
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      await client.query(migration.sql);
      await client.query('INSERT INTO migrations (id) VALUES ($1)', [migration.id]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export const migrator = new Migrator();
