import React, { useState, useMemo } from 'react';
import type { SavingsGoalParams } from '../types';
import InputField from '../components/InputField';
import { useTranslation } from '../i18n/context';

type Result = {
    years: number;
    months: number;
    totalContributions: number;
    totalInterest: number;
}

const ResultCard: React.FC<{ title: string; value: string; colorClass?: string }> = ({ title, value, colorClass = 'border-cyan-500' }) => (
  <div className={`p-4 rounded-lg bg-gray-200 dark:bg-gray-900/50 border-l-4 ${colorClass}`}>
    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    <p className="text-xl font-bold text-gray-800 dark:text-white">{value}</p>
  </div>
);


const SavingsGoalCalculator: React.FC = () => {
    const { t, language } = useTranslation();
    const [params, setParams] = useState<SavingsGoalParams>({
        goalName: '',
        targetAmount: 0,
        initialDeposit: 0,
        monthlyContribution: 0,
        annualRate: 0
    });
    const [result, setResult] = useState<Result | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (field: keyof SavingsGoalParams, value: string) => {
        if(field === 'goalName') {
            setParams(prev => ({ ...prev, [field]: value }));
        } else {
            setParams(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
        }
    };
    
    const formatCurrency = (value: number) => {
        const locale = language === 'ar' ? 'ar-EG' : 'en-US';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' }).format(value);
    };

    const handleCalculate = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (params.targetAmount <= params.initialDeposit) {
            setResult({ years: 0, months: 0, totalContributions: params.initialDeposit, totalInterest: 0 });
            return;
        }

        if (params.monthlyContribution <= 0 && params.annualRate <= 0) {
            setError(t('savingsGoal.error.message'));
            setResult(null);
            return;
        }

        let currentBalance = params.initialDeposit;
        let totalMonths = 0;
        const monthlyRate = params.annualRate / 100 / 12;

        // Limit to 100 years to prevent infinite loops
        while (currentBalance < params.targetAmount && totalMonths < 1200) {
            currentBalance += params.monthlyContribution;
            currentBalance += currentBalance * monthlyRate;
            totalMonths++;
        }
        
        if (currentBalance < params.targetAmount) {
             setError(t('savingsGoal.error.message'));
             setResult(null);
             return;
        }

        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        const totalContributions = params.initialDeposit + (params.monthlyContribution * totalMonths);
        const totalInterest = currentBalance - totalContributions;

        setResult({
            years,
            months,
            totalContributions,
            totalInterest: totalInterest
        });
    };
    
    const resetForm = () => {
        setParams({ goalName: '', targetAmount: 0, initialDeposit: 0, monthlyContribution: 0, annualRate: 0 });
        setResult(null);
        setError(null);
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <form onSubmit={handleCalculate}>
                    <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('savingsGoal.title')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <InputField id="goalName" label={t('savingsGoal.form.goalName.label')} type="text" value={params.goalName} onChange={e => handleInputChange('goalName', e.target.value)} placeholder={t('savingsGoal.form.goalName.placeholder')} required />
                        </div>
                        <InputField id="targetAmount" label={t('savingsGoal.form.targetAmount.label')} type="number" value={params.targetAmount || ''} onChange={e => handleInputChange('targetAmount', e.target.value)} placeholder={t('savingsGoal.form.targetAmount.placeholder')} required />
                        <InputField id="initialDeposit" label={t('savingsGoal.form.initialDeposit.label')} type="number" value={params.initialDeposit || ''} onChange={e => handleInputChange('initialDeposit', e.target.value)} placeholder={t('savingsGoal.form.initialDeposit.placeholder')} />
                        <InputField id="monthlyContribution" label={t('savingsGoal.form.monthlyContribution.label')} type="number" value={params.monthlyContribution || ''} onChange={e => handleInputChange('monthlyContribution', e.target.value)} placeholder={t('savingsGoal.form.monthlyContribution.placeholder')} />
                        <InputField id="annualRate" label={t('savingsGoal.form.annualRate.label')} type="number" step="0.1" value={params.annualRate || ''} onChange={e => handleInputChange('annualRate', e.target.value)} placeholder={t('savingsGoal.form.annualRate.placeholder')} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                        <button type="button" onClick={resetForm} className="w-full bg-gray-500 dark:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 transition-all duration-300">
                            {t('calculator.clear')}
                        </button>
                        <button type="submit" className="w-full bg-cyan-600 dark:bg-cyan-500 text-white dark:text-black font-bold py-3 px-6 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-400 transition-all duration-300">
                            {t('calculator.calculate')}
                        </button>
                    </div>
                </form>
            </div>
            
            {error && (
                 <div className="mt-8 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 p-4 rounded-lg text-center animate-fade-in">
                    <p className="font-bold mb-2">{t('savingsGoal.error.title')}</p>
                    <p>{error}</p>
                </div>
            )}

            {result && (
                <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in">
                    <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('savingsGoal.results.title')}: {params.goalName}</h3>
                    <div className="text-center p-6 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                        <p className="text-lg text-gray-600 dark:text-gray-400">{t('savingsGoal.results.timeframe')}</p>
                        <p className="text-4xl font-bold text-fuchsia-600 dark:text-fuchsia-400 my-2">
                           {result.years > 0 && `${result.years} ${t('savingsGoal.results.years')}`}
                           {result.years > 0 && result.months > 0 && ` ${t('savingsGoal.results.and')} `}
                           {result.months > 0 && `${result.months} ${t('savingsGoal.results.months')}`}
                           {result.years === 0 && result.months === 0 && `🎉 ${t('common.comingSoon')}`}
                        </p>
                    </div>
                    <div className="mt-6">
                        <h4 className="text-xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-3 text-center">{t('savingsGoal.results.summary')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <ResultCard title={t('savingsGoal.results.targetAmount')} value={formatCurrency(params.targetAmount)} colorClass="border-green-500"/>
                            <ResultCard title={t('savingsGoal.results.totalContributions')} value={formatCurrency(result.totalContributions)} colorClass="border-blue-500"/>
                            <ResultCard title={t('savingsGoal.results.totalInterest')} value={formatCurrency(result.totalInterest)} colorClass="border-yellow-500"/>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SavingsGoalCalculator;