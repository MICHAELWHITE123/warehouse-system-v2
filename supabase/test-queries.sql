-- =====================================================
-- ТЕСТОВЫЕ SQL ЗАПРОСЫ ДЛЯ БАЗЫ ДАННЫХ WEAREHOUSE
-- PostgreSQL версия для Supabase
-- Дата: 2025-01-01
-- =====================================================

-- =====================================================
-- ПРОВЕРКА СТРУКТУРЫ БАЗЫ ДАННЫХ
-- =====================================================

-- 1. Проверяем созданные таблицы
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. Проверяем созданные функции
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- 3. Проверяем созданные триггеры
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- 4. Проверяем созданные представления
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'VIEW'
ORDER BY table_name;

-- =====================================================
-- ПРОВЕРКА ДАННЫХ
-- =====================================================

-- 5. Количество записей в основных таблицах
SELECT 'categories' as table_name, COUNT(*) as record_count FROM categories
UNION ALL
SELECT 'locations', COUNT(*) FROM locations
UNION ALL
SELECT 'equipment', COUNT(*) FROM equipment
UNION ALL
SELECT 'equipment_stacks', COUNT(*) FROM equipment_stacks
UNION ALL
SELECT 'shipments', COUNT(*) FROM shipments
UNION ALL
SELECT 'shipment_equipment', COUNT(*) FROM shipment_equipment
UNION ALL
SELECT 'shipment_stacks', COUNT(*) FROM shipment_stacks
UNION ALL
SELECT 'shipment_checklist', COUNT(*) FROM shipment_checklist
UNION ALL
SELECT 'shipment_rental', COUNT(*) FROM shipment_rental
UNION ALL
SELECT 'device_sync_status', COUNT(*) FROM device_sync_status
UNION ALL
SELECT 'sync_operations', COUNT(*) FROM sync_operations
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
ORDER BY table_name;

-- 6. Проверяем связи между таблицами
SELECT 
    'equipment -> categories' as relationship,
    COUNT(*) as linked_records
FROM equipment e
JOIN categories c ON e.category_id = c.id
UNION ALL
SELECT 
    'equipment -> locations',
    COUNT(*)
FROM equipment e
JOIN locations l ON e.location_id = l.id
UNION ALL
SELECT 
    'stack_equipment -> equipment',
    COUNT(*)
FROM stack_equipment se
JOIN equipment e ON se.equipment_id = e.id
UNION ALL
SELECT 
    'shipment_equipment -> shipments',
    COUNT(*)
FROM shipment_equipment se
JOIN shipments s ON se.shipment_id = s.id;

-- =====================================================
-- ТЕСТИРОВАНИЕ ФУНКЦИЙ
-- =====================================================

-- 7. Тестируем функцию поиска оборудования
SELECT * FROM search_equipment('ноутбук', NULL, NULL, NULL, NULL, 10, 0);

-- 8. Тестируем функцию статистики оборудования
SELECT * FROM get_equipment_statistics();

-- 9. Тестируем функцию получения оборудования по категории
SELECT * FROM get_equipment_by_category(1);

-- 10. Тестируем функцию получения деталей отгрузки
SELECT * FROM get_shipment_details(1);

-- 11. Тестируем функцию получения операций синхронизации
SELECT * FROM get_device_sync_operations('test-device-1', 'acknowledged', 10);

-- 12. Тестируем функцию получения уведомлений
SELECT * FROM get_user_notifications(NULL, FALSE, 10);

-- =====================================================
-- ТЕСТИРОВАНИЕ ПРЕДСТАВЛЕНИЙ
-- =====================================================

-- 13. Проверяем представление статистики синхронизации
SELECT * FROM sync_statistics;

-- 14. Проверяем представление полной информации об оборудовании
SELECT * FROM equipment_full_info LIMIT 5;

-- 15. Проверяем представление деталей отгрузок
SELECT * FROM shipments_full_info LIMIT 3;

-- =====================================================
-- ТЕСТИРОВАНИЕ ТРИГГЕРОВ
-- =====================================================

-- 16. Тестируем триггер обновления updated_at
UPDATE equipment SET description = 'Обновленное описание' WHERE id = 1;
SELECT id, name, description, updated_at FROM equipment WHERE id = 1;

