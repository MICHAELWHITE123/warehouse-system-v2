-- Применение миграций для синхронизации
-- Выполните этот SQL в Supabase Dashboard > SQL Editor

-- Создание таблицы sync_operations
CREATE TABLE IF NOT EXISTS sync_operations (
  id BIGSERIAL PRIMARY KEY,
  operation_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('create', 'update', 'delete')),
  data JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  device_id TEXT NOT NULL,
  user_id TEXT,
  hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'failed', 'conflict')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создание индексов для лучшей производительности
CREATE INDEX IF NOT EXISTS idx_sync_operations_device_id ON sync_operations(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_operations_table_name ON sync_operations(table_name);
CREATE INDEX IF NOT EXISTS idx_sync_operations_timestamp ON sync_operations(timestamp);
CREATE INDEX IF NOT EXISTS idx_sync_operations_status ON sync_operations(status);
CREATE INDEX IF NOT EXISTS idx_sync_operations_hash ON sync_operations(hash);

-- Создание функции для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггера для sync_operations
CREATE TRIGGER update_sync_operations_updated_at 
  BEFORE UPDATE ON sync_operations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Создание функции для создания таблицы sync_operations если она не существует
CREATE OR REPLACE FUNCTION create_sync_operations_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
  -- Эта функция вызывается из Edge Functions для обеспечения существования таблицы
  -- Создание таблицы обрабатывается миграцией выше
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Включение Row Level Security
ALTER TABLE sync_operations ENABLE ROW LEVEL SECURITY;

-- Создание политик для аутентифицированных пользователей
CREATE POLICY "Users can view their own sync operations" ON sync_operations
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own sync operations" ON sync_operations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Создание функции для очистки старых операций синхронизации (старше 30 дней)
CREATE OR REPLACE FUNCTION cleanup_old_sync_operations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sync_operations 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Проверка существования основных таблиц
DO $$
BEGIN
  -- Проверяем существование таблицы equipment
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment') THEN
    RAISE NOTICE 'Таблица equipment не существует. Создайте её вручную или примените миграции.';
  END IF;
  
  -- Проверяем существование таблицы categories
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categories') THEN
    RAISE NOTICE 'Таблица categories не существует. Создайте её вручную или примените миграции.';
  END IF;
  
  -- Проверяем существование таблицы locations
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'locations') THEN
    RAISE NOTICE 'Таблица locations не существует. Создайте её вручную или примените миграции.';
  END IF;
END $$;

-- Сообщение об успешном выполнении
SELECT 'Миграции синхронизации успешно применены!' as status;
