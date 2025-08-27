import { Database, DatabaseZap, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Card, CardContent } from './ui/card';

interface SupabaseRealtimeStatusProps {
  isConnected: boolean;
  connectionError: string | null;
  lastEvent: any;
  onReconnect: () => void;
  showDetails?: boolean;
}

export function SupabaseRealtimeStatus({ 
  isConnected, 
  connectionError, 
  lastEvent, 
  onReconnect,
  showDetails = false 
}: SupabaseRealtimeStatusProps) {
  const getStatusIcon = () => {
    if (isConnected) {
      return <DatabaseZap className="h-4 w-4 text-green-500" />;
    } else {
      return <Database className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (isConnected) {
      return 'Supabase Realtime';
    } else if (connectionError) {
      return 'Ошибка подключения';
    } else {
      return 'Подключение...';
    }
  };

  const getStatusVariant = () => {
    if (isConnected) {
      return 'default' as const;
    } else {
      return 'destructive' as const;
    }
  };

  const formatLastEvent = () => {
    if (!lastEvent || !lastEvent.timestamp) {
      return 'Нет событий';
    }

    const date = new Date(lastEvent.timestamp);
    const timeStr = date.toLocaleTimeString();
    const eventInfo = `${lastEvent.table} ${lastEvent.type}`;
    
    return `${timeStr} - ${eventInfo}`;
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'INSERT':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'UPDATE':
        return <RefreshCw className="h-3 w-3 text-blue-500" />;
      case 'DELETE':
        return <AlertTriangle className="h-3 w-3 text-red-500" />;
      default:
        return <Database className="h-3 w-3 text-gray-500" />;
    }
  };

  if (showDetails) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Основной статус */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-medium">{getStatusText()}</span>
              </div>
              <Badge variant={getStatusVariant()}>
                {isConnected ? 'Активно' : 'Отключено'}
              </Badge>
            </div>

            {/* Ошибка подключения */}
            {connectionError && (
              <div className="flex items-start gap-2 p-2 bg-red-50 rounded-md">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Ошибка</p>
                  <p className="text-xs text-red-600">{connectionError}</p>
                </div>
              </div>
            )}

            {/* Последнее событие */}
            {lastEvent && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Последнее событие:</p>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                  {getEventTypeIcon(lastEvent.type)}
                  <div className="flex-1">
                    <p className="text-xs font-medium">
                      {lastEvent.table} - {lastEvent.type}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(lastEvent.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Кнопка переподключения */}
            {!isConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReconnect}
                className="w-full flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Переподключиться
              </Button>
            )}

            {/* Информация о Supabase */}
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500">
                Powered by Supabase Realtime
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Компактная версия
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={getStatusVariant()} className="flex items-center gap-1 cursor-help">
              {getStatusIcon()}
              <span className="text-xs">{getStatusText()}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="text-sm space-y-1">
              <p><strong>Статус:</strong> {getStatusText()}</p>
              {connectionError && (
                <p className="text-red-400"><strong>Ошибка:</strong> {connectionError}</p>
              )}
              <p><strong>Последнее событие:</strong> {formatLastEvent()}</p>
              <p className="text-xs text-gray-400 pt-1">
                Supabase Realtime обеспечивает мгновенную синхронизацию данных
              </p>
            </div>
          </TooltipContent>
        </Tooltip>

        {!isConnected && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onReconnect}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Переподключиться к Supabase Realtime</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
