import React, { useState, useCallback } from 'react';
import { getZakatReport } from '../services/offlineCalculationService';
import type { ReportData, CalculationRecord, ZakatParams } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import InputField from '../components/InputField';
import Loader from '../components/Loader';
import ReportDisplay from '../components/ReportDisplay';
import Welcome from '../components/Welcome';
import { useTranslation } from '../i18n/context';

type ViewState = 'form' | 'loading' | 'error' | 'report';

const ZakatCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [params, setParams] = useState<ZakatParams>({
    goldPrice: 0,
    cash: 0,
    stocks: 0,
    tradeGoods: 0,
    debts: 0,
  });
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [viewState, setViewState] = useState<ViewState>('form');
  const [error, setError] = useState<string | null>(null);

  const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);

  const handleInputChange = (field: keyof ZakatParams, value: string) => {
    setParams(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleCalculate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (params.goldPrice <= 0) {
      setError(t('error.unexpected')); // Add specific error key for gold price
      setViewState('error');
      return;
    }

    setViewState('loading');
    setError(null);
    setReport(null);

    try {
      const data = await getZakatReport(params);
      setReport(data);
      setViewState('report');

      const newRecord: CalculationRecord = {
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'zakat',
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
    setParams({ goldPrice: 0, cash: 0, stocks: 0, tradeGoods: 0, debts: 0 });
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
          <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('zakat.title')}</h2>
          
          <div className="mb-6">
            <InputField
              id="goldPrice"
              label={t('zakat.form.goldPrice.label')}
              type="number"
              value={params.goldPrice || ''}
              onChange={(e) => handleInputChange('goldPrice', e.target.value)}
              placeholder={t('zakat.form.goldPrice.placeholder')}
              required
            />
          </div>

          <fieldset className="border border-gray-300 dark:border-cyan-500/30 p-4 rounded-lg space-y-4">
            <legend className="text-lg font-bold text-cyan-700 dark:text-cyan-400 px-2">{t('zakat.form.cash')}</legend>
            <InputField id="cash" label={t('zakat.form.cash')} type="number" value={params.cash || ''} onChange={(e) => handleInputChange('cash', e.target.value)} placeholder="0" />
            <InputField id="stocks" label={t('zakat.form.stocks')} type="number" value={params.stocks || ''} onChange={(e) => handleInputChange('stocks', e.target.value)} placeholder="0" />
            <InputField id="tradeGoods" label={t('zakat.form.tradeGoods')} type="number" value={params.tradeGoods || ''} onChange={(e) => handleInputChange('tradeGoods', e.target.value)} placeholder="0" />
          </fieldset>
          
          <div className="mt-6">
            <InputField
              id="debts"
              label={t('zakat.form.debts.label')}
              type="number"
              value={params.debts || ''}
              onChange={(e) => handleInputChange('debts', e.target.value)}
              placeholder={t('zakat.form.debts.placeholder')}
            />
          </div>
          
           <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            {t('zakat.form.note')}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <button type="button" onClick={resetForm} className="w-full bg-gray-500 dark:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-400/50 transition-all duration-300 shadow-lg">
              {t('calculator.clear')}
            </button>
            <button type="submit" disabled={viewState === 'loading'} className="w-full bg-cyan-600 dark:bg-cyan-500 text-white dark:text-black font-bold py-3 px-6 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-300/50 transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30">
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

export default ZakatCalculator;