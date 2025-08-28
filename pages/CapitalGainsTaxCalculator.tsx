import React, { useState, useCallback } from 'react';
import { TAX_YEARS } from '../constants';
import { getCapitalGainsTaxReport } from '../services/offlineCalculationService';
import type { ReportData, CalculationRecord, CapitalGainsTaxParams } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import Loader from '../components/Loader';
import ReportDisplay from '../components/ReportDisplay';
import Welcome from '../components/Welcome';
import { useTranslation } from '../i18n/context';

type ViewState = 'form' | 'loading' | 'error' | 'report';

const CapitalGainsTaxCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [params, setParams] = useState<Omit<CapitalGainsTaxParams, 'year'>>({
    purchasePrice: 0,
    sellingPrice: 0,
    costs: 0,
  });
  const [year, setYear] = useState<number>(new Date().getFullYear());
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [viewState, setViewState] = useState<ViewState>('form');
  const [error, setError] = useState<string | null>(null);

  const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);

  const handleInputChange = (field: keyof typeof params, value: string) => {
    setParams(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleCalculate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(params.sellingPrice) <= 0) {
      setError(t('error.unexpected')); // Add a more specific error
      setViewState('error');
      return;
    }

    setViewState('loading');
    setError(null);
    setReport(null);

    const finalParams: CapitalGainsTaxParams = { ...params, year };

    try {
      const data = await getCapitalGainsTaxReport(finalParams);
      setReport(data);
      setViewState('report');

      const newRecord: CalculationRecord = {
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'capitalGains',
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
    setParams({ purchasePrice: 0, sellingPrice: 0, costs: 0 });
    setYear(new Date().getFullYear());
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
          <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('capitalGains.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              id="purchasePrice"
              label={t('capitalGains.form.purchasePrice.label')}
              type="number"
              value={params.purchasePrice || ''}
              onChange={e => handleInputChange('purchasePrice', e.target.value)}
              placeholder={t('capitalGains.form.purchasePrice.placeholder')}
              required
            />
             <InputField
              id="sellingPrice"
              label={t('capitalGains.form.sellingPrice.label')}
              type="number"
              value={params.sellingPrice || ''}
              onChange={e => handleInputChange('sellingPrice', e.target.value)}
              placeholder={t('capitalGains.form.sellingPrice.placeholder')}
              required
            />
            <InputField
              id="costs"
              label={t('capitalGains.form.costs.label')}
              type="number"
              value={params.costs || ''}
              onChange={e => handleInputChange('costs', e.target.value)}
              placeholder={t('capitalGains.form.costs.placeholder')}
            />
            <SelectField
              id="year"
              label={t('salary.form.year.label')}
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              options={TAX_YEARS.map(y => ({ value: y, label: y.toString() }))}
            />
          </div>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center md:col-span-2">
            {t('capitalGains.form.note')}
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

export default CapitalGainsTaxCalculator;
