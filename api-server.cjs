const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Путь к файлу данных
const DB_FILE = path.join(__dirname, 'sync-db.json');

// Инициализация базы данных
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      operations: [],
      lastSync: {}
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Чтение данных из файла
function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB:', error);
    return { operations: [], lastSync: {} };
  }
}

// Запись данных в файл
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing DB:', error);
    return false;
  }
}

// Инициализируем БД
initDB();

// API Routes

// HEAD /sync - проверка доступности
app.head('/sync', (req, res) => {
  res.status(200).send();
});

// POST /sync - получение операций от клиента
app.post('/sync', (req, res) => {
  try {
    console.log('🔄 Received sync request:', req.body);
    
    const { operations, deviceId, userId } = req.body;
    const db = readDB();
    
    // Добавляем операции в базу
    if (operations && operations.length > 0) {
      operations.forEach(op => {
        // Проверяем, что операция еще не существует
        const exists = db.operations.find(existing => existing.id === op.id);
        if (!exists) {
          db.operations.push({
            ...op,
            receivedAt: new Date().toISOString()
          });
          console.log(`✅ Added operation: ${op.operation} on ${op.table}`);
        }
      });
    }
    
    // Обновляем время последней синхронизации для устройства
    if (deviceId) {
      db.lastSync[deviceId] = Date.now();
    }
    
    writeDB(db);
    
    // Возвращаем успешный результат
    res.json({
      success: true,
      syncedOperations: operations || [],
      conflicts: [] // Пока без конфликтов
    });
    
  } catch (error) {
    console.error('❌ Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// GET /sync/operations - получение операций для устройства
app.get('/sync/operations', (req, res) => {
  try {
    const { deviceId, lastSync } = req.query;
    console.log(`📥 Pulling operations for device: ${deviceId}, lastSync: ${lastSync}`);
    
    const db = readDB();
    const lastSyncTime = parseInt(lastSync) || 0;
    
    // Возвращаем операции от других устройств, которые новее lastSync
    const newOperations = db.operations.filter(op => {
      return op.deviceId !== deviceId && op.timestamp > lastSyncTime;
    });
    
    console.log(`📤 Returning ${newOperations.length} operations`);
    
    res.json({
      operations: newOperations,
      serverTime: Date.now()
    });
    
  } catch (error) {
    console.error('❌ Pull operations error:', error);
    res.status(500).json({ error: 'Pull failed' });
  }
});

// POST /sync/operations/:id/acknowledge - подтверждение обработки операции
app.post('/sync/operations/:id/acknowledge', (req, res) => {
  try {
    const { id } = req.params;
    console.log(`✅ Acknowledging operation: ${id}`);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Acknowledge error:', error);
    res.status(500).json({ error: 'Acknowledge failed' });
  }
});

// GET /status - статус сервера
app.get('/status', (req, res) => {
  const db = readDB();
  res.json({
    status: 'running',
    operationsCount: db.operations.length,
    devices: Object.keys(db.lastSync).length,
    lastSync: db.lastSync
  });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sync API Server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Your phone can connect to: http://YOUR_COMPUTER_IP:${PORT}`);
  console.log(`💻 Local development: http://localhost:${PORT}`);
  console.log(`📊 Server status: http://localhost:${PORT}/status`);
});
