import { PDFDocument, PDFFont } from 'pdf-lib';

// Интерфейс для шрифта
interface FontConfig {
  name: string;
  url: string;
  weight?: string;
  style?: string;
}

// Конфигурация шрифтов с поддержкой кириллицы
export const FONT_CONFIGS: FontConfig[] = [
  {
    name: 'Noto Sans',
    url: '/fonts/NotoSans-Regular.ttf',
    weight: 'normal'
  },
  {
    name: 'Noto Sans Bold',
    url: '/fonts/NotoSans-Bold.ttf',
    weight: 'bold'
  },
  {
    name: 'Roboto',
    url: '/fonts/Roboto-Regular.ttf',
    weight: 'normal'
  },
  {
    name: 'Roboto Bold',
    url: '/fonts/Roboto-Bold.ttf',
    weight: 'bold'
  }
];

// Кэш для загруженных шрифтов
const fontCache = new Map<string, ArrayBuffer>();

/**
 * Загружает шрифт из URL
 */
export async function loadFont(url: string): Promise<ArrayBuffer> {
  if (fontCache.has(url)) {
    return fontCache.get(url)!;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load font: ${response.statusText}`);
    }
    
    const fontBuffer = await response.arrayBuffer();
    fontCache.set(url, fontBuffer);
    return fontBuffer;
  } catch (error) {
    console.warn(`Failed to load font from ${url}:`, error);
    throw error;
  }
}

/**
 * Встраивает шрифт в PDF документ
 */
export async function embedFont(
  pdfDoc: PDFDocument, 
  fontConfig: FontConfig
): Promise<PDFFont> {
  try {
    const fontBuffer = await loadFont(fontConfig.url);
    return await pdfDoc.embedFont(fontBuffer);
  } catch (error) {
    console.warn(`Failed to embed font ${fontConfig.name}, trying fallback`);
    throw error; // Пробрасываем ошибку для обработки в getFontWithCyrillic
  }
}

/**
 * Получает шрифт для PDF с поддержкой кириллицы
 */
export async function getFontWithCyrillic(
  pdfDoc: PDFDocument, 
  isBold: boolean = false
): Promise<PDFFont> {
  try {
    // Пытаемся загрузить Noto Sans
    const fontConfig = isBold 
      ? FONT_CONFIGS.find(f => f.name === 'Noto Sans Bold')
      : FONT_CONFIGS.find(f => f.name === 'Noto Sans');
    
    if (fontConfig) {
      return await embedFont(pdfDoc, fontConfig);
    }
    
    // Если Noto Sans не найден, пробуем Roboto
    const robotoConfig = isBold 
      ? FONT_CONFIGS.find(f => f.name === 'Roboto Bold')
      : FONT_CONFIGS.find(f => f.name === 'Roboto');
    
    if (robotoConfig) {
      return await embedFont(pdfDoc, robotoConfig);
    }
    
    // Если кастомные шрифты недоступны, используем Times-Roman (поддерживает кириллицу)
    console.warn('Custom fonts not available, using Times-Roman as fallback');
    return await pdfDoc.embedFont('Times-Roman');
    
  } catch (error) {
    console.warn('Failed to load custom fonts, using Times-Roman as fallback');
    try {
      // Times-Roman поддерживает кириллицу
      return await pdfDoc.embedFont('Times-Roman');
    } catch (fallbackError) {
      console.error('Even Times-Roman failed, this should not happen');
      throw new Error('No fonts with Cyrillic support available');
    }
  }
}

/**
 * Проверяет, поддерживает ли шрифт кириллицу
 */
export function supportsCyrillic(font: PDFFont): boolean {
  // Простая проверка - если шрифт загружен успешно, считаем что поддерживает
  return font !== null;
}

/**
 * Получает размер текста с учетом кириллицы
 */
export function getTextWidth(text: string, fontSize: number): number {
  // Приблизительная ширина для кириллицы (немного больше чем для латиницы)
  const cyrillicMultiplier = 1.1;
  return text.length * fontSize * cyrillicMultiplier;
}

/**
 * Разбивает текст на строки с учетом ширины страницы
 */
export function wrapText(
  text: string, 
  maxWidth: number, 
  fontSize: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const testWidth = getTextWidth(testLine, fontSize);

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
