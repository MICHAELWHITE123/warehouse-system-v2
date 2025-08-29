-- ====================================
-- ПОЛНАЯ НАСТРОЙКА БАЗЫ ДАННЫХ SUPABASE
-- ====================================
-- Этот файл содержит все необходимые миграции для развертывания системы WeareHouse
-- ВСЕ ОГРАНИЧЕНИЯ СОЗДАЮТСЯ БЕЗОПАСНО С ПРОВЕРКОЙ СУЩЕСТВОВАНИЯ

-- Таблица для отслеживания миграций
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- ОСНОВНЫЕ ТАБЛИЦЫ СИСТЕМЫ
-- ====================================

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    nickname VARCHAR(50) NOT NULL,
    login VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем уникальные ограничения для пользователей
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_username_unique') THEN
        ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_unique') THEN
        ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_nickname_unique') THEN
        ALTER TABLE users ADD CONSTRAINT users_nickname_unique UNIQUE (nickname);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_login_unique') THEN
        ALTER TABLE users ADD CONSTRAINT users_login_unique UNIQUE (login);
    END IF;
END $$;

-- Таблица категорий оборудования
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем уникальное ограничение для названия категории
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_name_unique') THEN
        ALTER TABLE categories ADD CONSTRAINT categories_name_unique UNIQUE (name);
    END IF;
END $$;

-- Таблица местоположений
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем уникальное ограничение для названия местоположения
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'locations_name_unique') THEN
        ALTER TABLE locations ADD CONSTRAINT locations_name_unique UNIQUE (name);
    END IF;
END $$;

-- Таблица оборудования
CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    serial_number VARCHAR(100),
    status VARCHAR(20) NOT NULL CHECK (status IN ('available', 'in-use', 'maintenance')) DEFAULT 'available',
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    purchase_date DATE,
    last_maintenance DATE,
    assigned_to VARCHAR(100),
    description TEXT,
    specifications JSONB,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем уникальное ограничение для серийного номера
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipment_serial_number_unique') THEN
        ALTER TABLE equipment ADD CONSTRAINT equipment_serial_number_unique UNIQUE (serial_number);
    END IF;
END $$;

-- Таблица стеков оборудования
CREATE TABLE IF NOT EXISTS equipment_stacks (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Связующая таблица между стеками и оборудованием
CREATE TABLE IF NOT EXISTS stack_equipment (
    id SERIAL PRIMARY KEY,
    stack_id INTEGER NOT NULL REFERENCES equipment_stacks(id) ON DELETE CASCADE,
    equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем уникальное ограничение для связи стека и оборудования
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stack_equipment_stack_equipment_unique') THEN
        ALTER TABLE stack_equipment ADD CONSTRAINT stack_equipment_stack_equipment_unique UNIQUE(stack_id, equipment_id);
    END IF;
END $$;

-- Таблица отгрузок
CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    number VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    recipient_address TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('preparing', 'in-transit', 'delivered', 'cancelled')) DEFAULT 'preparing',
    responsible_person VARCHAR(100) NOT NULL,
    total_items INTEGER DEFAULT 0,
    comments TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP
);

-- Добавляем уникальное ограничение для номера отгрузки
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipments_number_unique') THEN
        ALTER TABLE shipments ADD CONSTRAINT shipments_number_unique UNIQUE (number);
    END IF;
END $$;

