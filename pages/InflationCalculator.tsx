import React, { useState, useMemo } from 'react';
import InputField from '../components/InputField';
import { useTranslation } from '../i18n/context';
import useLocalStorage from '../hooks/useLocalStorage';
import type { CalculationRecord, InflationParams, ReportData } from '../types';

const ResultCard: React.FC<{ title: string; value: string; colorClass?: string }> = ({ title, value, colorClass = 'border-cyan-500' }) => (
    <div className={`p-4 rounded-lg bg-gray-200 dark:bg-gray-900/50 border-l-4 ${colorClass}`}>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
    </div>
);

const InflationCalculator: React.FC = () => {
    const { t, language } = useTranslation();
    const [amount, setAmount] = useState('1000');
    const [rate, setRate] = useState('7');
    const [years, setYears] = useState('10');
    const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);
    const [isSaved, setIsSaved] = useState(false);

    const formatCurrency = (value: number) => {
        const locale = language === 'ar' ? 'ar-EG' : 'en-US';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' }).format(value);
    };

    const results = useMemo(() => {
        setIsSaved(false);
        const amountNum = parseFloat(amount);
        const rateNum = parseFloat(rate) / 100;
        const yearsNum = parseInt(years);

        if (isNaN(amountNum) || isNaN(rateNum) || isNaN(yearsNum) || yearsNum <= 0) return null;

        const futureValue = amountNum * Math.pow(1 + rateNum, yearsNum);
        const purchasingPower = amountNum / Math.pow(1 + rateNum, yearsNum);
        
        return {
            futureValue,
            purchasingPower,
        };
    }, [amount, rate, years]);
    
    const handleSave = () => {
        if (!results) return;
        const params: InflationParams = {
            amount: parseFloat(amount),
            rate: parseFloat(rate),
            years: parseInt(years),
        };
        const report: ReportData = {
            summary: t('inflation.results.explanation', formatCurrency(params.amount), formatCurrency(results.futureValue), params.years, formatCurrency(results.purchasingPower)),
            calculations: [
                { description: t('inflation.results.futureValue'), amount: formatCurrency(results.futureValue) },
                { description: t('inflation.results.purchasingPower'), amount: formatCurrency(results.purchasingPower) },
            ],
            grossIncome: params.amount,
            netIncome: results.purchasingPower,
            totalTax: results.futureValue - params.amount,
            totalInsurance: 0,
            applicableLaws: ["Future value formula."]
        };
        const newRecord: CalculationRecord = {
            id: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            type: 'inflation',
            params,
            report,
        };
        setHistory(prev => [newRecord, ...prev]);
        setIsSaved(true);
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('inflation.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField id="amount" label={t('inflation.form.amount')} type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                    <InputField id="rate" label={t('inflation.form.rate')} type="number" value={rate} onChange={e => setRate(e.target.value)} />
                    <InputField id="years" label={t('inflation.form.years')} type="number" value={years} onChange={e => setYears(e.target.value)} />
                </div>
            </div>

            {results && (
                <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in">
                    <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('inflation.results.title')}</h3>
                     <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                        {t('inflation.results.explanation', formatCurrency(parseFloat(amount)), formatCurrency(results.futureValue), years, formatCurrency(results.purchasingPower))}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ResultCard title={t('inflation.results.futureValue')} value={formatCurrency(results.futureValue)} colorClass="border-red-500" />
                        <ResultCard title={t('inflation.results.purchasingPower')} value={formatCurrency(results.purchasingPower)} colorClass="border-green-500" />
                    </div>
                     <div className="text-center mt-6">
                        <button onClick={handleSave} disabled={isSaved} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isSaved ? t('common.done') : t('history.item.save')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InflationCalculator;