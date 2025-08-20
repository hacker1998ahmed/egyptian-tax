import React, { useState, useMemo } from 'react';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import { GENDER_OPTIONS } from '../constants';
import { useTranslation } from '../i18n/context';

const StatCard: React.FC<{ label: string, value: string | number, unit?: string, className?: string }> = ({ label, value, unit, className = '' }) => (
    <div className={`bg-gray-200 dark:bg-gray-900/50 p-4 rounded-lg text-center ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">
            {value} {unit && <span className="text-lg">{unit}</span>}
        </p>
    </div>
);

const AgeCalculator: React.FC = () => {
    const { t, language } = useTranslation();
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState('male');

    const genderOptions = useMemo(() => GENDER_OPTIONS.map(opt => ({
        value: opt.value,
        label: t(opt.labelKey as any),
    })), [t]);
    
    const ageData = useMemo(() => {
        if (!birthDate) return null;
        
        try {
            const birth = new Date(birthDate);
            const now = new Date();
            
            if (birth > now) return { error: t('age.error.futureDate') };

            let years = now.getFullYear() - birth.getFullYear();
            let months = now.getMonth() - birth.getMonth();
            let days = now.getDate() - birth.getDate();

            if (days < 0) {
                months--;
                const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                days += prevMonth.getDate();
            }
            if (months < 0) {
                years--;
                months += 12;
            }

            const locale = language === 'ar' ? 'ar-EG' : 'en-US';
            const totalDays = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
            
            const nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
            if (nextBirthday < now) {
                nextBirthday.setFullYear(now.getFullYear() + 1);
            }
            const daysToBirthday = Math.ceil((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            // Average life expectancy in Egypt (approx.)
            const lifeExpectancy = gender === 'female' ? 74 : 70; 
            const expectedDeathDate = new Date(birth.getTime());
            expectedDeathDate.setFullYear(birth.getFullYear() + lifeExpectancy);

            const timeLeftMs = expectedDeathDate.getTime() - now.getTime();
            const yearsLeft = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24 * 365.25));
            const monthsLeft = Math.floor((timeLeftMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
            const daysLeft = Math.floor((timeLeftMs % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24));


            return {
                years, months, days,
                totalDays: totalDays.toLocaleString(locale),
                daysToBirthday,
                expectedDeathDate: expectedDeathDate.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }),
                timeLeft: {
                    years: Math.max(0, yearsLeft),
                    months: Math.max(0, monthsLeft),
                    days: Math.max(0, daysLeft)
                },
                error: null,
            };
        } catch (e) {
            return { error: t('age.error.invalidDate') };
        }

    }, [birthDate, gender, t, language]);

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl shadow-gray-400/20 dark:shadow-2xl dark:shadow-cyan-500/10 dark:backdrop-blur-sm">
                 <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('age.title')}</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                    <InputField
                        id="birthDate"
                        label={t('age.form.dob.label')}
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        max={new Date().toISOString().split("T")[0]} // Prevent future dates
                    />
                    <SelectField
                        id="gender"
                        label={t('age.form.gender.label')}
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        options={genderOptions}
                    />
                 </div>
            </div>

            {ageData && !ageData.error && (
                <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in space-y-6">
                    <div>
                        <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('age.results.exactAge')}</h3>
                        <div className="grid grid-cols-3 gap-4">
                           <StatCard label={t('age.results.years')} value={ageData.years} />
                           <StatCard label={t('age.results.months')} value={ageData.months} />
                           <StatCard label={t('age.results.days')} value={ageData.days} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('age.results.nextBirthday')}</h3>
                         <StatCard label="" value={ageData.daysToBirthday} unit={t('common.day')} />
                    </div>
                    
                    <div className="pt-4 border-t border-gray-300 dark:border-fuchsia-500/20">
                         <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('age.results.lifeExpectancy')}</h3>
                         <StatCard label={t('age.results.dod')} value={ageData.expectedDeathDate} className="mb-4" />
                         <h4 className="text-lg font-bold text-fuchsia-600 dark:text-fuchsia-300 mb-2 text-center">{t('age.results.timeLeft')}</h4>
                         <div className="grid grid-cols-3 gap-4">
                            <StatCard label={t('age.results.years')} value={ageData.timeLeft.years} />
                            <StatCard label={t('age.results.months')} value={ageData.timeLeft.months} />
                            <StatCard label={t('age.results.days')} value={ageData.timeLeft.days} />
                         </div>
                         <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                           <strong>{t('age.results.disclaimer').split(':')[0]}:</strong> {t('age.results.disclaimer').split(':')[1]}
                         </p>
                    </div>
                </div>
            )}
            {ageData?.error && (
                 <div className="mt-8 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 p-4 rounded-lg text-center animate-fade-in">
                    <p>{ageData.error}</p>
                </div>
            )}

        </div>
    );
};

export default AgeCalculator;