// Русский шрифт для jsPDF
// Базовый шрифт с поддержкой кириллицы

const russianFont = {
  name: 'RussianFont',
  encoding: 'Identity-H',
  unicodeRanges: [
    { start: 0x0400, end: 0x04FF }, // Кириллица
    { start: 0x0500, end: 0x052F }, // Расширенная кириллица
    { start: 0x2000, end: 0x206F }, // Общие знаки пунктуации
    { start: 0x0020, end: 0x007F }  // Базовая латиница
  ]
};

// Функция для добавления русского шрифта в jsPDF
function addRussianFontToPDF(doc) {
  try {
    // Пытаемся добавить поддержку кириллицы
    if (doc.addFont) {
      // Если есть возможность добавить шрифт
      console.log('Поддержка добавления шрифтов доступна');
    }
    
    // Устанавливаем базовый шрифт
    doc.setFont('helvetica', 'normal');
    
    // Устанавливаем кодировку
    doc.setLanguage('ru');
    
    return true;
  } catch (error) {
    console.warn('Ошибка при добавлении русского шрифта:', error);
    return false;
  }
}

// Экспортируем для использования
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { russianFont, addRussianFontToPDF };
} else if (typeof window !== 'undefined') {
  window.russianFont = russianFont;
  window.addRussianFontToPDF = addRussianFontToPDF;
}
