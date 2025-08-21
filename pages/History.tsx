import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { CalculationRecord, ReportData, TaxParams, CorporateTaxParams, VATTaxParams, RealEstateTaxParams, WithholdingTaxParams, SocialInsuranceParams, StampDutyParams, ZakatParams, InvestmentParams, EndOfServiceParams, FeasibilityStudyParams, ElectricityParams, InheritanceParams, CustomsParams, LoanParams, PayrollParams, SavingsGoalParams, ProfitMarginParams } from '../types';
import ReportDisplay from '../components/ReportDisplay';
import { CORPORATE_TAX_LAWS } from '../constants';
import { useTranslation, TranslationKey } from '../i18n/context';
import { generateHistoryExcelDataUri, downloadFile } from '../utils/reportGenerator';

const HistoryItem: React.FC<{ record: CalculationRecord; onView: () => void; onDelete: () => void; }> = ({ record, onView, onDelete }) => {
  const { t, language } = useTranslation();
  
  const formatCurrency = (amount: number) => {
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' }).format(amount);
  };
  const formatDate = (dateString: string) => {
     const locale = language === 'ar' ? 'ar-EG' : 'en-US';
     return new Date(dateString).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short'});
  }
  
  const params = record.params;
  let title = '';
  let subtitle = '';
  let summaryLine1 = '';
  let summaryLine2 = '';

  switch(record.type) {
    case 'salary':
      title = t('history.item.salary.title', (params as TaxParams).year);
      summaryLine1 = `${t('history.item.grossIncome')}: ${formatCurrency((params as TaxParams).income)}`;
      summaryLine2 = `${t('history.item.netIncome')}: ${formatCurrency(record.report.netIncome)}`;
      break;
    case 'payroll':
       const pPayroll = params as PayrollParams;
       title = t('history.item.payroll.title', pPayroll.year);
       summaryLine1 = `${t('history.item.grossIncome')}: ${formatCurrency(pPayroll.grossMonthlySalary)}`;
       summaryLine2 = `${t('history.item.netIncome')}: ${formatCurrency(record.report.netIncome)}`;
       break;
    case 'corporate':
      const pCorp = params as CorporateTaxParams;
      const lawLabel = t(CORPORATE_TAX_LAWS.find(l => l.value === pCorp.law)?.labelKey as TranslationKey) || t('common.undefined');
      title = t('history.item.corporate.title', pCorp.year);
      subtitle = `${t('history.item.corporate.law')}: ${lawLabel}`;
      summaryLine1 = `${t('history.item.revenue')}: ${formatCurrency(pCorp.revenue)}`;
      summaryLine2 = `${t('history.item.taxDue')}: ${formatCurrency(record.report.totalTax)}`;
      break;
    case 'vat':
       const pVAT = params as VATTaxParams;
       const monthName = t(`month.${pVAT.month}` as TranslationKey);
       title = t('history.item.vat.title', monthName, pVAT.year);
       summaryLine1 = `${t('history.item.totalSales')}: ${formatCurrency(record.report.grossIncome)}`;
       const finalAmount = record.report.netIncome;
       if (finalAmount >= 0) {
         summaryLine2 = `${t('history.item.vat.taxPayable')}: ${formatCurrency(finalAmount)}`;
       } else {
         summaryLine2 = `${t('history.item.vat.creditCarriedOver')}: ${formatCurrency(Math.abs(finalAmount))}`;
       }
      break;
    case 'realEstate':
       title = t('history.item.realEstate.title', (params as RealEstateTaxParams).year);
       summaryLine1 = `${t('history.item.marketValue')}: ${formatCurrency((params as RealEstateTaxParams).marketValue)}`;
       summaryLine2 = `${t('history.item.taxDue')}: ${formatCurrency(record.report.totalTax)}`;
      break;
    case 'withholding':
       title = t('history.item.withholding.title', (params as WithholdingTaxParams).year);
       summaryLine1 = `${t('history.item.transactionAmount')}: ${formatCurrency((params as WithholdingTaxParams).amount)}`;
       summaryLine2 = `${t('history.item.withholding.taxWithheld')}: ${formatCurrency(record.report.totalTax)}`;
      break;
    case 'socialInsurance':
       title = t('history.item.socialInsurance.title', (params as SocialInsuranceParams).year);
       const p = params as SocialInsuranceParams;
       summaryLine1 = `${t('history.item.socialInsurance.totalWage')}: ${formatCurrency(p.basicWage + p.variableWage)}`;
       summaryLine2 = `${t('history.item.socialInsurance.totalContribution')}: ${formatCurrency(record.report.totalInsurance)}`;
      break;
    case 'stampDuty':
       title = t('history.item.stampDuty.title', (params as StampDutyParams).year);
       summaryLine1 = `${t('history.item.transactionAmount')}: ${formatCurrency((params as StampDutyParams).amount)}`;
       summaryLine2 = `${t('history.item.taxDue')}: ${formatCurrency(record.report.totalTax)}`;
      break;
    case 'zakat':
       title = t('history.item.zakat.title');
       summaryLine1 = `${t('history.item.zakat.zakatPool')}: ${formatCurrency(record.report.netIncome)}`;
       summaryLine2 = `${t('history.item.zakat.zakatDue')}: ${formatCurrency(record.report.totalTax)}`;
      break;
    case 'investment':
       title = t('history.item.investment.title', (params as InvestmentParams).years);
       summaryLine1 = `${t('history.item.investment.totalContribution')}: ${formatCurrency(record.report.grossIncome)}`;
       summaryLine2 = `${t('history.item.investment.futureValue')}: ${formatCurrency(record.report.netIncome)}`;
      break;
    case 'endOfService':
       title = t('history.item.endOfService.title', (params as EndOfServiceParams).yearsOfService);
       summaryLine1 = `${t('history.item.endOfService.lastSalary')}: ${formatCurrency((params as EndOfServiceParams).lastSalary)}`;
       summaryLine2 = `${t('history.item.endOfService.gratuity')}: ${formatCurrency(record.report.netIncome)}`;
       break;
    case 'feasibilityStudy':
       title = t('history.item.feasibility.title');
       summaryLine1 = `${t('history.item.feasibility.bepValue')}: ${formatCurrency(record.report.grossIncome)}`;
       summaryLine2 = `${t('history.item.feasibility.bepUnits')}: ${record.report.netIncome.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} ${t('history.item.feasibility.unit')}`;
       break;
    case 'electricity':
       title = t('history.item.electricity.title');
       summaryLine1 = `${t('history.item.electricity.consumption')}: ${record.report.grossIncome.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} kWh`;
       summaryLine2 = `${t('history.item.electricity.estimatedBill')}: ${formatCurrency(record.report.totalTax)}`;
       break;
    case 'inheritance':
       title = t('history.item.inheritance.title');
       summaryLine1 = `${t('history.item.inheritance.estateValue')}: ${formatCurrency((params as InheritanceParams).estateValue)}`;
       summaryLine2 = `${t('history.item.inheritance.heirsCount')}: ${record.report.calculations.length}`;
       break;
    case 'customs':
       title = t('history.item.customs.title');
       summaryLine1 = `${t('history.item.customs.shipmentValue')}: ${formatCurrency((params as CustomsParams).shipmentValue)}`;
       summaryLine2 = `${t('history.item.customs.totalFees')}: ${formatCurrency(record.report.totalTax)}`;
       break;
    case 'loan':
       const pLoan = params as LoanParams;
       title = t('history.item.loan.title');
       summaryLine1 = `${t('history.item.loan.amount')}: ${formatCurrency(pLoan.amount)}`;
       summaryLine2 = `${t('history.item.loan.totalPayment')}: ${formatCurrency(record.report.netIncome)}`;
       break;
    case 'profitMargin':
       const pMargin = params as ProfitMarginParams;
       title = t('history.item.profitMargin.title');
       summaryLine1 = `${t('history.item.revenue')}: ${formatCurrency(pMargin.revenue)}`;
       const netMargin = record.report.grossIncome > 0 ? (record.report.netIncome / record.report.grossIncome * 100).toFixed(2) : '0.00';
       summaryLine2 = `${t('history.item.profitMargin.netMargin')}: ${netMargin}%`;
       break;
  }


  return (
    <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
      <div className="flex-grow">
        <p className="font-bold text-fuchsia-700 dark:text-fuchsia-400">{title}</p>
        {subtitle && <p className="text-xs text-cyan-600 dark:text-cyan-400">{subtitle}</p>}
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
           {summaryLine1}
        </p>
        <p className="text-sm text-green-700 dark:text-green-400 mt-1">
          {summaryLine2}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          {t('history.item.createdAt')}: {formatDate(record.timestamp)}
        </p>
      </div>
      <div className="flex gap-2 self-stretch sm:self-center">
        <button onClick={onView} className="bg-cyan-600 dark:bg-cyan-500 text-white dark:text-black font-bold py-2 px-4 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-400 transition-colors text-sm">
          {t('history.item.view')}
        </button>
        <button onClick={onDelete} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 dark:hover:bg-red-500 transition-colors text-sm">
          {t('history.item.delete')}
        </button>
      </div>
    </div>
  );
};

