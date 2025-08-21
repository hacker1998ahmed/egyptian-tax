import React, { useState, useCallback, useMemo } from 'react';
import { TAX_YEARS } from '../constants';
import { getPayrollReport } from '../services/offlineCalculationService';
import type { ReportData, CalculationRecord, PayrollParams } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import Loader from '../components/Loader';
import ReportDisplay from '../components/ReportDisplay';
import Welcome from '../components/Welcome';
import { useTranslation } from '../i18n/context';

type ViewState = 'form' | 'loading' | 'error' | 'report';

const PayrollCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [params, setParams] = useState<PayrollParams>({
    grossMonthlySalary: 0,
    allowances: 0,
    deductions: 0,
    year: new Date().getFullYear(),
  });
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [viewState, setViewState] = useState<ViewState>('form');
  const [error, setError] = useState<string | null>(null);

  const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);

  const handleInputChange = (field: keyof PayrollParams, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    setParams(prev => ({ ...prev, [field]: numValue }));
  };

  const handleCalculate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (params.grossMonthlySalary <= 0) {
      setError(t('error.invalidIncome'));
      setViewState('error');
      return;
    }

    setViewState('loading');
    setError(null);
    setReport(null);

    try {
      const data = await getPayrollReport(params);
      setReport(data);
      setViewState('report');

      const newRecord: CalculationRecord = {
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'payroll',
        params,
        report: data,
      };
      setHistory(prevHistory => [newRecord, ...prevHistory]);

    } catch (err) {
      const errorMessage = (err instanceof Error && t(err.message as any)) ? t(err.message as any) : t('error.unexpected');
      setError(errorMessage);
      setViewState('error');
    }
  }, [params, setHistory, t]);
  
  const resetForm = () => {
    setParams({ grossMonthlySalary: 0, allowances: 0, deductions: 0, year: new Date().getFullYear() });
    setReport(null);
    setError(null);
    setViewState('form');
  }

  const handleBackToForm = () => {
     setViewState('form');
     setReport(null);
  }

  if (viewState === 'report' && report) {
    return <ReportDisplay data={report} onBack={handleBackToForm} />;
  }
  
  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl shadow-gray-400/20 dark:shadow-2xl dark:shadow-cyan-500/10 dark:backdrop-blur-sm">
        <form onSubmit={handleCalculate}>
          <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('payroll.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              id="grossMonthlySalary"
              label={t('payroll.form.gross.label')}
              type="number"
              value={params.grossMonthlySalary || ''}
              onChange={(e) => handleInputChange('grossMonthlySalary', e.target.value)}
              placeholder={t('payroll.form.gross.placeholder')}
              required
            />
             <SelectField
              id="year"
              label={t('salary.form.year.label')}
              value={params.year}
              onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
              options={TAX_YEARS.map(y => ({ value: y, label: y.toString() }))}
            />
            <InputField
              id="allowances"
              label={t('payroll.form.allowances.label')}
              type="number"
              value={params.allowances || ''}
              onChange={(e) => handleInputChange('allowances', e.target.value)}
              placeholder="0"
            />
            <InputField
              id="deductions"
              label={t('payroll.form.deductions.label')}
              type="number"
              value={params.deductions || ''}
              onChange={(e) => handleInputChange('deductions', e.target.value)}
              placeholder="0"
            />
          </div>
           <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center md:col-span-2">
            {t('payroll.form.note')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <button
              type="button"
              onClick={resetForm}
              className="w-full bg-gray-500 dark:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-400/50 transition-all duration-300 shadow-lg"
            >
              {t('calculator.clear')}
            </button>
            <button
              type="submit"
              disabled={viewState === 'loading'}
              className="w-full bg-cyan-600 dark:bg-cyan-500 text-white dark:text-black font-bold py-3 px-6 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-300/50 transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30"
            >
              {viewState === 'loading' ? t('calculator.calculating') : t('calculator.calculate')}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8">
        {viewState === 'loading' && <Loader />}
        {viewState === 'error' && (
          <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 p-4 rounded-lg text-center animate-fade-in">
            <p className="font-bold mb-2">{t('calculator.error.title')}</p>
            <p>{error}</p>
          </div>
        )}
        {viewState === 'form' && !report && <Welcome />}
      </div>
    </div>
  );
};

export default PayrollCalculator;