import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Shipment } from './ShipmentList';
import { Equipment } from './EquipmentList';
import CyrillicToTranslit from 'cyrillic-to-translit-js';

// Импортируем поддержку шрифтов
import 'jspdf-font';

// Расширяем типы jsPDF для поддержки autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Функция для добавления поддержки русского языка
function addRussianFontSupport(doc: jsPDF) {
  try {
    // Используем стандартный шрифт Helvetica
    doc.setFont('helvetica', 'normal');
    
    // Устанавливаем кодировку для поддержки символов
    doc.setLanguage('ru');
    
    console.log('Шрифт Helvetica установлен для поддержки символов');
  } catch (error) {
    console.warn('Ошибка при настройке шрифта:', error);
    // Fallback к стандартному шрифту
    doc.setFont('helvetica', 'normal');
  }
}

// Функция для transliteration русского текста
function transliterateRussian(text: string): string {
  const translit = new (CyrillicToTranslit as any)();
  return translit.transform(text, '-');
}

interface ShipmentPDFGeneratorProps {
  shipment: Shipment;
  equipment?: Equipment[];
  className?: string;
}

export function ShipmentPDFGenerator({ shipment, equipment, className }: ShipmentPDFGeneratorProps) {
  const generatePDF = () => {
    // Создаем новый PDF документ в формате А4
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Добавляем поддержку русского языка
    addRussianFontSupport(doc);
    
    // Размеры страницы А4: 210 x 297 мм
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    let yPosition = margin;
    
    // Заголовок документа
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(transliterateRussian('ОТГРУЗОЧНЫЙ ЛИСТ'), pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Номер отгрузки
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`No. ${shipment.number}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;
    
    // Основная информация об отгрузке
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(transliterateRussian('Информация об отгрузке:'), margin, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Дата отгрузки
    doc.text(`${transliterateRussian('Дата')}: ${new Date(shipment.date).toLocaleDateString('ru-RU')}`, margin, yPosition);
    yPosition += 6;
    
    // Статус
    doc.text(`${transliterateRussian('Статус')}: ${getStatusText(shipment.status)}`, margin, yPosition);
    yPosition += 6;
    
    // Ответственный
    doc.text(`${transliterateRussian('Ответственный')}: ${shipment.responsiblePerson}`, margin, yPosition);
    yPosition += 6;
    
    // Всего позиций
    doc.text(`${transliterateRussian('Всего позиций')}: ${shipment.totalItems}`, margin, yPosition);
    yPosition += 15;
    
    // Получатель
    doc.setFont('helvetica', 'bold');
    doc.text(transliterateRussian('Получатель:'), margin, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`${transliterateRussian('Наименование')}: ${shipment.recipient}`, margin, yPosition);
    yPosition += 6;
    
    doc.text(`${transliterateRussian('Адрес')}: ${shipment.recipientAddress}`, margin, yPosition);
    yPosition += 15;
    
    // Комментарии
    if (shipment.comments) {
      doc.setFont('helvetica', 'bold');
      doc.text(transliterateRussian('Комментарии:'), margin, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'normal');
      const comments = doc.splitTextToSize(shipment.comments, contentWidth);
      doc.text(comments, margin, yPosition);
      yPosition += (comments.length * 6) + 10;
    }
    
    // Оборудование
    if (shipment.equipment.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${transliterateRussian('Оборудование')} (${shipment.equipment.length} ${transliterateRussian('позиций')}):`, margin, yPosition);
      yPosition += 8;
      
      // Проверяем, поместится ли таблица на текущей странице
      if (yPosition + (shipment.equipment.length * 8) + 20 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      const equipmentData = shipment.equipment.map((item, index) => [
        index + 1,
        item.name,
        item.serialNumber,
        item.quantity.toString(),
        '□' // Чекбокс для отметки
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['No.', transliterateRussian('Наименование'), transliterateRussian('Серийный номер'), transliterateRussian('Количество'), transliterateRussian('Отметка')]],
        body: equipmentData,
        styles: {
          fontSize: 9,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        margin: { left: margin, right: margin }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Стеки
    if (shipment.stacks && shipment.stacks.length > 0) {
      // Проверяем, поместится ли на текущей странице
      if (yPosition + 30 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setFont('times', 'bold');
      doc.text(`Стеки техники (${shipment.stacks.length} стеков):`, margin, yPosition);
      yPosition += 8;
      
      shipment.stacks.forEach((stack, stackIndex) => {
        if (yPosition + 20 > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        
        doc.setFont('times', 'bold');
        doc.text(`${stackIndex + 1}. ${stack.name} (x${stack.quantity})`, margin, yPosition);
        yPosition += 6;
        
        doc.setFont('times', 'normal');
        doc.text(`Состав: ${stack.equipmentIds.length} единиц техники`, margin + 10, yPosition);
        yPosition += 6;
        
        // Отображение оборудования в стеке
        if (equipment) {
          const stackEquipment = equipment.filter(item => stack.equipmentIds.includes(item.id));
          stackEquipment.forEach((equip, equipIndex) => {
            if (yPosition + 6 > pageHeight - margin) {
              doc.addPage();
              yPosition = margin;
            }
            
            doc.text(`   ${equipIndex + 1}. ${equip.name} (${equip.serialNumber})`, margin + 20, yPosition);
            yPosition += 4;
          });
        }
        
        yPosition += 4;
      });
      
      yPosition += 10;
    }
    
    // Аренда
    if (shipment.rental && shipment.rental.length > 0) {
      if (yPosition + 30 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setFont('times', 'bold');
      doc.text(`Арендованное оборудование (${shipment.rental.length} позиций):`, margin, yPosition);
      yPosition += 8;
      
      const rentalData = shipment.rental.map((item, index) => [
        index + 1,
        item.equipment,
        item.quantity.toString(),
        '□'
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['№', 'Наименование', 'Количество', 'Отметка']],
        body: rentalData,
        styles: {
          fontSize: 9,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        margin: { left: margin, right: margin }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Чек-лист
    if (shipment.checklist && shipment.checklist.length > 0) {
      if (yPosition + 30 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setFont('times', 'bold');
      doc.text('Чек-лист:', margin, yPosition);
      yPosition += 8;
      
      shipment.checklist.forEach((item) => {
        if (yPosition + 8 > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        
        const checkbox = item.isCompleted ? '☑' : '□';
        doc.text(`${checkbox} ${item.title}`, margin, yPosition);
        yPosition += 6;
        
        if (item.description) {
          doc.setFontSize(8);
          doc.text(`   ${item.description}`, margin + 10, yPosition);
          yPosition += 4;
          doc.setFontSize(10);
        }
      });
      
      yPosition += 10;
    }
    
    // Подписи в конце
    if (yPosition + 40 > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.setFont('times', 'bold');
    doc.text('Подписи:', margin, yPosition);
    yPosition += 15;
    
    // Линии для подписей
    doc.line(margin, yPosition, margin + 60, yPosition);
    doc.line(margin + 80, yPosition, margin + 140, yPosition);
    doc.line(margin + 160, yPosition, margin + 220, yPosition);
    
    yPosition += 5;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.text('Отправитель', margin + 25, yPosition);
    doc.text('Водитель', margin + 105, yPosition);
    doc.text('Получатель', margin + 185, yPosition);
    
    // Дата и время создания документа
    yPosition += 20;
    doc.setFontSize(8);
    doc.text(`Документ создан: ${new Date().toLocaleString('ru-RU')}`, margin, yPosition);
    
    // Сохраняем PDF
    doc.save(`Отгрузочный_лист_${shipment.number}_${new Date(shipment.date).toLocaleDateString('ru-RU').replace(/\./g, '-')}.pdf`);
  };
  
  const getStatusText = (status: string): string => {
    switch (status) {
      case "pending": return "Ожидает";
      case "in-progress": return "В работе";
      case "in-transit": return "В пути";
      case "delivered": return "Доставлено";
      case "cancelled": return "Отменено";
      default: return "Неизвестно";
    }
  };
  
  return (
    <Button
      onClick={generatePDF}
      variant="outline"
      size="sm"
      className={`flex items-center gap-2 ${className || ''}`}
      title="Скачать отгрузочный лист в PDF"
    >
      <Download className="h-4 w-4" />
      <FileText className="h-4 w-4" />
      PDF
    </Button>
  );
}
