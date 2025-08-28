import React, { useState, useMemo } from 'react';
import InputField from '../components/InputField';
import { useTranslation } from '../i18n/context';
import useLocalStorage from '../hooks/useLocalStorage';
import type { CalculationRecord, DiscountParams, ReportData } from '../types';

const DiscountCalculator: React.FC = () => {
    const { t, language } = useTranslation();
    const [price, setPrice] = useState('');
    const [discount, setDiscount] = useState('');
    const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);
    const [isSaved, setIsSaved] = useState(false);

    const formatCurrency = (value: number) => {
        const locale = language === 'ar' ? 'ar-EG' : 'en-US';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' }).format(value);
    };

    const results = useMemo(() => {
        setIsSaved(false);
        const priceNum = parseFloat(price);
        const discountNum = parseFloat(discount);
        if (isNaN(priceNum) || isNaN(discountNum)) return null;

        const savedAmount = priceNum * (discountNum / 100);
        const finalPrice = priceNum - savedAmount;

        return {
            finalPrice,
            youSave: savedAmount
        };
    }, [price, discount]);

    const handleSave = () => {
        if (!results) return;
        const params: DiscountParams = {
            originalPrice: parseFloat(price),
            discount: parseFloat(discount),
        };
        const report: ReportData = {
            summary: `${params.discount}% discount on an item priced at ${formatCurrency(params.originalPrice)}.`,
            calculations: [
                { description: t('discount.results.youSave'), amount: formatCurrency(results.youSave) },
                { description: t('discount.results.finalPrice'), amount: formatCurrency(results.finalPrice) },
            ],
            grossIncome: params.originalPrice,
            netIncome: results.finalPrice,
            totalTax: results.youSave,
            totalInsurance: 0,
            applicableLaws: ["Standard percentage calculation."]
        };
        const newRecord: CalculationRecord = {
            id: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            type: 'discount',
            params,
            report,
        };
        setHistory(prev => [newRecord, ...prev]);
        setIsSaved(true);
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('discount.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="originalPrice" label={t('discount.form.originalPrice')} type="number" value={price} onChange={e => setPrice(e.target.value)} />
                    <InputField id="discount" label={t('discount.form.discount')} type="number" value={discount} onChange={e => setDiscount(e.target.value)} />
                </div>
            </div>

            {results && (
                <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in">
                    <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('discount.results.title')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-gray-200 dark:bg-gray-900/50 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('discount.results.finalPrice')}</p>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(results.finalPrice)}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-gray-200 dark:bg-gray-900/50 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('discount.results.youSave')}</p>
                            <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{formatCurrency(results.youSave)}</p>
                        </div>
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

export default DiscountCalculator;