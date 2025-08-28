import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import type { CalculationRecord, ReportData, PayrollRun, FixedAsset, DepreciationEntry } from '../types';
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
  if (!reportElement) {
    alert("Error: Report element not found for PDF generation.");
    return null;
  }
  
  try {
    // Add a small delay to allow for rendering and animations to complete, improving reliability.
    await new Promise(resolve => setTimeout(resolve, 300));

    const canvas = await html2canvas(reportElement, {
      scale: 2, // Higher scale for better quality
      backgroundColor: '#ffffff', // Force white background for consistency
      useCORS: true,
      onclone: (clonedDoc) => {
        // Inject styles to force a light-mode, print-friendly appearance with a white background and black text.
        // This is more robust than removing the 'dark' class, as it specifically overrides styles.
        const style = clonedDoc.createElement('style');
        style.innerHTML = `
          /* Universal overrides for PDF generation */
          .dark body, .dark .printable-area {
            background-color: #ffffff !important;
            background-image: none !important;
          }
          .dark .printable-area *, .dark .printable-area {
            color: #1f2937 !important;
            border-color: #e5e7eb !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          
          /* Override specific known background classes to be sure */
          .dark .bg-white, .dark .bg-gray-100, .dark .bg-gray-200, .dark .bg-gray-800, .dark .bg-gray-800\\/50, .dark .bg-gray-800\\/60, .dark .bg-gray-900, .dark .bg-gray-900\\/50, .dark .printable-card {
            background-color: #ffffff !important;
          }
          .dark .bg-gray-100.dark\\:bg-gray-900\\/50 {
             background-color: #f9fafb !important; /* Lighter gray for nested cards */
          }
          
          /* Re-apply semantic text colors that were overridden by the wildcard */
          .dark .text-red-400 { color: #dc2626 !important; }
          .dark .text-yellow-400 { color: #d97706 !important; }
          .dark .text-green-400 { color: #16a34a !important; }
          .dark .text-fuchsia-400, .dark .text-fuchsia-700, .dark .text-fuchsia-600 { color: #a21caf !important; }
          .dark .text-cyan-400, .dark .text-cyan-700, .dark .text-cyan-600 { color: #0891b2 !important; }
          
          /* Hide elements not meant for printing/PDF */
          .no-print, .print-header { 
            display: none !important; 
          }
        `;
        clonedDoc.head.appendChild(style);
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    alert(`An error occurred while generating the PDF: ${errorMessage}. Please try again.`);
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    alert(`An error occurred while generating the Excel file: ${errorMessage}. Please try again.`);
    return null;
  }
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    alert(`${t('error.unexpected')} ${errorMessage}`);
    return null;
  }
};

export const generatePayrollExcelDataUri = (payrollRun: PayrollRun, t: (key: any, ...args: any[]) => string): string | null => {
  try {
    const mainData = payrollRun.records.map(r => ({
      [t('payrollManager.table.name')]: r.name,
      [t('payrollManager.table.department')]: r.department,
      [t('payrollManager.form.gross')]: r.grossMonthlySalary,
      [t('payrollManager.form.allowances')]: r.allowances,
      [t('payrollManager.form.deductions')]: r.deductions,
      [t('report.totalInsurance')]: r.totalInsurance,
      [t('report.totalTax')]: r.totalTax,
      [t('report.netIncome')]: r.netSalary,
    }));
    
    const summaryData = [
        {}, // Spacer
        { A: t('payrollManager.report.summaryTitle') },
        { A: t('payrollManager.report.employeeCount'), B: payrollRun.summary.employeeCount },
        { A: t('payrollManager.report.totalGross'), B: payrollRun.summary.totalGross },
        { A: t('payrollManager.report.totalInsurance'), B: payrollRun.summary.totalInsurance },
        { A: t('payrollManager.report.totalTax'), B: payrollRun.summary.totalTax },
        { A: t('payrollManager.report.totalNet'), B: payrollRun.summary.totalNet },
    ];

    const ws = XLSX.utils.json_to_sheet(mainData);
    XLSX.utils.sheet_add_json(ws, summaryData, { skipHeader: true, origin: -1 });

    ws['!cols'] = [
      { wch: 25 }, // Name
      { wch: 20 }, // Department
      { wch: 15 }, // Gross
      { wch: 15 }, // Allowances
      { wch: 15 }, // Deductions
      { wch: 15 }, // Insurance
      { wch: 15 }, // Tax
      { wch: 15 }, // Net
    ];

    const wb = XLSX.utils.book_new();
    const sheetName = `${t('payrollManager.report.title', t(`month.${payrollRun.month}` as any), payrollRun.year)}`.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
  } catch (error) {
    console.error("Error generating payroll Excel data URI:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    alert(`${t('error.unexpected')} ${errorMessage}`);
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    alert(`${t('error.unexpected')} ${errorMessage}`);
    return null;
  }
};

export const generateAssetScheduleExcelDataUri = (asset: FixedAsset, schedule: DepreciationEntry[], t: (key: any, ...args: any[]) => string): string | null => {
  try {
    const data = schedule.map(entry => ({
      [t('fixedAssets.schedule.year')]: entry.year,
      [t('fixedAssets.schedule.depreciation')]: entry.depreciation,
      [t('fixedAssets.schedule.accumulated')]: entry.accumulatedDepreciation,
      [t('fixedAssets.schedule.bookValue')]: entry.bookValue,
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 25 }, { wch: 20 }];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Depreciation for ${asset.name}`);
    
    const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
  } catch (error) {
    console.error("Error generating Asset Schedule Excel:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    alert(`${t('error.unexpected')} ${errorMessage}`);
    return null;
  }
};

export const generateAnnualDepreciationExcelDataUri = (year: number, reportData: any[], t: (key: any, ...args: any[]) => string): string | null => {
  try {
    const data = reportData.map(item => ({
      [t('fixedAssets.table.name')]: item.name,
      [t('fixedAssets.annualReport.depreciationForYear')]: item.depreciation,
      [t('fixedAssets.annualReport.bookValue')]: item.bookValue,
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Depreciation Report ${year}`);
    
    const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
  } catch (error) {
    console.error("Error generating Annual Depreciation Excel:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    alert(`${t('error.unexpected')} ${errorMessage}`);
    return null;
  }
};


/**
 * Shares a file using the Web Share API if available.
 * @param title The title of the share.
 * @param text The text to share.
 * @param filename The name of the file to share.
 * @param dataUri The data URI of the file content.
 * @param mimeType The MIME type of the file.
 * @param t Translation function for alerts.
 */
export const shareFile = async (title: string, text: string, filename: string, dataUri: string, mimeType: string, t: (key: any) => string): Promise<void> => {
    if (!navigator.share) {
        alert(t('common.shareNotSupported'));
        return;
    }

    try {
        const response = await fetch(dataUri);
        if (!response.ok) {
            throw new Error('Failed to fetch data URI for sharing');
        }
        const blob = await response.blob();
        const file = new File([blob], filename, { type: mimeType });

        // Check if file sharing is supported
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: title,
                text: text,
                files: [file],
            });
        } else {
            // Fallback to sharing text if files are not supported by the share target
            await navigator.share({
                title: title,
                text: text,
            });
        }
    } catch (error) {
        // User cancellation of the share dialog is not an error.
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.log('Share was cancelled by the user.');
        } else {
            console.error("Sharing failed:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            alert(`${t('error.unexpectedShare')} ${errorMessage}`);
        }
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
            alert(`${t('error.unexpected')} ${errorMessage}. Attempting web download as a fallback.`);
            // If native saving fails, attempt a web download as a last resort
            console.log("Falling back to web download method due to native error.");
            downloadFileWeb(filename, dataUri, t);
        }
    } else {
        // This is a web environment, use the standard download method.
        downloadFileWeb(filename, dataUri, t);
    }
};
