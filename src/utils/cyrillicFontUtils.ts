import { PDFDocument, PDFFont } from 'pdf-lib';

/**
 * Создает шрифт с поддержкой кириллицы, используя доступные стандартные шрифты
 */
export async function createCyrillicFont(
  pdfDoc: PDFDocument,
  isBold: boolean = false
): Promise<PDFFont> {
  try {
    // Пытаемся использовать Times-Roman (лучше всего поддерживает кириллицу)
    return await pdfDoc.embedFont('Times-Roman');
  } catch (error) {
    console.warn('Times-Roman not available, trying other fonts...');
    
    try {
      // Пробуем Times-Bold
      if (isBold) {
        return await pdfDoc.embedFont('Times-Bold');
      }
      return await pdfDoc.embedFont('Times-Roman');
    } catch (error2) {
      console.warn('Times fonts not available, trying Courier...');
      
      try {
        // Courier также поддерживает кириллицу
        if (isBold) {
          return await pdfDoc.embedFont('Courier-Bold');
        }
        return await pdfDoc.embedFont('Courier');
      } catch (error3) {
        console.error('No fonts with Cyrillic support found');
        throw new Error('No fonts with Cyrillic support available in this PDF library');
      }
    }
  }
}

/**
 * Проверяет, содержит ли текст кириллические символы
 */
export function containsCyrillic(text: string): boolean {
  return /[а-яё]/i.test(text);
}

/**
 * Безопасно отображает текст, заменяя кириллицу на латиницу если шрифт не поддерживает
 */
export function safeTextForFont(text: string, font: PDFFont): string {
  // Если шрифт поддерживает кириллицу, возвращаем как есть
  if (font.name === 'Times-Roman' || font.name === 'Times-Bold' || 
      font.name === 'Courier' || font.name === 'Courier-Bold') {
    return text;
  }
  
  // Для шрифтов без поддержки кириллицы заменяем на латиницу
  return text.replace(/[а-яё]/gi, (match) => {
    const cyrillicMap: { [key: string]: string } = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'YO',
      'Ж': 'ZH', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
      'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
      'Ф': 'F', 'Х': 'H', 'Ц': 'TS', 'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SCH',
      'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'YU', 'Я': 'YA'
    };
    return cyrillicMap[match] || match;
  });
}

/**
 * Получает оптимальный шрифт для текста с кириллицей
 */
export async function getOptimalFont(
  pdfDoc: PDFDocument,
  text: string,
  isBold: boolean = false
): Promise<{ font: PDFFont; needsTransliteration: boolean }> {
  try {
    const font = await createCyrillicFont(pdfDoc, isBold);
    const needsTransliteration = false; // Шрифт поддерживает кириллицу
    return { font, needsTransliteration };
  } catch (error) {
    console.warn('Falling back to basic fonts without Cyrillic support');
    
    // Fallback на базовые шрифты без поддержки кириллицы
    try {
      const font = await pdfDoc.embedFont(isBold ? 'Helvetica-Bold' : 'Helvetica');
      const needsTransliteration = containsCyrillic(text);
      return { font, needsTransliteration };
    } catch (fallbackError) {
      throw new Error('No fonts available');
    }
  }
}

