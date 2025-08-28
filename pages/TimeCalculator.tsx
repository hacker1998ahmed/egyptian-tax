import React, { useState, useMemo } from 'react';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import { useTranslation } from '../i18n/context';

const TimeCalculator: React.FC = () => {
    const { t } = useTranslation();
    const [initialTime, setInitialTime] = useState('12:00');
    const [operation, setOperation] = useState<'add' | 'subtract'>('add');
    const [hours, setHours] = useState('');
    const [minutes, setMinutes] = useState('');
    const [seconds, setSeconds] = useState('');

    const resultTime = useMemo(() => {
        if (!initialTime) return '';
        const [h, m] = initialTime.split(':').map(Number);
        const initialDate = new Date();
        initialDate.setHours(h, m, 0, 0);

        const h_to_op = parseInt(hours) || 0;
        const m_to_op = parseInt(minutes) || 0;
        const s_to_op = parseInt(seconds) || 0;

        const multiplier = operation === 'add' ? 1 : -1;
        
        initialDate.setHours(initialDate.getHours() + (h_to_op * multiplier));
        initialDate.setMinutes(initialDate.getMinutes() + (m_to_op * multiplier));
        initialDate.setSeconds(initialDate.getSeconds() + (s_to_op * multiplier));

        return initialDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }, [initialTime, operation, hours, minutes, seconds]);

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('time.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <InputField id="initialTime" label={t('time.form.initialTime')} type="time" value={initialTime} onChange={e => setInitialTime(e.target.value)} />
                    <SelectField id="operation" label={t('time.form.operation')} value={operation} onChange={e => setOperation(e.target.value as 'add'|'subtract')} options={[
                        {value: 'add', label: t('time.form.add')},
                        {value: 'subtract', label: t('time.form.subtract')}
                    ]}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <InputField id="hours" label={t('time.form.hours')} type="number" value={hours} onChange={e => setHours(e.target.value)} placeholder="0" />
                    <InputField id="minutes" label={t('time.form.minutes')} type="number" value={minutes} onChange={e => setMinutes(e.target.value)} placeholder="0" />
                    <InputField id="seconds" label={t('time.form.seconds')} type="number" value={seconds} onChange={e => setSeconds(e.target.value)} placeholder="0" />
                </div>
            </div>

            <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in text-center">
                <h3 className="text-xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-2">{t('time.results.title')}</h3>
                <p className="text-5xl font-mono font-bold text-gray-800 dark:text-white">{resultTime}</p>
            </div>
        </div>
    );
};

export default TimeCalculator;