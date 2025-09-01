-- =====================================================
-- ОСНОВНАЯ СХЕМА БАЗЫ ДАННЫХ WEAREHOUSE
-- PostgreSQL версия для Supabase
-- Дата: 2025-01-01
-- =====================================================

-- Включаем необходимые расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ОСНОВНЫЕ ТАБЛИЦЫ
-- =====================================================

-- Таблица пользователей (расширение auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица категорий оборудования
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'box',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица местоположений
CREATE TABLE IF NOT EXISTS locations (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    address TEXT,
    coordinates POINT, -- для геолокации
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица оборудования
CREATE TABLE IF NOT EXISTS equipment (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    name TEXT NOT NULL,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    serial_number TEXT UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('available', 'in-use', 'maintenance', 'retired', 'lost')) DEFAULT 'available',
    location_id BIGINT REFERENCES locations(id) ON DELETE SET NULL,
    purchase_date DATE,
    last_maintenance DATE,
    next_maintenance DATE,
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    description TEXT,
    specifications JSONB, -- JSON поле для хранения дополнительных характеристик
    tags TEXT[], -- массив тегов
    condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 10) DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица стеков оборудования
CREATE TABLE IF NOT EXISTS equipment_stacks (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    tags TEXT[], -- массив тегов
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Связующая таблица между стеками и оборудованием
CREATE TABLE IF NOT EXISTS stack_equipment (
    id BIGSERIAL PRIMARY KEY,
    stack_id BIGINT NOT NULL REFERENCES equipment_stacks(id) ON DELETE CASCADE,
    equipment_id BIGINT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stack_id, equipment_id)
);

-- Таблица отгрузок
CREATE TABLE IF NOT EXISTS shipments (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    number TEXT NOT NULL UNIQUE,
    date DATE NOT NULL,
    recipient TEXT NOT NULL,
    recipient_address TEXT NOT NULL,
    recipient_phone TEXT,
    recipient_email TEXT,
    status TEXT NOT NULL CHECK (status IN ('preparing', 'in-transit', 'delivered', 'cancelled', 'returned')) DEFAULT 'preparing',
    responsible_person UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    total_items INTEGER DEFAULT 0,
    total_value DECIMAL(10,2) DEFAULT 0,
    comments TEXT,
    tracking_number TEXT,
    estimated_delivery DATE,
    delivered_at TIMESTAMPTZ,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица оборудования в отгрузках
CREATE TABLE IF NOT EXISTS shipment_equipment (
    id BIGSERIAL PRIMARY KEY,
    shipment_id BIGINT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    equipment_id BIGINT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица стеков в отгрузках
CREATE TABLE IF NOT EXISTS shipment_stacks (
    id BIGSERIAL PRIMARY KEY,
    shipment_id BIGINT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    stack_id BIGINT NOT NULL REFERENCES equipment_stacks(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица чек-листов для отгрузок
CREATE TABLE IF NOT EXISTS shipment_checklist (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    shipment_id BIGINT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    is_required BOOLEAN DEFAULT TRUE,
    completed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица аренды (rental) для отгрузок
CREATE TABLE IF NOT EXISTS shipment_rental (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    shipment_id BIGINT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    equipment_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    daily_rate DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    link TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦЫ СИНХРОНИЗАЦИИ
-- =====================================================

-- Таблица статуса синхронизации устройств
CREATE TABLE IF NOT EXISTS device_sync_status (
    id BIGSERIAL PRIMARY KEY,
    device_id TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    device_name TEXT,
    device_type TEXT,
    last_sync TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sync_count BIGINT DEFAULT 0,
    last_error TEXT,
    is_online BOOLEAN DEFAULT false,
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица операций синхронизации
CREATE TABLE IF NOT EXISTS sync_operations (
    id BIGSERIAL PRIMARY KEY,
    operation_id TEXT NOT NULL UNIQUE,
    table_name TEXT NOT NULL,
    record_id BIGINT NOT NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('create', 'update', 'delete')),
    source_device_id TEXT NOT NULL,
    data_before JSONB, -- данные до изменения
    data_after JSONB,  -- данные после изменения
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'failed', 'conflict')),
    acknowledged_by TEXT,
    acknowledged_at TIMESTAMPTZ,
    operation_hash TEXT, -- хеш операции для проверки целостности
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица конфликтов синхронизации
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id BIGSERIAL PRIMARY KEY,
    conflict_id TEXT NOT NULL UNIQUE,
    local_operation_id TEXT NOT NULL,
    remote_operation_id TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id BIGINT NOT NULL,
    conflict_type TEXT NOT NULL CHECK (conflict_type IN ('data_conflict', 'timestamp_conflict', 'hash_conflict')),
    local_data JSONB,
    remote_data JSONB,
    resolution TEXT DEFAULT 'manual' CHECK (resolution IN ('manual', 'local', 'remote', 'merge')),
    resolved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ДОПОЛНИТЕЛЬНЫЕ ТАБЛИЦЫ
-- =====================================================

-- Таблица истории изменений
CREATE TABLE IF NOT EXISTS change_log (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id BIGINT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица уведомлений
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    related_table TEXT,
    related_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица настроек пользователя
CREATE TABLE IF NOT EXISTS user_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language TEXT DEFAULT 'ru',
    timezone TEXT DEFAULT 'Europe/Moscow',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================

-- Индексы для equipment
CREATE INDEX IF NOT EXISTS idx_equipment_uuid ON equipment(uuid);
CREATE INDEX IF NOT EXISTS idx_equipment_serial ON equipment(serial_number);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_location ON equipment(location_id);
CREATE INDEX IF NOT EXISTS idx_equipment_assigned ON equipment(assigned_to);
CREATE INDEX IF NOT EXISTS idx_equipment_created_by ON equipment(created_by);
CREATE INDEX IF NOT EXISTS idx_equipment_tags ON equipment USING GIN(tags);

-- Индексы для categories
CREATE INDEX IF NOT EXISTS idx_categories_uuid ON categories(uuid);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_created_by ON categories(created_by);

-- Индексы для locations
CREATE INDEX IF NOT EXISTS idx_locations_uuid ON locations(uuid);
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
CREATE INDEX IF NOT EXISTS idx_locations_created_by ON locations(created_by);

-- Индексы для equipment_stacks
CREATE INDEX IF NOT EXISTS idx_stacks_uuid ON equipment_stacks(uuid);
CREATE INDEX IF NOT EXISTS idx_stacks_name ON equipment_stacks(name);
CREATE INDEX IF NOT EXISTS idx_stacks_category ON equipment_stacks(category_id);
CREATE INDEX IF NOT EXISTS idx_stacks_created_by ON equipment_stacks(created_by);
CREATE INDEX IF NOT EXISTS idx_stacks_tags ON equipment_stacks USING GIN(tags);

-- Индексы для stack_equipment
CREATE INDEX IF NOT EXISTS idx_stack_equipment_stack ON stack_equipment(stack_id);
CREATE INDEX IF NOT EXISTS idx_stack_equipment_equipment ON stack_equipment(equipment_id);

-- Индексы для shipments
CREATE INDEX IF NOT EXISTS idx_shipments_uuid ON shipments(uuid);
CREATE INDEX IF NOT EXISTS idx_shipments_number ON shipments(number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_date ON shipments(date);
CREATE INDEX IF NOT EXISTS idx_shipments_responsible ON shipments(responsible_person);
CREATE INDEX IF NOT EXISTS idx_shipments_created_by ON shipments(created_by);

-- Индексы для shipment_equipment
CREATE INDEX IF NOT EXISTS idx_shipment_equipment_shipment ON shipment_equipment(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_equipment_equipment ON shipment_equipment(equipment_id);

-- Индексы для shipment_stacks
CREATE INDEX IF NOT EXISTS idx_shipment_stacks_shipment ON shipment_stacks(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_stacks_stack ON shipment_stacks(stack_id);

-- Индексы для shipment_checklist
CREATE INDEX IF NOT EXISTS idx_shipment_checklist_shipment ON shipment_checklist(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_checklist_uuid ON shipment_checklist(uuid);

-- Индексы для shipment_rental
CREATE INDEX IF NOT EXISTS idx_shipment_rental_shipment ON shipment_rental(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_rental_uuid ON shipment_rental(uuid);

-- Индексы для sync_operations
CREATE INDEX IF NOT EXISTS idx_sync_operations_status ON sync_operations(status);
CREATE INDEX IF NOT EXISTS idx_sync_operations_table ON sync_operations(table_name);
CREATE INDEX IF NOT EXISTS idx_sync_operations_hash ON sync_operations(operation_hash);
CREATE INDEX IF NOT EXISTS idx_sync_operations_device ON sync_operations(source_device_id);
CREATE INDEX IF NOT EXISTS idx_sync_operations_created ON sync_operations(created_at);

-- Индексы для device_sync_status
CREATE INDEX IF NOT EXISTS idx_device_sync_status_device_id ON device_sync_status(device_id);
CREATE INDEX IF NOT EXISTS idx_device_sync_status_user_id ON device_sync_status(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sync_status_last_sync ON device_sync_status(last_sync);

-- Индексы для sync_conflicts
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_table ON sync_conflicts(table_name);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_resolution ON sync_conflicts(resolution);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_created ON sync_conflicts(created_at);

-- Индексы для change_log
CREATE INDEX IF NOT EXISTS idx_change_log_table ON change_log(table_name);
CREATE INDEX IF NOT EXISTS idx_change_log_record ON change_log(record_id);
CREATE INDEX IF NOT EXISTS idx_change_log_changed_at ON change_log(changed_at);

-- Индексы для notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- =====================================================
-- ФУНКЦИИ И ТРИГГЕРЫ
-- =====================================================

-- Функция для автоматического обновления updated_at и updated_by
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    -- Если updated_by не установлен, используем created_by
    IF NEW.updated_by IS NULL THEN
        NEW.updated_by = NEW.created_by;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Функция для логирования изменений
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO change_log (table_name, record_id, operation, new_values, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'create', to_jsonb(NEW), COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::UUID));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO change_log (table_name, record_id, operation, old_values, new_values, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW), COALESCE(NEW.updated_by, NEW.created_by, '00000000-0000-0000-0000-000000000000'::UUID));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO change_log (table_name, record_id, operation, old_values, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'delete', to_jsonb(OLD), COALESCE(OLD.updated_by, OLD.created_by, '00000000-0000-0000-0000-000000000000'::UUID));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Функция для генерации хеша операции
CREATE OR REPLACE FUNCTION generate_operation_hash(table_name TEXT, record_id BIGINT, operation_type TEXT, data JSONB)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(hmac(
        (table_name || record_id::TEXT || operation_type || data::TEXT)::bytea,
        'wearehouse_sync_secret'::bytea,
        'sha256'
    ), 'hex');
END;
$$ language 'plpgsql';

-- Создаем триггеры для обновления updated_at
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_stacks_updated_at BEFORE UPDATE ON equipment_stacks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_device_sync_status_updated_at BEFORE UPDATE ON device_sync_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sync_operations_updated_at BEFORE UPDATE ON sync_operations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sync_conflicts_updated_at BEFORE UPDATE ON sync_conflicts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Создаем триггеры для логирования изменений
CREATE TRIGGER log_equipment_changes AFTER INSERT OR UPDATE OR DELETE ON equipment FOR EACH ROW EXECUTE FUNCTION log_changes();
CREATE TRIGGER log_categories_changes AFTER INSERT OR UPDATE OR DELETE ON categories FOR EACH ROW EXECUTE FUNCTION log_changes();
CREATE TRIGGER log_locations_changes AFTER INSERT OR UPDATE OR DELETE ON locations FOR EACH ROW EXECUTE FUNCTION log_changes();
CREATE TRIGGER log_equipment_stacks_changes AFTER INSERT OR UPDATE OR DELETE ON equipment_stacks FOR EACH ROW EXECUTE FUNCTION log_changes();
CREATE TRIGGER log_shipments_changes AFTER INSERT OR UPDATE OR DELETE ON shipments FOR EACH ROW EXECUTE FUNCTION log_changes();

-- =====================================================
-- ПРЕДСТАВЛЕНИЯ (VIEWS)
-- =====================================================

-- Представление для статистики синхронизации
CREATE OR REPLACE VIEW sync_statistics AS
SELECT 
    d.device_id,
    d.device_name,
    d.user_id,
    up.username,
    d.last_sync,
    d.sync_count,
    d.is_online,
    d.last_heartbeat,
    COUNT(o.id) as total_operations,
    COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_operations,
    COUNT(CASE WHEN o.status = 'acknowledged' THEN 1 END) as acknowledged_operations,
    COUNT(CASE WHEN o.status = 'failed' THEN 1 END) as failed_operations,
    COUNT(CASE WHEN o.status = 'conflict' THEN 1 END) as conflict_operations
FROM device_sync_status d
LEFT JOIN user_profiles up ON d.user_id = up.id
LEFT JOIN sync_operations o ON d.device_id = o.source_device_id
GROUP BY d.device_id, d.device_name, d.user_id, up.username, d.last_sync, d.sync_count, d.is_online, d.last_heartbeat;

-- Представление для оборудования с полной информацией
CREATE OR REPLACE VIEW equipment_full_info AS
SELECT 
    e.*,
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon,
    l.name as location_name,
    l.address as location_address,
    up.username as assigned_username,
    up.full_name as assigned_fullname,
    creator.username as creator_username
FROM equipment e
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN user_profiles up ON e.assigned_to = up.id
LEFT JOIN user_profiles creator ON e.created_by = creator.id;

-- Представление для отгрузок с деталями
CREATE OR REPLACE VIEW shipments_full_info AS
SELECT 
    s.*,
    rp.username as responsible_username,
    rp.full_name as responsible_fullname,
    creator.username as creator_username,
    COUNT(DISTINCT se.equipment_id) as equipment_count,
    COUNT(DISTINCT ss.stack_id) as stack_count,
    COUNT(DISTINCT sc.id) as checklist_count,
    COUNT(DISTINCT sr.id) as rental_count
FROM shipments s
LEFT JOIN user_profiles rp ON s.responsible_person = rp.id
LEFT JOIN user_profiles creator ON s.created_by = creator.id
LEFT JOIN shipment_equipment se ON s.id = se.shipment_id
LEFT JOIN shipment_stacks ss ON s.id = ss.shipment_id
LEFT JOIN shipment_checklist sc ON s.id = sc.shipment_id
LEFT JOIN shipment_rental sr ON s.id = sr.shipment_id
GROUP BY s.id, rp.username, rp.full_name, creator.username;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Включаем RLS для всех таблиц
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stack_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_rental ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Политики для user_profiles (пользователи видят только свой профиль)
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Политики для основных таблиц (пользователи видят все записи)
CREATE POLICY "Users can view all categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Users can insert categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update categories" ON categories FOR UPDATE USING (true);
CREATE POLICY "Users can delete categories" ON categories FOR DELETE USING (true);

CREATE POLICY "Users can view all locations" ON locations FOR SELECT USING (true);
CREATE POLICY "Users can insert locations" ON locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update locations" ON locations FOR UPDATE USING (true);
CREATE POLICY "Users can delete locations" ON locations FOR DELETE USING (true);

CREATE POLICY "Users can view all equipment" ON equipment FOR SELECT USING (true);
CREATE POLICY "Users can insert equipment" ON equipment FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update equipment" ON equipment FOR UPDATE USING (true);
CREATE POLICY "Users can delete equipment" ON equipment FOR DELETE USING (true);

CREATE POLICY "Users can view all equipment_stacks" ON equipment_stacks FOR SELECT USING (true);
CREATE POLICY "Users can insert equipment_stacks" ON equipment_stacks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update equipment_stacks" ON equipment_stacks FOR UPDATE USING (true);
CREATE POLICY "Users can delete equipment_stacks" ON equipment_stacks FOR DELETE USING (true);

CREATE POLICY "Users can view all stack_equipment" ON stack_equipment FOR SELECT USING (true);
CREATE POLICY "Users can insert stack_equipment" ON stack_equipment FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update stack_equipment" ON stack_equipment FOR UPDATE USING (true);
CREATE POLICY "Users can delete stack_equipment" ON stack_equipment FOR DELETE USING (true);

CREATE POLICY "Users can view all shipments" ON shipments FOR SELECT USING (true);
CREATE POLICY "Users can insert shipments" ON shipments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update shipments" ON shipments FOR UPDATE USING (true);
CREATE POLICY "Users can delete shipments" ON shipments FOR DELETE USING (true);

CREATE POLICY "Users can view all shipment_equipment" ON shipment_equipment FOR SELECT USING (true);
CREATE POLICY "Users can insert shipment_equipment" ON shipment_equipment FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update shipment_equipment" ON shipment_equipment FOR UPDATE USING (true);
CREATE POLICY "Users can delete shipment_equipment" ON shipment_equipment FOR DELETE USING (true);

CREATE POLICY "Users can view all shipment_stacks" ON shipment_stacks FOR SELECT USING (true);
CREATE POLICY "Users can insert shipment_stacks" ON shipment_stacks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update shipment_stacks" ON shipment_stacks FOR UPDATE USING (true);
CREATE POLICY "Users can delete shipment_stacks" ON shipment_stacks FOR DELETE USING (true);

CREATE POLICY "Users can view all shipment_checklist" ON shipment_checklist FOR SELECT USING (true);
CREATE POLICY "Users can insert shipment_checklist" ON shipment_checklist FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update shipment_checklist" ON shipment_checklist FOR UPDATE USING (true);
CREATE POLICY "Users can delete shipment_checklist" ON shipment_checklist FOR DELETE USING (true);

CREATE POLICY "Users can view all shipment_rental" ON shipment_rental FOR SELECT USING (true);
CREATE POLICY "Users can insert shipment_rental" ON shipment_rental FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update shipment_rental" ON shipment_rental FOR UPDATE USING (true);
CREATE POLICY "Users can delete shipment_rental" ON shipment_rental FOR DELETE USING (true);

CREATE POLICY "Users can view all device_sync_status" ON device_sync_status FOR SELECT USING (true);
CREATE POLICY "Users can insert device_sync_status" ON device_sync_status FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update device_sync_status" ON device_sync_status FOR UPDATE USING (true);
CREATE POLICY "Users can delete device_sync_status" ON device_sync_status FOR DELETE USING (true);

CREATE POLICY "Users can view all sync_operations" ON sync_operations FOR SELECT USING (true);
CREATE POLICY "Users can insert sync_operations" ON sync_operations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update sync_operations" ON sync_operations FOR UPDATE USING (true);
CREATE POLICY "Users can delete sync_operations" ON sync_operations FOR DELETE USING (true);

CREATE POLICY "Users can view all sync_conflicts" ON sync_conflicts FOR SELECT USING (true);
CREATE POLICY "Users can insert sync_conflicts" ON sync_conflicts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update sync_conflicts" ON sync_conflicts FOR UPDATE USING (true);
CREATE POLICY "Users can delete sync_conflicts" ON sync_conflicts FOR DELETE USING (true);

CREATE POLICY "Users can view all change_log" ON change_log FOR SELECT USING (true);
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON user_settings FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- ЗАВЕРШЕНИЕ
-- =====================================================

-- Проверяем созданные таблицы
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Проверяем созданные индексы
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
