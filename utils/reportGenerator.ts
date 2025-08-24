import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import type { CalculationRecord, ReportData } from '../types';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Add Capacitor to the window object for TypeScript
declare global {
    interface Window {
        Capacitor?: {
            isNative?: boolean;
        };
    }
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
    
    const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
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

    const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
  } catch (error) {
    console.error("Error generating history Excel data URI:", error);
    alert("An error occurred while generating the Excel file. Please try again.");
    return null;
  }
};

export const generateAgeReportExcelDataUri = (ageData: any, t: (key: any, ...args: any[]) => string): string | null => {
  try {
    const worksheetData = [
      // Section 1: Exact Age
      { A: t('age.results.exactAge') },
      { A: t('age.results.years'), B: ageData.years },
      { A: t('age.results.months'), B: ageData.months },
      { A: t('age.results.days'), B: ageData.days },
      { A: t('age.results.hours'), B: ageData.hours < 0 ? 24 + ageData.hours : ageData.hours },
      { A: t('age.results.minutes'), B: ageData.minutes < 0 ? 60 + ageData.minutes : ageData.minutes },
      { A: t('age.results.seconds'), B: ageData.seconds < 0 ? 60 + ageData.seconds : ageData.seconds },
      {}, // Spacer

      // Section 2: Life Stats
      { A: t('age.results.lifeStats') },
      { A: t('age.results.totalDays'), B: ageData.totalDays },
      { A: t('age.results.totalHours'), B: ageData.totalHours },
      { A: t('age.results.totalMinutes'), B: ageData.totalMinutes },
      { A: t('age.results.totalHeartbeats'), B: ageData.totalHeartbeats },
      { A: t('age.results.totalBreaths'), B: ageData.totalBreaths },
      {}, // Spacer

      // Section 3: Astro Profile
      { A: t('age.results.astroProfile') },
      { A: t('age.results.westernZodiac'), B: t(`zodiac.western.${ageData.westernZodiac}` as any) },
      { A: t('age.results.chineseZodiac'), B: t(`zodiac.chinese.${ageData.chineseZodiac}` as any) },
      {}, // Spacer

      // Section 4: Ticking Clock
      { A: t('age.results.tickingClock') },
      { A: t('age.results.years'), B: ageData.timeLeft.years },
      { A: t('age.results.months'), B: ageData.timeLeft.months },
      { A: t('age.results.days'), B: ageData.timeLeft.days },
      {}, // Spacer
      { A: t('age.results.disclaimer').split(':')[0], B: t('age.results.disclaimer').split(':')[1] },
    ];

    const ws = XLSX.utils.json_to_sheet(worksheetData, { skipHeader: true });
    ws['!cols'] = [{ wch: 30 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Age Report");
    
    const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;

  } catch (error) {
    console.error("Error generating Age Report Excel data URI:", error);
    alert("An error occurred while generating the Excel file. Please try again.");
    return null;
  }
};

/**
 * Handles downloading a file for web browsers as a fallback.
 * @param filename The name of the file to save.
 * @param dataUri The data URI of the file content.
 * @param t Translation function for alerts.
 */
const downloadFileWeb = (filename: string, dataUri: string, t: (key: string) => string) => {
     try {
        const link = document.createElement("a");
        link.href = dataUri;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (webError) {
        console.error("Web download failed:", webError);
        alert(t('error.unexpected'));
    }
}

/**
 * Handles saving/downloading a file.
 * Uses Capacitor Filesystem API if in a native environment, otherwise falls back to a standard web download.
 * @param filename The name of the file to save.
 * @param dataUri The data URI of the file content.
 * @param t Translation function for alerts.
 */
export const downloadFile = async (filename: string, dataUri: string | null, t: (key: any) => string): Promise<void> => {
    if (!dataUri) {
        console.error("No data URI provided for download.");
        alert(t('error.unexpected'));
        return;
    }

    const isNativePlatform = window.Capacitor?.isNative;

    if (isNativePlatform) {
        try {
            // Extract base64 data from data URI
            const base64Data = dataUri.substring(dataUri.indexOf(',') + 1);
            if (!base64Data) {
                throw new Error("Invalid data URI format for base64 extraction.");
            }

            await Filesystem.writeFile({
                path: filename,
                data: base64Data,
                directory: Directory.Documents, // Save to a public, user-accessible directory
            });
            
            alert(t('common.reportSaved'));

        } catch (error) {
            console.error("Capacitor Filesystem writeFile error:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            alert(`${t('error.unexpected')} ${errorMessage}`);
            // If native saving fails, attempt a web download as a last resort
            console.log("Falling back to web download method due to native error.");
            downloadFileWeb(filename, dataUri, t);
        }
    } else {
        // This is a web environment, use the standard download method.
        downloadFileWeb(filename, dataUri, t);
    }
};
