-- =====================================================
-- НАЧАЛЬНЫЕ ДАННЫЕ ДЛЯ БАЗЫ ДАННЫХ WEAREHOUSE
-- PostgreSQL версия для Supabase
-- Дата: 2025-01-01
-- =====================================================

-- =====================================================
-- СОЗДАНИЕ СИСТЕМНОГО ПОЛЬЗОВАТЕЛЯ
-- =====================================================

-- Создаем системного пользователя для created_by/updated_by полей
INSERT INTO user_profiles (id, username, email, full_name, role) VALUES
('00000000-0000-0000-0000-000000000000', 'system', 'system@wearehouse.local', 'System User', 'admin')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ОЧИСТКА ТАБЛИЦ (РАСКОММЕНТИРУЙТЕ ЕСЛИ НУЖНО ОЧИСТИТЬ)
-- =====================================================

-- Очищаем таблицы в правильном порядке (сначала зависимые, потом основные)
-- УБРАТЬ КОММЕНТАРИИ СЛЕДУЮЩИХ СТРОК ЕСЛИ НУЖНО ОЧИСТИТЬ ТАБЛИЦЫ:

TRUNCATE TABLE shipment_rental CASCADE;
TRUNCATE TABLE shipment_checklist CASCADE;
TRUNCATE TABLE shipment_stacks CASCADE;
TRUNCATE TABLE shipment_equipment CASCADE;
TRUNCATE TABLE stack_equipment CASCADE;
TRUNCATE TABLE sync_operations CASCADE;
TRUNCATE TABLE sync_conflicts CASCADE;
TRUNCATE TABLE change_log CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE user_settings CASCADE;
TRUNCATE TABLE shipments CASCADE;
TRUNCATE TABLE equipment_stacks CASCADE;
TRUNCATE TABLE equipment CASCADE;
TRUNCATE TABLE locations CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE device_sync_status CASCADE;

-- =====================================================
-- ВСТАВКА ДАННЫХ
-- =====================================================

