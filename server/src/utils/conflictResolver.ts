import { SyncEntry } from '../models/SyncEntryModel';

export interface ConflictResolutionResult {
  success: boolean;
  resolvedData?: any;
  error?: string;
  requiresManualIntervention?: boolean;
}

export interface ConflictContext {
  tableName: string;
  recordId: string;
  localData: any;
  remoteData: any;
  localTimestamp: Date;
  remoteTimestamp: Date;
  conflictType: 'concurrent_update' | 'delete_update' | 'update_delete';
}

export class ConflictResolver {
  /**
   * Автоматическое разрешение конфликта по стратегии "последнее изменение выигрывает"
   */
  static resolveByLastWins(context: ConflictContext): ConflictResolutionResult {
    try {
      const localTime = context.localTimestamp.getTime();
      const remoteTime = context.remoteTimestamp.getTime();

      if (localTime === remoteTime) {
        return {
          success: false,
          requiresManualIntervention: true,
          error: 'Timestamps are identical, manual resolution required'
        };
      }

      const winningData = localTime > remoteTime ? context.localData : context.remoteData;

      return {
        success: true,
        resolvedData: winningData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Разрешение конфликта с предпочтением локальных данных
   */
  static resolveByLocalWins(context: ConflictContext): ConflictResolutionResult {
    try {
      return {
        success: true,
        resolvedData: context.localData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Разрешение конфликта с предпочтением удаленных данных
   */
  static resolveByRemoteWins(context: ConflictContext): ConflictResolutionResult {
    try {
      return {
        success: true,
        resolvedData: context.remoteData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Интеллектуальное слияние данных (для простых случаев)
   */
  static resolveByMerge(context: ConflictContext): ConflictResolutionResult {
    try {
      if (context.conflictType === 'delete_update' || context.conflictType === 'update_delete') {
        return {
          success: false,
          requiresManualIntervention: true,
          error: 'Delete conflicts require manual resolution'
        };
      }

      const merged = this.mergeObjects(context.localData, context.remoteData, context.localTimestamp, context.remoteTimestamp);
      
      return {
        success: true,
        resolvedData: merged
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Merge failed'
      };
    }
  }

  /**
   * Специализированные разрешители для конкретных таблиц
   */
  static resolveByTableLogic(context: ConflictContext): ConflictResolutionResult {
    switch (context.tableName) {
      case 'equipment':
        return this.resolveEquipmentConflict(context);
      case 'locations':
        return this.resolveLocationConflict(context);
      case 'shipments':
        return this.resolveShipmentConflict(context);
      case 'categories':
        return this.resolveCategoryConflict(context);
      default:
        return this.resolveByLastWins(context);
    }
  }

  /**
   * Разрешение конфликтов для оборудования
   */
  private static resolveEquipmentConflict(context: ConflictContext): ConflictResolutionResult {
    try {
      const local = context.localData;
      const remote = context.remoteData;

      // Для оборудования приоритет имеют:
      // 1. Обновления статуса (важно для отслеживания)
      // 2. Обновления местоположения
      // 3. Технические характеристики

      const merged = { ...local };

      // Приоритет статуса по времени
      if (remote.status && (!local.status || context.remoteTimestamp > context.localTimestamp)) {
        merged.status = remote.status;
      }

      // Приоритет местоположения по времени
      if (remote.location_id && (!local.location_id || context.remoteTimestamp > context.localTimestamp)) {
        merged.location_id = remote.location_id;
      }

      // Технические данные - берем более полные
      if (remote.specifications && Object.keys(remote.specifications || {}).length > Object.keys(local.specifications || {}).length) {
        merged.specifications = remote.specifications;
      }

      return {
        success: true,
        resolvedData: merged
      };
    } catch (error) {
      return this.resolveByLastWins(context);
    }
  }

  /**
   * Разрешение конфликтов для местоположений
   */
  private static resolveLocationConflict(context: ConflictContext): ConflictResolutionResult {
    try {
      const local = context.localData;
      const remote = context.remoteData;

      // Для местоположений важны:
      // 1. Название и описание
      // 2. Активность локации
      // 3. Метаданные

      const merged = { ...local };

      // Обновления имени имеют приоритет по времени
      if (remote.name && context.remoteTimestamp > context.localTimestamp) {
        merged.name = remote.name;
      }

      // Описание тоже по времени
      if (remote.description && context.remoteTimestamp > context.localTimestamp) {
        merged.description = remote.description;
      }

      // Статус активности - приоритет более позднему изменению
      if (remote.is_active !== undefined && context.remoteTimestamp > context.localTimestamp) {
        merged.is_active = remote.is_active;
      }

      return {
        success: true,
        resolvedData: merged
      };
    } catch (error) {
      return this.resolveByLastWins(context);
    }
  }

  /**
   * Разрешение конфликтов для поставок
   */
  private static resolveShipmentConflict(context: ConflictContext): ConflictResolutionResult {
    try {
      const local = context.localData;
      const remote = context.remoteData;

      // Для поставок критично:
      // 1. Статус поставки
      // 2. Список оборудования
      // 3. Даты

      const merged = { ...local };

      // Статус поставки - приоритет последнему изменению
      if (remote.status && context.remoteTimestamp > context.localTimestamp) {
        merged.status = remote.status;
      }

      // Список оборудования - объединяем
      if (remote.equipment_ids && Array.isArray(remote.equipment_ids)) {
        const localIds = Array.isArray(local.equipment_ids) ? local.equipment_ids : [];
        merged.equipment_ids = [...new Set([...localIds, ...remote.equipment_ids])];
      }

      // Даты - берем более позднее изменение
      if (remote.delivered_at && context.remoteTimestamp > context.localTimestamp) {
        merged.delivered_at = remote.delivered_at;
      }

      return {
        success: true,
        resolvedData: merged
      };
    } catch (error) {
      return this.resolveByLastWins(context);
    }
  }

  /**
   * Разрешение конфликтов для категорий
   */
  private static resolveCategoryConflict(context: ConflictContext): ConflictResolutionResult {
    // Категории редко изменяются, поэтому просто последнее изменение выигрывает
    return this.resolveByLastWins(context);
  }

  /**
   * Вспомогательная функция для слияния объектов
   */
  private static mergeObjects(local: any, remote: any, localTime: Date, remoteTime: Date): any {
    const result = { ...local };

    for (const key in remote) {
      if (remote.hasOwnProperty(key)) {
        if (!(key in local)) {
          // Новое поле - добавляем
          result[key] = remote[key];
        } else if (JSON.stringify(local[key]) !== JSON.stringify(remote[key])) {
          // Поля различаются - берем более новое по времени
          if (remoteTime > localTime) {
            result[key] = remote[key];
          }
          // Иначе оставляем локальное значение
        }
      }
    }

    return result;
  }

  /**
   * Проверка возможности автоматического разрешения
   */
  static canAutoResolve(context: ConflictContext): boolean {
    // Некоторые конфликты требуют ручного вмешательства
    if (context.conflictType === 'delete_update' || context.conflictType === 'update_delete') {
      return false;
    }

    // Проверяем, есть ли критические различия
    if (context.tableName === 'shipments' && 
        context.localData.status !== context.remoteData.status &&
        (context.localData.status === 'delivered' || context.remoteData.status === 'delivered')) {
      return false; // Изменения статуса доставки требуют ручной проверки
    }

    return true;
  }

  /**
   * Получение рекомендации по разрешению конфликта
   */
  static getResolutionRecommendation(context: ConflictContext): {
    strategy: 'local_wins' | 'remote_wins' | 'merge' | 'manual';
    confidence: number;
    reason: string;
  } {
    // Если есть удаление - ручное разрешение
    if (context.conflictType === 'delete_update' || context.conflictType === 'update_delete') {
      return {
        strategy: 'manual',
        confidence: 1.0,
        reason: 'Delete conflicts require manual review'
      };
    }

    // Если временные метки сильно различаются - предпочтение последнему
    const timeDiff = Math.abs(context.localTimestamp.getTime() - context.remoteTimestamp.getTime());
    if (timeDiff > 60000) { // Больше минуты
      return {
        strategy: context.localTimestamp > context.remoteTimestamp ? 'local_wins' : 'remote_wins',
        confidence: 0.9,
        reason: 'Clear time difference suggests last-wins strategy'
      };
    }

    // Если изменения касаются разных полей - можно объединить
    const localKeys = Object.keys(context.localData);
    const remoteKeys = Object.keys(context.remoteData);
    const conflictingKeys = localKeys.filter(key => 
      remoteKeys.includes(key) && 
      JSON.stringify(context.localData[key]) !== JSON.stringify(context.remoteData[key])
    );

    if (conflictingKeys.length <= localKeys.length / 2) {
      return {
        strategy: 'merge',
        confidence: 0.8,
        reason: 'Few conflicting fields, merge is possible'
      };
    }

    return {
      strategy: 'manual',
      confidence: 0.6,
      reason: 'Complex conflict, manual review recommended'
    };
  }
}
