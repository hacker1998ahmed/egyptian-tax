import React, { useState, useMemo } from 'react';
import InputField from '../components/InputField';
import { useTranslation } from '../i18n/context';
import useLocalStorage from '../hooks/useLocalStorage';
import type { CalculationRecord, PaceParams, ReportData } from '../types';

const PaceCalculator: React.FC = () => {
    const { t } = useTranslation();
    const [distance, setDistance] = useState('');
    const [hours, setHours] = useState('');
    const [minutes, setMinutes] = useState('');
    const [seconds, setSeconds] = useState('');
    const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);
    const [isSaved, setIsSaved] = useState(false);

    const formatPace = (totalSeconds: number) => {
        if (isNaN(totalSeconds) || !isFinite(totalSeconds)) return '00:00';
        const paceMinutes = Math.floor(totalSeconds / 60);
        const paceSeconds = Math.round(totalSeconds % 60);
        return `${String(paceMinutes).padStart(2, '0')}:${String(paceSeconds).padStart(2, '0')}`;
    };

    const results = useMemo(() => {
        setIsSaved(false);
        const distKm = parseFloat(distance);
        const h = parseInt(hours) || 0;
        const m = parseInt(minutes) || 0;
        const s = parseInt(seconds) || 0;

        if (distKm <= 0) return null;

        const totalSecondsInTime = (h * 3600) + (m * 60) + s;
        if (totalSecondsInTime <= 0) return null;

        const secondsPerKm = totalSecondsInTime / distKm;
        const secondsPerMile = totalSecondsInTime / (distKm / 1.60934);

        return {
            perKm: formatPace(secondsPerKm),
            perMile: formatPace(secondsPerMile),
        };
    }, [distance, hours, minutes, seconds]);

    const handleSave = () => {
        if (!results) return;
        const params: PaceParams = {
            distance: parseFloat(distance),
            hours: parseInt(hours) || 0,
            minutes: parseInt(minutes) || 0,
            seconds: parseInt(seconds) || 0
        };
        const totalTime = `${params.hours}h ${params.minutes}m ${params.seconds}s`;
        const report: ReportData = {
            summary: `Pace for a ${params.distance}km run completed in ${totalTime}.`,
            calculations: [
                { description: t('pace.results.perKm'), amount: results.perKm },
                { description: t('pace.results.perMile'), amount: results.perMile },
            ],
            grossIncome: params.distance,
            netIncome: (params.hours*3600) + (params.minutes*60) + params.seconds,
            totalTax: 0,
            totalInsurance: 0,
            applicableLaws: ["Pace calculation formulas."]
        };
        const newRecord: CalculationRecord = {
            id: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            type: 'pace',
            params,
            report,
        };
        setHistory(prev => [newRecord, ...prev]);
        setIsSaved(true);
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('pace.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <InputField id="distance" label={t('pace.form.distance')} type="number" value={distance} onChange={e => setDistance(e.target.value)} />
                    <InputField id="hours" label={t('pace.form.hours')} type="number" value={hours} onChange={e => setHours(e.target.value)} />
                    <InputField id="minutes" label={t('pace.form.minutes')} type="number" value={minutes} onChange={e => setMinutes(e.target.value)} />
                    <InputField id="seconds" label={t('pace.form.seconds')} type="number" value={seconds} onChange={e => setSeconds(e.target.value)} />
                </div>
            </div>

            {results && (
                <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in">
                    <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('pace.results.title')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-gray-200 dark:bg-gray-900/50 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('pace.results.perKm')}</p>
                            <p className="text-3xl font-bold font-mono">{results.perKm}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-gray-200 dark:bg-gray-900/50 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('pace.results.perMile')}</p>
                            <p className="text-3xl font-bold font-mono">{results.perMile}</p>
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

export default PaceCalculator;
