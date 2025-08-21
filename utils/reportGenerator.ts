import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import type { CalculationRecord, ReportData } from '../types';

// Helper to convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

export const generatePdfDataUri = async (reportElement: HTMLElement | null): Promise<string | null> => {
  if (!reportElement) return null;
  
  try {
    const canvas = await html2canvas(reportElement, {
      scale: 2, // Higher scale for better quality
      backgroundColor: document.documentElement.classList.contains('dark') ? '#111827' : '#f9fafb',
      useCORS: true,
      onclone: (document) => {
        // Ensure the print header is not included in the PDF canvas
        const printHeader = document.querySelector('.print-header');
        if (printHeader) {
          (printHeader as HTMLElement).style.display = 'none';
        }
      }
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    
    let finalImgWidth = pdfWidth - 40; // Add some margin
    let finalImgHeight = finalImgWidth / ratio;
    
    if (finalImgHeight > pdfHeight - 40) {
        finalImgHeight = pdfHeight - 40;
        finalImgWidth = finalImgHeight * ratio;
    }

    const x = (pdfWidth - finalImgWidth) / 2;
    const y = 20;

    pdf.addImage(imgData, 'PNG', x, y, finalImgWidth, finalImgHeight);
    return pdf.output('datauristring');

  } catch (error) {
    console.error("Error generating PDF data URI:", error);
    alert("An error occurred while generating the PDF. Please try again.");
    return null;
  }
};

type ExcelHeaders = {
    summary: string;
    finalResults: string;
    grossIncome: string;
    totalTax: string;
    totalInsurance: string;
    netIncome: string;
    calculationSteps: string;
    description: string;
    amount: string;
    applicableLaws: string;
};

export const generateExcelDataUri = (data: ReportData, headers: ExcelHeaders): string | null => {
  try {
    const worksheetData = [
      { A: headers.summary, B: data.summary },
      {}, // Spacer row
      { A: headers.finalResults },
      { A: headers.grossIncome, B: data.grossIncome },
      { A: headers.totalTax, B: data.totalTax },
      { A: headers.totalInsurance, B: data.totalInsurance },
      { A: headers.netIncome, B: data.netIncome },
      {}, // Spacer row
      { A: headers.calculationSteps },
      { A: headers.description, B: headers.amount },
      ...data.calculations.map(step => ({ A: step.description, B: step.amount })),
      {}, // Spacer row
      { A: headers.applicableLaws },
      ...data.applicableLaws.map(law => ({ A: law })),
    ];

    const ws = XLSX.utils.json_to_sheet(worksheetData, { skipHeader: true });
    
    // Set column widths
    ws['!cols'] = [{ wch: 50 }, { wch: 30 }];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tax Report");
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const base64 = arrayBufferToBase64(wbout);
    return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;

  } catch (error) {
    console.error("Error generating Excel data URI:", error);
    alert("An error occurred while generating the Excel file. Please try again.");
    return null;
  }
};


export const printReport = (reportElement: HTMLElement | null) => {
    if (!reportElement) return;

    const printStyles = `
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            body * {
                visibility: hidden;
            }
            .printable-area, .printable-area * {
                visibility: visible;
            }
            .printable-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
                border: none;
            }
            .no-print {
                display: none !important;
            }
            .print-header {
                display: block !important;
                text-align: center;
                margin-bottom: 2rem;
                padding: 1rem;
                border-bottom: 2px solid #ccc;
            }
             .dark .printable-area {
                 background-color: white !important;
             }
             .dark .printable-area, .dark .printable-area * {
                color: black !important;
             }
             .dark .bg-gray-800\/60, .dark .bg-gray-900\/50, .dark .bg-gray-800\/50 {
                background-color: #f3f4f6 !important;
             }
            @page {
                size: auto;
                margin: 0.75in;
            }
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = printStyles;
    document.head.appendChild(styleSheet);

    window.print();
    
    // Clean up after print
    document.head.removeChild(styleSheet);
};

export const generateHistoryExcelDataUri = (history: CalculationRecord[], t: (key: any, ...args: any[]) => string): string | null => {
  try {
    const dataForSheet = history.map(record => ({
      [t('history.export.id')]: record.id,
      [t('history.export.timestamp')]: new Date(record.timestamp).toLocaleString(t('common.locale')),
      [t('history.export.type')]: t(`dashboard.${record.type === 'loan' ? 'loan' : record.type === 'payroll' ? 'payroll' : record.type}.title`),
      [t('history.export.gross')]: record.report.grossIncome,
      [t('history.export.tax')]: record.report.totalTax,
      [t('history.export.insurance')]: record.report.totalInsurance,
      [t('history.export.net')]: record.report.netIncome,
      [t('history.export.params')]: JSON.stringify(record.params),
    }));

    const ws = XLSX.utils.json_to_sheet(dataForSheet);

    ws['!cols'] = [
      { wch: 30 }, // ID
      { wch: 20 }, // Timestamp
      { wch: 30 }, // Type
      { wch: 15 }, // Gross
      { wch: 15 }, // Tax
      { wch: 15 }, // Insurance
      { wch: 15 }, // Net
      { wch: 80 }, // Params
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Calculation History");

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const base64 = arrayBufferToBase64(wbout);
    return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
  } catch (error) {
    console.error("Error generating history Excel data URI:", error);
    alert("An error occurred while generating the Excel file. Please try again.");
    return null;
  }
};