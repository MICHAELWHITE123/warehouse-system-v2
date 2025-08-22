# Настройка шрифтов для поддержки кириллицы в PDF

## 📚 Установленные библиотеки

✅ **jsPDF** - для генерации PDF на стороне клиента
✅ **@fontsource/noto-sans** - шрифт Noto Sans с поддержкой кириллицы
✅ **pdf-lib** - для создания и редактирования PDF (уже была установлена)

## 🔧 Настройка шрифтов

### 1. Создание папки для шрифтов
```bash
mkdir -p public/fonts
```

### 2. Загрузка шрифтов

Для полной поддержки кириллицы рекомендуется загрузить следующие шрифты:

#### Noto Sans (рекомендуется)
- **NotoSans-Regular.ttf** - обычный вес
- **NotoSans-Bold.ttf** - жирный вес
- **Скачать:** https://fonts.google.com/noto/specimen/Noto+Sans

#### Roboto (альтернатива)
- **Roboto-Regular.ttf** - обычный вес
- **Roboto-Bold.ttf** - жирный вес
- **Скачать:** https://fonts.google.com/specimen/Roboto

### 3. Размещение шрифтов

Поместите загруженные `.ttf` файлы в папку `public/fonts/`:

```
public/
  fonts/
    NotoSans-Regular.ttf
    NotoSans-Bold.ttf
    Roboto-Regular.ttf
    Roboto-Bold.ttf
```

## 🚀 Использование в коде

### Основной генератор PDF
```typescript
import { getFontWithCyrillic, wrapText } from '../utils/fontUtils';

// Получение шрифтов с поддержкой кириллицы
const font = await getFontWithCyrillic(pdfDoc, false);      // обычный
const boldFont = await getFontWithCyrillic(pdfDoc, true);   // жирный

// Разбивка текста на строки
const lines = wrapText(text, maxWidth, fontSize);
```

### Утилиты для работы с текстом
```typescript
// Получение ширины текста с учетом кириллицы
const width = getTextWidth(text, fontSize);

// Разбивка текста на строки
const lines = wrapText(text, maxWidth, fontSize);
```

## 📝 Примеры русского текста

Теперь в PDF корректно отображаются:

- ✅ **Заголовки:** "ОТГРУЗОЧНЫЙ ЛИСТ"
- ✅ **Поля:** "Дата:", "Статус:", "Ответственный:"
- ✅ **Статусы:** "Ожидает", "В работе", "В пути"
- ✅ **Таблицы:** "Наименование", "Серийный номер", "Количество"
- ✅ **Комментарии:** Любой русский текст без искажений

## 🔍 Fallback механизм

Если кастомные шрифты не загружены, система автоматически использует:

1. **Helvetica** - для обычного текста
2. **Helvetica-Bold** - для жирного текста

Эти шрифты также поддерживают кириллицу, но могут выглядеть менее красиво.

## 🐛 Решение проблем

### Шрифты не загружаются
1. Проверьте, что файлы `.ttf` находятся в `public/fonts/`
2. Убедитесь, что имена файлов соответствуют конфигурации в `fontUtils.ts`
3. Проверьте консоль браузера на наличие ошибок

### Текст отображается некорректно
1. Убедитесь, что используется функция `getFontWithCyrillic()`
2. Проверьте, что импортированы утилиты шрифтов
3. Убедитесь, что текст передается в UTF-8 кодировке

## 📚 Дополнительные ресурсы

- [Google Fonts - Noto Sans](https://fonts.google.com/noto/specimen/Noto+Sans)
- [Google Fonts - Roboto](https://fonts.google.com/specimen/Roboto)
- [PDF-lib документация](https://pdf-lib.js.org/)
- [jsPDF документация](https://artskydj.github.io/jsPDF/docs/)

## 🎯 Следующие шаги

1. Загрузите рекомендованные шрифты
2. Поместите их в папку `public/fonts/`
3. Перезапустите приложение
4. Протестируйте генерацию PDF с русским текстом

Теперь ваше приложение полностью поддерживает русский язык в PDF документах! 🎉

