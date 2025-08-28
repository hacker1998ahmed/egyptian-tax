import React, { useState, useCallback } from 'react';
import { useTranslation } from '../i18n/context';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import GaugeChart from '../components/GaugeChart';
import { industryBenchmarks, industryOptions, Industry } from '../services/industryBenchmarks';
import { getPerformanceAnalysisInsight } from '../services/geminiService';

type ViewState = 'form' | 'results' | 'error';

const PerformanceAnalysis: React.FC = () => {
    const { t } = useTranslation();
    const [grossMargin, setGrossMargin] = useState('');
    const [netMargin, setNetMargin] = useState('');
    const [industry, setIndustry] = useState<Industry>('retail');
    
    const [viewState, setViewState] = useState<ViewState>('form');
    const [isInsightLoading, setIsInsightLoading] = useState(false);
    const [aiInsight, setAiInsight] = useState('');
    const [error, setError] = useState('');

    const translatedIndustryOptions = industryOptions.map(opt => ({
        value: opt.value,
        label: t(opt.labelKey as any)
    }));

    const handleAnalyze = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setAiInsight('');
        setError('');
        
        const grossMarginValue = parseFloat(grossMargin) / 100;
        const netMarginValue = parseFloat(netMargin) / 100;

        if (isNaN(grossMarginValue) || isNaN(netMarginValue)) {
            setError(t('error.unexpected'));
            setViewState('error');
            return;
        }
        
        setViewState('results');
        setIsInsightLoading(true);
        
        const benchmark = industryBenchmarks[industry];
        
        const summary = `
            Gross Profit Margin: My company's is ${grossMarginValue * 100}%, industry average is ${benchmark.grossMargin * 100}%.
            Net Profit Margin: My company's is ${netMarginValue * 100}%, industry average is ${benchmark.netMargin * 100}%.
        `;

        try {
            const insight = await getPerformanceAnalysisInsight(summary);
            setAiInsight(insight);
        } catch (err) {
            setError(err instanceof Error ? t(err.message as any, t('error.unexpected')) : t('error.unexpected'));
        } finally {
            setIsInsightLoading(false);
        }
    }, [grossMargin, netMargin, industry, t]);
    
    const benchmark = industryBenchmarks[industry];

    return (
        <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-cyan-700 dark:text-cyan-400">{t('performanceAnalysis.title')}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl mx-auto">{t('performanceAnalysis.description')}</p>
            </div>

            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <form onSubmit={handleAnalyze}>
                    <fieldset>
                        <legend className="text-xl font-bold text-cyan-800 dark:text-cyan-300 mb-4">{t('performanceAnalysis.form.legend')}</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField id="grossMargin" label={t('performanceAnalysis.form.grossMargin')} type="number" step="0.1" value={grossMargin} onChange={e => setGrossMargin(e.target.value)} required />
                            <InputField id="netMargin" label={t('performanceAnalysis.form.netMargin')} type="number" step="0.1" value={netMargin} onChange={e => setNetMargin(e.target.value)} required />
                            <SelectField id="industry" label={t('performanceAnalysis.form.industry')} value={industry} onChange={e => setIndustry(e.target.value as Industry)} options={translatedIndustryOptions} />
                        </div>
                    </fieldset>
                    <div className="mt-6 text-center">
                        <button type="submit" className="bg-cyan-600 text-white dark:text-black font-bold py-3 px-8 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/30" disabled={isInsightLoading}>
                            {t('performanceAnalysis.form.analyzeButton')}
                        </button>
                    </div>
                </form>
            </div>
            
            {viewState === 'error' && (
                 <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 p-4 rounded-lg text-center animate-fade-in">
                    <p className="font-bold mb-2">{t('calculator.error.title')}</p>
                    <p>{error}</p>
                </div>
            )}
            
            {viewState === 'results' && (
                 <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 shadow-xl animate-fade-in">
                    <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-6 text-center">{t('performanceAnalysis.results.title')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <GaugeChart label={t('performanceAnalysis.form.grossMargin')} value={parseFloat(grossMargin) / 100} benchmark={benchmark.grossMargin} />
                        <GaugeChart label={t('performanceAnalysis.form.netMargin')} value={parseFloat(netMargin) / 100} benchmark={benchmark.netMargin} />
                    </div>
                     <div className="flex justify-center text-sm mt-4 gap-6 text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-gray-800 dark:bg-white" style={{clipPath: 'polygon(0 50%, 100% 0, 100% 100%)'}}></div>
                           {t('performanceAnalysis.results.yourPerformance')}
                        </div>
                         <div className="flex items-center gap-2">
                           <div className="w-3 h-3 bg-cyan-500 dark:bg-cyan-400 rotate-90" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>
                           {t('performanceAnalysis.results.industryAverage')}
                        </div>
                     </div>

                    <div className="mt-8 pt-6 border-t border-fuchsia-500/20">
                         <h4 className="text-xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-2 text-center">{t('performanceAnalysis.results.aiInsight')}</h4>
                         <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg text-center min-h-[4rem] flex items-center justify-center">
                            {isInsightLoading && <p>{t('performanceAnalysis.results.loadingInsight')}</p>}
                            {!isInsightLoading && error && <p className="text-red-500">{error}</p>}
                            {!isInsightLoading && !error && aiInsight && <p className="text-gray-700 dark:text-gray-300 italic">"{aiInsight}"</p>}
                         </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default PerformanceAnalysis;
