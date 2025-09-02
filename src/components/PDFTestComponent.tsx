
import { PDFDocument, rgb } from 'pdf-lib';
import { Button } from './ui/button';
import { Download, FileText } from 'lucide-react';
import { getOptimalFont, safeTextForFont } from '../utils/cyrillicFontUtils';
import { wrapText } from '../utils/fontUtils';

export function PDFTestComponent() {
  const generateTestPDF = async () => {
    try {
      // Создаем новый PDF документ
      const pdfDoc = await PDFDocument.create();
      
      // Получаем шрифты с поддержкой кириллицы
      const { font: regularFont, needsTransliteration: needsTransliterationRegular } = 
        await getOptimalFont(pdfDoc, 'Тестовый текст', false);
      const { font: boldFont, needsTransliteration: needsTransliterationBold } = 
        await getOptimalFont(pdfDoc, 'Тестовый текст', true);
      
      // Функция для безопасного отображения текста
      const safeText = (text: string, isBold: boolean = false) => {
        const font = isBold ? boldFont : regularFont;
        const needsTransliteration = isBold ? needsTransliterationBold : needsTransliterationRegular;
        
        if (needsTransliteration) {
          return safeTextForFont(text, font);
        }
        return text;
      };
      
      // Создаем страницу A4
      const page = pdfDoc.addPage([595.28, 841.89]);
      const margin = 50;
      const pageWidth = 595.28;
      const contentWidth = pageWidth - (margin * 2);
      
      let yPosition = 750;
      
      // Заголовок
      page.drawText(safeText('ТЕСТОВЫЙ PDF С РУССКИМ ЯЗЫКОМ', true), {
        x: pageWidth / 2 - 150,
        y: yPosition,
        size: 20,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= 40;
      
      // Подзаголовок
      page.drawText(safeText('Проверка поддержки кириллицы'), {
        x: pageWidth / 2 - 120,
        y: yPosition,
        size: 16,
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2)
      });
      yPosition -= 50;
      
      // Тестовый русский текст
      const testTexts = [
        'Привет, мир!',
        'Система учета техники на складе',
        'Отгрузочный лист №12345',
        'Дата: 21 августа 2024 года',
        'Ответственный: Иванов Иван Иванович',
        'Получатель: ООО "ТехноСервис"',
        'Адрес: г. Москва, ул. Примерная, д. 1',
        'Статус: В работе',
        'Комментарии: Срочная доставка'
      ];
      
      testTexts.forEach((text, index) => {
        if (index === 0) {
          // Первый элемент - заголовок
          page.drawText(safeText(text, true), {
            x: margin,
            y: yPosition,
            size: 14,
            font: boldFont,
            color: rgb(0, 0, 0)
          });
        } else {
          page.drawText(safeText(text), {
            x: margin,
            y: yPosition,
            size: 12,
            font: regularFont,
            color: rgb(0, 0, 0)
          });
        }
        yPosition -= 25;
      });
      
      yPosition -= 30;
      
      // Таблица с русскими заголовками
      page.drawText(safeText('ТАБЛИЦА ОБОРУДОВАНИЯ:', true), {
        x: margin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= 25;
      
      const tableHeaders = ['№', safeText('Наименование'), safeText('Серийный номер'), safeText('Количество')];
      const tableData = [
        ['1', 'Ноутбук Dell', 'DL123456', '5'],
        ['2', 'Принтер HP', 'HP789012', '3'],
        ['3', 'Сканер Canon', 'CN345678', '2']
      ];
      
      // Заголовки таблицы
      const colWidths = [40, 200, 150, 80];
      let xPos = margin;
      
      tableHeaders.forEach((header, index) => {
        page.drawText(header, {
          x: xPos + 5,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: rgb(1, 1, 1)
        });
        
        // Фон для заголовка
        page.drawRectangle({
          x: xPos,
          y: yPosition - 15,
          width: colWidths[index],
          height: 20,
          color: rgb(0.26, 0.54, 0.79)
        });
        
        xPos += colWidths[index];
      });
      
      yPosition -= 25;
      
      // Данные таблицы
      tableData.forEach((row) => {
        xPos = margin;
        
        row.forEach((cell, colIndex) => {
          page.drawText(cell, {
            x: xPos + 5,
            y: yPosition,
            size: 10,
            font: regularFont,
            color: rgb(0, 0, 0)
          });
          
          // Границы ячейки
          page.drawRectangle({
            x: xPos,
            y: yPosition - 15,
            width: colWidths[colIndex],
            height: 20,
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 0.5
          });
          
          xPos += colWidths[colIndex];
        });
        
        yPosition -= 25;
      });
      
      yPosition -= 30;
      
      // Длинный русский текст для проверки переноса строк
      const longText = 'Это длинный текст на русском языке для проверки корректности переноса строк и отображения кириллицы в PDF документе. Текст должен корректно разбиваться на строки с учетом ширины страницы и поддерживать все русские символы.';
      
      page.drawText(safeText('ДЛИННЫЙ ТЕКСТ:', true), {
        x: margin,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= 20;
      
      // Разбиваем длинный текст на строки
      const lines = wrapText(longText, contentWidth, 10);
      
      lines.forEach(line => {
        page.drawText(safeText(line), {
          x: margin,
          y: yPosition,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0)
        });
        yPosition -= 15;
      });
      
      yPosition -= 30;
      
      // Подписи
      page.drawText(safeText('Подписи:', true), {
        x: margin,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= 20;
      
      // Линии для подписей
      page.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: margin + 150, y: yPosition },
        thickness: 1,
        color: rgb(0, 0, 0)
      });
      
      page.drawLine({
        start: { x: margin + 200, y: yPosition },
        end: { x: margin + 350, y: yPosition },
        thickness: 1,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 10;
      
      page.drawText(safeText('Отправитель'), {
        x: margin + 25,
        y: yPosition,
        size: 8,
        font: regularFont,
        color: rgb(0, 0, 0)
      });
      
      page.drawText(safeText('Получатель'), {
        x: margin + 260,
        y: yPosition,
        size: 8,
        font: regularFont,
        color: rgb(0, 0, 0)
      });
      
      // Дата создания
      yPosition -= 30;
      page.drawText(`Документ создан: ${new Date().toLocaleString('ru-RU')}`, {
        x: margin,
        y: yPosition,
        size: 8,
        font: regularFont,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      // Сохраняем PDF
      const pdfBytes = await pdfDoc.save();
      
      // Создаем blob и скачиваем файл
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Test_Russian_PDF_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ Тестовый PDF успешно создан с поддержкой русского языка!');
      
    } catch (error) {
      console.error('❌ Ошибка при создании тестового PDF:', error);
      alert('Ошибка при создании PDF. Проверьте консоль для деталей.');
    }
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Тест генерации PDF с русским языком
      </h2>
      
      <p className="text-gray-600 mb-6">
        Нажмите кнопку ниже для создания тестового PDF документа с русским текстом.
        Документ будет содержать различные примеры кириллицы для проверки корректности отображения.
      </p>
      
      <Button
        onClick={generateTestPDF}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        <Download className="h-5 w-5" />
        <FileText className="h-5 w-5" />
        Создать тестовый PDF
      </Button>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Что тестируется:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Отображение заголовков на русском языке</li>
          <li>• Корректность кириллицы в таблицах</li>
          <li>• Перенос длинного русского текста</li>
          <li>• Поддержка различных размеров шрифтов</li>
          <li>• Отображение дат в российском формате</li>
        </ul>
      </div>
    </div>
  );
}
