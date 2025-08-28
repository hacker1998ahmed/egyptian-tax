import React, { useState, useMemo } from 'react';
import InputField from '../components/InputField';
import { useTranslation } from '../i18n/context';
import useLocalStorage from '../hooks/useLocalStorage';
import type { CalculationRecord, TransportationParams, RiderType, ReportData } from '../types';

type CalculatorMode = 'group' | 'personal';

const ResultCard: React.FC<{ title: string; value: string; colorClass?: string }> = ({ title, value, colorClass = 'border-cyan-500' }) => (
    <div className={`p-4 rounded-lg bg-gray-200 dark:bg-gray-900/50 border-l-4 ${colorClass}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
    </div>
);

const TransportationFareCalculator: React.FC = () => {
    const { t, language } = useTranslation();
    const [mode, setMode] = useState<CalculatorMode>('group');
    const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);

    // State for Group Mode
    const [riders, setRiders] = useState<RiderType[]>([{ id: Date.now(), count: 1, fare: 0 }]);
    const [isGroupSaved, setIsGroupSaved] = useState(false);

    // State for Personal Mode
    const [personalFare, setPersonalFare] = useState({ farePerTrip: 0, tripsPerDay: 2, daysPerWeek: 5 });
    const [isPersonalSaved, setIsPersonalSaved] = useState(false);

    const formatCurrency = (value: number) => {
        const locale = language === 'ar' ? 'ar-EG' : 'en-US';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' }).format(value);
    };
    
    // Group Mode Logic
    const handleRiderChange = (id: number, field: 'count' | 'fare', value: string) => {
        setIsGroupSaved(false);
        setRiders(prev => prev.map(r => r.id === id ? { ...r, [field]: parseFloat(value) || 0 } : r));
    };
    const addRider = () => setRiders(prev => [...prev, { id: Date.now(), count: 1, fare: 0 }]);
    const removeRider = (id: number) => setRiders(prev => prev.filter(r => r.id !== id));
    
    const groupResult = useMemo(() => {
        const totalPassengers = riders.reduce((sum, r) => sum + r.count, 0);
        const totalFare = riders.reduce((sum, r) => sum + (r.count * r.fare), 0);
        return { totalPassengers, totalFare };
    }, [riders]);

    const handleSaveGroup = () => {
        if (!groupResult || groupResult.totalFare <= 0) return;
        const params: TransportationParams = { mode: 'group', groupParams: riders };
        const report: ReportData = {
            summary: `Group fare calculation for ${groupResult.totalPassengers} passengers.`,
            calculations: [
                { description: t('transportation.results.totalPassengers'), amount: groupResult.totalPassengers },
                { description: t('transportation.results.totalFare'), amount: formatCurrency(groupResult.totalFare) }
            ],
            grossIncome: groupResult.totalPassengers,
            netIncome: groupResult.totalFare,
            totalTax: 0, totalInsurance: 0,
            applicableLaws: ["Basic fare calculation."]
        };
        const newRecord: CalculationRecord = {
            id: new Date().toISOString(), timestamp: new Date().toISOString(), type: 'transportation', params, report
        };
        setHistory(prev => [newRecord, ...prev]);
        setIsGroupSaved(true);
    }
    
    // Personal Mode Logic
    const handlePersonalFareChange = (field: keyof typeof personalFare, value: string) => {
        setIsPersonalSaved(false);
        setPersonalFare(prev => ({...prev, [field]: parseFloat(value) || 0}));
    };

    const personalResult = useMemo(() => {
        const daily = personalFare.farePerTrip * personalFare.tripsPerDay;
        const weekly = daily * personalFare.daysPerWeek;
        const monthly = weekly * 4.345; // Average weeks in a month
        const annually = monthly * 12;
        return { daily, weekly, monthly, annually };
    }, [personalFare]);

    const handleSavePersonal = () => {
        if (!personalResult || personalResult.daily <= 0) return;
        const params: TransportationParams = { mode: 'personal', personalParams: personalFare };
        const report: ReportData = {
            summary: `Personal daily transportation cost of ${formatCurrency(personalResult.daily)}.`,
            calculations: [
                { description: t('transportation.results.daily'), amount: formatCurrency(personalResult.daily) },
                { description: t('transportation.results.weekly'), amount: formatCurrency(personalResult.weekly) },
                { description: t('transportation.results.monthly'), amount: formatCurrency(personalResult.monthly) },
                { description: t('transportation.results.annually'), amount: formatCurrency(personalResult.annually) },
            ],
            grossIncome: personalFare.farePerTrip,
            netIncome: personalResult.monthly,
            totalTax: 0, totalInsurance: 0,
            applicableLaws: ["Basic fare calculation."]
        };
        const newRecord: CalculationRecord = {
            id: new Date().toISOString(), timestamp: new Date().toISOString(), type: 'transportation', params, report
        };
        setHistory(prev => [newRecord, ...prev]);
        setIsPersonalSaved(true);
    }

    const renderGroupMode = () => (
        <>
            <div className="space-y-4">
                {riders.map((rider, index) => (
                    <div key={rider.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-lg items-end">
                        <InputField id={`count-${index}`} label={`${t('transportation.form.passengerType')} ${index+1}`} type="number" value={rider.count || ''} onChange={e => handleRiderChange(rider.id, 'count', e.target.value)} />
                        <InputField id={`fare-${index}`} label={t('transportation.form.farePerPerson')} type="number" value={rider.fare || ''} onChange={e => handleRiderChange(rider.id, 'fare', e.target.value)} />
                        {riders.length > 1 && <button type="button" onClick={() => removeRider(rider.id)} className="bg-red-500 text-white h-10 self-end rounded-md">X</button>}
                    </div>
                ))}
            </div>
            <button type="button" onClick={addRider} className="mt-4 text-cyan-600 dark:text-cyan-400 hover:underline">{t('transportation.form.addType')}</button>
            
             {groupResult.totalFare > 0 && (
                <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in">
                    <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('transportation.results.groupTitle')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ResultCard title={t('transportation.results.totalPassengers')} value={groupResult.totalPassengers.toLocaleString()} colorClass="border-blue-500"/>
                        <ResultCard title={t('transportation.results.totalFare')} value={formatCurrency(groupResult.totalFare)} colorClass="border-green-500"/>
                    </div>
                    <div className="text-center mt-6">
                        <button onClick={handleSaveGroup} disabled={isGroupSaved} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isGroupSaved ? t('common.done') : t('history.item.save' as any)}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
    
    const renderPersonalMode = () => (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField id="farePerTrip" label={t('transportation.form.farePerTrip')} type="number" value={personalFare.farePerTrip || ''} onChange={e => handlePersonalFareChange('farePerTrip', e.target.value)} />
                <InputField id="tripsPerDay" label={t('transportation.form.tripsPerDay')} type="number" value={personalFare.tripsPerDay || ''} onChange={e => handlePersonalFareChange('tripsPerDay', e.target.value)} />
                <InputField id="daysPerWeek" label={t('transportation.form.daysPerWeek')} type="number" value={personalFare.daysPerWeek || ''} onChange={e => handlePersonalFareChange('daysPerWeek', e.target.value)} />
            </div>
            {personalResult.daily > 0 && (
                 <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in">
                    <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('transportation.results.personalTitle')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ResultCard title={t('transportation.results.daily')} value={formatCurrency(personalResult.daily)} />
                        <ResultCard title={t('transportation.results.weekly')} value={formatCurrency(personalResult.weekly)} />
                        <ResultCard title={t('transportation.results.monthly')} value={formatCurrency(personalResult.monthly)} />
                        <ResultCard title={t('transportation.results.annually')} value={formatCurrency(personalResult.annually)} />
                    </div>
                     <div className="text-center mt-6">
                        <button onClick={handleSavePersonal} disabled={isPersonalSaved} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isPersonalSaved ? t('common.done') : t('history.item.save' as any)}
                        </button>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('dashboard.transportation.title')}</h2>
                <div className="flex justify-center mb-6 p-1 bg-gray-200 dark:bg-gray-900/50 rounded-lg">
                    <button onClick={() => setMode('group')} className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${mode === 'group' ? 'bg-cyan-600 text-white' : 'hover:bg-gray-300 dark:hover:bg-gray-700'}`}>{t('transportation.mode.group')}</button>
                    <button onClick={() => setMode('personal')} className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${mode === 'personal' ? 'bg-cyan-600 text-white' : 'hover:bg-gray-300 dark:hover:bg-gray-700'}`}>{t('transportation.mode.personal')}</button>
                </div>
                {mode === 'group' ? renderGroupMode() : renderPersonalMode()}
            </div>
        </div>
    );
};

export default TransportationFareCalculator;