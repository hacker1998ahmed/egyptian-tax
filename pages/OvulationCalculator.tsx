import React, { useState, useMemo } from 'react';
import InputField from '../components/InputField';
import { useTranslation } from '../i18n/context';

const OvulationCalculator: React.FC = () => {
    const { t, language } = useTranslation();
    const [lmpDate, setLmpDate] = useState('');
    const [cycleLength, setCycleLength] = useState('28');
    
    const formatDate = (date: Date) => {
        const locale = language === 'ar' ? 'ar-EG' : 'en-US';
        return date.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const results = useMemo(() => {
        if (!lmpDate) return null;
        const lmp = new Date(lmpDate);
        if (isNaN(lmp.getTime())) return null;

        const cycle = parseInt(cycleLength) || 28;
        
        const nextPeriod = new Date(lmp);
        nextPeriod.setDate(nextPeriod.getDate() + cycle);
        
        const ovulationDate = new Date(lmp);
        ovulationDate.setDate(ovulationDate.getDate() + cycle - 14);

        const fertileStart = new Date(ovulationDate);
        fertileStart.setDate(fertileStart.getDate() - 5);
        
        const fertileEnd = new Date(ovulationDate);
        fertileEnd.setDate(fertileEnd.getDate() + 1);

        return {
            nextPeriod: formatDate(nextPeriod),
            ovulationDate: formatDate(ovulationDate),
            fertileWindow: `${formatDate(fertileStart)} - ${formatDate(fertileEnd)}`
        };
    }, [lmpDate, cycleLength, language]);

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('ovulation.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="lmpDate" label={t('ovulation.form.lmp')} type="date" value={lmpDate} onChange={e => setLmpDate(e.target.value)} />
                    <InputField id="cycleLength" label={t('ovulation.form.cycleLength')} type="number" value={cycleLength} onChange={e => setCycleLength(e.target.value)} />
                </div>
            </div>

            {results && (
                <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in space-y-4">
                    <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('ovulation.results.title')}</h3>
                    <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-900/50">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('ovulation.results.nextPeriod')}</p>
                        <p className="text-lg font-bold">{results.nextPeriod}</p>
                    </div>
                     <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('ovulation.results.ovulationDate')}</p>
                        <p className="text-lg font-bold text-green-700 dark:text-green-300">{results.ovulationDate}</p>
                    </div>
                     <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('ovulation.results.fertileWindow')}</p>
                        <p className="text-lg font-bold text-green-700 dark:text-green-300">{results.fertileWindow}</p>
                    </div>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">{t('ovulation.results.note')}</p>
                </div>
            )}
        </div>
    );
};

export default OvulationCalculator;
