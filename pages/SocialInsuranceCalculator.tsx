import React, { useState, useCallback, useMemo } from 'react';
import { TAX_YEARS } from '../constants';
import { getSocialInsuranceReport } from '../services/offlineCalculationService';
import type { ReportData, CalculationRecord, SocialInsuranceParams, SocialInsuranceContributionParams, SocialInsurancePensionParams, SocialInsuranceLumpSumParams } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import Loader from '../components/Loader';
import ReportDisplay from '../components/ReportDisplay';
import Welcome from '../components/Welcome';
import { useTranslation } from '../i18n/context';

type ViewState = 'form' | 'loading' | 'error' | 'report';
type CalculationType = 'contribution' | 'pension' | 'lumpSum';

const SocialInsuranceCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [calculationType, setCalculationType] = useState<CalculationType>('contribution');
  
  // State for all possible forms
  const [contributionParams, setContributionParams] = useState<Omit<SocialInsuranceContributionParams, 'calculationType'>>({ basicWage: 0, variableWage: 0, year: new Date().getFullYear() });
  const [pensionParams, setPensionParams] = useState<Omit<SocialInsurancePensionParams, 'calculationType'>>({ averageWage: 0, contributionYears: 0 });
  const [lumpSumParams, setLumpSumParams] = useState<Omit<SocialInsuranceLumpSumParams, 'calculationType'>>({ averageWage: 0, contributionYears: 0 });
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [viewState, setViewState] = useState<ViewState>('form');
  const [error, setError] = useState<string | null>(null);

  const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);

  const calculationTypeOptions = useMemo(() => [
    { value: 'contribution', label: t('socialInsurance.form.type.contribution') },
    { value: 'pension', label: t('socialInsurance.form.type.pension') },
    { value: 'lumpSum', label: t('socialInsurance.form.type.lumpSum') },
  ], [t]);

  const handleCalculate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setViewState('loading');
    setError(null);
    setReport(null);

    let params: SocialInsuranceParams;
    switch (calculationType) {
        case 'pension':
            params = { calculationType, ...pensionParams };
            break;
        case 'lumpSum':
            params = { calculationType, ...lumpSumParams };
            break;
        case 'contribution':
        default:
            params = { calculationType, ...contributionParams };
            break;
    }
    
    try {
      const data = await getSocialInsuranceReport(params);
      setReport(data);
      setViewState('report');

      const newRecord: CalculationRecord = {
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'socialInsurance',
        params,
        report: data,
      };
      setHistory(prevHistory => [newRecord, ...prevHistory]);

    } catch (err) {
      const errorMessage = (err instanceof Error && t(err.message as any)) ? t(err.message as any) : t('error.unexpected');
      setError(errorMessage);
      setViewState('error');
    }
  }, [calculationType, contributionParams, pensionParams, lumpSumParams, setHistory, t]);
  
  const resetForm = () => {
    setContributionParams({ basicWage: 0, variableWage: 0, year: new Date().getFullYear() });
    setPensionParams({ averageWage: 0, contributionYears: 0 });
    setLumpSumParams({ averageWage: 0, contributionYears: 0 });
    setReport(null);
    setError(null);
    setViewState('form');
  }

  const handleBackToForm = () => {
     setViewState('form');
     setReport(null);
  }

  const renderForm = () => {
    switch(calculationType) {
        case 'pension':
        case 'lumpSum':
            const params = calculationType === 'pension' ? pensionParams : lumpSumParams;
            const setParams = calculationType === 'pension' ? setPensionParams : setLumpSumParams;
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    <InputField
                        id="averageWage"
                        label={t('socialInsurance.form.avgWage.label')}
                        type="number"
                        value={params.averageWage || ''}
                        onChange={(e) => setParams(p => ({ ...p, averageWage: parseFloat(e.target.value) || 0 }))}
                        placeholder={t('socialInsurance.form.avgWage.placeholder')}
                        required
                    />
                    <InputField
                        id="contributionYears"
                        label={t('socialInsurance.form.contributionYears.label')}
                        type="number"
                        value={params.contributionYears || ''}
                        onChange={(e) => setParams(p => ({ ...p, contributionYears: parseFloat(e.target.value) || 0 }))}
                        placeholder={t('socialInsurance.form.contributionYears.placeholder')}
                        required
                    />
                </div>
            );
        case 'contribution':
        default:
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    <InputField
                        id="basicWage"
                        label={t('socialInsurance.form.basicWage.label')}
                        type="number"
                        value={contributionParams.basicWage || ''}
                        onChange={(e) => setContributionParams(p => ({ ...p, basicWage: parseFloat(e.target.value) || 0 }))}
                        placeholder={t('socialInsurance.form.basicWage.placeholder')}
                    />
                    <InputField
                        id="variableWage"
                        label={t('socialInsurance.form.variableWage.label')}
                        type="number"
                        value={contributionParams.variableWage || ''}
                        onChange={(e) => setContributionParams(p => ({ ...p, variableWage: parseFloat(e.target.value) || 0 }))}
                        placeholder={t('socialInsurance.form.variableWage.placeholder')}
                    />
                    <div className="md:col-span-2">
                        <SelectField
                            id="year"
                            label={t('salary.form.year.label')}
                            value={contributionParams.year}
                            onChange={(e) => setContributionParams(p => ({...p, year: parseInt(e.target.value)}))}
                            options={TAX_YEARS.map(y => ({ value: y, label: y.toString() }))}
                        />
                    </div>
                </div>
            );
    }
  }

  if (viewState === 'report' && report) {
    return <ReportDisplay data={report} onBack={handleBackToForm} />;
  }
  
  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl dark:shadow-cyan-500/10 dark:backdrop-blur-sm">
        <form onSubmit={handleCalculate}>
          <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('socialInsurance.title')}</h2>
          
          <div className="mb-6">
             <SelectField
                id="calculationType"
                label={t('socialInsurance.form.type.label')}
                value={calculationType}
                onChange={(e) => setCalculationType(e.target.value as CalculationType)}
                options={calculationTypeOptions}
            />
          </div>
          
          {renderForm()}

           <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center md:col-span-2">
            {t('socialInsurance.form.note')}
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

export default SocialInsuranceCalculator;