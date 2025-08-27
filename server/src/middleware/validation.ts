import { Request, Response, NextFunction } from 'express';
import { body, validationResult, query } from 'express-validator';

// Функция для обработки ошибок валидации
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }
  
  next();
};

// Улучшенная валидация паролей
export const validatePassword = (fieldName: string = 'password') => {
  return body(fieldName)
    .isLength({ min: 8 })
    .withMessage('Пароль должен содержать минимум 8 символов')
    .matches(/^(?=.*[a-z])/)
    .withMessage('Пароль должен содержать минимум одну строчную букву')
    .matches(/^(?=.*[A-Z])/)
    .withMessage('Пароль должен содержать минимум одну заглавную букву')
    .matches(/^(?=.*\d)/)
    .withMessage('Пароль должен содержать минимум одну цифру')
    .matches(/^(?=.*[@$!%*?&])/)
    .withMessage('Пароль должен содержать минимум один специальный символ (@$!%*?&)')
    .matches(/^[a-zA-Z0-9@$!%*?&]+$/)
    .withMessage('Пароль может содержать только буквы, цифры и специальные символы @$!%*?&');
};

// Валидация для входа
export const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  handleValidationErrors
];

// Валидация для регистрации
export const validateRegister = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('login')
    .notEmpty()
    .withMessage('Login is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Login must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Login can only contain letters, numbers, and underscores'),
  
  body('nickname')
    .notEmpty()
    .withMessage('Nickname is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Nickname must be between 2 and 50 characters')
    .matches(/^[a-zA-Zа-яА-Я0-9_\s-]+$/)
    .withMessage('Nickname can contain letters, numbers, spaces, underscores and hyphens'),
  
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  validatePassword('password'),
  
  body('full_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Full name must not exceed 100 characters'),
  
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'user'])
    .withMessage('Role must be one of: admin, manager, user'),
  
  handleValidationErrors
];

// Валидация для создания пользователя
export const validateCreateUser = [
  ...validateRegister
];

// Валидация для обновления пользователя
export const validateUpdateUser = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('login')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Login must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Login can only contain letters, numbers, and underscores'),
  
  body('nickname')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nickname must be between 2 and 50 characters')
    .matches(/^[a-zA-Zа-яА-Я0-9_\s-]+$/)
    .withMessage('Nickname can contain letters, numbers, spaces, underscores and hyphens'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .optional()
    .custom((value) => {
      if (value && value.length > 0) {
        // Применяем улучшенную валидацию только если пароль предоставлен
        if (value.length < 8) {
          throw new Error('Пароль должен содержать минимум 8 символов');
        }
        if (!/(?=.*[a-z])/.test(value)) {
          throw new Error('Пароль должен содержать минимум одну строчную букву');
        }
        if (!/(?=.*[A-Z])/.test(value)) {
          throw new Error('Пароль должен содержать минимум одну заглавную букву');
        }
        if (!/(?=.*\d)/.test(value)) {
          throw new Error('Пароль должен содержать минимум одну цифру');
        }
        if (!/(?=.*[@$!%*?&])/.test(value)) {
          throw new Error('Пароль должен содержать минимум один специальный символ (@$!%*?&)');
        }
        if (!/^[a-zA-Z0-9@$!%*?&]+$/.test(value)) {
          throw new Error('Пароль может содержать только буквы, цифры и специальные символы @$!%*?&');
        }
      }
      return true;
    }),
  
  body('full_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Full name must not exceed 100 characters'),
  
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'user'])
    .withMessage('Role must be one of: admin, manager, user'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  
  handleValidationErrors
];

// Валидация для создания категории
export const validateCreateCategory = [
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be between 1 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  handleValidationErrors
];

// Валидация для обновления категории
export const validateUpdateCategory = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be between 1 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  handleValidationErrors
];

// Валидация для создания местоположения
export const validateCreateLocation = [
  body('name')
    .notEmpty()
    .withMessage('Location name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Location name must be between 1 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  
  handleValidationErrors
];

// Валидация для обновления местоположения
export const validateUpdateLocation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Location name must be between 1 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  
  handleValidationErrors
];

