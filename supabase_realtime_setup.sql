-- =========================================
-- Supabase Realtime Setup для WeareHouse
-- =========================================

-- 1. Включаем Realtime для основных таблиц
ALTER PUBLICATION supabase_realtime ADD TABLE equipment;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE locations;
ALTER PUBLICATION supabase_realtime ADD TABLE shipments;
ALTER PUBLICATION supabase_realtime ADD TABLE equipment_stacks;
ALTER PUBLICATION supabase_realtime ADD TABLE stack_equipment;
ALTER PUBLICATION supabase_realtime ADD TABLE shipment_equipment;
ALTER PUBLICATION supabase_realtime ADD TABLE shipment_stacks;
ALTER PUBLICATION supabase_realtime ADD TABLE shipment_checklist;
ALTER PUBLICATION supabase_realtime ADD TABLE shipment_rental;

-- 2. Создаем таблицу для логирования realtime событий (опционально)
CREATE TABLE IF NOT EXISTS realtime_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  table_name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('INSERT', 'UPDATE', 'DELETE', 'CUSTOM')),
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'database'
);

-- Индекс для быстрого поиска по времени и таблице
CREATE INDEX IF NOT EXISTS idx_realtime_events_created_at ON realtime_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_realtime_events_table ON realtime_events(table_name);

-- 3. Включаем Realtime для таблицы событий
ALTER PUBLICATION supabase_realtime ADD TABLE realtime_events;

-- 4. Создаем Row Level Security (RLS) политики для realtime_events
ALTER TABLE realtime_events ENABLE ROW LEVEL SECURITY;

-- Позволяем всем аутентифицированным пользователям читать события
CREATE POLICY "Allow authenticated users to read realtime events" ON realtime_events
  FOR SELECT TO authenticated USING (true);

-- Позволяем только сервису вставлять события
CREATE POLICY "Allow service role to insert realtime events" ON realtime_events
  FOR INSERT TO service_role WITH CHECK (true);

-- 5. Создаем функцию для очистки старых событий (автоматическая очистка)
CREATE OR REPLACE FUNCTION cleanup_old_realtime_events()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Удаляем события старше 7 дней
  DELETE FROM realtime_events 
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- 6. Создаем расписание для автоматической очистки (требует pg_cron расширение)
-- Раскомментируйте если pg_cron доступен:
-- SELECT cron.schedule('cleanup-realtime-events', '0 2 * * *', 'SELECT cleanup_old_realtime_events();');

-- 7. Создаем триггерную функцию для автоматического логирования изменений
CREATE OR REPLACE FUNCTION log_table_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Логируем только если это не служебная таблица
  IF TG_TABLE_NAME != 'realtime_events' THEN
    INSERT INTO realtime_events (table_name, event_type, event_data, source)
    VALUES (
      TG_TABLE_NAME,
      TG_OP,
      CASE 
        WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
        ELSE to_jsonb(NEW)
      END,
      'trigger'
    );
  END IF;

  -- Возвращаем соответствующую запись
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 8. Создаем триггеры для основных таблиц (опционально, для дополнительного логирования)
-- Раскомментируйте если нужно дополнительное логирование:

-- CREATE TRIGGER equipment_changes_trigger
--   AFTER INSERT OR UPDATE OR DELETE ON equipment
--   FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- CREATE TRIGGER shipments_changes_trigger
--   AFTER INSERT OR UPDATE OR DELETE ON shipments
--   FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- CREATE TRIGGER categories_changes_trigger
--   AFTER INSERT OR UPDATE OR DELETE ON categories
--   FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- CREATE TRIGGER locations_changes_trigger
--   AFTER INSERT OR UPDATE OR DELETE ON locations
--   FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- CREATE TRIGGER stacks_changes_trigger
--   AFTER INSERT OR UPDATE OR DELETE ON equipment_stacks
--   FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- 9. Создаем функцию для проверки состояния Realtime
CREATE OR REPLACE FUNCTION check_realtime_status()
RETURNS TABLE (
  table_name TEXT,
  realtime_enabled BOOLEAN,
  row_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    EXISTS (
      SELECT 1 FROM pg_publication_tables pt 
      WHERE pt.pubname = 'supabase_realtime' 
      AND pt.tablename = t.table_name
    ) as realtime_enabled,
    (
      SELECT count(*) 
      FROM information_schema.tables ist 
      WHERE ist.table_name = t.table_name 
      AND ist.table_schema = 'public'
    ) as row_count
  FROM information_schema.tables t
  WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
  AND t.table_name IN (
    'equipment', 'categories', 'locations', 'shipments', 
    'equipment_stacks', 'stack_equipment', 'shipment_equipment',
    'shipment_stacks', 'shipment_checklist', 'shipment_rental'
  )
  ORDER BY t.table_name;
END;
$$;

-- 10. Создаем представление для мониторинга активности Realtime
CREATE OR REPLACE VIEW realtime_activity AS
SELECT 
  table_name,
  event_type,
  COUNT(*) as event_count,
  MAX(created_at) as last_event_time,
  MIN(created_at) as first_event_time
FROM realtime_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY table_name, event_type
ORDER BY last_event_time DESC;

-- =========================================
-- Инструкции по проверке настройки:
-- =========================================

-- Проверить какие таблицы включены в Realtime:
-- SELECT * FROM check_realtime_status();

-- Посмотреть последние события:
-- SELECT * FROM realtime_events ORDER BY created_at DESC LIMIT 10;

-- Посмотреть активность за последние 24 часа:
-- SELECT * FROM realtime_activity;

-- Очистить старые события вручную:
-- SELECT cleanup_old_realtime_events();
