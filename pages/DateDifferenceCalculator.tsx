import React, { useState, useMemo } from 'react';
import InputField from '../components/InputField';
import { useTranslation } from '../i18n/context';

const ResultCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
  <div className="p-4 rounded-lg bg-gray-200 dark:bg-gray-900/50 text-center">
    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    <p className="text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
  </div>
);

const DateDifferenceCalculator: React.FC = () => {
    const { t } = useTranslation();
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const difference = useMemo(() => {
        if (!startDate || !endDate) return null;

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return null;

        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();
        let days = end.getDate() - start.getDate();

        if (days < 0) {
            months--;
            days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }
        
        const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        return { years, months, days, totalDays };
    }, [startDate, endDate]);

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('dateDifference.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="startDate" label={t('dateDifference.form.startDate')} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <InputField id="endDate" label={t('dateDifference.form.endDate')} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
            </div>

            {difference && (
                <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in">
                    <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('dateDifference.results.title')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ResultCard title={t('age.results.years')} value={difference.years} />
                        <ResultCard title={t('age.results.months')} value={difference.months} />
                        <ResultCard title={t('age.results.days')} value={difference.days} />
                        <ResultCard title={t('dateDifference.results.inDays')} value={difference.totalDays.toLocaleString()} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateDifferenceCalculator;