import React, { useState, useMemo } from 'react';
import type { CalculationRecord, ProfitMarginParams, ReportData } from '../types';
import InputField from '../components/InputField';
import useLocalStorage from '../hooks/useLocalStorage';
import { useTranslation } from '../i18n/context';

type Result = {
    grossProfit: number;
    grossMargin: number;
    netProfit: number;
    netMargin: number;
}

const ResultCard: React.FC<{ title: string; value: string; colorClass?: string }> = ({ title, value, colorClass = 'border-cyan-500' }) => (
  <div className={`p-4 rounded-lg bg-gray-200 dark:bg-gray-900/50 border-l-4 ${colorClass}`}>
    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    <p className="text-xl font-bold text-gray-800 dark:text-white">{value}</p>
  </div>
);

const ProfitMarginCalculator: React.FC = () => {
    const { t, language } = useTranslation();
    const [params, setParams] = useState<ProfitMarginParams>({
        revenue: 0,
        cogs: 0,
        operatingExpenses: 0
    });
    const [result, setResult] = useState<Result | null>(null);
    const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);

    const handleInputChange = (field: keyof ProfitMarginParams, value: string) => {
        setParams(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const formatCurrency = (value: number) => {
        const locale = language === 'ar' ? 'ar-EG' : 'en-US';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }).format(value);
    };

    const handleCalculate = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (params.revenue <= 0) {
            setResult(null);
            return;
        }

        const grossProfit = params.revenue - params.cogs;
        const grossMargin = (grossProfit / params.revenue) * 100;
        const netProfit = grossProfit - params.operatingExpenses;
        const netMargin = (netProfit / params.revenue) * 100;

        const newResult = { grossProfit, grossMargin, netProfit, netMargin };
        setResult(newResult);

        // Save to history
        const report: ReportData = {
            summary: `For a revenue of ${formatCurrency(params.revenue)}, the net profit is ${formatCurrency(netProfit)}, resulting in a net profit margin of ${netMargin.toFixed(2)}%.`,
            calculations: [
                { description: t('profitMargin.results.grossProfit'), amount: formatCurrency(grossProfit) },
                { description: t('profitMargin.results.netProfit'), amount: formatCurrency(netProfit) },
            ],
            grossIncome: params.revenue,
            totalTax: params.cogs + params.operatingExpenses, // Using this field to store total costs
            totalInsurance: 0,
            netIncome: netProfit,
            applicableLaws: ["Standard business profitability formulas."]
        };
        const newRecord: CalculationRecord = {
            id: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            type: 'profitMargin',
            params,
            report,
        };
        setHistory(prev => [newRecord, ...prev]);
    };

    const resetForm = () => {
        setParams({ revenue: 0, cogs: 0, operatingExpenses: 0 });
        setResult(null);
    }
    
    const breakdownPercentages = useMemo(() => {
        if (!result || params.revenue <= 0) return { cogs: 0, expenses: 0, profit: 0 };
        const cogsPercent = (params.cogs / params.revenue) * 100;
        const expensesPercent = (params.operatingExpenses / params.revenue) * 100;
        const profitPercent = Math.max(0, 100 - cogsPercent - expensesPercent);
        return { cogs: cogsPercent, expenses: expensesPercent, profit: profitPercent };
    }, [result, params]);


    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <form onSubmit={handleCalculate}>
                    <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('profitMargin.title')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InputField id="revenue" label={t('profitMargin.form.revenue.label')} type="number" value={params.revenue || ''} onChange={e => handleInputChange('revenue', e.target.value)} required />
                        <InputField id="cogs" label={t('profitMargin.form.cogs.label')} type="number" value={params.cogs || ''} onChange={e => handleInputChange('cogs', e.target.value)} />
                        <InputField id="operatingExpenses" label={t('profitMargin.form.expenses.label')} type="number" value={params.operatingExpenses || ''} onChange={e => handleInputChange('operatingExpenses', e.target.value)} />
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

            {result && (
                <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in space-y-6">
                    <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 text-center">{t('profitMargin.results.title')}</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ResultCard title={t('profitMargin.results.grossProfit')} value={formatCurrency(result.grossProfit)} colorClass="border-blue-500"/>
                        <ResultCard title={t('profitMargin.results.grossMargin')} value={`${result.grossMargin.toFixed(2)}%`} colorClass="border-blue-500"/>
                        <ResultCard title={t('profitMargin.results.netProfit')} value={formatCurrency(result.netProfit)} colorClass={result.netProfit >= 0 ? 'border-green-500' : 'border-red-500'}/>
                        <ResultCard title={t('profitMargin.results.netMargin')} value={`${result.netMargin.toFixed(2)}%`} colorClass={result.netMargin >= 0 ? 'border-green-500' : 'border-red-500'}/>
                    </div>

                    <div>
                        <h4 className="text-lg font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-2 text-center">{t('profitMargin.results.breakdown')}</h4>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 flex overflow-hidden">
                            <div className="bg-red-500 h-full flex items-center justify-center text-white text-xs font-bold" style={{ width: `${breakdownPercentages.cogs}%` }} title={`${t('profitMargin.results.cogs')}: ${breakdownPercentages.cogs.toFixed(1)}%`}>{breakdownPercentages.cogs > 10 && `${breakdownPercentages.cogs.toFixed(0)}%`}</div>
                            <div className="bg-yellow-500 h-full flex items-center justify-center text-black text-xs font-bold" style={{ width: `${breakdownPercentages.expenses}%` }} title={`${t('profitMargin.results.expenses')}: ${breakdownPercentages.expenses.toFixed(1)}%`}>{breakdownPercentages.expenses > 10 && `${breakdownPercentages.expenses.toFixed(0)}%`}</div>
                            <div className="bg-green-500 h-full flex items-center justify-center text-white text-xs font-bold" style={{ width: `${breakdownPercentages.profit}%` }} title={`${t('profitMargin.results.profit')}: ${breakdownPercentages.profit.toFixed(1)}%`}>{breakdownPercentages.profit > 10 && `${breakdownPercentages.profit.toFixed(0)}%`}</div>
                        </div>
                        <div className="flex justify-around mt-2 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-full me-2"></span>{t('profitMargin.results.cogs')}</div>
                            <div className="flex items-center"><span className="w-3 h-3 bg-yellow-500 rounded-full me-2"></span>{t('profitMargin.results.expenses')}</div>
                            <div className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full me-2"></span>{t('profitMargin.results.profit')}</div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default ProfitMarginCalculator;