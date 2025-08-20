import React, { useState, useCallback, useMemo } from 'react';
import { TAX_YEARS, TAX_TYPE_KEYS, INSURANCE_TYPE_KEYS } from '../constants';
import { getTaxReport } from '../services/geminiService';
import type { ReportData, CalculationRecord, TaxParams } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import Loader from '../components/Loader';
import ReportDisplay from '../components/ReportDisplay';
import Welcome from '../components/Welcome';
import { useTranslation, TranslationKey } from '../i18n/context';

type ViewState = 'form' | 'loading' | 'error' | 'report';

const SalaryTaxCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [income, setIncome] = useState('');
  const [year, setYear] = useState<number>(2024);
  
  const taxTypeOptions = useMemo(() => TAX_TYPE_KEYS.map(key => ({ value: t(`taxType.${key}` as TranslationKey), label: t(`taxType.${key}` as TranslationKey) })), [t]);
  const insuranceTypeOptions = useMemo(() => INSURANCE_TYPE_KEYS.map(key => ({ value: t(`insuranceType.${key}` as TranslationKey), label: t(`insuranceType.${key}` as TranslationKey) })), [t]);
  
  const [taxType, setTaxType] = useState(taxTypeOptions[0].value);
  const [insuranceType, setInsuranceType] = useState(insuranceTypeOptions[0].value);
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [viewState, setViewState] = useState<ViewState>('form');
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);

  const handleCalculate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const incomeValue = parseFloat(income);
    if (isNaN(incomeValue) || incomeValue <= 0) {
      setError(t('error.invalidIncome'));
      setViewState('error');
      return;
    }

    setViewState('loading');
    setError(null);
    setReport(null);

    const params: TaxParams = {
      income: incomeValue,
      year,
      taxType,
      insuranceType,
    };

    try {
      const data = await getTaxReport(params);
      setReport(data);
      setViewState('report');

      // Save to history
      const newRecord: CalculationRecord = {
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'salary',
        params,
        report: data,
      };
      setHistory(prevHistory => [newRecord, ...prevHistory]);

    } catch (err) {
      const errorMessage = (err instanceof Error && t(err.message as any)) ? t(err.message as any) : t('error.unexpected');
      setError(errorMessage);
      setViewState('error');
    }
  }, [income, year, taxType, insuranceType, setHistory, t]);
  
  const resetForm = () => {
    setIncome('');
    setYear(2024);
    setTaxType(taxTypeOptions[0].value);
    setInsuranceType(insuranceTypeOptions[0].value);
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
          <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('salary.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              id="income"
              label={t('salary.form.income.label')}
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder={t('salary.form.income.placeholder')}
              required
            />
            <SelectField
              id="year"
              label={t('salary.form.year.label')}
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              options={TAX_YEARS.map(y => ({ value: y, label: y.toString() }))}
            />
            <SelectField
              id="taxType"
              label={t('salary.form.taxType.label')}
              value={taxType}
              onChange={(e) => setTaxType(e.target.value)}
              options={taxTypeOptions.filter(opt => opt.value.includes(t('taxType.salary' as TranslationKey)))}
              disabled
            />
            <SelectField
              id="insuranceType"
              label={t('salary.form.insuranceType.label')}
              value={insuranceType}
              onChange={(e) => setInsuranceType(e.target.value)}
              options={insuranceTypeOptions}
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

export default SalaryTaxCalculator;