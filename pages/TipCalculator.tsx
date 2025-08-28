import React, { useState, useMemo } from 'react';
import type { TipParams, CalculationRecord, ReportData } from '../types';
import InputField from '../components/InputField';
import { useTranslation } from '../i18n/context';
import useLocalStorage from '../hooks/useLocalStorage';

const ResultCard: React.FC<{ title: string; value: string; colorClass?: string }> = ({ title, value, colorClass = 'border-cyan-500' }) => (
  <div className={`p-4 rounded-lg bg-gray-200 dark:bg-gray-900/50 border-l-4 ${colorClass}`}>
    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
  </div>
);

const TipCalculator: React.FC = () => {
    const { t, language } = useTranslation();
    const [params, setParams] = useState<TipParams>({
        billAmount: 0,
        tipPercentage: 15,
        numberOfPeople: 1
    });
    const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);
    const [isSaved, setIsSaved] = useState(false);

    const handleInputChange = (field: keyof TipParams, value: string) => {
        setIsSaved(false);
        setParams(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const formatCurrency = (value: number) => {
        const locale = language === 'ar' ? 'ar-EG' : 'en-US';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' }).format(value);
    };

    const results = useMemo(() => {
        if (params.billAmount <= 0) return null;
        const tipAmount = params.billAmount * (params.tipPercentage / 100);
        const totalBill = params.billAmount + tipAmount;
        const perPerson = params.numberOfPeople > 0 ? totalBill / params.numberOfPeople : 0;
        return { tipAmount, totalBill, perPerson };
    }, [params]);

    const handleSave = () => {
        if (!results) return;
        const report: ReportData = {
            summary: `Tip calculation for a bill of ${formatCurrency(params.billAmount)} split among ${params.numberOfPeople} people.`,
            calculations: [
                { description: t('tip.results.tipAmount'), amount: formatCurrency(results.tipAmount) },
                { description: t('tip.results.totalBill'), amount: formatCurrency(results.totalBill) },
                { description: t('tip.results.perPerson'), amount: formatCurrency(results.perPerson) },
            ],
            grossIncome: params.billAmount,
            totalTax: results.tipAmount,
            totalInsurance: 0,
            netIncome: results.totalBill,
            applicableLaws: ["Standard tipping calculation."]
        };
        const newRecord: CalculationRecord = {
            id: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            type: 'tip',
            params,
            report,
        };
        setHistory(prev => [newRecord, ...prev]);
        setIsSaved(true);
    };

    const tipOptions = [10, 12, 15, 18, 20];

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <form onSubmit={(e) => e.preventDefault()}>
                    <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('tip.title')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                             <InputField id="billAmount" label={t('tip.form.bill.label')} type="number" value={params.billAmount || ''} onChange={e => handleInputChange('billAmount', e.target.value)} required />
                        </div>
                        <div>
                             <label className="block mb-2 text-sm font-medium text-cyan-700 dark:text-cyan-300">{t('tip.form.percentage.label')}: {params.tipPercentage}%</label>
                             <div className="flex gap-2 mb-2">
                                {tipOptions.map(tip => (
                                    <button key={tip} type="button" onClick={() => { setIsSaved(false); setParams(p => ({...p, tipPercentage: tip})); }} className={`flex-1 py-2 rounded-md font-semibold transition-colors ${params.tipPercentage === tip ? 'bg-cyan-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'}`}>{tip}%</button>
                                ))}
                             </div>
                             <input type="range" min="0" max="50" step="1" value={params.tipPercentage} onChange={e => handleInputChange('tipPercentage', e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-cyan-500" />
                        </div>
                        <InputField id="numberOfPeople" label={t('tip.form.people.label')} type="number" min="1" step="1" value={params.numberOfPeople || ''} onChange={e => handleInputChange('numberOfPeople', e.target.value)} required />
                    </div>
                </form>
            </div>

            {results && (
                 <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in">
                    <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('tip.results.title')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ResultCard title={t('tip.results.tipAmount')} value={formatCurrency(results.tipAmount)} colorClass="border-yellow-500"/>
                        <ResultCard title={t('tip.results.totalBill')} value={formatCurrency(results.totalBill)} colorClass="border-blue-500"/>
                        <ResultCard title={t('tip.results.perPerson')} value={formatCurrency(results.perPerson)} colorClass="border-green-500"/>
                    </div>
                    <div className="text-center mt-6">
                        <button onClick={handleSave} disabled={isSaved} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isSaved ? t('common.done') : t('history.item.save' as any)}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TipCalculator;