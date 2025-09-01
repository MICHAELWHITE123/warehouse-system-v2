-- =====================================================
-- ОБНОВЛЕНИЕ СУЩЕСТВУЮЩИХ ТАБЛИЦ
-- PostgreSQL версия для Supabase
-- Дата: 2025-01-01
-- =====================================================

-- Добавляем недостающие поля в существующие таблицы

-- Добавляем поле updated_by в categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Добавляем поле updated_by в locations
ALTER TABLE locations ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Добавляем поле updated_by в equipment
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Добавляем поле updated_by в equipment_stacks
ALTER TABLE equipment_stacks ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Добавляем поле updated_by в shipments
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Обновляем существующие записи, устанавливая updated_by = created_by
UPDATE categories SET updated_by = created_by WHERE updated_by IS NULL;
UPDATE locations SET updated_by = created_by WHERE updated_by IS NULL;
UPDATE equipment SET updated_by = created_by WHERE updated_by IS NULL;
UPDATE equipment_stacks SET updated_by = created_by WHERE updated_by IS NULL;
UPDATE shipments SET updated_by = created_by WHERE updated_by IS NULL;

-- Если created_by тоже NULL, устанавливаем значение по умолчанию
UPDATE categories SET updated_by = '00000000-0000-0000-0000-000000000000'::UUID WHERE updated_by IS NULL;
UPDATE locations SET updated_by = '00000000-0000-0000-0000-000000000000'::UUID WHERE updated_by IS NULL;
UPDATE equipment SET updated_by = '00000000-0000-0000-0000-000000000000'::UUID WHERE updated_by IS NULL;
UPDATE equipment_stacks SET updated_by = '00000000-0000-0000-0000-000000000000'::UUID WHERE updated_by IS NULL;
UPDATE shipments SET updated_by = '00000000-0000-0000-0000-000000000000'::UUID WHERE updated_by IS NULL;

-- Обновляем функции и триггеры
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

-- Пересоздаем триггеры для обновления updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
DROP TRIGGER IF EXISTS update_equipment_updated_at ON equipment;
DROP TRIGGER IF EXISTS update_equipment_stacks_updated_at ON equipment_stacks;
DROP TRIGGER IF EXISTS update_shipments_updated_at ON shipments;

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_stacks_updated_at BEFORE UPDATE ON equipment_stacks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Пересоздаем триггеры для логирования изменений
DROP TRIGGER IF EXISTS log_categories_changes ON categories;
DROP TRIGGER IF EXISTS log_locations_changes ON locations;
DROP TRIGGER IF EXISTS log_equipment_changes ON equipment;
DROP TRIGGER IF EXISTS log_equipment_stacks_changes ON equipment_stacks;
DROP TRIGGER IF EXISTS log_shipments_changes ON shipments;

CREATE TRIGGER log_categories_changes AFTER INSERT OR UPDATE OR DELETE ON categories FOR EACH ROW EXECUTE FUNCTION log_changes();
CREATE TRIGGER log_locations_changes AFTER INSERT OR UPDATE OR DELETE ON locations FOR EACH ROW EXECUTE FUNCTION log_changes();
CREATE TRIGGER log_equipment_changes AFTER INSERT OR UPDATE OR DELETE ON equipment FOR EACH ROW EXECUTE FUNCTION log_changes();
CREATE TRIGGER log_equipment_stacks_changes AFTER INSERT OR UPDATE OR DELETE ON equipment_stacks FOR EACH ROW EXECUTE FUNCTION log_changes();
CREATE TRIGGER log_shipments_changes AFTER INSERT OR UPDATE OR DELETE ON shipments FOR EACH ROW EXECUTE FUNCTION log_changes();

-- Проверяем структуру обновленных таблиц
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('categories', 'locations', 'equipment', 'equipment_stacks', 'shipments')
ORDER BY table_name, ordinal_position;

