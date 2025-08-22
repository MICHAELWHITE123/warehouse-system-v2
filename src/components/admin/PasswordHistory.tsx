import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Clock, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface PasswordHistoryItem {
  id: number;
  user_id: number;
  password_hash: string;
  changed_by?: number;
  change_reason: string;
  created_at: string;
}

interface PasswordHistoryProps {
  userId: number;
  userName: string;
  userLogin: string;
  userNickname: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PasswordHistory({ userId, userName, userLogin, userNickname, isOpen, onClose }: PasswordHistoryProps) {
  const [history, setHistory] = useState<PasswordHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Загрузка истории паролей
  useEffect(() => {
    if (isOpen && userId) {
      loadPasswordHistory();
    }
  }, [isOpen, userId]);

  const loadPasswordHistory = async () => {
    setIsLoading(true);
    try {
      // Здесь должен быть API вызов для получения истории паролей
      // Пока используем моковые данные
      const mockHistory: PasswordHistoryItem[] = [
        {
          id: 1,
          user_id: userId,
          password_hash: "hash1...",
          change_reason: "password_change",
          created_at: "2024-01-15 10:30:00"
        },
        {
          id: 2,
          user_id: userId,
          password_hash: "hash2...",
          change_reason: "password_reset",
          changed_by: 1,
          created_at: "2024-01-10 14:20:00"
        },
        {
          id: 3,
          user_id: userId,
          password_hash: "hash3...",
          change_reason: "password_change",
          created_at: "2024-01-05 09:15:00"
        }
      ];
      
      setHistory(mockHistory);
    } catch (error) {
      toast.error("Ошибка при загрузке истории паролей");
      console.error("Error loading password history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getReasonLabel = (reason: string): string => {
    const labels: Record<string, string> = {
      'password_change': 'Изменение пароля',
      'password_reset': 'Сброс пароля',
      'initial_setup': 'Первоначальная установка',
      'admin_reset': 'Сброс администратором'
    };
    return labels[reason] || reason;
  };

  const getReasonBadgeVariant = (reason: string): string => {
    const variants: Record<string, string> = {
      'password_change': 'default',
      'password_reset': 'destructive',
      'initial_setup': 'secondary',
      'admin_reset': 'outline'
    };
    return variants[reason] || 'outline';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearHistory = async () => {
    try {
      // Здесь должен быть API вызов для очистки истории
      setHistory([]);
      toast.success("История паролей очищена");
    } catch (error) {
      toast.error("Ошибка при очистке истории паролей");
      console.error("Error clearing password history:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            История паролей
          </DialogTitle>
          <DialogDescription>
            История изменений паролей для пользователя: {userName} (@{userLogin} - {userNickname})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Статистика */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{history.length}</div>
                <p className="text-xs text-muted-foreground">Всего изменений</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {history.filter(h => h.change_reason === 'password_change').length}
                </div>
                <p className="text-xs text-muted-foreground">Самостоятельных изменений</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {history.filter(h => h.change_reason === 'password_reset').length}
                </div>
                <p className="text-xs text-muted-foreground">Сбросов пароля</p>
              </CardContent>
            </Card>
          </div>

          {/* История паролей */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Детальная история</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadPasswordHistory}
                  disabled={isLoading}
                >
                  Обновить
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearHistory}
                  disabled={history.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Очистить
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Загрузка истории паролей...
                </div>
              ) : history.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>История паролей пуста</p>
                  <p className="text-sm">Изменения паролей будут отображаться здесь</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата изменения</TableHead>
                      <TableHead>Тип изменения</TableHead>
                      <TableHead>Хеш пароля</TableHead>
                      <TableHead>Кем изменено</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">
                          {formatDate(item.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getReasonBadgeVariant(item.change_reason) as any}>
                            {getReasonLabel(item.change_reason)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.password_hash.substring(0, 20)}...
                        </TableCell>
                        <TableCell>
                          {item.changed_by ? (
                            <span className="text-sm text-muted-foreground">
                              ID: {item.changed_by}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Пользователь
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Информация о безопасности */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Рекомендации по безопасности
              </h4>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• История паролей хранится для аудита безопасности</p>
                <p>• Рекомендуется менять пароль каждые 90 дней</p>
                <p>• Не используйте один и тот же пароль для разных сервисов</p>
                <p>• При подозрении на компрометацию немедленно смените пароль</p>
              </div>
            </CardContent>
          </Card>

          {/* Информация о пользователе */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Информация о пользователе</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Имя:</span> {userName}
                </div>
                <div>
                  <span className="font-medium">Логин:</span> {userLogin}
                </div>
                <div>
                  <span className="font-medium">Никнейм:</span> {userNickname}
                </div>
                <div>
                  <span className="font-medium">Роль:</span> Администратор
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
