import React, { useState, useCallback, useMemo } from 'react';
import { TAX_YEARS, WITHHOLDING_TYPE_KEYS } from '../constants';
import { getWithholdingTaxReport } from '../services/geminiService';
import type { ReportData, CalculationRecord, WithholdingTaxParams } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import Loader from '../components/Loader';
import ReportDisplay from '../components/ReportDisplay';
import Welcome from '../components/Welcome';
import { useTranslation, TranslationKey } from '../i18n/context';

type ViewState = 'form' | 'loading' | 'error' | 'report';

const WithholdingTaxCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState(WITHHOLDING_TYPE_KEYS[0]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [viewState, setViewState] = useState<ViewState>('form');
  const [error, setError] = useState<string | null>(null);

  const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);

  const transactionTypeOptions = useMemo(() => WITHHOLDING_TYPE_KEYS.map(key => ({
    value: key,
    label: t(`withholdingType.${key}` as TranslationKey),
  })), [t]);

  const handleCalculate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      setError(t('error.unexpected')); // Placeholder, should have specific error key
      setViewState('error');
      return;
    }

    setViewState('loading');
    setError(null);
    setReport(null);

    const params: WithholdingTaxParams = {
      amount: amountNum,
      transactionType,
      year,
    };

    try {
      const data = await getWithholdingTaxReport(params);
      setReport(data);
      setViewState('report');

      const newRecord: CalculationRecord = {
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'withholding',
        params,
        report: data,
      };
      setHistory(prevHistory => [newRecord, ...prevHistory]);

    } catch (err) {
      const errorMessage = (err instanceof Error && t(err.message as any)) ? t(err.message as any) : t('error.unexpected');
      setError(errorMessage);
      setViewState('error');
    }
  }, [amount, transactionType, year, setHistory, t]);
  
  const resetForm = () => {
    setAmount('');
    setTransactionType(WITHHOLDING_TYPE_KEYS[0]);
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
      <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl shadow-gray-400/20 dark:shadow-2xl dark:shadow-cyan-500/10 dark:backdrop-blur-sm">
        <form onSubmit={handleCalculate}>
          <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('withholding.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              id="amount"
              label={t('withholding.form.amount.label')}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('withholding.form.amount.placeholder')}
              required
            />
             <SelectField
              id="year"
              label={t('salary.form.year.label')}
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              options={TAX_YEARS.map(y => ({ value: y, label: y.toString() }))}
            />
            <div className="md:col-span-2">
              <SelectField
                id="transactionType"
                label={t('withholding.form.transactionType.label')}
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                options={transactionTypeOptions}
              />
            </div>
          </div>
           <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center md:col-span-2">
            {t('withholding.form.note')}
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

export default WithholdingTaxCalculator;