import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import type { ReportData } from '../types';

export const printReport = (reportElement: HTMLElement | null) => {
  if (!reportElement) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("يرجى السماح بال نوافذ المنبثقة لطباعة التقرير.");
    return;
  }
  
  const reportHTML = reportElement.innerHTML;
  
  printWindow.document.write(`
    <html>
      <head>
        <title>تقرير الضرائب</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            background-color: #ffffff;
            color: #000000;
          }
          .printable-card {
             border: 1px solid #ccc;
             margin-bottom: 20px;
             padding: 15px;
             border-radius: 8px;
             -webkit-print-color-adjust: exact;
          }
          h3 {
            font-size: 1.5rem;
            font-weight: bold;
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          /* Hide chart from print */
          #chart-container {
              display: none;
          }
        </style>
      </head>
      <body>
        ${reportHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

export const downloadReportAsPDF = async (reportElement: HTMLElement | null, fileName: string) => {
  if (!reportElement) return;
  
  try {
    const canvas = await html2canvas(reportElement, {
      scale: 2, // Higher scale for better quality
      backgroundColor: document.documentElement.classList.contains('dark') ? '#111827' : '#f9fafb',
      useCORS: true,
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
    
    let finalImgWidth = pdfWidth;
    let finalImgHeight = pdfWidth / ratio;
    
    if (finalImgHeight > pdfHeight) {
        finalImgHeight = pdfHeight;
        finalImgWidth = pdfHeight * ratio;
    }

    const x = (pdfWidth - finalImgWidth) / 2;
    const y = 0;

    pdf.addImage(imgData, 'PNG', x, y, finalImgWidth, finalImgHeight);
    pdf.save(`${fileName}.pdf`);

  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("An error occurred while generating the PDF. Please try again.");
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

export const downloadReportAsExcel = (data: ReportData, fileName: string, headers: ExcelHeaders) => {
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
    
    XLSX.writeFile(wb, `${fileName}.xlsx`);

  } catch (error) {
    console.error("Error generating Excel file:", error);
    alert("An error occurred while generating the Excel file. Please try again.");
  }
};