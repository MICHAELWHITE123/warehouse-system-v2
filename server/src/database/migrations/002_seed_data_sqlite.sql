-- Тестовые данные для системы учета техники на складе (SQLite версия)

-- Вставка тестовых пользователей
INSERT OR IGNORE INTO users (uuid, username, email, password_hash, full_name, role) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin', 'admin@warehouse.com', '$2a$10$dummy.hash.for.testing', 'Администратор системы', 'admin'),
('550e8400-e29b-41d4-a716-446655440001', 'user1', 'user1@warehouse.com', '$2a$10$dummy.hash.for.testing', 'Пользователь 1', 'user'),
('550e8400-e29b-41d4-a716-446655440002', 'user2', 'user2@warehouse.com', '$2a$10$dummy.hash.for.testing', 'Пользователь 2', 'user');

-- Вставка тестовых категорий
INSERT OR IGNORE INTO categories (uuid, name, description) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'Компьютеры', 'Персональные компьютеры и ноутбуки'),
('550e8400-e29b-41d4-a716-446655440011', 'Принтеры', 'Принтеры и МФУ'),
('550e8400-e29b-41d4-a716-446655440012', 'Сетевое оборудование', 'Свитчи, роутеры, кабели'),
('550e8400-e29b-41d4-a716-446655440013', 'Периферия', 'Клавиатуры, мыши, мониторы');

-- Вставка тестовых местоположений
INSERT OR IGNORE INTO locations (uuid, name, description, address) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'Склад А', 'Основной склад', 'ул. Складская, 1'),
('550e8400-e29b-41d4-a716-446655440021', 'Склад Б', 'Дополнительный склад', 'ул. Складская, 2'),
('550e8400-e29b-41d4-a716-446655440022', 'Офис', 'Главный офис', 'ул. Офисная, 10');

-- Вставка тестового оборудования
INSERT OR IGNORE INTO equipment (uuid, name, category_id, serial_number, status, location_id, description) VALUES
('550e8400-e29b-41d4-a716-446655440030', 'MacBook Pro 16"', 1, 'MBP001', 'available', 1, 'Ноутбук Apple MacBook Pro 16 дюймов'),
('550e8400-e29b-41d4-a716-446655440031', 'HP LaserJet Pro 400', 2, 'HP001', 'available', 1, 'Лазерный принтер HP'),
('550e8400-e29b-41d4-a716-446655440032', 'Dell OptiPlex 7090', 1, 'DELL001', 'available', 2, 'Настольный компьютер Dell'),
('550e8400-e29b-41d4-a716-446655440033', 'Cisco Catalyst 2960', 3, 'CISCO001', 'available', 1, 'Сетевой свитч Cisco'),
('550e8400-e29b-41d4-a716-446655440034', 'Logitech MX Master 3', 4, 'LOG001', 'available', 3, 'Беспроводная мышь Logitech');

-- Вставка тестовых стеков оборудования
INSERT OR IGNORE INTO equipment_stacks (uuid, name, description, created_by, tags) VALUES
('550e8400-e29b-41d4-a716-446655440040', 'Комплект разработчика', 'Полный комплект для разработки ПО', 1, 'dev,programming,full-stack'),
('550e8400-e29b-41d4-a716-446655440041', 'Базовый офисный комплект', 'Стандартный офисный набор', 1, 'office,basic,standard');

-- Связывание оборудования со стеками
INSERT OR IGNORE INTO stack_equipment (stack_id, equipment_id) VALUES
(1, 1), -- MacBook Pro в комплект разработчика
(1, 3), -- Dell OptiPlex в комплект разработчика
(1, 4), -- Cisco свитч в комплект разработчика
(2, 2), -- HP принтер в базовый офисный комплект
(2, 5); -- Logitech мышь в базовый офисный комплект

-- Вставка тестовых отгрузок
INSERT OR IGNORE INTO shipments (uuid, number, date, recipient, recipient_address, status, responsible_person, total_items) VALUES
('550e8400-e29b-41d4-a716-446655440050', 'SH-20257929', '2025-08-15', 'ООО "ТехноСервис"', 'ул. Клиентская, 15', 'preparing', 'Иванов И.И.', 2),
('550e8400-e29b-41d4-a716-446655440051', 'SH-20257930', '2025-08-16', 'ИП "Стартап"', 'ул. Инновационная, 7', 'preparing', 'Петров П.П.', 1);

-- Вставка оборудования в отгрузки
INSERT OR IGNORE INTO shipment_equipment (shipment_id, equipment_id, quantity) VALUES
(1, 1, 1), -- MacBook Pro в отгрузку SH-20257929
(1, 2, 1); -- HP принтер в отгрузку SH-20257929

-- Вставка стеков в отгрузки
INSERT OR IGNORE INTO shipment_stacks (shipment_id, stack_id, quantity) VALUES
(1, 1, 1), -- Комплект разработчика в отгрузку SH-20257929
(1, 2, 1); -- Базовый офисный комплект в отгрузку SH-20257929

-- Вставка аренды в отгрузки
INSERT OR IGNORE INTO shipment_rental (uuid, shipment_id, equipment_name, quantity, link) VALUES
('550e8400-e29b-41d4-a716-446655440060', 1, 'Дополнительный монитор 27"', 1, 'https://example.com/monitor'),
('550e8400-e29b-41d4-a716-446655440061', 1, 'USB-хаб 4 порта', 2, 'https://example.com/usb-hub');

-- Вставка чек-листов для отгрузок
INSERT OR IGNORE INTO shipment_checklist (uuid, shipment_id, title, description, is_required) VALUES
('550e8400-e29b-41d4-a716-446655440070', 1, 'Проверить комплектность', 'Убедиться, что все оборудование упаковано', 1),
('550e8400-e29b-41d4-a716-446655440071', 1, 'Проверить упаковку', 'Проверить качество упаковки', 1),
('550e8400-e29b-41d4-a716-446655440072', 1, 'Подготовить документы', 'Собрать все необходимые документы', 1);