-- 17. Тестируем триггер логирования изменений
SELECT * FROM change_log WHERE table_name = 'equipment' ORDER BY changed_at DESC LIMIT 5;

-- 18. Тестируем триггер уведомлений о статусе
UPDATE equipment SET status = 'maintenance' WHERE id = 2;
SELECT * FROM notifications WHERE related_table = 'equipment' ORDER BY created_at DESC LIMIT 3;

-- =====================================================
-- ТЕСТИРОВАНИЕ СИНХРОНИЗАЦИИ
-- =====================================================

-- 19. Регистрируем новое устройство
SELECT register_device('test-device-4', 'Тестовое устройство 4', 'mobile', NULL);

-- 20. Создаем операцию синхронизации
SELECT create_sync_operation('equipment', 3, 'update', 'test-device-4', 
    '{"status": "available"}', '{"status": "in-use"}');

-- 21. Подтверждаем операцию синхронизации
SELECT acknowledge_sync_operation('op-' || extract(epoch from now())::TEXT || '-001', 'test-device-4');

-- =====================================================
-- ТЕСТИРОВАНИЕ ПОИСКА И ФИЛЬТРАЦИИ
-- =====================================================

-- 22. Поиск оборудования по тегам
SELECT * FROM search_equipment(NULL, NULL, NULL, NULL, ARRAY['презентации'], 10, 0);

-- 23. Поиск оборудования по статусу
SELECT * FROM search_equipment(NULL, NULL, NULL, 'available', NULL, 10, 0);

-- 24. Поиск оборудования по местоположению
SELECT * FROM search_equipment(NULL, NULL, 1, NULL, NULL, 10, 0);

-- =====================================================
-- ТЕСТИРОВАНИЕ ОТЧЕТОВ
-- =====================================================

-- 25. Отчет по использованию оборудования
SELECT * FROM get_equipment_usage_report();

-- 26. Отчет по отгрузкам
SELECT * FROM get_shipments_report();

-- 27. Отчет по отгрузкам за определенный период
SELECT * FROM get_shipments_report('2025-01-01', '2025-12-31', 'preparing');

-- =====================================================
-- ТЕСТИРОВАНИЕ JSONB ПОЛЕЙ
-- =====================================================

-- 28. Поиск по спецификациям оборудования
SELECT name, specifications 
FROM equipment 
WHERE specifications ? 'processor';

-- 29. Поиск по значению в JSONB
SELECT name, specifications 
FROM equipment 
WHERE specifications->>'processor' = 'Intel i7';

-- 30. Поиск по тегам (массивы)
SELECT name, tags 
FROM equipment 
WHERE tags && ARRAY['презентации'];

-- =====================================================
-- ТЕСТИРОВАНИЕ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================

-- 31. Проверяем использование индексов
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM search_equipment('ноутбук', NULL, NULL, NULL, NULL, 10, 0);

-- 32. Проверяем производительность сложных запросов
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM shipments_full_info LIMIT 10;

-- =====================================================
-- ТЕСТИРОВАНИЕ БЕЗОПАСНОСТИ
-- =====================================================

-- 33. Проверяем RLS политики
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = true
ORDER BY tablename;

-- 34. Проверяем политики доступа
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- ОЧИСТКА ТЕСТОВЫХ ДАННЫХ
-- =====================================================

-- 35. Удаляем тестовые операции синхронизации
-- DELETE FROM sync_operations WHERE source_device_id LIKE 'test-device-%';

-- 36. Удаляем тестовые уведомления
-- DELETE FROM notifications WHERE related_table = 'equipment';

-- 37. Восстанавливаем исходные данные
-- UPDATE equipment SET status = 'available', description = 'Корпоративный ноутбук для презентаций' WHERE id = 1;
-- UPDATE equipment SET status = 'available' WHERE id = 2;

-- =====================================================
-- ЗАКЛЮЧЕНИЕ
-- =====================================================

-- 38. Финальная проверка состояния базы данных
SELECT 
    'База данных WeareHouse готова к работе!' as status,
    COUNT(*) as total_tables,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as total_functions,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') as total_triggers
FROM pg_tables 
WHERE schemaname = 'public';

echo "🎉 Тестирование завершено! База данных готова к работе."

