import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Shipment } from './ShipmentList';
import { Equipment } from './EquipmentList';

interface ShipmentPDFGeneratorProps {
  shipment: Shipment;
  equipment?: Equipment[];
  className?: string;
}

export function ShipmentPDFGenerator({ shipment, equipment, className }: ShipmentPDFGeneratorProps) {
  const generatePDF = async () => {
    try {
      // Создаем HTML контент с правильной кодировкой
      const htmlContent = createHTMLContent(shipment, equipment);
      
      // Создаем временный div для рендеринга
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '210mm';
      tempDiv.style.padding = '20mm';
      tempDiv.style.fontFamily = '"Noto Sans", "Roboto", Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.color = '#000';
      tempDiv.style.backgroundColor = '#fff';
      
      document.body.appendChild(tempDiv);
      
      // Создаем canvas с помощью html2canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 210 * 3.779527559, // конвертируем mm в px (1mm = 3.779527559px)
        height: 297 * 3.779527559
      });
      
      // Удаляем временный элемент
      document.body.removeChild(tempDiv);
      
      // Конвертируем canvas в изображение
      const imgData = canvas.toDataURL('image/png');
      
      // Создаем PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Добавляем изображение в PDF
      const imgWidth = 210; // A4 ширина в мм
      const imgHeight = 297; // A4 высота в мм
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Сохраняем PDF
      const fileName = `shipment_${shipment.number}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      alert('Ошибка при создании PDF: ' + errorMessage);
    }
  };

  // Функция создания HTML контента
  const createHTMLContent = (shipment: Shipment, equipment?: Equipment[]) => {
    const safeText = (text: string) => text || '';
    
    return `
      <div style="font-family: 'Noto Sans', 'Roboto', Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #000;">
        <!-- Заголовок -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 10px 0;">ОТГРУЗОЧНЫЙ ЛИСТ</h1>
          <h2 style="font-size: 18px; font-weight: bold; margin: 0;">№ ${shipment.number}</h2>
        </div>
        
        <!-- Основная информация -->
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">Информация об отгрузке:</h3>
          <p style="margin: 5px 0;"><strong>Дата:</strong> ${new Date(shipment.date).toLocaleDateString('ru-RU')}</p>
          <p style="margin: 5px 0;"><strong>Статус:</strong> ${getStatusText(shipment.status)}</p>
          <p style="margin: 5px 0;"><strong>Ответственный:</strong> ${safeText(shipment.responsiblePerson)}</p>
          <p style="margin: 5px 0;"><strong>Всего позиций:</strong> ${shipment.totalItems}</p>
        </div>
        
        <!-- Получатель -->
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">Получатель:</h3>
          <p style="margin: 5px 0;"><strong>Наименование:</strong> ${safeText(shipment.recipient)}</p>
          ${shipment.recipientAddress ? `<p style="margin: 5px 0;"><strong>Адрес:</strong> ${safeText(shipment.recipientAddress)}</p>` : ''}
        </div>
        
        <!-- Комментарии -->
        ${shipment.comments ? `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">Комментарии:</h3>
          <p style="margin: 5px 0; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">${safeText(shipment.comments)}</p>
        </div>
        ` : ''}
        
        <!-- Список оборудования -->
        ${equipment && equipment.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">Список оборудования:</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc; font-size: 10px;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">№</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Наименование</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Категория</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Кол-во</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Местоположение</th>
              </tr>
            </thead>
            <tbody>
              ${equipment.map((item, index) => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 8px;">${index + 1}</td>
                  <td style="border: 1px solid #ccc; padding: 8px;">${safeText(item.name)}</td>
                  <td style="border: 1px solid #ccc; padding: 8px;">${safeText(item.category)}</td>
                  <td style="border: 1px solid #ccc; padding: 8px;">1</td>
                  <td style="border: 1px solid #ccc; padding: 8px;">${safeText(item.location)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        <!-- Чек-лист -->
        ${shipment.checklist && shipment.checklist.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">Чек-лист:</h3>
          ${shipment.checklist.map(item => `
            <div style="margin: 8px 0;">
              <span style="font-weight: bold;">${item.isCompleted ? '[✓]' : '[ ]'}</span> ${safeText(item.title)}
              ${item.description ? `<div style="margin-left: 20px; font-size: 10px; color: #666;">${safeText(item.description)}</div>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        <!-- Подписи -->
        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div style="text-align: center;">
            <div style="border-bottom: 1px solid #000; width: 150px; margin-bottom: 5px;"></div>
            <small>Подпись отправителя</small>
          </div>
          <div style="text-align: center;">
            <div style="border-bottom: 1px solid #000; width: 150px; margin-bottom: 5px;"></div>
            <small>Подпись получателя</small>
          </div>
        </div>
        
        <!-- Дата создания -->
        <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #666;">
          Дата создания документа: ${new Date().toLocaleDateString('ru-RU')}
        </div>
      </div>
    `;
  };

  // Функция для получения текста статуса
  const getStatusText = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Ожидает',
      'in-progress': 'В процессе',
      'in-transit': 'В пути',
      'delivered': 'Доставлено',
      'cancelled': 'Отменено'
    };
    return statusMap[status] || status;
  };

  return (
    <div className={className}>
      <Button
        onClick={generatePDF}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        Скачать PDF
      </Button>
    </div>
  );
}
