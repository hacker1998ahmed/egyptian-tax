import React, { useState, useCallback, useMemo } from 'react';
import { TAX_YEARS } from '../constants';
import { getFreelancerTaxReport } from '../services/offlineCalculationService';
import type { ReportData, CalculationRecord, FreelancerTaxParams } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import Loader from '../components/Loader';
import ReportDisplay from '../components/ReportDisplay';
import Welcome from '../components/Welcome';
import { useTranslation } from '../i18n/context';

type ViewState = 'form' | 'loading' | 'error' | 'report';

const FreelancerTaxCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [params, setParams] = useState<Omit<FreelancerTaxParams, 'year'>>({
    revenue: 0,
    expenseType: 'deemed',
    actualExpenses: 0,
  });
  const [year, setYear] = useState<number>(new Date().getFullYear());
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [viewState, setViewState] = useState<ViewState>('form');
  const [error, setError] = useState<string | null>(null);

  const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);

  const handleInputChange = (field: keyof typeof params, value: string | number) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  const expenseTypeOptions = useMemo(() => [
    { value: 'deemed', label: t('freelancer.form.expenseType.deemed') },
    { value: 'actual', label: t('freelancer.form.expenseType.actual') },
  ], [t]);

  const handleCalculate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(params.revenue) <= 0) {
      setError(t('error.invalidRevenue'));
      setViewState('error');
      return;
    }

    setViewState('loading');
    setError(null);
    setReport(null);

    const finalParams: FreelancerTaxParams = { ...params, revenue: Number(params.revenue), actualExpenses: Number(params.actualExpenses), year };

    try {
      const data = await getFreelancerTaxReport(finalParams);
      setReport(data);
      setViewState('report');

      const newRecord: CalculationRecord = {
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'freelancer',
        params: finalParams,
        report: data,
      };
      setHistory(prev => [newRecord, ...prev]);

    } catch (err) {
      const errorMessage = (err instanceof Error && t(err.message as any)) ? t(err.message as any) : t('error.unexpected');
      setError(errorMessage);
      setViewState('error');
    }
  }, [params, year, setHistory, t]);
  
  const resetForm = () => {
    setParams({ revenue: 0, expenseType: 'deemed', actualExpenses: 0 });
    setYear(new Date().getFullYear());
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
      <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
        <form onSubmit={handleCalculate}>
          <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('freelancer.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              id="revenue"
              label={t('freelancer.form.revenue.label')}
              type="number"
              value={params.revenue || ''}
              onChange={e => handleInputChange('revenue', e.target.value)}
              placeholder={t('freelancer.form.revenue.placeholder')}
              required
            />
            <SelectField
              id="year"
              label={t('salary.form.year.label')}
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              options={TAX_YEARS.map(y => ({ value: y, label: y.toString() }))}
            />
            <SelectField
              id="expenseType"
              label={t('freelancer.form.expenseType.label')}
              value={params.expenseType}
              onChange={e => handleInputChange('expenseType', e.target.value)}
              options={expenseTypeOptions}
            />
            {params.expenseType === 'actual' && (
              <InputField
                id="actualExpenses"
                label={t('freelancer.form.actualExpenses.label')}
                type="number"
                value={params.actualExpenses || ''}
                onChange={e => handleInputChange('actualExpenses', e.target.value)}
                placeholder={t('freelancer.form.actualExpenses.placeholder')}
                required
              />
            )}
          </div>
           <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center md:col-span-2">
            {t('freelancer.form.note')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
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

export default FreelancerTaxCalculator;
