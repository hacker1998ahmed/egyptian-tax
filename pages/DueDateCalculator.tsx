import React, { useState, useMemo } from 'react';
import InputField from '../components/InputField';
import { useTranslation } from '../i18n/context';

const ResultCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
  <div className="p-4 rounded-lg bg-gray-200 dark:bg-gray-900/50 text-center">
    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
  </div>
);

const DueDateCalculator: React.FC = () => {
    const { t, language } = useTranslation();
    const [lmpDate, setLmpDate] = useState('');

    const results = useMemo(() => {
        if (!lmpDate) return null;
        const lmp = new Date(lmpDate);
        if (isNaN(lmp.getTime())) return null;

        const dueDate = new Date(lmp);
        dueDate.setDate(dueDate.getDate() + 280); // Naegele's rule

        const today = new Date();
        const gestationalAgeMs = today.getTime() - lmp.getTime();
        const gestationalAgeDays = Math.floor(gestationalAgeMs / (1000 * 60 * 60 * 24));
        const weeks = Math.floor(gestationalAgeDays / 7);
        const days = gestationalAgeDays % 7;
        
        let trimester = '';
        if (weeks < 14) trimester = t('dueDate.results.first');
        else if (weeks < 28) trimester = t('dueDate.results.second');
        else trimester = t('dueDate.results.third');
        
        const locale = language === 'ar' ? 'ar-EG' : 'en-US';

        return {
            dueDate: dueDate.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }),
            gestationalAge: `${weeks} ${t('dueDate.results.weeks')} ${t('savingsGoal.results.and')} ${days} ${t('dueDate.results.days')}`,
            trimester
        };
    }, [lmpDate, t, language]);

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('dueDate.title')}</h2>
                <div className="max-w-sm mx-auto">
                    <InputField id="lmp" label={t('dueDate.form.lmp')} type="date" value={lmpDate} onChange={e => setLmpDate(e.target.value)} />
                </div>
            </div>

            {results && (
                <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in">
                    <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('dueDate.results.title')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ResultCard title={t('dueDate.results.dueDate')} value={results.dueDate} />
                        <ResultCard title={t('dueDate.results.gestationalAge')} value={results.gestationalAge} />
                        <ResultCard title={t('dueDate.results.trimester')} value={results.trimester} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DueDateCalculator;