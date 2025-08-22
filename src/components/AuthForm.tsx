import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Package, User, Key } from "lucide-react";
import { User as UserType } from "./Navigation";

interface AuthFormProps {
  onLogin: (user: UserType) => void;
}

export function AuthForm({ onLogin }: AuthFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Очистка полей при загрузке компонента
  useEffect(() => {
    // Очистка состояния
    setUsername("");
    setPassword("");
    setError("");
    
    // Принудительная пересборка формы
    setFormKey(prev => prev + 1);
  }, []);

  // Реальные пользователи для продакшн системы
  const productionUsers: Record<string, { password: string; role: string; displayName: string }> = {
    Qstream: {
      password: "QstreamPro2023",
      role: "admin",
      displayName: "Администратор Системы"
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Отладочная информация
    console.log("=== AuthForm Debug ===");
    console.log("Username entered:", username);
    console.log("Password entered:", password);
    console.log("Available users:", Object.keys(productionUsers));
    console.log("User found:", productionUsers[username]);
    console.log("Password match:", productionUsers[username]?.password === password);
    console.log("=====================");

    // Симуляция загрузки
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = productionUsers[username];
    
    if (user && user.password === password) {
      console.log("Authentication successful, calling onLogin with:", {
        username: username,
        role: user.role,
        displayName: user.displayName
      });
      
      onLogin({
        username: username,
        role: user.role,
        displayName: user.displayName
      });
    } else {
      console.log("Authentication failed");
      if (!productionUsers[username]) {
        setError(`Пользователь "${username}" не найден`);
      } else {
        setError("Неверный пароль. Проверьте правильность ввода");
      }
    }

    setIsLoading(false);
  };

  const handleReset = () => {
    // Очистка состояния
    setUsername("");
    setPassword("");
    setError("");
    
    // Принудительная пересборка формы
    setFormKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <Package className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Вход в систему</CardTitle>
          <CardDescription>
            Система учета техники на складе
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Логин</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Введите логин"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Вход..." : "Войти"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleReset}
                disabled={isLoading}
              >
                Очистить
              </Button>
            </div>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>Система управления складом</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}