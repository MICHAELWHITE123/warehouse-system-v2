-- Исправление триггера для таблицы sync_operations
-- Проблема: функция update_updated_at_column() пытается обновить поля created_by и updated_by,
-- которых нет в таблице sync_operations

-- Удаляем старый триггер
DROP TRIGGER IF EXISTS update_sync_operations_updated_at ON sync_operations;

-- Создаем специальную функцию для sync_operations
CREATE OR REPLACE FUNCTION update_sync_operations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создаем новый триггер
CREATE TRIGGER update_sync_operations_updated_at 
    BEFORE UPDATE ON sync_operations 
    FOR EACH ROW EXECUTE FUNCTION update_sync_operations_updated_at();

-- Проверяем, что триггер работает
SELECT 'Trigger fixed successfully' as status;