// Валидация для создания оборудования
export const validateCreateEquipment = [
  body('name')
    .notEmpty()
    .withMessage('Equipment name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Equipment name must be between 1 and 255 characters'),
  
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  
  body('serial_number')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Serial number must not exceed 100 characters'),
  
  body('status')
    .optional()
    .isIn(['available', 'in-use', 'maintenance'])
    .withMessage('Status must be one of: available, in-use, maintenance'),
  
  body('location_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Location ID must be a positive integer'),
  
  body('purchase_date')
    .optional()
    .isDate()
    .withMessage('Purchase date must be a valid date'),
  
  body('last_maintenance')
    .optional()
    .isDate()
    .withMessage('Last maintenance date must be a valid date'),
  
  body('assigned_to')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Assigned to must not exceed 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  handleValidationErrors
];

// Валидация для обновления оборудования
export const validateUpdateEquipment = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Equipment name must be between 1 and 255 characters'),
  
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  
  body('serial_number')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Serial number must not exceed 100 characters'),
  
  body('status')
    .optional()
    .isIn(['available', 'in-use', 'maintenance'])
    .withMessage('Status must be one of: available, in-use, maintenance'),
  
  body('location_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Location ID must be a positive integer'),
  
  body('purchase_date')
    .optional()
    .isDate()
    .withMessage('Purchase date must be a valid date'),
  
  body('last_maintenance')
    .optional()
    .isDate()
    .withMessage('Last maintenance date must be a valid date'),
  
  body('assigned_to')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Assigned to must not exceed 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  handleValidationErrors
];

// Валидация для создания стека
export const validateCreateStack = [
  body('name')
    .notEmpty()
    .withMessage('Stack name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Stack name must be between 1 and 255 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .isString()
    .withMessage('Each tag must be a string'),
  
  body('equipment_ids')
    .optional()
    .isArray()
    .withMessage('Equipment IDs must be an array'),
  
  body('equipment_ids.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each equipment ID must be a positive integer'),
  
  handleValidationErrors
];

// Валидация для обновления стека
export const validateUpdateStack = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Stack name must be between 1 and 255 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .isString()
    .withMessage('Each tag must be a string'),
  
  body('equipment_ids')
    .optional()
    .isArray()
    .withMessage('Equipment IDs must be an array'),
  
  body('equipment_ids.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each equipment ID must be a positive integer'),
  
  handleValidationErrors
];

// Валидация для создания отгрузки
export const validateCreateShipment = [
  body('number')
    .notEmpty()
    .withMessage('Shipment number is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Shipment number must be between 1 and 50 characters'),
  
  body('date')
    .notEmpty()
    .withMessage('Shipment date is required')
    .isDate()
    .withMessage('Date must be a valid date'),
  
  body('recipient')
    .notEmpty()
    .withMessage('Recipient is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Recipient must be between 1 and 255 characters'),
  
  body('recipient_address')
    .notEmpty()
    .withMessage('Recipient address is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Recipient address must be between 1 and 500 characters'),
  
  body('responsible_person')
    .notEmpty()
    .withMessage('Responsible person is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Responsible person must be between 1 and 100 characters'),
  
  body('status')
    .optional()
    .isIn(['preparing', 'in-transit', 'delivered', 'cancelled'])
    .withMessage('Status must be one of: preparing, in-transit, delivered, cancelled'),
  
  body('comments')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comments must not exceed 1000 characters'),
  
  handleValidationErrors
];

// Валидация для обновления отгрузки
export const validateUpdateShipment = [
  body('number')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Shipment number must be between 1 and 50 characters'),
  
  body('date')
    .optional()
    .isDate()
    .withMessage('Date must be a valid date'),
  
  body('recipient')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Recipient must be between 1 and 255 characters'),
  
  body('recipient_address')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Recipient address must be between 1 and 500 characters'),
  
  body('responsible_person')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Responsible person must be between 1 and 100 characters'),
  
  body('status')
    .optional()
    .isIn(['preparing', 'in-transit', 'delivered', 'cancelled'])
    .withMessage('Status must be one of: preparing, in-transit, delivered, cancelled'),
  
  body('comments')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comments must not exceed 1000 characters'),
  
  handleValidationErrors
];

