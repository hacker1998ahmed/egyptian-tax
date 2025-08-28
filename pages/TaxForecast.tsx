import React, { useState, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { useTranslation } from '../i18n/context';
import type { Invoice, PayrollRun, FixedAsset } from '../types';
import { getTaxForecastInsight } from '../services/geminiService';
import Loader from '../components/Loader';

type ViewState = 'idle' | 'loading' | 'results' | 'error';

type ForecastResult = {
    ytdRevenue: number;
    ytdPayroll: number;
    ytdDepreciation: number;
    ytdProfit: number;
    projectedRevenue: number;
    projectedProfit: number;
    estimatedTax: number;
};

const ResultCard: React.FC<{ title: string, value: string, colorClass?: string, isLarge?: boolean }> = ({ title, value, colorClass = 'text-cyan-700 dark:text-cyan-400', isLarge = false }) => (
    <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg text-center">
        <p className={`text-sm ${isLarge ? 'md:text-base' : ''} text-gray-500 dark:text-gray-400`}>{title}</p>
        <p className={`font-bold ${isLarge ? 'text-3xl md:text-4xl' : 'text-2xl'} ${colorClass}`}>{value}</p>
    </div>
);

const TaxForecast: React.FC = () => {
    const { t, language } = useTranslation();
    const [invoices] = useLocalStorage<Invoice[]>('invoices', []);
    const [payrolls] = useLocalStorage<PayrollRun[]>('payrollHistory', []);
    const [assets] = useLocalStorage<FixedAsset[]>('fixedAssets', []);

    const [viewState, setViewState] = useState<ViewState>('idle');
    const [results, setResults] = useState<ForecastResult | null>(null);
    const [aiInsight, setAiInsight] = useState('');
    const [isInsightLoading, setIsInsightLoading] = useState(false);
    const [error, setError] = useState('');

    const formatCurrency = (amount: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(amount);

    const handleForecast = useCallback(async () => {
        setViewState('loading');
        setError('');
        
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const monthsPassed = now.getMonth() + 1;

        const ytdInvoices = invoices.filter(i => new Date(i.issueDate) >= startOfYear && i.status === 'paid');
        const ytdPayrolls = payrolls.filter(p => new Date(p.timestamp) >= startOfYear);
        
        const ytdRevenue = ytdInvoices.reduce((sum, i) => sum + i.items.reduce((itemSum, item) => itemSum + item.quantity * item.unitPrice, 0) * (1 + i.taxRate), 0);
        const ytdPayroll = ytdPayrolls.reduce((sum, p) => sum + p.summary.totalGross, 0);
        
        const ytdDepreciation = assets.reduce((sum, asset) => {
            const purchaseYear = new Date(asset.purchaseDate).getFullYear();
            if (purchaseYear > now.getFullYear()) return sum;
            
            let annualDepreciation = 0;
            if (asset.depreciationMethod === 'straight-line') {
                annualDepreciation = (asset.cost - asset.salvageValue) / asset.usefulLife;
            } else { // Simplified double-declining for this context
                annualDepreciation = (asset.cost * 2) / asset.usefulLife;
            }
            return sum + annualDepreciation;
        }, 0);
        
        const ytdProfit = ytdRevenue - ytdPayroll - ytdDepreciation;

        if (ytdRevenue === 0 && ytdPayroll === 0) {
            setViewState('error');
            setError(t('taxForecast.summary.noData'));
            return;
        }

        const projectedRevenue = (ytdRevenue / monthsPassed) * 12;
        const projectedPayroll = (ytdPayroll / monthsPassed) * 12;
        const projectedProfit = projectedRevenue - projectedPayroll - ytdDepreciation;
        
        // Simplified tax calculation (e.g., standard corporate rate)
        const estimatedTax = Math.max(0, projectedProfit * 0.225);

        const newResults = { ytdRevenue, ytdPayroll, ytdDepreciation, ytdProfit, projectedRevenue, projectedProfit, estimatedTax };
        setResults(newResults);
        setViewState('results');
        
        // Fetch AI insight
        setIsInsightLoading(true);
        try {
            const summary = `${t('taxForecast.results.estimatedTax')}: ${formatCurrency(estimatedTax)}`;
            const insight = await getTaxForecastInsight(summary);
            setAiInsight(insight);
        } catch(e) {
            console.error(e);
        } finally {
            setIsInsightLoading(false);
        }

    }, [invoices, payrolls, assets, t, language]);


    return (
        <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-cyan-700 dark:text-cyan-400">{t('taxForecast.title')}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl mx-auto">{t('taxForecast.description')}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl text-center">
                {viewState === 'loading' ? (
                    <div>
                        <Loader />
                        <p className="text-gray-500 dark:text-gray-400">{t('taxForecast.loading')}</p>
                    </div>
                ) : (
                     <button onClick={handleForecast} className="bg-cyan-600 text-white dark:text-black font-bold py-3 px-8 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/30">
                        {viewState === 'idle' ? t('taxForecast.button.forecast') : 'Re-forecast'}
                    </button>
                )}
            </div>

            {viewState === 'error' && (
                 <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 p-4 rounded-lg text-center">
                    <p className="font-bold mb-2">{t('calculator.error.title')}</p>
                    <p>{error}</p>
                </div>
            )}

            {viewState === 'results' && results && (
                <>
                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 shadow-xl">
                    <h3 className="text-xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('taxForecast.summary.title')}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <ResultCard title={t('taxForecast.summary.revenue')} value={formatCurrency(results.ytdRevenue)} />
                        <ResultCard title={t('taxForecast.summary.payroll')} value={formatCurrency(results.ytdPayroll)} />
                        <ResultCard title={t('taxForecast.summary.depreciation')} value={formatCurrency(results.ytdDepreciation)} />
                        <ResultCard title={t('taxForecast.summary.profit')} value={formatCurrency(results.ytdProfit)} colorClass={results.ytdProfit >= 0 ? 'text-green-600' : 'text-red-600'} />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 shadow-xl">
                    <h3 className="text-xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('taxForecast.results.title')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <ResultCard title={t('taxForecast.results.projectedRevenue')} value={formatCurrency(results.projectedRevenue)} />
                        <ResultCard title={t('taxForecast.results.projectedProfit')} value={formatCurrency(results.projectedProfit)} colorClass={results.projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}/>
                    </div>
                    <ResultCard 
                        title={t('taxForecast.results.estimatedTax')} 
                        value={formatCurrency(results.estimatedTax)} 
                        colorClass="text-red-600 dark:text-red-400" 
                        isLarge={true} 
                    />
                    <div className="mt-6 pt-4 border-t border-fuchsia-500/20">
                         <h4 className="text-lg font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-2 text-center">{t('taxForecast.results.aiInsight')}</h4>
                         <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg text-center min-h-[3rem] flex items-center justify-center">
                            {isInsightLoading && <p className="text-sm">{t('taxForecast.results.loadingInsight')}</p>}
                            {!isInsightLoading && aiInsight && <p className="text-gray-700 dark:text-gray-300 italic">"{aiInsight}"</p>}
                         </div>
                    </div>
                </div>
                </>
            )}
        </div>
    );
};

export default TaxForecast;