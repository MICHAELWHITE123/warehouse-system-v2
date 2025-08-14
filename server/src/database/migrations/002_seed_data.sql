-- Заполнение базы данных начальными данными

-- Вставка категорий
INSERT INTO categories (name, description) VALUES
    ('Компьютеры', 'Настольные компьютеры, ноутбуки, моноблоки'),
    ('Принтеры', 'Принтеры, МФУ, плоттеры'),
    ('Мониторы', 'Мониторы различных типов и размеров'),
    ('Сетевое оборудование', 'Коммутаторы, маршрутизаторы, точки доступа'),
    ('Мобильные устройства', 'Смартфоны, планшеты'),
    ('Аксессуары', 'Клавиатуры, мыши, наушники, кабели')
ON CONFLICT (name) DO NOTHING;

-- Вставка местоположений
INSERT INTO locations (name, description, address) VALUES
    ('ИТ-отдел', 'Основной ИТ отдел компании', 'Главный офис, 3 этаж'),
    ('Офис 1', 'Первый офис', 'Главный офис, 1 этаж'),
    ('Склад A', 'Основной склад', 'Складское помещение А'),
    ('Склад B', 'Дополнительный склад', 'Складское помещение Б')
ON CONFLICT (name) DO NOTHING;

-- Создание администратора по умолчанию (пароль: admin123)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
    ('admin', 'admin@warehouse.local', '$2a$10$X4v8u5Dk9TbP5vO1Q4k2U.yNu5VoQh6R8w3D5XyE7a1Z6c9B8fG2e', 'Администратор системы', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Вставка оборудования
INSERT INTO equipment (uuid, name, category_id, serial_number, status, location_id, purchase_date, last_maintenance, assigned_to, description, created_by) VALUES
    (gen_random_uuid(), 'MacBook Pro 16"', 
     (SELECT id FROM categories WHERE name = 'Компьютеры'), 
     'MBP16-001', 'in-use', 
     (SELECT id FROM locations WHERE name = 'ИТ-отдел'), 
     '2023-01-15', '2024-06-01', 'Иванов И.И.',
     'Ноутбук для разработки',
     (SELECT id FROM users WHERE username = 'admin')),
    
    (gen_random_uuid(), 'HP LaserJet Pro 400', 
     (SELECT id FROM categories WHERE name = 'Принтеры'), 
     'HP400-001', 'available', 
     (SELECT id FROM locations WHERE name = 'Офис 1'), 
     '2022-08-10', '2024-03-15', NULL,
     'Лазерный принтер для офиса',
     (SELECT id FROM users WHERE username = 'admin')),
    
    (gen_random_uuid(), 'Dell UltraSharp 27"', 
     (SELECT id FROM categories WHERE name = 'Мониторы'), 
     'DELL27-001', 'available', 
     (SELECT id FROM locations WHERE name = 'ИТ-отдел'), 
     '2023-03-20', NULL, NULL,
     'Монитор для рабочего места',
     (SELECT id FROM users WHERE username = 'admin')),
    
    (gen_random_uuid(), 'Cisco SG350-28', 
     (SELECT id FROM categories WHERE name = 'Сетевое оборудование'), 
     'CSC28-001', 'maintenance', 
     (SELECT id FROM locations WHERE name = 'Склад A'), 
     '2022-12-05', '2024-07-20', NULL,
     'Управляемый коммутатор',
     (SELECT id FROM users WHERE username = 'admin')),
    
    (gen_random_uuid(), 'iPhone 14 Pro', 
     (SELECT id FROM categories WHERE name = 'Мобильные устройства'), 
     'IPH14-001', 'available', 
     (SELECT id FROM locations WHERE name = 'Склад B'), 
     '2023-09-25', NULL, NULL,
     'Смартфон для мобильной работы',
     (SELECT id FROM users WHERE username = 'admin')),
    
    (gen_random_uuid(), 'Logitech MX Master 3', 
     (SELECT id FROM categories WHERE name = 'Аксессуары'), 
     'LGT-MX3-001', 'available', 
     (SELECT id FROM locations WHERE name = 'ИТ-отдел'), 
     '2023-05-10', NULL, NULL,
     'Беспроводная мышь',
     (SELECT id FROM users WHERE username = 'admin')),
    
    (gen_random_uuid(), 'Apple Magic Keyboard', 
     (SELECT id FROM categories WHERE name = 'Аксессуары'), 
     'APL-KB-001', 'available', 
     (SELECT id FROM locations WHERE name = 'ИТ-отдел'), 
     '2023-05-10', NULL, NULL,
     'Беспроводная клавиатура',
     (SELECT id FROM users WHERE username = 'admin'));

-- Вставка стеков оборудования
INSERT INTO equipment_stacks (uuid, name, description, created_by, tags) VALUES
    (gen_random_uuid(), 'Комплект разработчика', 
     'Полный набор техники для программиста: ноутбук, монитор и аксессуары', 
     (SELECT id FROM users WHERE username = 'admin'), 
     ARRAY['разработка', 'программирование', 'рабочее место']),
    
    (gen_random_uuid(), 'Базовый офисный комплект', 
     'Минимальный набор техники для офисного работника', 
     (SELECT id FROM users WHERE username = 'admin'), 
     ARRAY['офис', 'базовый комплект']);

-- Связывание оборудования со стеками
-- Комплект разработчика: MacBook Pro, Dell Monitor, Logitech Mouse, Apple Keyboard
INSERT INTO stack_equipment (stack_id, equipment_id) VALUES
    -- Комплект разработчика
    ((SELECT id FROM equipment_stacks WHERE name = 'Комплект разработчика'), 
     (SELECT id FROM equipment WHERE serial_number = 'MBP16-001')),
    ((SELECT id FROM equipment_stacks WHERE name = 'Комплект разработчика'), 
     (SELECT id FROM equipment WHERE serial_number = 'DELL27-001')),
    ((SELECT id FROM equipment_stacks WHERE name = 'Комплект разработчика'), 
     (SELECT id FROM equipment WHERE serial_number = 'LGT-MX3-001')),
    ((SELECT id FROM equipment_stacks WHERE name = 'Комплект разработчика'), 
     (SELECT id FROM equipment WHERE serial_number = 'APL-KB-001')),
    
    -- Базовый офисный комплект: HP Printer, iPhone
    ((SELECT id FROM equipment_stacks WHERE name = 'Базовый офисный комплект'), 
     (SELECT id FROM equipment WHERE serial_number = 'HP400-001')),
    ((SELECT id FROM equipment_stacks WHERE name = 'Базовый офисный комплект'), 
     (SELECT id FROM equipment WHERE serial_number = 'IPH14-001'));

-- Создание тестовых отгрузок
INSERT INTO shipments (uuid, number, date, recipient, recipient_address, status, responsible_person, total_items, comments, created_by, delivered_at) VALUES
    (gen_random_uuid(), 'SH-240001', '2024-08-10', 'ООО Рога и Копыта', 'г. Москва, ул. Ленина, д. 1', 
     'delivered', 'Сидоров С.С.', 5, 'Срочная доставка', 
     (SELECT id FROM users WHERE username = 'admin'), '2024-08-10 15:30:00'),
    
    (gen_random_uuid(), 'SH-240002', '2024-08-12', 'ИП Иванов', 'г. СПб, Невский пр., д. 50', 
     'in-transit', 'Петров П.П.', 2, NULL, 
     (SELECT id FROM users WHERE username = 'admin'), NULL);

-- Создание чек-листов для отгрузок
INSERT INTO shipment_checklist (uuid, shipment_id, title, description, is_completed, is_required, completed_by, completed_at) VALUES
    -- Чек-лист для первой отгрузки (все пункты выполнены)
    (gen_random_uuid(), (SELECT id FROM shipments WHERE number = 'SH-240001'), 
     'Проверить упаковку оборудования', 'Убедиться в целостности упаковки', 
     TRUE, TRUE, 'Сидоров С.С.', '2024-08-10 09:15:00'),
    (gen_random_uuid(), (SELECT id FROM shipments WHERE number = 'SH-240001'), 
     'Сверить серийные номера', 'Проверить соответствие серийных номеров', 
     TRUE, TRUE, 'Сидоров С.С.', '2024-08-10 09:20:00'),
    (gen_random_uuid(), (SELECT id FROM shipments WHERE number = 'SH-240001'), 
     'Проверить комплектность стеков', 'Убедиться в наличии всего оборудования в стеках', 
     TRUE, TRUE, 'Сидоров С.С.', '2024-08-10 09:25:00'),
    
    -- Чек-лист для второй отгрузки (частично выполнен)
    (gen_random_uuid(), (SELECT id FROM shipments WHERE number = 'SH-240002'), 
     'Проверить антистатическую упаковку', 'Убедиться в защите от статики', 
     TRUE, TRUE, 'Петров П.П.', '2024-08-12 10:15:00'),
    (gen_random_uuid(), (SELECT id FROM shipments WHERE number = 'SH-240002'), 
     'Упаковать кабели отдельно', 'Аккуратно упаковать все кабели', 
     TRUE, TRUE, 'Петров П.П.', '2024-08-12 10:20:00'),
    (gen_random_uuid(), (SELECT id FROM shipments WHERE number = 'SH-240002'), 
     'Загрузить в транспорт', 'Аккуратно разместить в транспортном средстве', 
     FALSE, TRUE, NULL, NULL);

-- Создание аренды оборудования для отгрузок
INSERT INTO shipment_rental (uuid, shipment_id, equipment_name, quantity, link) VALUES
    -- Первая отгрузка
    (gen_random_uuid(), (SELECT id FROM shipments WHERE number = 'SH-240001'), 
     'Звуковая система JBL', 2, 'https://example.com/jbl-sound'),
    (gen_random_uuid(), (SELECT id FROM shipments WHERE number = 'SH-240001'), 
     'Сценические светильники', 8, 'https://example.com/stage-lights'),
    
    -- Вторая отгрузка
    (gen_random_uuid(), (SELECT id FROM shipments WHERE number = 'SH-240002'), 
     'Проектор EPSON', 1, '');
