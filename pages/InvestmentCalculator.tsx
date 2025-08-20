import React, { useState, useCallback } from 'react';
import { getInvestmentReport } from '../services/geminiService';
import type { ReportData, CalculationRecord, InvestmentParams } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import InputField from '../components/InputField';
import Loader from '../components/Loader';
import ReportDisplay from '../components/ReportDisplay';
import Welcome from '../components/Welcome';
import { useTranslation } from '../i18n/context';

type ViewState = 'form' | 'loading' | 'error' | 'report';

const InvestmentCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [params, setParams] = useState<InvestmentParams>({
    initialAmount: 0,
    monthlyContribution: 0,
    interestRate: 0,
    years: 0,
  });

  const [report, setReport] = useState<ReportData | null>(null);
  const [viewState, setViewState] = useState<ViewState>('form');
  const [error, setError] = useState<string | null>(null);

  const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);

  const handleInputChange = (field: keyof InvestmentParams, value: string) => {
    setParams(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleCalculate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
     if (params.years <= 0 || params.interestRate <= 0) {
      setError(t('error.unexpected')); // Add specific error key
      setViewState('error');
      return;
    }

    setViewState('loading');
    setError(null);
    setReport(null);

    try {
      const data = await getInvestmentReport(params);
      setReport(data);
      setViewState('report');

      const newRecord: CalculationRecord = {
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'investment',
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
    setParams({ initialAmount: 0, monthlyContribution: 0, interestRate: 0, years: 0 });
    setReport(null);
    setError(null);
    setViewState('form');
  };

  const handleBackToForm = () => {
    setViewState('form');
    setReport(null);
  };

  if (viewState === 'report' && report) {
    return <ReportDisplay data={report} onBack={handleBackToForm} />;
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
        <form onSubmit={handleCalculate}>
          <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('investment.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              id="initialAmount"
              label={t('investment.form.initial.label')}
              type="number"
              value={params.initialAmount || ''}
              onChange={(e) => handleInputChange('initialAmount', e.target.value)}
              placeholder={t('investment.form.initial.placeholder')}
            />
            <InputField
              id="monthlyContribution"
              label={t('investment.form.monthly.label')}
              type="number"
              value={params.monthlyContribution || ''}
              onChange={(e) => handleInputChange('monthlyContribution', e.target.value)}
              placeholder={t('investment.form.monthly.placeholder')}
            />
            <InputField
              id="interestRate"
              label={t('investment.form.rate.label')}
              type="number"
              step="0.1"
              value={params.interestRate || ''}
              onChange={(e) => handleInputChange('interestRate', e.target.value)}
              placeholder={t('investment.form.rate.placeholder')}
              required
            />
            <InputField
              id="years"
              label={t('investment.form.years.label')}
              type="number"
              value={params.years || ''}
              onChange={(e) => handleInputChange('years', e.target.value)}
              placeholder={t('investment.form.years.placeholder')}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <button type="button" onClick={resetForm} className="w-full bg-gray-500 dark:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 transition-all duration-300">
              {t('calculator.clear')}
            </button>
            <button type="submit" disabled={viewState === 'loading'} className="w-full bg-cyan-600 dark:bg-cyan-500 text-white dark:text-black font-bold py-3 px-6 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-400 transition-all duration-300 disabled:opacity-50">
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

export default InvestmentCalculator;
