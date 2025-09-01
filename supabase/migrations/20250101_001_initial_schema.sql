-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы категорий
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    updated_by UUID REFERENCES user_profiles(id)
);

-- Создание таблицы местоположений
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    updated_by UUID REFERENCES user_profiles(id)
);

-- Создание таблицы оборудования
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    location_id UUID REFERENCES locations(id),
    serial_number VARCHAR(255),
    model VARCHAR(255),
    manufacturer VARCHAR(255),
    status VARCHAR(50) DEFAULT 'available',
    condition_notes TEXT,
    purchase_date DATE,
    warranty_expiry DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    updated_by UUID REFERENCES user_profiles(id)
);

-- Создание таблицы стеков оборудования
CREATE TABLE IF NOT EXISTS equipment_stacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location_id UUID REFERENCES locations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    updated_by UUID REFERENCES user_profiles(id)
);

-- Создание таблицы связи оборудования и стеков
CREATE TABLE IF NOT EXISTS equipment_stack_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stack_id UUID REFERENCES equipment_stacks(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
    position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stack_id, equipment_id)
);

-- Создание таблицы отгрузок
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number VARCHAR(255) UNIQUE NOT NULL,
    date DATE NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    recipient_address TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    updated_by UUID REFERENCES user_profiles(id)
);

-- Создание таблицы элементов отгрузки
CREATE TABLE IF NOT EXISTS shipment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES equipment(id),
    stack_id UUID REFERENCES equipment_stacks(id),
    quantity INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_location ON equipment(location_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_shipments_date ON shipments(date);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);

-- Создание функции для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггеров для автоматического обновления updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at 
    BEFORE UPDATE ON equipment 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_stacks_updated_at 
    BEFORE UPDATE ON equipment_stacks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at 
    BEFORE UPDATE ON shipments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Включение Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_stack_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;

-- Создание политик RLS (разрешаем все операции для аутентифицированных пользователей)
CREATE POLICY "Users can view all user_profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert user_profiles" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update user_profiles" ON user_profiles FOR UPDATE USING (true);
CREATE POLICY "Users can delete user_profiles" ON user_profiles FOR DELETE USING (true);

CREATE POLICY "Users can view all categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Users can insert categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update categories" ON categories FOR UPDATE USING (true);
CREATE POLICY "Users can delete categories" ON categories FOR DELETE USING (true);

CREATE POLICY "Users can view all locations" ON locations FOR SELECT USING (true);
CREATE POLICY "Users can insert locations" ON locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update locations" ON locations FOR UPDATE USING (true);
CREATE POLICY "Users can delete locations" ON locations FOR DELETE USING (true);

CREATE POLICY "Users can view all equipment" ON equipment FOR SELECT USING (true);
CREATE POLICY "Users can insert equipment" ON equipment FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update equipment" ON equipment FOR UPDATE USING (true);
CREATE POLICY "Users can delete equipment" ON equipment FOR DELETE USING (true);

CREATE POLICY "Users can view all equipment_stacks" ON equipment_stacks FOR SELECT USING (true);
CREATE POLICY "Users can insert equipment_stacks" ON equipment_stacks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update equipment_stacks" ON equipment_stacks FOR UPDATE USING (true);
CREATE POLICY "Users can delete equipment_stacks" ON equipment_stacks FOR DELETE USING (true);

CREATE POLICY "Users can view all equipment_stack_items" ON equipment_stack_items FOR SELECT USING (true);
CREATE POLICY "Users can insert equipment_stack_items" ON equipment_stack_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update equipment_stack_items" ON equipment_stack_items FOR UPDATE USING (true);
CREATE POLICY "Users can delete equipment_stack_items" ON equipment_stack_items FOR DELETE USING (true);

CREATE POLICY "Users can view all shipments" ON shipments FOR SELECT USING (true);
CREATE POLICY "Users can insert shipments" ON shipments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update shipments" ON shipments FOR UPDATE USING (true);
CREATE POLICY "Users can delete shipments" ON shipments FOR DELETE USING (true);

CREATE POLICY "Users can view all shipment_items" ON shipment_items FOR SELECT USING (true);
CREATE POLICY "Users can insert shipment_items" ON shipment_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update shipment_items" ON shipment_items FOR UPDATE USING (true);
CREATE POLICY "Users can delete shipment_items" ON shipment_items FOR DELETE USING (true);
