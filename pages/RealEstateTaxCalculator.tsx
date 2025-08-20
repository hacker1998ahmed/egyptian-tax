import React, { useState, useCallback, useMemo } from 'react';
import { TAX_YEARS, PROPERTY_TYPE_KEYS, YES_NO_OPTIONS } from '../constants';
import { getRealEstateTaxReport } from '../services/offlineCalculationService';
import type { ReportData, CalculationRecord, RealEstateTaxParams } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import Loader from '../components/Loader';
import ReportDisplay from '../components/ReportDisplay';
import Welcome from '../components/Welcome';
import { useTranslation, TranslationKey } from '../i18n/context';

type ViewState = 'form' | 'loading' | 'error' | 'report';

const RealEstateTaxCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [marketValue, setMarketValue] = useState('');
  const [propertyType, setPropertyType] = useState(PROPERTY_TYPE_KEYS[0]);
  const [isPrimaryResidence, setIsPrimaryResidence] = useState<'yes' | 'no'>('yes');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [viewState, setViewState] = useState<ViewState>('form');
  const [error, setError] = useState<string | null>(null);

  const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);

  const propertyTypeOptions = useMemo(() => PROPERTY_TYPE_KEYS.map(key => ({
    value: key,
    label: t(`propertyType.${key}` as TranslationKey),
  })), [t]);

  const yesNoOptions = useMemo(() => YES_NO_OPTIONS.map(opt => ({
    value: opt.value,
    label: t(opt.labelKey as TranslationKey),
  })), [t]);

  const handleCalculate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const marketValueNum = parseFloat(marketValue);
    
    if (isNaN(marketValueNum) || marketValueNum <= 0) {
      setError(t('error.unexpected')); // Placeholder, should have specific error key
      setViewState('error');
      return;
    }

    setViewState('loading');
    setError(null);
    setReport(null);

    const params: RealEstateTaxParams = {
      marketValue: marketValueNum,
      propertyType,
      isPrimaryResidence,
      year,
    };

    try {
      const data = await getRealEstateTaxReport(params);
      setReport(data);
      setViewState('report');

      const newRecord: CalculationRecord = {
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'realEstate',
        params,
        report: data,
      };
      setHistory(prevHistory => [newRecord, ...prevHistory]);

    } catch (err) {
      const errorMessage = (err instanceof Error && t(err.message as any)) ? t(err.message as any) : t('error.unexpected');
      setError(errorMessage);
      setViewState('error');
    }
  }, [marketValue, propertyType, isPrimaryResidence, year, setHistory, t]);
  
  const resetForm = () => {
    setMarketValue('');
    setYear(new Date().getFullYear());
    setPropertyType(PROPERTY_TYPE_KEYS[0]);
    setIsPrimaryResidence('yes');
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
          <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('realEstate.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              id="marketValue"
              label={t('realEstate.form.marketValue.label')}
              type="number"
              value={marketValue}
              onChange={(e) => setMarketValue(e.target.value)}
              placeholder={t('realEstate.form.marketValue.placeholder')}
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
              id="propertyType"
              label={t('realEstate.form.propertyType.label')}
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              options={propertyTypeOptions}
            />
             <SelectField
              id="isPrimaryResidence"
              label={t('realEstate.form.isPrimary.label')}
              value={isPrimaryResidence}
              onChange={(e) => setIsPrimaryResidence(e.target.value as 'yes' | 'no')}
              options={yesNoOptions}
              disabled={propertyType !== 'residential'}
            />
          </div>
           <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center md:col-span-2">
            {t('realEstate.form.note')}
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

export default RealEstateTaxCalculator;