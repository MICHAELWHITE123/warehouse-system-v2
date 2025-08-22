-- Миграция для добавления таблицы истории паролей
-- Создаем таблицу для отслеживания изменений паролей пользователей

CREATE TABLE IF NOT EXISTS password_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    change_reason VARCHAR(100) DEFAULT 'password_change',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем индекс для быстрого поиска по пользователю
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);

-- Создаем индекс для поиска по дате изменения
CREATE INDEX IF NOT EXISTS idx_password_history_created_at ON password_history(created_at);

-- Добавляем комментарии к таблице
COMMENT ON TABLE password_history IS 'История изменений паролей пользователей';
COMMENT ON COLUMN password_history.user_id IS 'ID пользователя, чей пароль был изменен';
COMMENT ON COLUMN password_history.password_hash IS 'Хеш пароля';
COMMENT ON COLUMN password_history.changed_by IS 'ID пользователя, который изменил пароль';
COMMENT ON COLUMN password_history.change_reason IS 'Причина изменения пароля (password_change, password_reset, etc.)';
COMMENT ON COLUMN password_history.created_at IS 'Дата и время изменения пароля';
