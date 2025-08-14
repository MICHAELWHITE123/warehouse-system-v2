// Простая браузерная база данных на основе localStorage

interface DatabaseRecord {
  id: number;
  [key: string]: any;
}

interface DatabaseTable {
  [id: string]: DatabaseRecord;
}

interface DatabaseSchema {
  [tableName: string]: DatabaseTable;
}

class BrowserDatabase {
  private dbName: string;
  private schema: DatabaseSchema = {};

  constructor(dbName: string = 'warehouse-db') {
    this.dbName = dbName;
    this.loadFromStorage();
  }

  // Загрузка данных из localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.dbName);
      if (stored) {
        this.schema = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading database from storage:', error);
      this.schema = {};
    }
  }

  // Публичный метод для перезагрузки данных из localStorage
  public reloadFromStorage(): void {
    this.loadFromStorage();
  }

  // Сохранение данных в localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.dbName, JSON.stringify(this.schema));
    } catch (error) {
      console.error('Error saving database to storage:', error);
    }
  }

  // Создание таблицы
  createTable(tableName: string): void {
    if (!this.schema[tableName]) {
      this.schema[tableName] = {};
      this.saveToStorage();
    }
  }

  // Получение следующего ID для таблицы
  private getNextId(tableName: string): number {
    const table = this.schema[tableName] || {};
    const ids = Object.keys(table).map(Number);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  // Вставка записи
  insert(tableName: string, data: Omit<DatabaseRecord, 'id'>): DatabaseRecord {
    this.createTable(tableName);
    
    const id = this.getNextId(tableName);
    const record: DatabaseRecord = { id, ...data };
    
    this.schema[tableName][id] = record;
    this.saveToStorage();
    
    return record;
  }

  // Получение всех записей из таблицы
  selectAll(tableName: string): DatabaseRecord[] {
    const table = this.schema[tableName] || {};
    return Object.values(table);
  }

  // Получение записи по ID
  selectById(tableName: string, id: number): DatabaseRecord | null {
    const table = this.schema[tableName] || {};
    return table[id] || null;
  }

  // Поиск записей по условию
  selectWhere(tableName: string, condition: (record: DatabaseRecord) => boolean): DatabaseRecord[] {
    const table = this.schema[tableName] || {};
    return Object.values(table).filter(condition);
  }

  // Обновление записи
  update(tableName: string, id: number, updates: Partial<DatabaseRecord>): DatabaseRecord | null {
    const table = this.schema[tableName] || {};
    const record = table[id];
    
    if (!record) return null;
    
    const updatedRecord = { ...record, ...updates, id }; // id не должен изменяться
    this.schema[tableName][id] = updatedRecord;
    this.saveToStorage();
    
    return updatedRecord;
  }

  // Удаление записи
  delete(tableName: string, id: number): boolean {
    const table = this.schema[tableName] || {};
    
    if (table[id]) {
      delete table[id];
      this.saveToStorage();
      return true;
    }
    
    return false;
  }

  // Очистка таблицы
  clearTable(tableName: string): void {
    this.schema[tableName] = {};
    this.saveToStorage();
  }

  // Очистка всей базы данных
  clearDatabase(): void {
    this.schema = {};
    this.saveToStorage();
  }

  // Выполнение запроса с JOIN (упрощенная версия)
  selectWithJoin(
    mainTable: string,
    joinTable: string,
    mainKey: string,
    joinKey: string,
    condition?: (record: any) => boolean
  ): any[] {
    const mainRecords = this.selectAll(mainTable);
    const joinRecords = this.selectAll(joinTable);
    
    const result = mainRecords.map(mainRecord => {
      const joinRecord = joinRecords.find(jr => jr[joinKey] === mainRecord[mainKey]);
      return {
        ...mainRecord,
        ...joinRecord
      };
    });
    
    return condition ? result.filter(condition) : result;
  }

  // Подсчет записей
  count(tableName: string, condition?: (record: DatabaseRecord) => boolean): number {
    const records = this.selectAll(tableName);
    return condition ? records.filter(condition).length : records.length;
  }

  // Инициализация базы данных с начальными данными
  async initializeWithSeedData(): Promise<void> {
    // Проверяем, инициализирована ли уже база
    if (this.selectAll('migrations').length > 0) {
      return; // База уже инициализирована
    }

    console.log('Инициализация базы данных...');

    // Создаем таблицы
    this.createTable('migrations');
    this.createTable('categories');
    this.createTable('locations');
    this.createTable('equipment');
    this.createTable('equipment_stacks');
    this.createTable('stack_equipment');
    this.createTable('shipments');
    this.createTable('shipment_equipment');
    this.createTable('shipment_stacks');
    this.createTable('shipment_checklist');
    this.createTable('shipment_rental');

    // Добавляем запись о миграции
    this.insert('migrations', {
      filename: 'initial_seed',
      executed_at: new Date().toISOString()
    });

    // Заполняем начальными данными
    // Категории
    const categories = [
      { name: 'Компьютеры', description: 'Настольные компьютеры, ноутбуки, моноблоки' },
      { name: 'Принтеры', description: 'Принтеры, МФУ, плоттеры' },
      { name: 'Мониторы', description: 'Мониторы различных типов и размеров' },
      { name: 'Сетевое оборудование', description: 'Коммутаторы, маршрутизаторы, точки доступа' },
      { name: 'Мобильные устройства', description: 'Смартфоны, планшеты' },
      { name: 'Аксессуары', description: 'Клавиатуры, мыши, наушники, кабели' }
    ];

    categories.forEach(cat => this.insert('categories', cat));

    // Местоположения
    const locations = [
      { name: 'ИТ-отдел', description: 'Основной ИТ отдел компании', address: 'Главный офис, 3 этаж' },
      { name: 'Офис 1', description: 'Первый офис', address: 'Главный офис, 1 этаж' },
      { name: 'Склад A', description: 'Основной склад', address: 'Складское помещение А' },
      { name: 'Склад B', description: 'Дополнительный склад', address: 'Складское помещение Б' }
    ];

    locations.forEach(loc => this.insert('locations', loc));

    // Получаем ID категорий и местоположений для связей
    const categoryComputers = this.selectWhere('categories', r => r.name === 'Компьютеры')[0];
    const categoryPrinters = this.selectWhere('categories', r => r.name === 'Принтеры')[0];
    const categoryMonitors = this.selectWhere('categories', r => r.name === 'Мониторы')[0];
    const categoryNetwork = this.selectWhere('categories', r => r.name === 'Сетевое оборудование')[0];
    const categoryMobile = this.selectWhere('categories', r => r.name === 'Мобильные устройства')[0];
    const categoryAccessories = this.selectWhere('categories', r => r.name === 'Аксессуары')[0];

    const locationIT = this.selectWhere('locations', r => r.name === 'ИТ-отдел')[0];
    const locationOffice1 = this.selectWhere('locations', r => r.name === 'Офис 1')[0];
    const locationWarehouseA = this.selectWhere('locations', r => r.name === 'Склад A')[0];
    const locationWarehouseB = this.selectWhere('locations', r => r.name === 'Склад B')[0];

    // Оборудование
    const equipment = [
      {
        uuid: '1',
        name: 'MacBook Pro 16"',
        category_id: categoryComputers?.id,
        serial_number: 'MBP16-001',
        status: 'in-use',
        location_id: locationIT?.id,
        purchase_date: '2023-01-15',
        last_maintenance: '2024-06-01',
        assigned_to: 'Иванов И.И.',
        description: 'Ноутбук для разработки',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        uuid: '2',
        name: 'HP LaserJet Pro 400',
        category_id: categoryPrinters?.id,
        serial_number: 'HP400-001',
        status: 'available',
        location_id: locationOffice1?.id,
        purchase_date: '2022-08-10',
        last_maintenance: '2024-03-15',
        description: 'Лазерный принтер для офиса',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        uuid: '3',
        name: 'Dell UltraSharp 27"',
        category_id: categoryMonitors?.id,
        serial_number: 'DELL27-001',
        status: 'available',
        location_id: locationIT?.id,
        purchase_date: '2023-03-20',
        description: 'Монитор для рабочего места',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        uuid: '4',
        name: 'Cisco SG350-28',
        category_id: categoryNetwork?.id,
        serial_number: 'CSC28-001',
        status: 'maintenance',
        location_id: locationWarehouseA?.id,
        purchase_date: '2022-12-05',
        last_maintenance: '2024-07-20',
        description: 'Управляемый коммутатор',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        uuid: '5',
        name: 'iPhone 14 Pro',
        category_id: categoryMobile?.id,
        serial_number: 'IPH14-001',
        status: 'available',
        location_id: locationWarehouseB?.id,
        purchase_date: '2023-09-25',
        description: 'Смартфон для мобильной работы',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        uuid: '6',
        name: 'Logitech MX Master 3',
        category_id: categoryAccessories?.id,
        serial_number: 'LGT-MX3-001',
        status: 'available',
        location_id: locationIT?.id,
        purchase_date: '2023-05-10',
        description: 'Беспроводная мышь',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        uuid: '7',
        name: 'Apple Magic Keyboard',
        category_id: categoryAccessories?.id,
        serial_number: 'APL-KB-001',
        status: 'available',
        location_id: locationIT?.id,
        purchase_date: '2023-05-10',
        description: 'Беспроводная клавиатура',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    equipment.forEach(eq => this.insert('equipment', eq));

    // Стеки оборудования
    const stacks = [
      {
        uuid: '1',
        name: 'Комплект разработчика',
        description: 'Полный набор техники для программиста: ноутбук, монитор и аксессуары',
        created_by: 'Администратор',
        tags: JSON.stringify(['разработка', 'программирование', 'рабочее место']),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        uuid: '2',
        name: 'Базовый офисный комплект',
        description: 'Минимальный набор техники для офисного работника',
        created_by: 'Менеджер',
        tags: JSON.stringify(['офис', 'базовый комплект']),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    stacks.forEach(stack => this.insert('equipment_stacks', stack));

    console.log('База данных инициализирована успешно!');
  }
}

// Создаем единственный экземпляр базы данных
export const browserDb = new BrowserDatabase();

// Экспортируем типы и класс
export type { DatabaseRecord, BrowserDatabase };
export default BrowserDatabase;