// Валидация для регистрации устройства
export const validateDeviceRegistration = [
  body('device_id')
    .notEmpty()
    .withMessage('Device ID is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Device ID must be between 1 and 255 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Device ID can only contain letters, numbers, underscores and hyphens'),
  
  body('device_name')
    .notEmpty()
    .withMessage('Device name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Device name must be between 1 and 255 characters'),
  
  body('device_type')
    .optional()
    .isIn(['desktop', 'mobile', 'tablet', 'web'])
    .withMessage('Device type must be one of: desktop, mobile, tablet, web'),
  
  body('platform')
    .optional()
    .isIn(['windows', 'macos', 'ios', 'android', 'linux', 'web'])
    .withMessage('Platform must be one of: windows, macos, ios, android, linux, web'),
  
  handleValidationErrors
];

// Валидация для обновления устройства
export const validateDeviceUpdate = [
  body('device_name')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Device name must be between 1 and 255 characters'),
  
  body('device_type')
    .optional()
    .isIn(['desktop', 'mobile', 'tablet', 'web'])
    .withMessage('Device type must be one of: desktop, mobile, tablet, web'),
  
  body('platform')
    .optional()
    .isIn(['windows', 'macos', 'ios', 'android', 'linux', 'web'])
    .withMessage('Platform must be one of: windows, macos, ios, android, linux, web'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  
  handleValidationErrors
];

// Валидация для PUSH синхронизации
export const validateSyncPush = [
  body('device_id')
    .notEmpty()
    .withMessage('Device ID is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Device ID must be between 1 and 255 characters'),
  
  body('changes')
    .isArray({ min: 1 })
    .withMessage('Changes must be a non-empty array'),
  
  body('changes.*.table')
    .notEmpty()
    .withMessage('Table name is required for each change')
    .isIn(['equipment', 'categories', 'locations', 'shipments', 'stacks', 'users'])
    .withMessage('Table must be one of: equipment, categories, locations, shipments, stacks, users'),
  
  body('changes.*.operation')
    .notEmpty()
    .withMessage('Operation is required for each change')
    .isIn(['CREATE', 'UPDATE', 'DELETE'])
    .withMessage('Operation must be one of: CREATE, UPDATE, DELETE'),
  
  body('changes.*.record_id')
    .notEmpty()
    .withMessage('Record ID is required for each change')
    .isLength({ min: 1, max: 255 })
    .withMessage('Record ID must be between 1 and 255 characters'),
  
  body('changes.*.data')
    .exists()
    .withMessage('Data is required for each change'),
  
  body('changes.*.timestamp')
    .isInt({ min: 0 })
    .withMessage('Timestamp must be a valid Unix timestamp'),
  
  handleValidationErrors
];

// Валидация для PULL синхронизации
export const validateSyncPull = [
  body('device_id')
    .notEmpty()
    .withMessage('Device ID is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Device ID must be between 1 and 255 characters'),
  
  body('last_sync')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Last sync must be a valid Unix timestamp'),
  
  handleValidationErrors
];

// Валидация для получения статуса синхронизации
export const validateSyncStatus = [
  query('device_id')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Device ID must be between 1 and 255 characters'),
  
  handleValidationErrors
];

// Валидация для разрешения конфликта
export const validateConflictResolution = [
  body('resolution')
    .notEmpty()
    .withMessage('Resolution is required')
    .isIn(['local_wins', 'remote_wins', 'merged', 'manual'])
    .withMessage('Resolution must be one of: local_wins, remote_wins, merged, manual'),
  
  body('resolved_data')
    .optional()
    .isObject()
    .withMessage('Resolved data must be an object'),
  
  handleValidationErrors
];

// Валидация для подтверждения операции синхронизации
export const validateSyncAcknowledge = [
  body('device_id')
    .notEmpty()
    .withMessage('Device ID is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Device ID must be between 1 and 255 characters'),
  
  handleValidationErrors
];

// Валидация query параметров для пагинации
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Search query must not exceed 255 characters'),
  
  handleValidationErrors
];

// Валидация для фильтров синхронизации
export const validateSyncFilters = [
  query('status')
    .optional()
    .isIn(['pending', 'processed', 'failed', 'conflict'])
    .withMessage('Status must be one of: pending, processed, failed, conflict'),
  
  query('table_name')
    .optional()
    .isIn(['equipment', 'categories', 'locations', 'shipments', 'stacks', 'users'])
    .withMessage('Table name must be one of: equipment, categories, locations, shipments, stacks, users'),
  
  query('device_id')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Device ID must be between 1 and 255 characters'),
  
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid ISO 8601 date'),
  
  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid ISO 8601 date'),
  
  handleValidationErrors
];
