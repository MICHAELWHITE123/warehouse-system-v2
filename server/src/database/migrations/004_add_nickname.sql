-- Миграция для добавления полей nickname и login в таблицу пользователей
-- Добавляем поля для отображения пользовательского никнейма и логина

-- Добавляем поле nickname в таблицу users
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(50);

-- Добавляем поле login в таблицу users
ALTER TABLE users ADD COLUMN IF NOT EXISTS login VARCHAR(50);

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);

-- Добавляем комментарии к новым полям
COMMENT ON COLUMN users.nickname IS 'Пользовательский никнейм для отображения';
COMMENT ON COLUMN users.login IS 'Логин пользователя для входа в систему';

-- Обновляем существующих пользователей, устанавливая nickname и login на основе username
UPDATE users SET nickname = username, login = username WHERE nickname IS NULL OR login IS NULL;

-- Делаем поля nickname и login обязательными после заполнения
ALTER TABLE users ALTER COLUMN nickname SET NOT NULL;
ALTER TABLE users ALTER COLUMN login SET NOT NULL;

-- Добавляем уникальные ограничения
ALTER TABLE users ADD CONSTRAINT users_nickname_unique UNIQUE (nickname);
ALTER TABLE users ADD CONSTRAINT users_login_unique UNIQUE (login);
