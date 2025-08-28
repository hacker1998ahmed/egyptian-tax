import React, { useState, useMemo } from 'react';
import InputField from '../components/InputField';
import { useTranslation } from '../i18n/context';

const PercentageCalculator: React.FC = () => {
    const { t } = useTranslation();
    const [valA, setValA] = useState('');
    const [valB, setValB] = useState('');

    const results = useMemo(() => {
        const a = parseFloat(valA);
        const b = parseFloat(valB);

        if (isNaN(a) || isNaN(b)) return null;

        const mode1 = (a / 100) * b;
        const mode2 = b !== 0 ? (a / b) * 100 : 0;
        const mode3_change = b - a;
        const mode3_percent = a !== 0 ? (mode3_change / a) * 100 : 0;
        
        return {
            mode1: mode1.toLocaleString(),
            mode2: `${mode2.toFixed(2)}%`,
            mode3: `${Math.abs(mode3_percent).toFixed(2)}% ${mode3_percent > 0 ? t('percentage.results.increase') : t('percentage.results.decrease')}`
        };
    }, [valA, valB, t]);

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('percentage.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="valA" label="القيمة أ" type="number" value={valA} onChange={e => setValA(e.target.value)} placeholder="e.g., 20" />
                    <InputField id="valB" label="القيمة ب" type="number" value={valB} onChange={e => setValB(e.target.value)} placeholder="e.g., 50" />
                </div>
            </div>

            {results && (
                <div className="mt-8 space-y-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-fuchsia-500/30">
                        <p className="text-sm text-fuchsia-700 dark:text-fuchsia-400">{t('percentage.form.mode1', valA, valB)}</p>
                        <p className="text-2xl font-bold">{results.mode1}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-fuchsia-500/30">
                        <p className="text-sm text-fuchsia-700 dark:text-fuchsia-400">{t('percentage.form.mode2', valA, valB)}</p>
                        <p className="text-2xl font-bold">{results.mode2}</p>
                    </div>
                     <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-fuchsia-500/30">
                        <p className="text-sm text-fuchsia-700 dark:text-fuchsia-400">{t('percentage.form.mode3', valA, valB)}</p>
                        <p className="text-2xl font-bold">{results.mode3}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PercentageCalculator;