-- Таблица оборудования в отгрузках
CREATE TABLE IF NOT EXISTS shipment_equipment (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица стеков в отгрузках
CREATE TABLE IF NOT EXISTS shipment_stacks (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    stack_id INTEGER NOT NULL REFERENCES equipment_stacks(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица чек-листов для отгрузок
CREATE TABLE IF NOT EXISTS shipment_checklist (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    is_required BOOLEAN DEFAULT TRUE,
    completed_by VARCHAR(100),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица аренды (rental) для отгрузок
CREATE TABLE IF NOT EXISTS shipment_rental (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    equipment_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица истории изменений
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица истории паролей
CREATE TABLE IF NOT EXISTS password_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    change_reason VARCHAR(100) DEFAULT 'password_change',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- ТАБЛИЦЫ ДЛЯ СИНХРОНИЗАЦИИ
-- ====================================

-- Таблица устройств пользователей
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(100), -- 'desktop', 'mobile', 'tablet', 'web'
    platform VARCHAR(100), -- 'windows', 'macos', 'ios', 'android', 'linux'
    last_sync TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица записей синхронизации
CREATE TABLE IF NOT EXISTS sync_entries (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(255) NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE')),
    data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    sync_status VARCHAR(20) NOT NULL CHECK (sync_status IN ('pending', 'processed', 'failed', 'conflict')) DEFAULT 'pending',
    conflict_resolution VARCHAR(20) CHECK (conflict_resolution IN ('local_wins', 'remote_wins', 'merged', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица конфликтов синхронизации
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id SERIAL PRIMARY KEY,
    sync_entry_id INTEGER NOT NULL REFERENCES sync_entries(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(255) NOT NULL,
    local_data JSONB NOT NULL,
    remote_data JSONB NOT NULL,
    local_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    remote_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    conflict_type VARCHAR(20) NOT NULL CHECK (conflict_type IN ('concurrent_update', 'delete_update', 'update_delete')),
    resolved BOOLEAN DEFAULT false,
    resolution VARCHAR(20) CHECK (resolution IN ('local_wins', 'remote_wins', 'merged', 'manual')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ
-- ====================================

-- Индексы для пользователей
CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);

-- Индексы для оборудования
CREATE INDEX IF NOT EXISTS idx_equipment_uuid ON equipment(uuid);
CREATE INDEX IF NOT EXISTS idx_equipment_serial ON equipment(serial_number);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_location ON equipment(location_id);

-- Индексы для стеков
CREATE INDEX IF NOT EXISTS idx_stacks_uuid ON equipment_stacks(uuid);
CREATE INDEX IF NOT EXISTS idx_stack_equipment_stack ON stack_equipment(stack_id);
CREATE INDEX IF NOT EXISTS idx_stack_equipment_equipment ON stack_equipment(equipment_id);

-- Индексы для отгрузок
CREATE INDEX IF NOT EXISTS idx_shipments_uuid ON shipments(uuid);
CREATE INDEX IF NOT EXISTS idx_shipments_number ON shipments(number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_date ON shipments(date);
CREATE INDEX IF NOT EXISTS idx_shipment_equipment_shipment ON shipment_equipment(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_stacks_shipment ON shipment_stacks(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_checklist_shipment ON shipment_checklist(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_rental_shipment ON shipment_rental(shipment_id);

-- Индексы для аудита
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_created_at ON password_history(created_at);

-- Индексы для синхронизации
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_last_sync ON devices(last_sync);
CREATE INDEX IF NOT EXISTS idx_devices_is_active ON devices(is_active);

CREATE INDEX IF NOT EXISTS idx_sync_entries_user_id ON sync_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_entries_device_id ON sync_entries(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_entries_table_record ON sync_entries(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_sync_entries_timestamp ON sync_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_sync_entries_sync_status ON sync_entries(sync_status);
CREATE INDEX IF NOT EXISTS idx_sync_entries_operation ON sync_entries(operation);

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_sync_entry_id ON sync_conflicts(sync_entry_id);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_table_record ON sync_conflicts(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_resolved ON sync_conflicts(resolved);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_conflict_type ON sync_conflicts(conflict_type);

-- ====================================
-- ФУНКЦИИ И ТРИГГЕРЫ
-- ====================================

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE OR REPLACE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_stacks_updated_at BEFORE UPDATE ON equipment_stacks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_sync_entries_updated_at BEFORE UPDATE ON sync_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция очистки старых записей синхронизации
CREATE OR REPLACE FUNCTION cleanup_old_sync_entries(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sync_entries 
    WHERE sync_status = 'processed' 
    AND created_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- НАЧАЛЬНЫЕ ДАННЫЕ
-- ====================================

-- Вставка тестового админ пользователя
INSERT INTO users (uuid, username, email, password_hash, full_name, nickname, login, role) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Qstream', 'admin@warehouse.com', '$2a$10$dummy.hash.for.production', 'Администратор системы', 'Admin', 'Qstream', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Вставка базовых категорий
INSERT INTO categories (uuid, name, description) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'Компьютеры', 'Персональные компьютеры и ноутбуки'),
('550e8400-e29b-41d4-a716-446655440011', 'Принтеры', 'Принтеры и МФУ'),
('550e8400-e29b-41d4-a716-446655440012', 'Сетевое оборудование', 'Свитчи, роутеры, кабели'),
('550e8400-e29b-41d4-a716-446655440013', 'Периферия', 'Клавиатуры, мыши, мониторы'),
('550e8400-e29b-41d4-a716-446655440014', 'Мобильные устройства', 'Смартфоны и планшеты'),
('550e8400-e29b-41d4-a716-446655440015', 'Аксессуары', 'Дополнительное оборудование')
ON CONFLICT (name) DO NOTHING;

-- Вставка базовых местоположений
INSERT INTO locations (uuid, name, description, address) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'Основной склад', 'Главный склад компании', 'ул. Складская, 1'),
('550e8400-e29b-41d4-a716-446655440021', 'Офис', 'Главный офис', 'ул. Офисная, 10')
ON CONFLICT (name) DO NOTHING;

-- Записи о выполненных миграциях
INSERT INTO migrations (filename, executed_at) VALUES 
('001_create_tables.sql', CURRENT_TIMESTAMP),
('002_production_data.sql', CURRENT_TIMESTAMP),
('003_password_history.sql', CURRENT_TIMESTAMP),
('004_add_nickname.sql', CURRENT_TIMESTAMP),
('006_sync_improvements.sql', CURRENT_TIMESTAMP)
ON CONFLICT (filename) DO NOTHING;

-- ====================================
-- КОММЕНТАРИИ К ТАБЛИЦАМ
-- ====================================

COMMENT ON TABLE users IS 'Пользователи системы';
COMMENT ON TABLE categories IS 'Категории оборудования';
COMMENT ON TABLE locations IS 'Местоположения на складе';
COMMENT ON TABLE equipment IS 'Оборудование на складе';
COMMENT ON TABLE equipment_stacks IS 'Стеки (группы) оборудования';
COMMENT ON TABLE shipments IS 'Отгрузки оборудования';
COMMENT ON TABLE devices IS 'Устройства пользователей для синхронизации';
COMMENT ON TABLE sync_entries IS 'Записи синхронизации между устройствами';
COMMENT ON TABLE sync_conflicts IS 'Конфликты синхронизации';
COMMENT ON TABLE password_history IS 'История изменений паролей';

-- ====================================
-- ЗАВЕРШЕНИЕ НАСТРОЙКИ
-- ====================================

-- Статистика по созданным таблицам
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'users', 'categories', 'locations', 'equipment', 'equipment_stacks', 
    'shipments', 'devices', 'sync_entries', 'sync_conflicts', 'password_history'
)
ORDER BY tablename;

-- Готово!
