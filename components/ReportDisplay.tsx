import React, { useRef, useState } from 'react';
import type { ReportData } from '../types';
import IncomeChart from './IncomeChart';
import { generatePdfDataUri, generateExcelDataUri, printReport } from '../utils/reportGenerator';
import { useTranslation } from '../i18n/context';
import Modal from './Modal';

interface ReportDisplayProps {
  data: ReportData;
  onBack: () => void;
}

const NeonCard: React.FC<{ title: string, children: React.ReactNode, className?: string }> = ({ title, children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800/60 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 shadow-lg dark:shadow-2xl shadow-gray-400/20 dark:shadow-fuchsia-500/10 dark:backdrop-blur-sm ${className}`}>
    <h3 
      className="text-2xl font-bold mb-4 text-fuchsia-600 dark:text-fuchsia-400"
      style={{ textShadow: 'var(--card-header-shadow)' }}
    >
      <style>{`.dark h3 { --card-header-shadow: 0 0 4px #e879f9; }`}</style>
      {title}
    </h3>
    <div className="text-gray-700 dark:text-gray-300 space-y-3">{children}</div>
  </div>
);

const ReportDisplay: React.FC<ReportDisplayProps> = ({ data, onBack }) => {
  const { t, language } = useTranslation();
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [downloadInfo, setDownloadInfo] = useState<{ uri: string; fileName: string; type: 'PDF' | 'Excel' } | null>(null);
  
  const handleDownloadPDF = async () => {
    if (!reportContentRef.current) return;
    const uri = await generatePdfDataUri(reportContentRef.current);
    if (uri) {
        setDownloadInfo({
            uri,
            fileName: `Tax-Report-${new Date().toISOString().split('T')[0]}.pdf`,
            type: 'PDF'
        });
    }
  }
  
  const handleDownloadExcel = () => {
    const translatedData = {
      ...data,
      summary: data.summary, // Summary is from AI, no need to translate
    };
    const headers = {
        summary: t('report.summary'),
        finalResults: t('report.finalResults'),
        grossIncome: t('report.grossIncome'),
        totalTax: t('report.totalTax'),
        totalInsurance: t('report.totalInsurance'),
        netIncome: t('report.netIncome'),
        calculationSteps: t('report.calculationSteps'),
        description: t('report.stepDescription'),
        amount: t('report.stepAmount'),
        applicableLaws: t('report.applicableLaws')
    }
    const uri = generateExcelDataUri(translatedData, headers);
     if (uri) {
      setDownloadInfo({
        uri,
        fileName: `Tax-Report-${new Date().toISOString().split('T')[0]}.xlsx`,
        type: 'Excel'
      });
    }
  }

  const handlePrint = () => {
      if (reportContentRef.current) {
          printReport(reportContentRef.current);
      }
  }

  const formatCurrency = (amount: number) => {
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="animate-fade-in">
      <div ref={reportContentRef} className="p-4 md:p-8 bg-gray-100 dark:bg-gray-900 printable-area">
        <div className="hidden print-header text-black">
          <h2 className="text-2xl font-bold">{t('header.title')}</h2>
          <p>{new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
        </div>
        <div className="space-y-8">
          <NeonCard title={t('report.incomeAnalysis')} className="printable-card">
            <IncomeChart 
              grossIncome={data.grossIncome}
              netIncome={data.netIncome}
              totalTax={data.totalTax}
              totalInsurance={data.totalInsurance}
            />
          </NeonCard>

          <NeonCard title={t('report.summary')} className="printable-card">
            <p className="leading-relaxed">{data.summary}</p>
          </NeonCard>

          <NeonCard title={t('report.finalResults')} className="printable-card">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-md">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('report.totalTax')}</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(data.totalTax)}</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-md">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('report.totalInsurance')}</p>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(data.totalInsurance)}</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-md">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('report.netIncome')}</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(data.netIncome)}</p>
              </div>
            </div>
          </NeonCard>
          
          <NeonCard title={t('report.calculationSteps')} className="printable-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-300 dark:border-fuchsia-500/30">
                  <tr>
                    <th className="p-3 text-fuchsia-600 dark:text-fuchsia-400 font-semibold text-start">{t('report.stepDescription')}</th>
                    <th className="p-3 text-fuchsia-600 dark:text-fuchsia-400 font-semibold text-end">{t('report.stepAmount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.calculations.map((step, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700/50 last:border-none">
                      <td className="p-3">{step.description}</td>
                      <td className="p-3 text-end font-mono">
                        {typeof step.amount === 'number' ? formatCurrency(step.amount) : step.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </NeonCard>
          
          <NeonCard title={t('report.applicableLaws')} className="printable-card">
            <ul className="list-disc list-inside space-y-2">
              {data.applicableLaws.map((law, index) => (
                <li key={index}>{law}</li>
              ))}
            </ul>
          </NeonCard>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 justify-center gap-4 no-print">
        <button onClick={onBack} className="sm:col-span-1 bg-gray-500 dark:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-400/50 transition-all duration-300 shadow-lg">
          {t('calculator.back')}
        </button>
        <button onClick={handlePrint} className="sm:col-span-1 bg-blue-600 dark:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-300/50 transition-all duration-300 shadow-lg shadow-blue-500/30">
          {t('report.printReport')}
        </button>
        <button onClick={handleDownloadPDF} className="sm:col-span-1 bg-teal-600 dark:bg-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-700 dark:hover:bg-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-300/50 transition-all duration-300 shadow-lg shadow-teal-500/30">
          {t('report.downloadPdf')}
        </button>
        <button onClick={handleDownloadExcel} className="sm:col-span-1 bg-green-700 dark:bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-800 dark:hover:bg-green-500 focus:outline-none focus:ring-4 focus:ring-green-400/50 transition-all duration-300 shadow-lg shadow-green-600/30">
          {t('report.downloadExcel')}
        </button>
      </div>

       <Modal 
        isOpen={!!downloadInfo} 
        onClose={() => setDownloadInfo(null)} 
        title={t('report.download.modalTitle', downloadInfo?.type || '')}
      >
        <div className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-400">{t('report.download.instructions')}</p>
            <a
                href={downloadInfo?.uri}
                download={downloadInfo?.fileName}
                className="inline-block bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-700 transition-colors break-all"
            >
                {t('report.download.linkText', downloadInfo?.fileName || '')}
            </a>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('report.download.altInstructions')}</p>
        </div>
      </Modal>

    </div>
  );
};

export default ReportDisplay;