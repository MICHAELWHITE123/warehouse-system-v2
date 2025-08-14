-- Создание таблиц для системы учета техники на складе

-- Таблица категорий оборудования
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица местоположений
CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица оборудования
CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category_id INTEGER,
    serial_number TEXT UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('available', 'in-use', 'maintenance')) DEFAULT 'available',
    location_id INTEGER,
    purchase_date DATE,
    last_maintenance DATE,
    assigned_to TEXT,
    description TEXT,
    specifications TEXT, -- JSON поле для хранения дополнительных характеристик
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
);

-- Таблица стеков оборудования
CREATE TABLE IF NOT EXISTS equipment_stacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    tags TEXT, -- JSON массив тегов
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Связующая таблица между стеками и оборудованием
CREATE TABLE IF NOT EXISTS stack_equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stack_id INTEGER NOT NULL,
    equipment_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stack_id) REFERENCES equipment_stacks(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    UNIQUE(stack_id, equipment_id)
);

-- Таблица отгрузок
CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    number TEXT NOT NULL UNIQUE,
    date DATE NOT NULL,
    recipient TEXT NOT NULL,
    recipient_address TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('preparing', 'in-transit', 'delivered', 'cancelled')) DEFAULT 'preparing',
    responsible_person TEXT NOT NULL,
    total_items INTEGER DEFAULT 0,
    comments TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivered_at DATETIME
);

-- Таблица оборудования в отгрузках
CREATE TABLE IF NOT EXISTS shipment_equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER NOT NULL,
    equipment_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- Таблица стеков в отгрузках
CREATE TABLE IF NOT EXISTS shipment_stacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER NOT NULL,
    stack_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    FOREIGN KEY (stack_id) REFERENCES equipment_stacks(id) ON DELETE CASCADE
);

-- Таблица чек-листов для отгрузок
CREATE TABLE IF NOT EXISTS shipment_checklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    shipment_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    is_required BOOLEAN DEFAULT TRUE,
    completed_by TEXT,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- Таблица аренды (rental) для отгрузок
CREATE TABLE IF NOT EXISTS shipment_rental (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    shipment_id INTEGER NOT NULL,
    equipment_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- Индексы для улучшения производительности
CREATE INDEX idx_equipment_uuid ON equipment(uuid);
CREATE INDEX idx_equipment_serial ON equipment(serial_number);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_category ON equipment(category_id);
CREATE INDEX idx_equipment_location ON equipment(location_id);

CREATE INDEX idx_stacks_uuid ON equipment_stacks(uuid);
CREATE INDEX idx_stack_equipment_stack ON stack_equipment(stack_id);
CREATE INDEX idx_stack_equipment_equipment ON stack_equipment(equipment_id);

CREATE INDEX idx_shipments_uuid ON shipments(uuid);
CREATE INDEX idx_shipments_number ON shipments(number);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_date ON shipments(date);

CREATE INDEX idx_shipment_equipment_shipment ON shipment_equipment(shipment_id);
CREATE INDEX idx_shipment_stacks_shipment ON shipment_stacks(shipment_id);
CREATE INDEX idx_shipment_checklist_shipment ON shipment_checklist(shipment_id);
CREATE INDEX idx_shipment_rental_shipment ON shipment_rental(shipment_id);

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER IF NOT EXISTS equipment_updated_at
    AFTER UPDATE ON equipment
    FOR EACH ROW
    BEGIN
        UPDATE equipment SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS categories_updated_at
    AFTER UPDATE ON categories
    FOR EACH ROW
    BEGIN
        UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS locations_updated_at
    AFTER UPDATE ON locations
    FOR EACH ROW
    BEGIN
        UPDATE locations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS stacks_updated_at
    AFTER UPDATE ON equipment_stacks
    FOR EACH ROW
    BEGIN
        UPDATE equipment_stacks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS shipments_updated_at
    AFTER UPDATE ON shipments
    FOR EACH ROW
    BEGIN
        UPDATE shipments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
