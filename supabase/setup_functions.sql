-- =====================================================
-- ФУНКЦИИ И API ДЛЯ БАЗЫ ДАННЫХ WEAREHOUSE
-- PostgreSQL версия для Supabase
-- Дата: 2025-01-01
-- =====================================================

-- =====================================================
-- ФУНКЦИИ ДЛЯ РАБОТЫ С ОБОРУДОВАНИЕМ
-- =====================================================

-- Функция для поиска оборудования по различным критериям
CREATE OR REPLACE FUNCTION search_equipment(
    search_term TEXT DEFAULT NULL,
    category_id BIGINT DEFAULT NULL,
    location_id BIGINT DEFAULT NULL,
    status_filter TEXT DEFAULT NULL,
    tags_filter TEXT[] DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id BIGINT,
    uuid UUID,
    name TEXT,
    category_name TEXT,
    location_name TEXT,
    status TEXT,
    serial_number TEXT,
    description TEXT,
    equipment_tags TEXT[],
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.uuid,
        e.name,
        c.name as category_name,
        l.name as location_name,
        e.status,
        e.serial_number,
        e.description,
        e.tags as equipment_tags,
        e.created_at
    FROM equipment e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN locations l ON e.location_id = l.id
    WHERE e.is_active = true
        AND (search_term IS NULL OR 
             e.name ILIKE '%' || search_term || '%' OR 
             e.description ILIKE '%' || search_term || '%' OR
             e.serial_number ILIKE '%' || search_term || '%')
        AND (category_id IS NULL OR e.category_id = category_id)
        AND (location_id IS NULL OR e.location_id = location_id)
        AND (status_filter IS NULL OR e.status = status_filter)
        AND (tags_filter IS NULL OR e.tags && tags_filter)
    ORDER BY e.name
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения статистики по оборудованию
CREATE OR REPLACE FUNCTION get_equipment_statistics()
RETURNS TABLE (
    total_equipment BIGINT,
    available_equipment BIGINT,
    in_use_equipment BIGINT,
    maintenance_equipment BIGINT,
    retired_equipment BIGINT,
    total_categories BIGINT,
    total_locations BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_equipment,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available_equipment,
        COUNT(CASE WHEN status = 'in-use' THEN 1 END) as in_use_equipment,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_equipment,
        COUNT(CASE WHEN status = 'retired' THEN 1 END) as retired_equipment,
        (SELECT COUNT(*) FROM categories WHERE is_active = true) as total_categories,
        (SELECT COUNT(*) FROM locations WHERE is_active = true) as total_locations
    FROM equipment
    WHERE is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения оборудования по категории с деталями
CREATE OR REPLACE FUNCTION get_equipment_by_category(category_id_param BIGINT)
RETURNS TABLE (
    id BIGINT,
    uuid UUID,
    name TEXT,
    serial_number TEXT,
    equipment_status TEXT,
    location_name TEXT,
    description TEXT,
    specifications JSONB,
    equipment_tags TEXT[],
    condition_rating INTEGER,
    last_maintenance DATE,
    next_maintenance DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.uuid,
        e.name,
        e.serial_number,
        e.status as equipment_status,
        l.name as location_name,
        e.description,
        e.specifications,
        e.tags as equipment_tags,
        e.condition_rating,
        e.last_maintenance,
        e.next_maintenance
    FROM equipment e
    LEFT JOIN locations l ON e.location_id = l.id
    WHERE e.category_id = category_id_param AND e.is_active = true
    ORDER BY e.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ФУНКЦИИ ДЛЯ РАБОТЫ С ОТГРУЗКАМИ
-- =====================================================

-- Функция для создания новой отгрузки с оборудованием
CREATE OR REPLACE FUNCTION create_shipment_with_equipment(
    shipment_data JSONB,
    equipment_items JSONB[],
    stack_items JSONB[]
)
RETURNS BIGINT AS $$
DECLARE
    new_shipment_id BIGINT;
    item JSONB;
    equipment_count INTEGER DEFAULT 0;
    stack_count INTEGER DEFAULT 0;
BEGIN
    -- Создаем отгрузку
    INSERT INTO shipments (
        number, date, recipient, recipient_address, recipient_phone, recipient_email,
        status, responsible_person, comments, tracking_number, estimated_delivery
    )
    VALUES (
        (shipment_data->>'number'),
        (shipment_data->>'date')::DATE,
        (shipment_data->>'recipient'),
        (shipment_data->>'recipient_address'),
        (shipment_data->>'recipient_phone'),
        (shipment_data->>'recipient_email'),
        COALESCE(shipment_data->>'status', 'preparing'),
        (shipment_data->>'responsible_person')::UUID,
        (shipment_data->>'comments'),
        (shipment_data->>'tracking_number'),
        (shipment_data->>'estimated_delivery')::DATE
    )
    RETURNING id INTO new_shipment_id;

    -- Добавляем оборудование
    IF equipment_items IS NOT NULL THEN
        FOREACH item IN ARRAY equipment_items
        LOOP
            INSERT INTO shipment_equipment (shipment_id, equipment_id, quantity, notes)
            VALUES (
                new_shipment_id,
                (item->>'equipment_id')::BIGINT,
                COALESCE((item->>'quantity')::INTEGER, 1),
                item->>'notes'
            );
            equipment_count := equipment_count + COALESCE((item->>'quantity')::INTEGER, 1);
        END LOOP;
    END IF;

    -- Добавляем стеки
    IF stack_items IS NOT NULL THEN
        FOREACH item IN ARRAY stack_items
        LOOP
            INSERT INTO shipment_stacks (shipment_id, stack_id, quantity, notes)
            VALUES (
                new_shipment_id,
                (item->>'stack_id')::BIGINT,
                COALESCE((item->>'quantity')::INTEGER, 1),
                item->>'notes'
            );
            stack_count := stack_count + COALESCE((item->>'quantity')::INTEGER, 1);
        END LOOP;
    END IF;

    -- Обновляем общее количество предметов
    UPDATE shipments 
    SET total_items = equipment_count + stack_count
    WHERE id = new_shipment_id;

    RETURN new_shipment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения детальной информации об отгрузке
CREATE OR REPLACE FUNCTION get_shipment_details(shipment_id_param BIGINT)
RETURNS TABLE (
    shipment_info JSONB,
    equipment_items JSONB,
    stack_items JSONB,
    checklist_items JSONB,
    rental_items JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_jsonb(s.*) as shipment_info,
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', se.id,
                    'equipment_id', se.equipment_id,
                    'equipment_name', e.name,
                    'equipment_uuid', e.uuid,
                    'quantity', se.quantity,
                    'notes', se.notes
                )
            ) FROM shipment_equipment se
            JOIN equipment e ON se.equipment_id = e.id
            WHERE se.shipment_id = s.id), 
            '[]'::jsonb
        ) as equipment_items,
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', ss.id,
                    'stack_id', ss.stack_id,
                    'stack_name', es.name,
                    'stack_uuid', es.uuid,
                    'quantity', ss.quantity,
                    'notes', ss.notes
                )
            ) FROM shipment_stacks ss
            JOIN equipment_stacks es ON ss.stack_id = es.id
            WHERE ss.shipment_id = s.id),
            '[]'::jsonb
        ) as stack_items,
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', sc.id,
                    'title', sc.title,
                    'description', sc.description,
                    'is_completed', sc.is_completed,
                    'is_required', sc.is_required,
                    'completed_by', sc.completed_by,
                    'completed_at', sc.completed_at
                )
            ) FROM shipment_checklist sc
            WHERE sc.shipment_id = s.id),
            '[]'::jsonb
        ) as checklist_items,
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', sr.id,
                    'equipment_name', sr.equipment_name,
                    'quantity', sr.quantity,
                    'daily_rate', sr.daily_rate,
                    'total_cost', sr.total_cost,
                    'link', sr.link,
                    'notes', sr.notes
                )
            ) FROM shipment_rental sr
            WHERE sr.shipment_id = s.id),
            '[]'::jsonb
        ) as rental_items
    FROM shipments s
    WHERE s.id = shipment_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ФУНКЦИИ ДЛЯ СИНХРОНИЗАЦИИ
