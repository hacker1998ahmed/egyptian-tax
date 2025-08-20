import React, { useState, useCallback } from 'react';
import { getInheritanceReport } from '../services/geminiService';
import type { ReportData, CalculationRecord, InheritanceParams } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import Loader from '../components/Loader';
import ReportDisplay from '../components/ReportDisplay';
import Welcome from '../components/Welcome';
import { useTranslation } from '../i18n/context';

type ViewState = 'form' | 'loading' | 'error' | 'report';

const initialParams: InheritanceParams = {
  estateValue: 0,
  hasSpouse: 'no',
  sons: 0,
  daughters: 0,
  father: false,
  mother: false,
  paternalGrandfather: false,
  maternalGrandmother: false,
  paternalGrandmother: false,
  fullBrothers: 0,
  fullSisters: 0,
  paternalBrothers: 0,
  paternalSisters: 0,
  maternalSiblings: 0,
};

const HeirInput: React.FC<{label: string, value: number, onChange: (val: number) => void}> = ({label, value, onChange}) => (
    <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-900/50 p-2 rounded-md">
        <label className="text-sm text-cyan-800 dark:text-cyan-300">{label}</label>
        <input 
            type="number" 
            min="0"
            value={value}
            onChange={e => onChange(parseInt(e.target.value) || 0)}
            className="w-20 bg-white dark:bg-gray-800 rounded-md p-1 text-center font-mono"
        />
    </div>
);

const HeirToggle: React.FC<{label: string, checked: boolean, onChange: (val: boolean) => void}> = ({label, checked, onChange}) => (
     <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-900/50 p-2 rounded-md">
        <label className="text-sm text-cyan-800 dark:text-cyan-300">{label}</label>
        <input 
            type="checkbox" 
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            className="w-6 h-6 rounded-md accent-cyan-500"
        />
    </div>
)


const InheritanceCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [params, setParams] = useState<InheritanceParams>(initialParams);
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [viewState, setViewState] = useState<ViewState>('form');
  const [error, setError] = useState<string | null>(null);

  const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);

  const handleParamChange = (field: keyof InheritanceParams, value: string | number | boolean) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (params.estateValue <= 0) {
      setError(t('error.unexpected')); // Add specific error key
      setViewState('error');
      return;
    }

    setViewState('loading');
    setError(null);
    setReport(null);

    try {
      const data = await getInheritanceReport(params);
      setReport(data);
      setViewState('report');

      const newRecord: CalculationRecord = {
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'inheritance',
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
    setParams(initialParams);
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
          <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('inheritance.title')}</h2>
          
          <div className="mb-6">
            <InputField
              id="estateValue"
              label={t('inheritance.form.estateValue.label')}
              type="number"
              value={params.estateValue || ''}
              onChange={(e) => handleParamChange('estateValue', parseFloat(e.target.value) || 0)}
              placeholder={t('inheritance.form.estateValue.placeholder')}
              required
            />
          </div>

          <fieldset className="border border-gray-300 dark:border-cyan-500/30 p-4 rounded-lg space-y-4">
            <legend className="text-lg font-bold text-cyan-700 dark:text-cyan-400 px-2">{t('inheritance.form.heirs.legend')}</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <SelectField 
                    id="spouse"
                    label={t('inheritance.form.spouse.label')}
                    value={params.hasSpouse}
                    onChange={e => handleParamChange('hasSpouse', e.target.value)}
                    options={[
                        {value: 'no', label: t('inheritance.form.spouse.no')},
                        {value: 'husband', label: t('inheritance.form.spouse.husband')},
                        {value: 'wife', label: t('inheritance.form.spouse.wife')}
                    ]}
                />
                <HeirInput label={t('inheritance.form.sons.label')} value={params.sons} onChange={v => handleParamChange('sons', v)} />
                <HeirInput label={t('inheritance.form.daughters.label')} value={params.daughters} onChange={v => handleParamChange('daughters', v)} />
                <HeirToggle label={t('inheritance.form.father.label')} checked={params.father} onChange={v => handleParamChange('father', v)} />
                <HeirToggle label={t('inheritance.form.mother.label')} checked={params.mother} onChange={v => handleParamChange('mother', v)} />
                <HeirToggle label={t('inheritance.form.paternalGrandfather.label')} checked={params.paternalGrandfather} onChange={v => handleParamChange('paternalGrandfather', v)} />
                <HeirToggle label={t('inheritance.form.maternalGrandmother.label')} checked={params.maternalGrandmother} onChange={v => handleParamChange('maternalGrandmother', v)} />
                <HeirToggle label={t('inheritance.form.paternalGrandmother.label')} checked={params.paternalGrandmother} onChange={v => handleParamChange('paternalGrandmother', v)} />
                <HeirInput label={t('inheritance.form.fullBrothers.label')} value={params.fullBrothers} onChange={v => handleParamChange('fullBrothers', v)} />
                <HeirInput label={t('inheritance.form.fullSisters.label')} value={params.fullSisters} onChange={v => handleParamChange('fullSisters', v)} />
                <HeirInput label={t('inheritance.form.paternalBrothers.label')} value={params.paternalBrothers} onChange={v => handleParamChange('paternalBrothers', v)} />
                <HeirInput label={t('inheritance.form.paternalSisters.label')} value={params.paternalSisters} onChange={v => handleParamChange('paternalSisters', v)} />
                <HeirInput label={t('inheritance.form.maternalSiblings.label')} value={params.maternalSiblings} onChange={v => handleParamChange('maternalSiblings', v)} />
            </div>
          </fieldset>
          
           <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            {t('inheritance.form.note')}
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

export default InheritanceCalculator;