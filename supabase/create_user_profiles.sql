-- =====================================================
-- СОЗДАНИЕ ТАБЛИЦЫ USER_PROFILES И ТЕСТОВОГО ПОЛЬЗОВАТЕЛЯ
-- PostgreSQL версия для Supabase
-- Дата: 2025-01-01
-- =====================================================

-- Создаем таблицу user_profiles если её нет
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создаем тестового пользователя
INSERT INTO user_profiles (id, username, email, full_name, role) VALUES
('00000000-0000-0000-0000-000000000000', 'system', 'system@wearehouse.local', 'System User', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Проверяем что пользователь создан
SELECT * FROM user_profiles;

