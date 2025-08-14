-- Заполнение базы данных начальными данными

-- Вставка категорий
INSERT OR IGNORE INTO categories (name, description) VALUES
    ('Компьютеры', 'Настольные компьютеры, ноутбуки, моноблоки'),
    ('Принтеры', 'Принтеры, МФУ, плоттеры'),
    ('Мониторы', 'Мониторы различных типов и размеров'),
    ('Сетевое оборудование', 'Коммутаторы, маршрутизаторы, точки доступа'),
    ('Мобильные устройства', 'Смартфоны, планшеты'),
    ('Аксессуары', 'Клавиатуры, мыши, наушники, кабели');

-- Вставка местоположений
INSERT OR IGNORE INTO locations (name, description, address) VALUES
    ('ИТ-отдел', 'Основной ИТ отдел компании', 'Главный офис, 3 этаж'),
    ('Офис 1', 'Первый офис', 'Главный офис, 1 этаж'),
    ('Склад A', 'Основной склад', 'Складское помещение А'),
    ('Склад B', 'Дополнительный склад', 'Складское помещение Б');

-- Вставка оборудования
INSERT OR IGNORE INTO equipment (uuid, name, category_id, serial_number, status, location_id, purchase_date, last_maintenance, assigned_to, description) VALUES
    ('1', 'MacBook Pro 16"', 
     (SELECT id FROM categories WHERE name = 'Компьютеры'), 
     'MBP16-001', 'in-use', 
     (SELECT id FROM locations WHERE name = 'ИТ-отдел'), 
     '2023-01-15', '2024-06-01', 'Иванов И.И.',
     'Ноутбук для разработки'),
    
    ('2', 'HP LaserJet Pro 400', 
     (SELECT id FROM categories WHERE name = 'Принтеры'), 
     'HP400-001', 'available', 
     (SELECT id FROM locations WHERE name = 'Офис 1'), 
     '2022-08-10', '2024-03-15', NULL,
     'Лазерный принтер для офиса'),
    
    ('3', 'Dell UltraSharp 27"', 
     (SELECT id FROM categories WHERE name = 'Мониторы'), 
     'DELL27-001', 'available', 
     (SELECT id FROM locations WHERE name = 'ИТ-отдел'), 
     '2023-03-20', NULL, NULL,
     'Монитор для рабочего места'),
    
    ('4', 'Cisco SG350-28', 
     (SELECT id FROM categories WHERE name = 'Сетевое оборудование'), 
     'CSC28-001', 'maintenance', 
     (SELECT id FROM locations WHERE name = 'Склад A'), 
     '2022-12-05', '2024-07-20', NULL,
     'Управляемый коммутатор'),
    
    ('5', 'iPhone 14 Pro', 
     (SELECT id FROM categories WHERE name = 'Мобильные устройства'), 
     'IPH14-001', 'available', 
     (SELECT id FROM locations WHERE name = 'Склад B'), 
     '2023-09-25', NULL, NULL,
     'Смартфон для мобильной работы'),
    
    ('6', 'Logitech MX Master 3', 
     (SELECT id FROM categories WHERE name = 'Аксессуары'), 
     'LGT-MX3-001', 'available', 
     (SELECT id FROM locations WHERE name = 'ИТ-отдел'), 
     '2023-05-10', NULL, NULL,
     'Беспроводная мышь'),
    
    ('7', 'Apple Magic Keyboard', 
     (SELECT id FROM categories WHERE name = 'Аксессуары'), 
     'APL-KB-001', 'available', 
     (SELECT id FROM locations WHERE name = 'ИТ-отдел'), 
     '2023-05-10', NULL, NULL,
     'Беспроводная клавиатура');

-- Вставка стеков оборудования
INSERT OR IGNORE INTO equipment_stacks (uuid, name, description, created_by, tags) VALUES
    ('1', 'Комплект разработчика', 
     'Полный набор техники для программиста: ноутбук, монитор и аксессуары', 
     'Администратор', 
     '["разработка", "программирование", "рабочее место"]'),
    
    ('2', 'Базовый офисный комплект', 
     'Минимальный набор техники для офисного работника', 
     'Менеджер', 
     '["офис", "базовый комплект"]');

-- Связывание оборудования со стеками
INSERT OR IGNORE INTO stack_equipment (stack_id, equipment_id) VALUES
    -- Комплект разработчика (MacBook Pro, Dell Monitor, Logitech Mouse, Apple Keyboard)
    ((SELECT id FROM equipment_stacks WHERE uuid = '1'), (SELECT id FROM equipment WHERE uuid = '1')),
    ((SELECT id FROM equipment_stacks WHERE uuid = '1'), (SELECT id FROM equipment WHERE uuid = '3')),
    ((SELECT id FROM equipment_stacks WHERE uuid = '1'), (SELECT id FROM equipment WHERE uuid = '6')),
    ((SELECT id FROM equipment_stacks WHERE uuid = '1'), (SELECT id FROM equipment WHERE uuid = '7')),
    
    -- Базовый офисный комплект (HP Printer, iPhone)
    ((SELECT id FROM equipment_stacks WHERE uuid = '2'), (SELECT id FROM equipment WHERE uuid = '2')),
    ((SELECT id FROM equipment_stacks WHERE uuid = '2'), (SELECT id FROM equipment WHERE uuid = '5'));