-- =====================================================

-- Функция для регистрации устройства
CREATE OR REPLACE FUNCTION register_device(
    device_id_param TEXT,
    device_name_param TEXT,
    device_type_param TEXT,
    user_id_param UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO device_sync_status (
        device_id, device_name, device_type, user_id, last_sync, last_heartbeat
    )
    VALUES (
        device_id_param,
        device_name_param,
        device_type_param,
        user_id_param,
        NOW(),
        NOW()
    )
    ON CONFLICT (device_id) 
    DO UPDATE SET
        device_name = EXCLUDED.device_name,
        device_type = EXCLUDED.device_type,
        user_id = COALESCE(EXCLUDED.user_id, device_sync_status.user_id),
        last_heartbeat = NOW(),
        updated_at = NOW();
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для создания операции синхронизации
CREATE OR REPLACE FUNCTION create_sync_operation(
    table_name_param TEXT,
    record_id_param BIGINT,
    operation_type_param TEXT,
    source_device_id_param TEXT,
    data_before_param JSONB DEFAULT NULL,
    data_after_param JSONB DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    operation_id TEXT;
    operation_hash TEXT;
BEGIN
    -- Генерируем уникальный ID операции
    operation_id := 'op-' || extract(epoch from now())::TEXT || '-' || floor(random() * 1000)::TEXT;
    
    -- Генерируем хеш операции
    operation_hash := generate_operation_hash(table_name_param, record_id_param, operation_type_param, data_after_param);
    
    -- Создаем операцию
    INSERT INTO sync_operations (
        operation_id, table_name, record_id, operation_type, source_device_id,
        data_before, data_after, operation_hash
    )
    VALUES (
        operation_id,
        table_name_param,
        record_id_param,
        operation_type_param,
        source_device_id_param,
        data_before_param,
        data_after_param,
        operation_hash
    );
    
    -- Обновляем статус устройства
    UPDATE device_sync_status 
    SET 
        last_sync = NOW(),
        sync_count = sync_count + 1,
        updated_at = NOW()
    WHERE device_id = source_device_id_param;
    
    RETURN operation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения операций синхронизации для устройства
CREATE OR REPLACE FUNCTION get_device_sync_operations(
    device_id_param TEXT,
    status_filter TEXT DEFAULT 'pending',
    limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
    operation_id TEXT,
    table_name TEXT,
    record_id BIGINT,
    operation_type TEXT,
    data_before JSONB,
    data_after JSONB,
    operation_hash TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        so.operation_id,
        so.table_name,
        so.record_id,
        so.operation_type,
        so.data_before,
        so.data_after,
        so.operation_hash,
        so.created_at
    FROM sync_operations so
    WHERE so.source_device_id = device_id_param
        AND (status_filter IS NULL OR so.status = status_filter)
    ORDER BY so.created_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для подтверждения операции синхронизации
CREATE OR REPLACE FUNCTION acknowledge_sync_operation(
    operation_id_param TEXT,
    acknowledged_by_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE sync_operations 
    SET 
        status = 'acknowledged',
        acknowledged_by = acknowledged_by_param,
        acknowledged_at = NOW(),
        updated_at = NOW()
    WHERE operation_id = operation_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ФУНКЦИИ ДЛЯ УВЕДОМЛЕНИЙ
-- =====================================================

-- Функция для создания уведомления
CREATE OR REPLACE FUNCTION create_notification(
    user_id_param UUID,
    title_param TEXT,
    message_param TEXT,
    type_param TEXT DEFAULT 'info',
    related_table_param TEXT DEFAULT NULL,
    related_id_param BIGINT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_uuid UUID;
BEGIN
    INSERT INTO notifications (
        user_id, title, message, type, related_table, related_id
    )
    VALUES (
        user_id_param,
        title_param,
        message_param,
        type_param,
        related_table_param,
        related_id_param
    )
    RETURNING uuid INTO notification_uuid;
    
    RETURN notification_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения уведомлений пользователя
CREATE OR REPLACE FUNCTION get_user_notifications(
    user_id_param UUID,
    unread_only BOOLEAN DEFAULT FALSE,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    id BIGINT,
    uuid UUID,
    title TEXT,
    message TEXT,
    notification_type TEXT,
    is_read BOOLEAN,
    related_table TEXT,
    related_id BIGINT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.uuid,
        n.title,
        n.message,
        n.type as notification_type,
        n.is_read,
        n.related_table,
        n.related_id,
        n.created_at
    FROM notifications n
    WHERE n.user_id = user_id_param
        AND (NOT unread_only OR n.is_read = FALSE)
    ORDER BY n.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ФУНКЦИИ ДЛЯ АУДИТА И ЛОГИРОВАНИЯ
-- =====================================================

-- Функция для получения истории изменений записи
CREATE OR REPLACE FUNCTION get_record_history(
    table_name_param TEXT,
    record_id_param BIGINT
)
RETURNS TABLE (
    operation TEXT,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID,
    changed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cl.operation,
        cl.old_values,
        cl.new_values,
        cl.changed_by,
        cl.changed_at
    FROM change_log cl
    WHERE cl.table_name = table_name_param
        AND cl.record_id = record_id_param
    ORDER BY cl.changed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для очистки старых логов
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM change_log 
    WHERE changed_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ФУНКЦИИ ДЛЯ ОТЧЕТНОСТИ
-- =====================================================

-- Функция для получения отчета по использованию оборудования
CREATE OR REPLACE FUNCTION get_equipment_usage_report(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    equipment_name TEXT,
    category_name TEXT,
    location_name TEXT,
    status TEXT,
    last_maintenance DATE,
    next_maintenance DATE,
    condition_rating INTEGER,
    days_since_last_maintenance INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.name as equipment_name,
        c.name as category_name,
        l.name as location_name,
        e.status,
        e.last_maintenance,
        e.next_maintenance,
        e.condition_rating,
        CASE 
            WHEN e.last_maintenance IS NOT NULL 
            THEN EXTRACT(DAY FROM NOW() - e.last_maintenance)::INTEGER
            ELSE NULL
        END as days_since_last_maintenance
    FROM equipment e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN locations l ON e.location_id = l.id
    WHERE e.is_active = true
        AND (start_date IS NULL OR e.last_maintenance >= start_date)
        AND (end_date IS NULL OR e.last_maintenance <= end_date)
    ORDER BY e.last_maintenance DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения отчета по отгрузкам
CREATE OR REPLACE FUNCTION get_shipments_report(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    status_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    shipment_number TEXT,
    recipient TEXT,
    date DATE,
    shipment_status TEXT,
    total_items INTEGER,
    total_value DECIMAL,
    equipment_count INTEGER,
    stack_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.number as shipment_number,
        s.recipient,
        s.date,
        s.status as shipment_status,
        s.total_items,
        s.total_value,
        COUNT(DISTINCT se.equipment_id) as equipment_count,
        COUNT(DISTINCT ss.stack_id) as stack_count
    FROM shipments s
    LEFT JOIN shipment_equipment se ON s.id = se.shipment_id
    LEFT JOIN shipment_stacks ss ON s.id = ss.shipment_id
    WHERE (start_date IS NULL OR s.date >= start_date)
        AND (end_date IS NULL OR s.date <= end_date)
        AND (status_filter IS NULL OR s.status = status_filter)
    GROUP BY s.id, s.number, s.recipient, s.date, s.status, s.total_items, s.total_value
    ORDER BY s.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКИХ ДЕЙСТВИЙ
-- =====================================================

-- Триггер для автоматического создания уведомлений при изменении статуса оборудования
CREATE OR REPLACE FUNCTION notify_equipment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Уведомляем о необходимости обслуживания
    IF NEW.status = 'maintenance' AND OLD.status != 'maintenance' THEN
        PERFORM create_notification(
            NEW.assigned_to,
            'Оборудование требует обслуживания',
            'Оборудование "' || NEW.name || '" переведено в статус обслуживания',
            'warning',
            'equipment',
            NEW.id
        );
    END IF;
    
    -- Уведомляем о завершении обслуживания
    IF NEW.status = 'available' AND OLD.status = 'maintenance' THEN
        PERFORM create_notification(
            NEW.assigned_to,
            'Обслуживание завершено',
            'Оборудование "' || NEW.name || '" готово к использованию',
            'success',
            'equipment',
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер
CREATE TRIGGER equipment_status_notification
    AFTER UPDATE OF status ON equipment
    FOR EACH ROW
    EXECUTE FUNCTION notify_equipment_status_change();

-- Триггер для автоматического обновления счетчиков в отгрузках
CREATE OR REPLACE FUNCTION update_shipment_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        -- Обновляем total_items в отгрузке
        UPDATE shipments 
        SET 
            total_items = (
                SELECT COALESCE(SUM(se.quantity), 0) + COALESCE(SUM(ss.quantity), 0)
                FROM shipments s
                LEFT JOIN shipment_equipment se ON s.id = se.shipment_id
                LEFT JOIN shipment_stacks ss ON s.id = ss.shipment_id
                WHERE s.id = NEW.shipment_id
            ),
            updated_at = NOW()
        WHERE id = NEW.shipment_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггеры для обновления счетчиков
CREATE TRIGGER update_shipment_counters_equipment
    AFTER INSERT OR UPDATE OR DELETE ON shipment_equipment
    FOR EACH ROW
    EXECUTE FUNCTION update_shipment_counters();

CREATE TRIGGER update_shipment_counters_stacks
    AFTER INSERT OR UPDATE OR DELETE ON shipment_stacks
    FOR EACH ROW
    EXECUTE FUNCTION update_shipment_counters();

-- =====================================================
-- ЗАВЕРШЕНИЕ
-- =====================================================

-- Проверяем созданные функции
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name LIKE '%equipment%' 
    OR routine_name LIKE '%shipment%' 
    OR routine_name LIKE '%sync%'
    OR routine_name LIKE '%notification%'
ORDER BY routine_name;

-- Проверяем созданные триггеры
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