const History: React.FC = () => {
  const { t } = useTranslation();
  const [history, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleDelete = (id: string) => {
    if (window.confirm(t('history.confirmDelete'))) {
      setHistory(history.filter(record => record.id !== id));
    }
  };

  const handleClearHistory = () => {
    if (history.length > 0 && window.confirm(t('history.confirmDeleteAll'))) {
      setHistory([]);
    }
  }
  
  const handleExportAllToExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
        const uri = generateHistoryExcelDataUri(sortedHistory, (key, ...args) => t(key as any, ...args));
        const filename = `Calculation-History-${new Date().toISOString().split('T')[0]}.xlsx`;
        downloadFile(filename, uri, (key) => t(key as any));
    } catch (error) {
        console.error("Error during history export:", error);
        alert(t('error.unexpected'));
    } finally {
        setIsExporting(false);
    }
  }

  if (selectedReport) {
    return <ReportDisplay data={selectedReport} onBack={() => setSelectedReport(null)} />;
  }

  const sortedHistory = [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6 gap-2">
        <h2 className="text-3xl font-bold text-fuchsia-700 dark:text-fuchsia-400" style={{ textShadow: 'var(--history-header-shadow)' }}>
          <style>{`.dark h2 { --history-header-shadow: 0 0 5px #e879f9; }`}</style>
          {t('history.title')}
        </h2>
        <div className="flex gap-2">
            {history.length > 0 && (
                <button
                    onClick={handleExportAllToExcel}
                    disabled={isExporting}
                    className="bg-green-700 dark:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-800 dark:hover:bg-green-500 transition-colors text-sm disabled:opacity-50"
                >
                    {isExporting ? t('history.export.exporting') : t('history.export.button')}
                </button>
            )}
            {history.length > 0 && (
            <button
                onClick={handleClearHistory}
                className="bg-red-700 dark:bg-red-800 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-800 dark:hover:bg-red-700 transition-colors text-sm"
            >
                {t('history.clearAll')}
            </button>
            )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center bg-white dark:bg-gray-800/50 p-8 rounded-lg border border-gray-200 dark:border-fuchsia-500/30">
          <p className="text-gray-600 dark:text-gray-400">{t('history.empty.title')}</p>
          <p className="text-gray-500 mt-2">{t('history.empty.subtitle')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedHistory.map(record => (
            <HistoryItem 
              key={record.id} 
              record={record}
              onView={() => setSelectedReport(record.report)}
              onDelete={() => handleDelete(record.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default History;