-- Вставка отгрузок
INSERT OR IGNORE INTO shipments (uuid, number, date, recipient, recipient_address, status, responsible_person, total_items, comments, delivered_at) VALUES
    ('1', 'SH-240001', '2024-08-10', 'ООО Рога и Копыта', 'г. Москва, ул. Ленина, д. 1', 
     'delivered', 'Сидоров С.С.', 5, 'Срочная доставка', '2024-08-10 15:30:00'),
    
    ('2', 'SH-240002', '2024-08-12', 'ИП Иванов', 'г. СПб, Невский пр., д. 50', 
     'in-transit', 'Петров П.П.', 2, NULL, NULL);

-- Оборудование в отгрузках
INSERT OR IGNORE INTO shipment_equipment (shipment_id, equipment_id, quantity) VALUES
    -- Первая отгрузка - HP Printer
    ((SELECT id FROM shipments WHERE uuid = '1'), (SELECT id FROM equipment WHERE uuid = '2'), 1),
    
    -- Вторая отгрузка - iPhone (2 штуки)
    ((SELECT id FROM shipments WHERE uuid = '2'), (SELECT id FROM equipment WHERE uuid = '5'), 2);

-- Стеки в отгрузках
INSERT OR IGNORE INTO shipment_stacks (shipment_id, stack_id, quantity) VALUES
    -- Первая отгрузка - Комплект разработчика
    ((SELECT id FROM shipments WHERE uuid = '1'), (SELECT id FROM equipment_stacks WHERE uuid = '1'), 1);

-- Чек-листы для отгрузок
INSERT OR IGNORE INTO shipment_checklist (uuid, shipment_id, title, description, is_completed, is_required, completed_by, completed_at) VALUES
    -- Чек-лист для первой отгрузки (все пункты выполнены)
    ('1', (SELECT id FROM shipments WHERE uuid = '1'), 'Проверить упаковку оборудования', 'Убедиться в целостности упаковки', TRUE, TRUE, 'Сидоров С.С.', '2024-08-10 09:15:00'),
    ('2', (SELECT id FROM shipments WHERE uuid = '1'), 'Сверить серийные номера', 'Проверить соответствие серийных номеров', TRUE, TRUE, 'Сидоров С.С.', '2024-08-10 09:20:00'),
    ('3', (SELECT id FROM shipments WHERE uuid = '1'), 'Проверить комплектность стеков', 'Убедиться в наличии всего оборудования в стеках', TRUE, TRUE, 'Сидоров С.С.', '2024-08-10 09:25:00'),
    ('4', (SELECT id FROM shipments WHERE uuid = '1'), 'Загрузить в транспорт', 'Аккуратно разместить в транспортном средстве', TRUE, TRUE, 'Сидоров С.С.', '2024-08-10 09:45:00'),
    ('5', (SELECT id FROM shipments WHERE uuid = '1'), 'Оформить документы', 'Заполнить необходимые документы', TRUE, TRUE, 'Сидоров С.С.', '2024-08-10 10:00:00'),
    
    -- Чек-лист для второй отгрузки (частично выполнен)
    ('6', (SELECT id FROM shipments WHERE uuid = '2'), 'Проверить антистатическую упаковку', 'Убедиться в защите от статики', TRUE, TRUE, 'Петров П.П.', '2024-08-12 10:15:00'),
    ('7', (SELECT id FROM shipments WHERE uuid = '2'), 'Упаковать кабели отдельно', 'Аккуратно упаковать все кабели', TRUE, TRUE, 'Петров П.П.', '2024-08-12 10:20:00'),
    ('8', (SELECT id FROM shipments WHERE uuid = '2'), 'Загрузить в транспорт', 'Аккуратно разместить в транспортном средстве', FALSE, TRUE, NULL, NULL),
    ('9', (SELECT id FROM shipments WHERE uuid = '2'), 'Закрепить груз', 'Обеспечить надежное крепление груза', FALSE, TRUE, NULL, NULL),
    ('10', (SELECT id FROM shipments WHERE uuid = '2'), 'Оформить документы', 'Заполнить необходимые документы', FALSE, TRUE, NULL, NULL);

-- Аренда оборудования для отгрузок
INSERT OR IGNORE INTO shipment_rental (uuid, shipment_id, equipment_name, quantity, link) VALUES
    -- Первая отгрузка
    ('1', (SELECT id FROM shipments WHERE uuid = '1'), 'Звуковая система JBL', 2, 'https://example.com/jbl-sound'),
    ('2', (SELECT id FROM shipments WHERE uuid = '1'), 'Сценические светильники', 8, 'https://example.com/stage-lights'),
    
    -- Вторая отгрузка
    ('3', (SELECT id FROM shipments WHERE uuid = '2'), 'Проектор EPSON', 1, '');
