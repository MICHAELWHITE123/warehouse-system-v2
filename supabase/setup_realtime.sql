-- =====================================================
-- НАСТРОЙКА REALTIME ДЛЯ SUPABASE
-- PostgreSQL версия для Supabase
-- Дата: 2025-01-01
-- =====================================================

-- В Supabase расширение realtime включено по умолчанию
-- CREATE EXTENSION IF NOT EXISTS "realtime"; -- Не нужно в Supabase

-- =====================================================
-- НАСТРОЙКА ПУБЛИКАЦИЙ ДЛЯ REALTIME
-- =====================================================

-- Создаем публикацию для всех таблиц
DROP PUBLICATION IF EXISTS wearehouse_realtime;
CREATE PUBLICATION wearehouse_realtime FOR TABLE 
    categories,
    locations,
    equipment,
    equipment_stacks,
    stack_equipment,
    shipments,
    shipment_equipment,
    shipment_stacks,
    shipment_checklist,
    shipment_rental,
    device_sync_status,
    sync_operations,
    sync_conflicts,
    change_log,
    notifications,
    user_settings;

-- =====================================================
-- НАСТРОЙКА ТРИГГЕРОВ ДЛЯ REALTIME УВЕДОМЛЕНИЙ
-- =====================================================

-- Функция для отправки уведомлений через Realtime
CREATE OR REPLACE FUNCTION notify_realtime()
RETURNS TRIGGER AS $$
BEGIN
    -- Отправляем уведомление через Realtime
    PERFORM pg_notify(
        'wearehouse_changes',
        json_build_object(
            'table', TG_TABLE_NAME,
            'action', TG_OP,
            'record_id', COALESCE(NEW.id, OLD.id),
            'data', CASE 
                WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
                ELSE to_jsonb(NEW)
            END,
            'timestamp', now()
        )::text
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Создаем триггеры для Realtime уведомлений
DROP TRIGGER IF EXISTS realtime_categories ON categories;
CREATE TRIGGER realtime_categories
    AFTER INSERT OR UPDATE OR DELETE ON categories
    FOR EACH ROW EXECUTE FUNCTION notify_realtime();

DROP TRIGGER IF EXISTS realtime_locations ON locations;
CREATE TRIGGER realtime_locations
    AFTER INSERT OR UPDATE OR DELETE ON locations
    FOR EACH ROW EXECUTE FUNCTION notify_realtime();

DROP TRIGGER IF EXISTS realtime_equipment ON equipment;
CREATE TRIGGER realtime_equipment
    AFTER INSERT OR UPDATE OR DELETE ON equipment
    FOR EACH ROW EXECUTE FUNCTION notify_realtime();

DROP TRIGGER IF EXISTS realtime_equipment_stacks ON equipment_stacks;
CREATE TRIGGER realtime_equipment_stacks
    AFTER INSERT OR UPDATE OR DELETE ON equipment_stacks
    FOR EACH ROW EXECUTE FUNCTION notify_realtime();

DROP TRIGGER IF EXISTS realtime_stack_equipment ON stack_equipment;
CREATE TRIGGER realtime_stack_equipment
    AFTER INSERT OR UPDATE OR DELETE ON stack_equipment
    FOR EACH ROW EXECUTE FUNCTION notify_realtime();

DROP TRIGGER IF EXISTS realtime_shipments ON shipments;
CREATE TRIGGER realtime_shipments
    AFTER INSERT OR UPDATE OR DELETE ON shipments
    FOR EACH ROW EXECUTE FUNCTION notify_realtime();

DROP TRIGGER IF EXISTS realtime_shipment_equipment ON shipment_equipment;
CREATE TRIGGER realtime_shipment_equipment
    AFTER INSERT OR UPDATE OR DELETE ON shipment_equipment
    FOR EACH ROW EXECUTE FUNCTION notify_realtime();

DROP TRIGGER IF EXISTS realtime_shipment_stacks ON shipment_stacks;
CREATE TRIGGER realtime_shipment_stacks
    AFTER INSERT OR UPDATE OR DELETE ON shipment_stacks
    FOR EACH ROW EXECUTE FUNCTION notify_realtime();

DROP TRIGGER IF EXISTS realtime_shipment_checklist ON shipment_checklist;
CREATE TRIGGER realtime_shipment_checklist
    AFTER INSERT OR UPDATE OR DELETE ON shipment_checklist
    FOR EACH ROW EXECUTE FUNCTION notify_realtime();

DROP TRIGGER IF EXISTS realtime_shipment_rental ON shipment_rental;
CREATE TRIGGER realtime_shipment_rental
    AFTER INSERT OR UPDATE OR DELETE ON shipment_rental
    FOR EACH ROW EXECUTE FUNCTION notify_realtime();

DROP TRIGGER IF EXISTS realtime_device_sync_status ON device_sync_status;
CREATE TRIGGER realtime_device_sync_status
    AFTER INSERT OR UPDATE OR DELETE ON device_sync_status
    FOR EACH ROW EXECUTE FUNCTION notify_realtime();

DROP TRIGGER IF EXISTS realtime_sync_operations ON sync_operations;
CREATE TRIGGER realtime_sync_operations
    AFTER INSERT OR UPDATE OR DELETE ON sync_operations
    FOR EACH ROW EXECUTE FUNCTION notify_realtime();

DROP TRIGGER IF EXISTS realtime_sync_conflicts ON sync_conflicts;
CREATE TRIGGER realtime_sync_conflicts
    AFTER INSERT OR UPDATE OR DELETE ON sync_conflicts
    FOR EACH ROW EXECUTE FUNCTION notify_realtime();

DROP TRIGGER IF EXISTS realtime_change_log ON change_log;
CREATE TRIGGER realtime_change_log
    AFTER INSERT OR UPDATE OR DELETE ON change_log
    FOR EACH ROW EXECUTE FUNCTION notify_realtime();

DROP TRIGGER IF EXISTS realtime_notifications ON notifications;
CREATE TRIGGER realtime_notifications
    AFTER INSERT OR UPDATE OR DELETE ON notifications
    FOR EACH ROW EXECUTE FUNCTION notify_realtime();

DROP TRIGGER IF EXISTS realtime_user_settings ON user_settings;
CREATE TRIGGER realtime_user_settings
    AFTER INSERT OR UPDATE OR DELETE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION notify_realtime();

-- =====================================================
-- НАСТРОЙКА КАНАЛОВ ДЛЯ СПЕЦИФИЧЕСКИХ СОБЫТИЙ
-- =====================================================

-- Функция для уведомлений о статусе оборудования
CREATE OR REPLACE FUNCTION notify_equipment_status_change_realtime()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM pg_notify(
            'equipment_status_changes',
            json_build_object(
                'equipment_id', NEW.id,
                'equipment_name', NEW.name,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'timestamp', now()
            )::text
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для уведомлений о статусе оборудования
DROP TRIGGER IF EXISTS equipment_status_realtime ON equipment;
CREATE TRIGGER equipment_status_realtime
    AFTER UPDATE OF status ON equipment
    FOR EACH ROW EXECUTE FUNCTION notify_equipment_status_change_realtime();

-- Функция для уведомлений о синхронизации
CREATE OR REPLACE FUNCTION notify_sync_operations_realtime()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'sync_operations_changes',
        json_build_object(
            'operation_id', NEW.operation_id,
            'table_name', NEW.table_name,
            'operation_type', NEW.operation_type,
            'status', NEW.status,
            'source_device_id', NEW.source_device_id,
            'timestamp', now()
        )::text
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для уведомлений о синхронизации
DROP TRIGGER IF EXISTS sync_operations_realtime ON sync_operations;
CREATE TRIGGER sync_operations_realtime
    AFTER INSERT OR UPDATE ON sync_operations
    FOR EACH ROW EXECUTE FUNCTION notify_sync_operations_realtime();

-- Функция для уведомлений о новых отгрузках
CREATE OR REPLACE FUNCTION notify_new_shipments_realtime()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM pg_notify(
            'new_shipments',
            json_build_object(
                'shipment_id', NEW.id,
                'shipment_number', NEW.number,
                'recipient', NEW.recipient,
                'status', NEW.status,
                'timestamp', now()
            )::text
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для уведомлений о новых отгрузках
DROP TRIGGER IF EXISTS new_shipments_realtime ON shipments;
CREATE TRIGGER new_shipments_realtime
    AFTER INSERT ON shipments
    FOR EACH ROW EXECUTE FUNCTION notify_new_shipments_realtime();

-- =====================================================
-- НАСТРОЙКА КАНАЛОВ ДЛЯ ПОЛЬЗОВАТЕЛЬСКИХ УВЕДОМЛЕНИЙ
-- =====================================================

-- Функция для персональных уведомлений пользователя
CREATE OR REPLACE FUNCTION notify_user_personal_realtime()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        PERFORM pg_notify(
            'user_notifications_' || NEW.user_id::text,
            json_build_object(
                'notification_id', NEW.id,
                'title', NEW.title,
                'message', NEW.message,
                'type', NEW.type,
                'is_read', NEW.is_read,
                'timestamp', now()
            )::text
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для персональных уведомлений
DROP TRIGGER IF EXISTS user_notifications_realtime ON notifications;
CREATE TRIGGER user_notifications_realtime
    AFTER INSERT OR UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION notify_user_personal_realtime();

-- =====================================================
-- НАСТРОЙКА КАНАЛОВ ДЛЯ СТАТИСТИКИ
-- =====================================================

-- Функция для уведомлений об изменениях статистики
CREATE OR REPLACE FUNCTION notify_statistics_changes_realtime()
RETURNS TRIGGER AS $$
BEGIN
    -- Уведомляем об изменениях в статистике оборудования
    PERFORM pg_notify(
        'equipment_statistics_changes',
        json_build_object(
            'table', TG_TABLE_NAME,
            'action', TG_OP,
            'record_id', COALESCE(NEW.id, OLD.id),
            'timestamp', now()
        )::text
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для уведомлений об изменениях статистики
DROP TRIGGER IF EXISTS equipment_statistics_realtime ON equipment;
CREATE TRIGGER equipment_statistics_realtime
    AFTER INSERT OR UPDATE OR DELETE ON equipment
    FOR EACH ROW EXECUTE FUNCTION notify_statistics_changes_realtime();

-- =====================================================
-- ПРОВЕРКА НАСТРОЙКИ REALTIME
-- =====================================================

-- Проверяем активные публикации
SELECT 
    pubname,
    puballtables,
    pubinsert,
    pubupdate,
    pubdelete
FROM pg_publication
WHERE pubname = 'wearehouse_realtime';

-- Проверяем таблицы в публикации
-- Упрощенная проверка таблиц в публикации
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE pubname = 'wearehouse_realtime'
ORDER BY tablename;

-- Проверяем созданные триггеры для Realtime
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND trigger_name LIKE '%realtime%'
ORDER BY trigger_name;

-- Проверяем функции для Realtime
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name LIKE '%realtime%'
ORDER BY routine_name;

-- =====================================================
-- ИНСТРУКЦИИ ПО ИСПОЛЬЗОВАНИЮ REALTIME
-- =====================================================

/*
Для использования Realtime в клиентском приложении:

1. Подключение к каналу:
   const channel = supabase
     .channel('wearehouse_changes')
     .on('postgres_changes', 
       { event: '*', schema: 'public', table: 'equipment' },
       (payload) => {
         console.log('Change received!', payload)
       }
     )
     .subscribe()

2. Подключение к каналу статуса оборудования:
   const statusChannel = supabase
     .channel('equipment_status_changes')
     .on('postgres_changes', 
       { event: 'UPDATE', schema: 'public', table: 'equipment' },
       (payload) => {
         console.log('Status change:', payload)
       }
     )
     .subscribe()

3. Подключение к персональным уведомлениям:
   const userChannel = supabase
     .channel(`user_notifications_${userId}`)
     .on('postgres_changes', 
       { event: '*', schema: 'public', table: 'notifications' },
       (payload) => {
         console.log('User notification:', payload)
       }
     )
     .subscribe()

4. Отключение от канала:
   supabase.removeChannel(channel)
*/

