// Менеджер для экспорта/импорта данных базы данных

import { browserDb } from './browserDatabase';

export class DataManager {
  // Экспорт всех данных в JSON файл
  static exportData(): string {
    try {
      const data = localStorage.getItem('warehouse-db');
      if (!data) {
        throw new Error('Нет данных для экспорта');
      }
      
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: JSON.parse(data)
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Ошибка при экспорте данных:', error);
      throw error;
    }
  }

  // Импорт данных из JSON
  static importData(jsonData: string): boolean {
    try {
      const importData = JSON.parse(jsonData);
      
      // Проверяем формат данных
      if (!importData.data || !importData.version) {
        throw new Error('Неверный формат файла');
      }
      
      // Сохраняем данные
      localStorage.setItem('warehouse-db', JSON.stringify(importData.data));
      
      // Перезагружаем базу данных
      browserDb.reloadFromStorage();
      
      return true;
    } catch (error) {
      console.error('Ошибка при импорте данных:', error);
      throw error;
    }
  }

  // Скачать данные как файл
  static downloadData(filename: string = 'warehouse-backup.json'): void {
    try {
      const data = this.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
      throw error;
    }
  }

  // Загрузить данные из файла
  static loadFromFile(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error('Файл не выбран'));
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const success = this.importData(content);
            resolve(success);
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error('Ошибка чтения файла'));
        reader.readAsText(file);
      };
      
      input.click();
    });
  }

  // Очистить все данные
  static clearAllData(): boolean {
    try {
      localStorage.removeItem('warehouse-db');
      browserDb.clearDatabase();
      return true;
    } catch (error) {
      console.error('Ошибка при очистке данных:', error);
      return false;
    }
  }

  // Получить информацию о размере данных
  static getDataInfo(): { size: string; recordsCount: number } {
    try {
      const data = localStorage.getItem('warehouse-db');
      if (!data) {
        return { size: '0 bytes', recordsCount: 0 };
      }
      
      const sizeInBytes = new Blob([data]).size;
      const sizeFormatted = this.formatBytes(sizeInBytes);
      
      const parsedData = JSON.parse(data);
      const recordsCount = Object.values(parsedData).reduce((total: number, table: any) => {
        return total + Object.keys(table).length;
      }, 0);
      
      return { size: sizeFormatted, recordsCount };
    } catch (error) {
      console.error('Ошибка при получении информации о данных:', error);
      return { size: 'unknown', recordsCount: 0 };
    }
  }

  // Форматирование размера в человекочитаемый вид
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 bytes';
    
    const k = 1024;
    const sizes = ['bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default DataManager;
