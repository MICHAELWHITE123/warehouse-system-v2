import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface RealTimeStatusProps {
  isConnected: boolean;
  connectionError: string | null;
  lastUpdate: any;
  onReconnect: () => void;
}

export function RealTimeStatus({ isConnected, connectionError, lastUpdate, onReconnect }: RealTimeStatusProps) {
  const getStatusIcon = () => {
    if (isConnected) {
      return <Wifi className="h-4 w-4 text-green-500" />;
    } else {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (isConnected) {
      return 'Подключено';
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

  const formatLastUpdate = () => {
    if (!lastUpdate || !lastUpdate.timestamp) {
      return 'Нет обновлений';
    }

    const date = new Date(lastUpdate.timestamp);
    return `${date.toLocaleTimeString()} - ${lastUpdate.type}`;
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={getStatusVariant()} className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-xs">{getStatusText()}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p><strong>Статус:</strong> {getStatusText()}</p>
              {connectionError && (
                <p className="text-red-400"><strong>Ошибка:</strong> {connectionError}</p>
              )}
              <p><strong>Последнее обновление:</strong> {formatLastUpdate()}</p>
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
              <p>Переподключиться</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
