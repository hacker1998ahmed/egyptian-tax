import React, { useState, useCallback, useMemo } from 'react';
import { TAX_YEARS, ENTITY_TYPE_KEYS, CORPORATE_TAX_LAWS } from '../constants';
import { getCorporateTaxReport } from '../services/offlineCalculationService';
import type { ReportData, CalculationRecord, CorporateTaxParams, CorporateTaxLaw } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import Loader from '../components/Loader';
import ReportDisplay from '../components/ReportDisplay';
import Welcome from '../components/Welcome';
import { useTranslation, TranslationKey } from '../i18n/context';

type ViewState = 'form' | 'loading' | 'error' | 'report';

const CorporateTaxCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [revenue, setRevenue] = useState('');
  const [expenses, setExpenses] = useState('');
  const [year, setYear] = useState<number>(2024);
  const [entityType, setEntityType] = useState(ENTITY_TYPE_KEYS[0]);
  const [law, setLaw] = useState<CorporateTaxLaw>(CORPORATE_TAX_LAWS[0].value);
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [viewState, setViewState] = useState<ViewState>('form');
  const [error, setError] = useState<string | null>(null);

  const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);

  const isProfitBased = useMemo(() => ['standard_22.5', 'law_175_2023'].includes(law), [law]);

  const corporateTaxLawOptions = useMemo(() => CORPORATE_TAX_LAWS.map(l => ({
    value: l.value,
    label: t(l.labelKey as TranslationKey),
  })), [t]);

  const entityTypeOptions = useMemo(() => ENTITY_TYPE_KEYS.map(key => ({
    value: key,
    label: t(`entityType.${key}` as TranslationKey),
  })), [t]);

  const handleCalculate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const revenueValue = parseFloat(revenue);
    const expensesValue = parseFloat(expenses) || 0;

    if (isNaN(revenueValue) || revenueValue <= 0) {
      setError(t('error.invalidRevenue'));
      setViewState('error');
      return;
    }
    
    if (isProfitBased) {
        if (isNaN(expensesValue) || expensesValue < 0) {
            setError(t('error.invalidExpenses'));
            setViewState('error');
            return;
        }
        if (expensesValue > revenueValue) {
            setError(t('error.expensesVsRevenue'));
            setViewState('error');
            return;
        }
    }


    setViewState('loading');
    setError(null);
    setReport(null);

    const params: CorporateTaxParams = {
      revenue: revenueValue,
      ...(isProfitBased && { expenses: expensesValue }),
      year,
      entityType,
      law,
    };

    try {
      const data = await getCorporateTaxReport(params);
      setReport(data);
      setViewState('report');

      const newRecord: CalculationRecord = {
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'corporate',
        params,
        report: data,
      };
      setHistory(prevHistory => [newRecord, ...prevHistory]);

    } catch (err) {
      const errorMessage = (err instanceof Error && t(err.message as any)) ? t(err.message as any) : t('error.unexpected');
      setError(errorMessage);
      setViewState('error');
    }
  }, [revenue, expenses, year, entityType, law, isProfitBased, setHistory, t]);
  
  const resetForm = () => {
    setRevenue('');
    setExpenses('');
    setYear(2024);
    setEntityType(ENTITY_TYPE_KEYS[0]);
    setLaw(CORPORATE_TAX_LAWS[0].value)
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
          <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('corporate.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
                <SelectField
                id="taxLaw"
                label={t('corporate.form.law.label')}
                value={law}
                onChange={(e) => setLaw(e.target.value as CorporateTaxLaw)}
                options={corporateTaxLawOptions}
                />
            </div>
            <InputField
              id="revenue"
              label={t('corporate.form.revenue.label')}
              type="number"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              placeholder={t('corporate.form.revenue.placeholder')}
              required
            />
            {isProfitBased && (
                 <InputField
                    id="expenses"
                    label={t('corporate.form.expenses.label')}
                    type="number"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    placeholder={t('corporate.form.expenses.placeholder')}
                    required
                />
            )}
             <SelectField
              id="year"
              label={t('salary.form.year.label')}
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              options={TAX_YEARS.map(y => ({ value: y, label: y.toString() }))}
            />
            <SelectField
              id="entityType"
              label={t('corporate.form.entity.label')}
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              options={entityTypeOptions}
            />
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

export default CorporateTaxCalculator;