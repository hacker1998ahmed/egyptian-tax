import React, { useState, useCallback, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { useTranslation } from '../i18n/context';
import type { Invoice, PayrollRun, FixedAsset } from '../types';
import { getTaxPlanningAdvice } from '../services/geminiService';
import Loader from '../components/Loader';

// A simple markdown-to-HTML renderer for the AI response
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const htmlContent = useMemo(() => {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<li>$1</li>') // List items
            .replace(/(\r\n|\n|\r)/g, '<br />'); // New lines
    }, [content]);

    return <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

const TaxPlanner: React.FC = () => {
    const { t, language } = useTranslation();
    const [invoices] = useLocalStorage<Invoice[]>('invoices', []);
    const [payrolls] = useLocalStorage<PayrollRun[]>('payrollHistory', []);
    const [assets] = useLocalStorage<FixedAsset[]>('fixedAssets', []);

    const [viewState, setViewState] = useState<'idle' | 'loading' | 'results' | 'error'>('idle');
    const [financialSummary, setFinancialSummary] = useState('');
    const [aiAdvice, setAiAdvice] = useState('');
    const [error, setError] = useState('');

    const formatCurrency = (amount: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(amount);

    const handleAnalyze = useCallback(async () => {
        setViewState('loading');
        
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const recentInvoices = invoices.filter(i => new Date(i.issueDate) > oneYearAgo && i.status === 'paid');
        const recentPayrolls = payrolls.filter(p => new Date(p.timestamp) > oneYearAgo);
        
        const totalRevenue = recentInvoices.reduce((sum, i) => sum + i.items.reduce((itemSum, item) => itemSum + item.quantity * item.unitPrice, 0), 0);
        const totalPayroll = recentPayrolls.reduce((sum, p) => sum + p.summary.totalGross, 0);
        
        // Simplified annual depreciation calculation
        const totalDepreciation = assets.reduce((sum, asset) => {
            if (asset.depreciationMethod === 'straight-line') {
                return sum + (asset.cost - asset.salvageValue) / asset.usefulLife;
            }
            // Note: Double-declining is more complex to annualize simply, so we use a simplification.
            return sum + (asset.cost * 2) / asset.usefulLife;
        }, 0);
        
        if (totalRevenue === 0 && totalPayroll === 0 && totalDepreciation === 0) {
            setViewState('error');
            setError(t('taxPlanner.summary.noData'));
            return;
        }

        const summary = `
- ${t('taxPlanner.summary.revenue')}: ${formatCurrency(totalRevenue)}
- ${t('taxPlanner.summary.payroll')}: ${formatCurrency(totalPayroll)}
- ${t('taxPlanner.summary.depreciation')}: ${formatCurrency(totalDepreciation)}
        `;
        setFinancialSummary(summary);

        try {
            const advice = await getTaxPlanningAdvice(summary);
            setAiAdvice(advice);
            setViewState('results');
        } catch (e) {
            setError(e instanceof Error ? e.message : t('error.unexpected'));
            setViewState('error');
        }

    }, [invoices, payrolls, assets, t, language]);


    return (
        <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-cyan-700 dark:text-cyan-400">{t('taxPlanner.title')}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl mx-auto">{t('taxPlanner.description')}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl text-center">
                {viewState === 'idle' && (
                     <button onClick={handleAnalyze} className="bg-cyan-600 text-white dark:text-black font-bold py-3 px-8 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/30">
                        {t('taxPlanner.button.analyze')}
                    </button>
                )}
                {viewState === 'loading' && (
                    <div>
                        <Loader />
                        <p className="text-gray-500 dark:text-gray-400">{t('taxPlanner.loading')}</p>
                    </div>
                )}
                 {(viewState === 'results' || viewState === 'error') && (
                     <button onClick={handleAnalyze} className="bg-cyan-600 text-white dark:text-black font-bold py-2 px-6 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-400 transition-colors">
                        Re-analyze
                    </button>
                )}
            </div>

            {financialSummary && (viewState === 'results' || viewState === 'error') && (
                 <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 shadow-xl">
                    <h3 className="text-xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4">{t('taxPlanner.summary.title')}</h3>
                    <pre className="whitespace-pre-wrap font-sans bg-gray-100 dark:bg-gray-900/50 p-4 rounded-md">{financialSummary}</pre>
                </div>
            )}
            
            {viewState === 'results' && (
                 <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 shadow-xl">
                    <h3 className="text-xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4">{t('taxPlanner.results.title')}</h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-3 leading-relaxed">
                        <MarkdownRenderer content={aiAdvice} />
                    </div>
                </div>
            )}

            {viewState === 'error' && (
                 <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 p-4 rounded-lg text-center">
                    <p className="font-bold mb-2">{t('calculator.error.title')}</p>
                    <p>{error}</p>
                </div>
            )}
            
             <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-sm rounded-lg text-center">
                <strong>{t('taxPlanner.disclaimer').split(':')[0]}:</strong> {t('taxPlanner.disclaimer').split(':')[1]}
            </div>

        </div>
    );
};

export default TaxPlanner;