import React, { useState, useMemo } from 'react';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import { useTranslation } from '../i18n/context';
import useLocalStorage from '../hooks/useLocalStorage';
import type { CalculationRecord, CalorieParams, ReportData } from '../types';

const CalorieCalculator: React.FC = () => {
    const { t } = useTranslation();
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [activity, setActivity] = useState(1.2);
    const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);
    const [isSaved, setIsSaved] = useState(false);

    const activityOptions = [
        { value: 1.2, label: t('calorie.activity.sedentary') },
        { value: 1.375, label: t('calorie.activity.light') },
        { value: 1.55, label: t('calorie.activity.moderate') },
        { value: 1.725, label: t('calorie.activity.active') },
        { value: 1.9, label: t('calorie.activity.veryActive') },
    ];
    
    const results = useMemo(() => {
        setIsSaved(false);
        const ageNum = parseInt(age);
        const heightNum = parseInt(height);
        const weightNum = parseInt(weight);
        
        if (!ageNum || !heightNum || !weightNum) return null;

        let bmr = 0;
        if (gender === 'male') {
            bmr = 88.362 + (13.397 * weightNum) + (4.799 * heightNum) - (5.677 * ageNum);
        } else {
            bmr = 447.593 + (9.247 * weightNum) + (3.098 * heightNum) - (4.330 * ageNum);
        }
        
        const tdee = bmr * activity;

        return {
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
        };
    }, [age, gender, height, weight, activity]);

    const handleSave = () => {
        if (!results) return;
        const params: CalorieParams = {
            age: parseInt(age),
            gender,
            height: parseInt(height),
            weight: parseInt(weight),
            activity
        };
        const report: ReportData = {
            summary: `Calorie needs calculation based on provided data. BMR: ${results.bmr}, TDEE: ${results.tdee}.`,
            calculations: [
                { description: t('calorie.results.bmr'), amount: `${results.bmr} kcal/day` },
                { description: t('calorie.results.tdee'), amount: `${results.tdee} kcal/day` },
            ],
            grossIncome: results.tdee,
            netIncome: results.bmr,
            totalTax: 0,
            totalInsurance: 0,
            applicableLaws: ["Mifflin-St Jeor Equation for BMR."]
        };
        const newRecord: CalculationRecord = {
            id: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            type: 'calorie',
            params,
            report,
        };
        setHistory(prev => [newRecord, ...prev]);
        setIsSaved(true);
    };
    
    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
             <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('calorie.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="age" label={t('calorie.form.age')} type="number" value={age} onChange={e => {setAge(e.target.value); setIsSaved(false);}} />
                    <SelectField id="gender" label={t('calorie.form.gender')} value={gender} onChange={e => {setGender(e.target.value as 'male'|'female'); setIsSaved(false);}} options={[
                        {value: 'male', label: t('calorie.form.male')},
                        {value: 'female', label: t('calorie.form.female')}
                    ]} />
                    <InputField id="height" label={t('calorie.form.height')} type="number" value={height} onChange={e => {setHeight(e.target.value); setIsSaved(false);}} />
                    <InputField id="weight" label={t('calorie.form.weight')} type="number" value={weight} onChange={e => {setWeight(e.target.value); setIsSaved(false);}} />
                    <div className="md:col-span-2">
                        <SelectField id="activity" label={t('calorie.form.activity')} value={activity} onChange={e => {setActivity(Number(e.target.value)); setIsSaved(false);}} options={activityOptions} />
                    </div>
                </div>
            </div>
            
            {results && (
                <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in">
                     <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('calorie.results.title')}</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-gray-200 dark:bg-gray-900/50 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('calorie.results.bmr')}</p>
                            <p className="text-3xl font-bold">{results.bmr.toLocaleString()}</p>
                        </div>
                         <div className="p-4 rounded-lg bg-gray-200 dark:bg-gray-900/50 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('calorie.results.tdee')}</p>
                            <p className="text-3xl font-bold">{results.tdee.toLocaleString()}</p>
                        </div>
                     </div>
                     <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-300">{t('calorie.results.explanation', results.tdee.toLocaleString())}</p>
                     <div className="text-center mt-6">
                        <button onClick={handleSave} disabled={isSaved} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isSaved ? t('common.done') : t('history.item.save' as any)}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
};

export default CalorieCalculator;