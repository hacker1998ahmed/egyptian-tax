import React, { useState, useMemo } from 'react';
import type { FuelCostParams, CalculationRecord, ReportData } from '../types';
import InputField from '../components/InputField';
import { useTranslation } from '../i18n/context';
import useLocalStorage from '../hooks/useLocalStorage';

const ResultCard: React.FC<{ title: string; value: string; colorClass?: string }> = ({ title, value, colorClass = 'border-cyan-500' }) => (
  <div className={`p-4 rounded-lg bg-gray-200 dark:bg-gray-900/50 border-l-4 ${colorClass}`}>
    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
  </div>
);

const FuelCostCalculator: React.FC = () => {
    const { t, language } = useTranslation();
    const [params, setParams] = useState<FuelCostParams>({
        distance: 0,
        efficiency: 0,
        pricePerLiter: 0,
    });
    const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);
    const [isSaved, setIsSaved] = useState(false);

    const handleInputChange = (field: keyof FuelCostParams, value: string) => {
        setIsSaved(false);
        setParams(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const formatCurrency = (value: number) => {
        const locale = language === 'ar' ? 'ar-EG' : 'en-US';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' }).format(value);
    };

    const results = useMemo(() => {
        if (params.distance <= 0 || params.efficiency <= 0 || params.pricePerLiter <= 0) return null;
        const fuelNeeded = params.distance / params.efficiency;
        const totalCost = fuelNeeded * params.pricePerLiter;
        return { fuelNeeded, totalCost };
    }, [params]);

    const handleSave = () => {
        if (!results) return;
        const report: ReportData = {
            summary: `Calculation for a trip of ${params.distance} km with a fuel efficiency of ${params.efficiency} km/L.`,
            calculations: [
                { description: t('fuelCost.results.fuelNeeded'), amount: `${results.fuelNeeded.toFixed(2)} L` },
                { description: t('fuelCost.results.totalCost'), amount: formatCurrency(results.totalCost) },
            ],
            grossIncome: params.distance,
            totalTax: results.totalCost,
            totalInsurance: 0,
            netIncome: results.fuelNeeded,
            applicableLaws: ["Basic fuel consumption formula."]
        };
        const newRecord: CalculationRecord = {
            id: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            type: 'fuelCost',
            params,
            report,
        };
        setHistory(prev => [newRecord, ...prev]);
        setIsSaved(true);
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <form onSubmit={(e) => e.preventDefault()}>
                    <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('fuelCost.title')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InputField id="distance" label={t('fuelCost.form.distance.label')} type="number" value={params.distance || ''} onChange={e => handleInputChange('distance', e.target.value)} required />
                        <InputField id="efficiency" label={t('fuelCost.form.efficiency.label')} type="number" value={params.efficiency || ''} onChange={e => handleInputChange('efficiency', e.target.value)} required />
                        <InputField id="pricePerLiter" label={t('fuelCost.form.price.label')} type="number" step="0.01" value={params.pricePerLiter || ''} onChange={e => handleInputChange('pricePerLiter', e.target.value)} required />
                    </div>
                </form>
            </div>

            {results && (
                 <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in">
                    <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('fuelCost.results.title')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ResultCard title={t('fuelCost.results.fuelNeeded')} value={`${results.fuelNeeded.toFixed(2)} L`} colorClass="border-yellow-500"/>
                        <ResultCard title={t('fuelCost.results.totalCost')} value={formatCurrency(results.totalCost)} colorClass="border-green-500"/>
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

export default FuelCostCalculator;