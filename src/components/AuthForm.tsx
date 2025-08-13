import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Package, Shield, User, Key } from "lucide-react";
import { User as UserType } from "./Navigation";

interface AuthFormProps {
  onLogin: (user: UserType) => void;
}

export function AuthForm({ onLogin }: AuthFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Демо-пользователи с полными данными
  const demoUsers: Record<string, { password: string; role: string; displayName: string }> = {
    admin: {
      password: "demo123",
      role: "admin",
      displayName: "Администратор Системы"
    },
    manager: {
      password: "demo123",
      role: "manager",
      displayName: "Менеджер Склада"
    },
    operator: {
      password: "demo123",
      role: "operator",
      displayName: "Оператор Склада"
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Симуляция загрузки
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = demoUsers[username.toLowerCase()];
    
    if (user && user.password === password) {
      onLogin({
        username: username.toLowerCase(),
        role: user.role,
        displayName: user.displayName
      });
    } else {
      setError("Неверный логин или пароль");
    }

    setIsLoading(false);
  };

  const handleDemoLogin = (demoUsername: string) => {
    const user = demoUsers[demoUsername];
    if (user) {
      onLogin({
        username: demoUsername,
        role: user.role,
        displayName: user.displayName
      });
    }
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Вход..." : "Войти"}
            </Button>
          </form>

          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-2 text-muted-foreground">
                  Демо-аккаунты
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin("admin")}
                className="flex items-center justify-start gap-2"
              >
                <Shield className="h-4 w-4 text-red-500" />
                <div className="text-left">
                  <div className="font-medium">Администратор</div>
                  <div className="text-xs text-muted-foreground">admin / demo123</div>
                </div>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin("manager")}
                className="flex items-center justify-start gap-2"
              >
                <Shield className="h-4 w-4 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium">Менеджер</div>
                  <div className="text-xs text-muted-foreground">manager / demo123</div>
                </div>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin("operator")}
                className="flex items-center justify-start gap-2"
              >
                <Shield className="h-4 w-4 text-green-500" />
                <div className="text-left">
                  <div className="font-medium">Оператор</div>
                  <div className="text-xs text-muted-foreground">operator / demo123</div>
                </div>
              </Button>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Это демо-приложение для демонстрации функционала</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}