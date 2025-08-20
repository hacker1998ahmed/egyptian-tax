import React, { useState, useCallback, useMemo } from 'react';
import { TAX_YEARS, MONTHS_KEYS } from '../constants';
import { getVATTaxReport } from '../services/offlineCalculationService';
import type { ReportData, CalculationRecord, VATTaxParams, VatBreakdown } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import Loader from '../components/Loader';
import ReportDisplay from '../components/ReportDisplay';
import Welcome from '../components/Welcome';
import { useTranslation, TranslationKey } from '../i18n/context';

type ViewState = 'form' | 'loading' | 'error' | 'report';

const initialBreakdown: VatBreakdown = {
  rate14: 0, rate10: 0, rate5: 0, exempt: 0, creditNote: 0, debitNote: 0,
};

const VatSection: React.FC<{ title: string, values: VatBreakdown, onChange: (field: keyof VatBreakdown, value: number) => void, prefix: string }> = ({ title, values, onChange, prefix }) => {
  const { t } = useTranslation();
  return (
    <fieldset className="border border-gray-300 dark:border-cyan-500/30 p-4 rounded-lg">
      <legend className="text-lg font-bold text-cyan-700 dark:text-cyan-400 px-2">{title}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <InputField id={`${prefix}-rate14`} label={t('vat.form.rate14')} type="number" value={values.rate14 || ''} onChange={e => onChange('rate14', parseFloat(e.target.value) || 0)} placeholder="0" />
        <InputField id={`${prefix}-rate10`} label={t('vat.form.rate10')} type="number" value={values.rate10 || ''} onChange={e => onChange('rate10', parseFloat(e.target.value) || 0)} placeholder="0" />
        <InputField id={`${prefix}-rate5`} label={t('vat.form.rate5')} type="number" value={values.rate5 || ''} onChange={e => onChange('rate5', parseFloat(e.target.value) || 0)} placeholder="0" />
        <InputField id={`${prefix}-exempt`} label={t('vat.form.exempt')} type="number" value={values.exempt || ''} onChange={e => onChange('exempt', parseFloat(e.target.value) || 0)} placeholder="0" />
        <InputField id={`${prefix}-creditNote`} label={t('vat.form.creditNote')} type="number" value={values.creditNote || ''} onChange={e => onChange('creditNote', parseFloat(e.target.value) || 0)} placeholder="0" />
        <InputField id={`${prefix}-debitNote`} label={t('vat.form.debitNote')} type="number" value={values.debitNote || ''} onChange={e => onChange('debitNote', parseFloat(e.target.value) || 0)} placeholder="0" />
      </div>
    </fieldset>
  );
}


const VATTaxCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [previousCredit, setPreviousCredit] = useState('');
  const [sales, setSales] = useState<VatBreakdown>(initialBreakdown);
  const [purchases, setPurchases] = useState<VatBreakdown>(initialBreakdown);

  const [report, setReport] = useState<ReportData | null>(null);
  const [viewState, setViewState] = useState<ViewState>('form');
  const [error, setError] = useState<string | null>(null);

  const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);

  const monthOptions = useMemo(() => MONTHS_KEYS.map(key => ({
    value: key,
    label: t(`month.${key}` as TranslationKey),
  })), [t]);
  
  const handleSalesChange = (field: keyof VatBreakdown, value: number) => {
    setSales(prev => ({ ...prev, [field]: value }));
  };
  
  const handlePurchasesChange = (field: keyof VatBreakdown, value: number) => {
    setPurchases(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setViewState('loading');
    setError(null);
    setReport(null);

    const params: VATTaxParams = {
      year,
      month,
      previousCredit: parseFloat(previousCredit) || 0,
      sales,
      purchases,
    };

    try {
      const data = await getVATTaxReport(params);
      setReport(data);
      setViewState('report');

      const newRecord: CalculationRecord = {
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'vat',
        params,
        report: data,
      };
      setHistory(prevHistory => [newRecord, ...prevHistory]);

    } catch (err) {
      const errorMessage = (err instanceof Error && t(err.message as any)) ? t(err.message as any) : t('error.unexpected');
      setError(errorMessage);
      setViewState('error');
    }
  }, [year, month, previousCredit, sales, purchases, setHistory, t]);
  
  const resetForm = () => {
    setYear(new Date().getFullYear());
    setMonth(new Date().getMonth() + 1);
    setPreviousCredit('');
    setSales(initialBreakdown);
    setPurchases(initialBreakdown);
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
          <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('vat.title')}</h2>
          
          <fieldset className="border border-gray-300 dark:border-cyan-500/30 p-4 rounded-lg mb-6">
            <legend className="text-lg font-bold text-cyan-700 dark:text-cyan-400 px-2">{t('vat.form.period.legend')}</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField id="month" label={t('vat.form.period.month')} value={month} onChange={e => setMonth(parseInt(e.target.value))} options={monthOptions} />
              <SelectField id="year" label={t('vat.form.period.year')} value={year} onChange={e => setYear(parseInt(e.target.value))} options={TAX_YEARS.map(y => ({ value: y, label: y.toString() }))} />
            </div>
          </fieldset>

          <div className="space-y-6">
            <VatSection title={t('vat.form.sales.legend')} values={sales} onChange={handleSalesChange} prefix="sales" />
            <VatSection title={t('vat.form.purchases.legend')} values={purchases} onChange={handlePurchasesChange} prefix="purchases" />
          </div>

          <div className="mt-6">
            <InputField 
                id="previousCredit"
                label={t('vat.form.previousCredit.label')}
                type="number"
                value={previousCredit}
                onChange={(e) => setPreviousCredit(e.target.value)}
                placeholder={t('vat.form.previousCredit.placeholder')}
            />
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

export default VATTaxCalculator;