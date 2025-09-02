import { useState, useEffect } from "react";
import { User } from "../components/Navigation";
import { toast } from "sonner";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Проверяем сохраненную сессию пользователя
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Обеспечиваем что у пользователя есть displayName
        if (parsedUser && !parsedUser.displayName) {
          parsedUser.displayName = getDisplayNameForUser(parsedUser.username, parsedUser.role);
        }
        setUser(parsedUser);
      } catch (error) {
        console.error("Ошибка при загрузке сессии пользователя:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Функция для генерации отображаемого имени на основе логина и роли
  const getDisplayNameForUser = (username: string, _role: string): string => {
    const userNames: Record<string, string> = {
      Qstream: "Администратор Системы"
    };

    return userNames[username] || `Пользователь ${username}`;
  };

  const handleLogin = (userData: User) => {
    // Убеждаемся что у пользователя есть displayName
    const userWithDisplayName = {
      ...userData,
      displayName: userData.displayName || getDisplayNameForUser(userData.username, userData.role)
    };

    setUser(userWithDisplayName);
    localStorage.setItem("user", JSON.stringify(userWithDisplayName));
    toast.success("Добро пожаловать в систему управления складом!");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast.success("Вы успешно вышли из системы");
  };

  return { user, handleLogin, handleLogout };
};