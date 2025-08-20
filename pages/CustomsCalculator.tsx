import React, { useState, useCallback, useMemo } from 'react';
import { getCustomsReport } from '../services/geminiService';
import type { ReportData, CalculationRecord, CustomsParams } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import Loader from '../components/Loader';
import ReportDisplay from '../components/ReportDisplay';
import Welcome from '../components/Welcome';
import { useTranslation } from '../i18n/context';
import { COUNTRIES } from '../constants';

type ViewState = 'form' | 'loading' | 'error' | 'report';

const CustomsCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [params, setParams] = useState<CustomsParams>({
    shipmentValue: 0,
    description: '',
    countryOfOrigin: 'China',
  });

  const [report, setReport] = useState<ReportData | null>(null);
  const [viewState, setViewState] = useState<ViewState>('form');
  const [error, setError] = useState<string | null>(null);

  const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);
  
  const countryOptions = useMemo(() => COUNTRIES.map(c => ({ value: c, label: c })), []);

  const handleInputChange = (field: keyof CustomsParams, value: string | number) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (params.shipmentValue <= 0 || !params.description.trim()) {
      setError(t('error.unexpected')); // Add specific error key
      setViewState('error');
      return;
    }

    setViewState('loading');
    setError(null);
    setReport(null);

    try {
      const data = await getCustomsReport(params);
      setReport(data);
      setViewState('report');

      const newRecord: CalculationRecord = {
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'customs',
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
    setParams({ shipmentValue: 0, description: '', countryOfOrigin: 'China' });
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
          <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('customs.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              id="shipmentValue"
              label={t('customs.form.value.label')}
              type="number"
              value={params.shipmentValue || ''}
              onChange={(e) => handleInputChange('shipmentValue', parseFloat(e.target.value) || 0)}
              placeholder={t('customs.form.value.placeholder')}
              required
            />
            <SelectField
              id="countryOfOrigin"
              label={t('customs.form.origin.label')}
              value={params.countryOfOrigin}
              onChange={(e) => handleInputChange('countryOfOrigin', e.target.value)}
              options={countryOptions}
            />
            <div className="md:col-span-2">
                <InputField
                id="description"
                label={t('customs.form.description.label')}
                type="text"
                value={params.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t('customs.form.description.placeholder')}
                required
                />
            </div>
          </div>
           <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center md:col-span-2">
            {t('customs.form.note')}
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

export default CustomsCalculator;