-- Вставляем базовые категории оборудования
INSERT INTO categories (name, description, color, icon, created_by, updated_by) VALUES
('Компьютеры и ноутбуки', 'Персональные компьютеры, ноутбуки и периферия', '#3B82F6', 'laptop', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Сетевое оборудование', 'Маршрутизаторы, коммутаторы, кабели', '#10B981', 'wifi', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Аудио/Видео техника', 'Микрофоны, колонки, проекторы, экраны', '#F59E0B', 'speaker', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Осветительное оборудование', 'Светильники, прожекторы, стойки', '#EF4444', 'lightbulb', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Сценическое оборудование', 'Сцены, подмостки, декорации', '#8B5CF6', 'theater', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Инструменты', 'Ручной и электроинструмент', '#06B6D4', 'wrench', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Мебель', 'Столы, стулья, шкафы', '#84CC16', 'chair', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Транспорт', 'Тележки, погрузчики, транспортные средства', '#F97316', 'truck', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Безопасность', 'Огнетушители, аптечки, знаки', '#EC4899', 'shield', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Прочее', 'Различное оборудование и материалы', '#6B7280', 'box', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID);

-- Вставляем базовые местоположения
INSERT INTO locations (name, description, address, created_by, updated_by) VALUES
('Главный склад', 'Основной склад компании', 'ул. Складская, 1', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Склад А', 'Склад для крупногабаритного оборудования', 'ул. Промышленная, 15', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Склад Б', 'Склад для мелкого оборудования', 'ул. Торговая, 8', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Офис', 'Офисное помещение', 'ул. Центральная, 10', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Сцена', 'Концертная площадка', 'ул. Культурная, 5', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Мастерская', 'Ремонтная мастерская', 'ул. Ремонтная, 12', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Парковка', 'Парковка для транспорта', 'ул. Транспортная, 3', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Архив', 'Архивное помещение', 'ул. Архивная, 7', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID);

-- Вставляем тестовое оборудование
INSERT INTO equipment (name, category_id, serial_number, status, location_id, description, specifications, tags, created_by, updated_by) VALUES
('Ноутбук Dell Latitude 5520', (SELECT id FROM categories WHERE name = 'Компьютеры и ноутбуки'), 'DL5520-001', 'available', (SELECT id FROM locations WHERE name = 'Главный склад'), 'Корпоративный ноутбук для презентаций', '{"processor": "Intel i7", "ram": "16GB", "storage": "512GB SSD"}', ARRAY['ноутбук', 'dell', 'презентации'], '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Проектор Epson EB-X41', (SELECT id FROM categories WHERE name = 'Аудио/Видео техника'), 'EP-X41-001', 'available', (SELECT id FROM locations WHERE name = 'Главный склад'), 'Мультимедийный проектор', '{"brightness": "3100 lumens", "resolution": "1024x768", "contrast": "15000:1"}', ARRAY['проектор', 'epson', 'мультимедиа'], '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Микрофон Shure SM58', (SELECT id FROM categories WHERE name = 'Аудио/Видео техника'), 'SH-SM58-001', 'in-use', (SELECT id FROM locations WHERE name = 'Сцена'), 'Динамический микрофон для вокала', '{"type": "dynamic", "frequency": "50Hz-15kHz", "impedance": "300 ohms"}', ARRAY['микрофон', 'shure', 'вокал'], '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Светодиодный прожектор Chauvet DJ', (SELECT id FROM categories WHERE name = 'Осветительное оборудование'), 'CH-LED-001', 'available', (SELECT id FROM locations WHERE name = 'Главный склад'), 'RGB светодиодный прожектор', '{"power": "54W", "colors": "RGB", "beam_angle": "25°"}', ARRAY['прожектор', 'chauvet', 'rgb'], '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Сетевая стойка 19"', (SELECT id FROM categories WHERE name = 'Сетевое оборудование'), 'ST-19-001', 'available', (SELECT id FROM locations WHERE name = 'Главный склад'), 'Стандартная сетевая стойка', '{"height": "42U", "depth": "800mm", "width": "19inch"}', ARRAY['стойка', 'сетевая', '19inch'], '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Тележка складская', (SELECT id FROM categories WHERE name = 'Транспорт'), 'TC-001', 'available', (SELECT id FROM locations WHERE name = 'Главный склад'), 'Металлическая складская тележка', '{"capacity": "500kg", "wheels": "4", "material": "steel"}', ARRAY['тележка', 'складская', 'металл'], '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Огнетушитель ОП-4', (SELECT id FROM categories WHERE name = 'Безопасность'), 'FE-OP4-001', 'available', (SELECT id FROM locations WHERE name = 'Главный склад'), 'Порошковый огнетушитель', '{"type": "powder", "capacity": "4kg", "class": "A,B,C,E"}', ARRAY['огнетушитель', 'порошковый', 'безопасность'], '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Стол складной', (SELECT id FROM categories WHERE name = 'Мебель'), 'TS-FOLD-001', 'available', (SELECT id FROM locations WHERE name = 'Главный склад'), 'Складной стол для мероприятий', '{"size": "120x60cm", "height": "75cm", "material": "aluminum"}', ARRAY['стол', 'складной', 'алюминий'], '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID);

-- Вставляем тестовые стеки оборудования
INSERT INTO equipment_stacks (name, description, category_id, tags, created_by, updated_by) VALUES
('Комплект для презентаций', 'Полный комплект для проведения презентаций', (SELECT id FROM categories WHERE name = 'Компьютеры и ноутбуки'), ARRAY['презентации', 'комплект', 'мультимедиа'], '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Комплект для концертов', 'Оборудование для концертных выступлений', (SELECT id FROM categories WHERE name = 'Аудио/Видео техника'), ARRAY['концерт', 'звук', 'свет'], '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Комплект для выставок', 'Оборудование для выставочных мероприятий', (SELECT id FROM categories WHERE name = 'Осветительное оборудование'), ARRAY['выставка', 'освещение', 'декорации'], '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('Комплект для мастер-классов', 'Оборудование для проведения мастер-классов', (SELECT id FROM categories WHERE name = 'Компьютеры и ноутбуки'), ARRAY['мастер-класс', 'обучение', 'демонстрация'], '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID);

-- Связываем оборудование со стеками
INSERT INTO stack_equipment (stack_id, equipment_id, quantity) VALUES
((SELECT id FROM equipment_stacks WHERE name = 'Комплект для презентаций'), (SELECT id FROM equipment WHERE name = 'Ноутбук Dell Latitude 5520'), 1), -- Ноутбук в комплект для презентаций
((SELECT id FROM equipment_stacks WHERE name = 'Комплект для презентаций'), (SELECT id FROM equipment WHERE name = 'Проектор Epson EB-X41'), 1), -- Проектор в комплект для презентаций
((SELECT id FROM equipment_stacks WHERE name = 'Комплект для концертов'), (SELECT id FROM equipment WHERE name = 'Микрофон Shure SM58'), 2), -- Микрофоны в комплект для концертов
((SELECT id FROM equipment_stacks WHERE name = 'Комплект для концертов'), (SELECT id FROM equipment WHERE name = 'Светодиодный прожектор Chauvet DJ'), 4), -- Прожекторы в комплект для концертов
((SELECT id FROM equipment_stacks WHERE name = 'Комплект для выставок'), (SELECT id FROM equipment WHERE name = 'Светодиодный прожектор Chauvet DJ'), 6), -- Прожекторы в комплект для выставок
((SELECT id FROM equipment_stacks WHERE name = 'Комплект для выставок'), (SELECT id FROM equipment WHERE name = 'Стол складной'), 1), -- Стол в комплект для выставок
((SELECT id FROM equipment_stacks WHERE name = 'Комплект для мастер-классов'), (SELECT id FROM equipment WHERE name = 'Ноутбук Dell Latitude 5520'), 1), -- Ноутбук в комплект для мастер-классов
((SELECT id FROM equipment_stacks WHERE name = 'Комплект для мастер-классов'), (SELECT id FROM equipment WHERE name = 'Проектор Epson EB-X41'), 1);  -- Проектор в комплект для мастер-классов

-- Вставляем тестовые отгрузки
INSERT INTO shipments (number, date, recipient, recipient_address, status, total_items, comments, created_by, updated_by) VALUES
('SH-2025-001', '2025-01-15', 'ООО "Мероприятия+"', 'ул. Событийная, 25', 'preparing', 0, 'Отгрузка для корпоративного мероприятия', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('SH-2025-002', '2025-01-20', 'ИП Иванов А.А.', 'ул. Предпринимательская, 10', 'preparing', 0, 'Отгрузка для свадебного торжества', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
('SH-2025-003', '2025-01-25', 'Культурный центр "Искусство"', 'ул. Культурная, 15', 'preparing', 0, 'Отгрузка для театрального представления', '00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID);

-- Вставляем оборудование в отгрузки
INSERT INTO shipment_equipment (shipment_id, equipment_id, quantity, notes) VALUES
((SELECT id FROM shipments WHERE number = 'SH-2025-001'), (SELECT id FROM equipment WHERE name = 'Ноутбук Dell Latitude 5520'), 1, 'Ноутбук для презентаций'),
((SELECT id FROM shipments WHERE number = 'SH-2025-001'), (SELECT id FROM equipment WHERE name = 'Проектор Epson EB-X41'), 1, 'Проектор для демонстрации'),
((SELECT id FROM shipments WHERE number = 'SH-2025-001'), (SELECT id FROM equipment WHERE name = 'Светодиодный прожектор Chauvet DJ'), 2, 'Прожекторы для освещения'),
((SELECT id FROM shipments WHERE number = 'SH-2025-002'), (SELECT id FROM equipment WHERE name = 'Микрофон Shure SM58'), 2, 'Микрофоны для ведущего и гостей'),
((SELECT id FROM shipments WHERE number = 'SH-2025-002'), (SELECT id FROM equipment WHERE name = 'Светодиодный прожектор Chauvet DJ'), 4, 'Прожекторы для декоративного освещения'),
((SELECT id FROM shipments WHERE number = 'SH-2025-002'), (SELECT id FROM equipment WHERE name = 'Стол складной'), 1, 'Стол для регистрации'),
((SELECT id FROM shipments WHERE number = 'SH-2025-003'), (SELECT id FROM equipment WHERE name = 'Проектор Epson EB-X41'), 1, 'Проектор для сцены'),
((SELECT id FROM shipments WHERE number = 'SH-2025-003'), (SELECT id FROM equipment WHERE name = 'Светодиодный прожектор Chauvet DJ'), 6, 'Прожекторы для сценического освещения');

-- Вставляем стеки в отгрузки
INSERT INTO shipment_stacks (shipment_id, stack_id, quantity, notes) VALUES
((SELECT id FROM shipments WHERE number = 'SH-2025-001'), (SELECT id FROM equipment_stacks WHERE name = 'Комплект для презентаций'), 1, 'Полный комплект для презентаций'),
((SELECT id FROM shipments WHERE number = 'SH-2025-002'), (SELECT id FROM equipment_stacks WHERE name = 'Комплект для концертов'), 1, 'Комплект для торжественного мероприятия'),
((SELECT id FROM shipments WHERE number = 'SH-2025-003'), (SELECT id FROM equipment_stacks WHERE name = 'Комплект для выставок'), 1, 'Комплект для театрального представления');

-- Вставляем чек-листы для отгрузок
INSERT INTO shipment_checklist (shipment_id, title, description, is_required) VALUES
((SELECT id FROM shipments WHERE number = 'SH-2025-001'), 'Проверить работоспособность ноутбука', 'Убедиться, что ноутбук включается и работает стабильно', true),
((SELECT id FROM shipments WHERE number = 'SH-2025-001'), 'Проверить проектор', 'Проверить яркость и фокус проектора', true),
((SELECT id FROM shipments WHERE number = 'SH-2025-001'), 'Проверить прожекторы', 'Убедиться, что все прожекторы работают и имеют запасные лампы', true),
((SELECT id FROM shipments WHERE number = 'SH-2025-002'), 'Проверить микрофоны', 'Проверить качество звука и наличие запасных батарей', true),
((SELECT id FROM shipments WHERE number = 'SH-2025-002'), 'Проверить освещение', 'Протестировать все прожекторы и их режимы', true),
((SELECT id FROM shipments WHERE number = 'SH-2025-003'), 'Проверить сценическое оборудование', 'Убедиться в готовности всего сценического оборудования', true);

-- Вставляем аренду для отгрузок
INSERT INTO shipment_rental (shipment_id, equipment_name, quantity, daily_rate, total_cost, notes) VALUES
((SELECT id FROM shipments WHERE number = 'SH-2025-001'), 'Дополнительный экран 3x2м', 1, 5000.00, 15000.00, 'Аренда экрана на 3 дня'),
((SELECT id FROM shipments WHERE number = 'SH-2025-002'), 'Дополнительная звуковая система', 1, 3000.00, 9000.00, 'Аренда звука на 3 дня'),
((SELECT id FROM shipments WHERE number = 'SH-2025-003'), 'Сценические декорации', 1, 2000.00, 6000.00, 'Аренда декораций на 3 дня');

-- Вставляем тестовые записи синхронизации
INSERT INTO device_sync_status (device_id, device_name, device_type, last_sync, sync_count) VALUES
('test-device-1', 'Тестовое устройство 1', 'mobile', NOW(), 0),
('test-device-2', 'Тестовое устройство 2', 'tablet', NOW(), 0),
('test-device-3', 'Тестовое устройство 3', 'desktop', NOW(), 0);

-- Вставляем тестовые операции синхронизации
INSERT INTO sync_operations (operation_id, table_name, record_id, operation_type, source_device_id, data_after, status) VALUES
('op-001', 'equipment', (SELECT id FROM equipment WHERE name = 'Ноутбук Dell Latitude 5520'), 'create', 'test-device-1', '{"name": "Ноутбук Dell Latitude 5520"}', 'acknowledged'),
('op-002', 'equipment', (SELECT id FROM equipment WHERE name = 'Проектор Epson EB-X41'), 'create', 'test-device-1', '{"name": "Проектор Epson EB-X41"}', 'acknowledged'),
('op-003', 'categories', (SELECT id FROM categories WHERE name = 'Компьютеры и ноутбуки'), 'create', 'test-device-2', '{"name": "Компьютеры и ноутбуки"}', 'acknowledged');

-- Вставляем тестовые уведомления (без user_id для демонстрации)
INSERT INTO notifications (user_id, title, message, type, related_table, related_id) VALUES
('00000000-0000-0000-0000-000000000000', 'Новое оборудование добавлено', 'В систему добавлен новый ноутбук Dell Latitude 5520', 'info', 'equipment', (SELECT id FROM equipment WHERE name = 'Ноутбук Dell Latitude 5520')),
('00000000-0000-0000-0000-000000000000', 'Отгрузка готова', 'Отгрузка SH-2025-001 готова к отправке', 'success', 'shipments', (SELECT id FROM shipments WHERE number = 'SH-2025-001')),
('00000000-0000-0000-0000-000000000000', 'Требуется обслуживание', 'Проектор Epson EB-X41 требует профилактического обслуживания', 'warning', 'equipment', (SELECT id FROM equipment WHERE name = 'Проектор Epson EB-X41'));

-- =====================================================
-- ОБНОВЛЕНИЕ СЧЕТЧИКОВ
-- =====================================================

-- Обновляем total_items в отгрузках
UPDATE shipments SET total_items = (
    SELECT COALESCE(SUM(se.quantity), 0) + COALESCE(SUM(ss.quantity), 0)
    FROM shipments s
    LEFT JOIN shipment_equipment se ON s.id = se.shipment_id
    LEFT JOIN shipment_stacks ss ON s.id = ss.shipment_id
    WHERE s.id = shipments.id
);

-- Обновляем total_value в отгрузках (примерные цены)
UPDATE shipments SET total_value = (
    SELECT COALESCE(SUM(se.quantity * 50000), 0) + COALESCE(SUM(sr.total_cost), 0)
    FROM shipments s
    LEFT JOIN shipment_equipment se ON s.id = se.shipment_id
    LEFT JOIN shipment_rental sr ON s.id = sr.shipment_id
    WHERE s.id = shipments.id
);

-- =====================================================
-- ПРОВЕРКА ДАННЫХ
-- =====================================================

-- Проверяем количество записей в основных таблицах
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

-- Проверяем связи между таблицами
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

-- Проверяем представления
SELECT 'sync_statistics' as view_name, COUNT(*) as record_count FROM sync_statistics
UNION ALL
SELECT 'equipment_full_info', COUNT(*) FROM equipment_full_info
UNION ALL
SELECT 'shipments_full_info', COUNT(*) FROM shipments_full_info;
