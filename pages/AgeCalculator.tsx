import React, { useState, useEffect, useMemo, useRef } from 'react';
import InputField from '../components/InputField';
import { useTranslation } from '../i18n/context';
import { generatePdfDataUri, generateAgeReportExcelDataUri, downloadFile } from '../utils/reportGenerator';

const StatCard: React.FC<{ label: string, value: string | number, unit?: string, className?: string, valueClassName?: string }> = ({ label, value, unit, className = '', valueClassName = '' }) => (
    <div className={`bg-gray-200 dark:bg-gray-900/50 p-4 rounded-lg text-center ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`text-2xl font-bold text-cyan-700 dark:text-cyan-400 ${valueClassName}`}>
            {value} {unit && <span className="text-lg">{unit}</span>}
        </p>
    </div>
);

const ZodiacCard: React.FC<{ label: string, sign: string, icon: string }> = ({ label, sign, icon }) => (
    <div className="bg-gray-200 dark:bg-gray-900/50 p-4 rounded-lg text-center flex flex-col items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-5xl my-2">{icon}</p>
        <p className="text-xl font-bold text-cyan-700 dark:text-cyan-400">{sign}</p>
    </div>
);

const getWesternZodiac = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "aquarius";
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "pisces";
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "aries";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "taurus";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "gemini";
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "cancer";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "leo";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "virgo";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "libra";
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "scorpio";
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "sagittarius";
    return "capricorn"; // Default
};

const getChineseZodiac = (year: number) => {
    const animals = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "goat", "monkey", "rooster", "dog", "pig"];
    return animals[(year - 4) % 12];
};

const AgeCalculator: React.FC = () => {
    const { t, language } = useTranslation();
    const [birthDate, setBirthDate] = useState('');
    const [ageData, setAgeData] = useState<any>(null);
    const reportContentRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState<null | 'pdf' | 'excel'>(null);

    useEffect(() => {
        if (!birthDate) {
            setAgeData(null);
            return;
        }

        const calculateAge = () => {
            try {
                const birth = new Date(birthDate);
                const now = new Date();
                
                if (birth > now || isNaN(birth.getTime())) {
                    setAgeData({ error: birth > now ? t('age.error.futureDate') : t('age.error.invalidDate') });
                    return;
                }
                
                const diff = now.getTime() - birth.getTime();

                const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
                const months = Math.floor((diff % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
                const days = Math.floor((diff % (30.44 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
                const hours = now.getHours() - birth.getHours();
                const minutes = now.getMinutes() - birth.getMinutes();
                const seconds = now.getSeconds() - birth.getSeconds();

                const lifeExpectancyYears = 72; // Average for Egypt
                const expectedDeathDate = new Date(birth.getTime());
                expectedDeathDate.setFullYear(birth.getFullYear() + lifeExpectancyYears);
                const timeLeftMs = expectedDeathDate.getTime() - now.getTime();

                const locale = language === 'ar' ? 'ar-EG' : 'en-US';
                const format = (num: number) => num.toLocaleString(locale);

                setAgeData({
                    years, months, days, hours, minutes, seconds,
                    totalDays: format(Math.floor(diff / (1000 * 60 * 60 * 24))),
                    totalHours: format(Math.floor(diff / (1000 * 60 * 60))),
                    totalMinutes: format(Math.floor(diff / (1000 * 60))),
                    totalHeartbeats: format(Math.floor(diff / 1000 * 1.2)), // avg 72bpm
                    totalBreaths: format(Math.floor(diff / 1000 * 0.26)), // avg 16bpm
                    westernZodiac: getWesternZodiac(birth),
                    chineseZodiac: getChineseZodiac(birth.getFullYear()),
                    timeLeft: {
                        years: Math.max(0, Math.floor(timeLeftMs / (365.25 * 24 * 60 * 60 * 1000))),
                        months: Math.max(0, Math.floor((timeLeftMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000))),
                        days: Math.max(0, Math.floor((timeLeftMs % (30.44 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000))),
                        hours: 23 - now.getHours(),
                        minutes: 59 - now.getMinutes(),
                        seconds: 59 - now.getSeconds(),
                    },
                    error: null,
                });
            } catch(e) {
                 setAgeData({ error: t('age.error.invalidDate') });
            }
        };

        calculateAge(); // Initial calculation
        const interval = setInterval(calculateAge, 1000); // Update every second

        return () => clearInterval(interval);
    }, [birthDate, t, language]);
    
    const handleDownloadPdf = async () => {
        if (!reportContentRef.current || isExporting) return;
        setIsExporting('pdf');
        try {
            const uri = await generatePdfDataUri(reportContentRef.current);
            const filename = `Age-Report-${new Date().toISOString().split('T')[0]}.pdf`;
            downloadFile(filename, uri, (key) => t(key as any));
        } catch (error) {
            console.error("Error during PDF download:", error);
            alert(t('error.unexpected'));
        } finally {
            setIsExporting(null);
        }
    }

    const handleDownloadExcel = async () => {
        if (!ageData || isExporting) return;
        setIsExporting('excel');
        try {
            const uri = await Promise.resolve(generateAgeReportExcelDataUri(ageData, t));
            const filename = `Age-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
            downloadFile(filename, uri, (key) => t(key as any));
        } catch (error) {
            console.error("Error during Excel download:", error);
            alert(t('error.unexpected'));
        } finally {
            setIsExporting(null);
        }
    }

    const resetForm = () => setBirthDate('');

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl shadow-gray-400/20 dark:shadow-2xl dark:shadow-cyan-500/10 dark:backdrop-blur-sm">
                 <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('age.title')}</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                    <InputField
                        id="birthDate"
                        label={t('age.form.dob.label')}
                        type="datetime-local"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        max={new Date().toISOString().slice(0, 16)}
                    />
                     <button onClick={resetForm} className="w-full bg-gray-500 dark:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-400/50 transition-all duration-300 shadow-lg self-end">
                        {t('calculator.clear')}
                    </button>
                 </div>
            </div>

            {ageData && !ageData.error && (
                <>
                <div ref={reportContentRef} className="mt-8 space-y-8 animate-fade-in printable-area bg-gray-100 dark:bg-gray-900 p-4 md:p-8 rounded-lg">
                    {/* Your Age Now */}
                    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30">
                        <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('age.results.exactAge')}</h3>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                           <StatCard label={t('age.results.years')} value={ageData.years} />
                           <StatCard label={t('age.results.months')} value={ageData.months} />
                           <StatCard label={t('age.results.days')} value={ageData.days} />
                           <StatCard label={t('age.results.hours')} value={ageData.hours < 0 ? 24 + ageData.hours : ageData.hours} />
                           <StatCard label={t('age.results.minutes')} value={ageData.minutes < 0 ? 60 + ageData.minutes : ageData.minutes} />
                           <StatCard label={t('age.results.seconds')} value={ageData.seconds < 0 ? 60 + ageData.seconds : ageData.seconds} />
                        </div>
                    </div>
                    
                    {/* Astrological Profile */}
                    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30">
                        <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('age.results.astroProfile')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ZodiacCard label={t('age.results.westernZodiac')} sign={t(`zodiac.western.${ageData.westernZodiac}` as any)} icon={t(`zodiac.western.icon.${ageData.westernZodiac}` as any)} />
                            <ZodiacCard label={t('age.results.chineseZodiac')} sign={t(`zodiac.chinese.${ageData.chineseZodiac}` as any)} icon={t(`zodiac.chinese.icon.${ageData.chineseZodiac}` as any)} />
                        </div>
                    </div>

                    {/* Life in Numbers */}
                     <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30">
                        <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('age.results.lifeStats')}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                           <StatCard label={t('age.results.totalDays')} value={ageData.totalDays} />
                           <StatCard label={t('age.results.totalHours')} value={ageData.totalHours} />
                           <StatCard label={t('age.results.totalMinutes')} value={ageData.totalMinutes} />
                           <StatCard label={t('age.results.totalHeartbeats')} value={ageData.totalHeartbeats} />
                           <StatCard label={t('age.results.totalBreaths')} value={ageData.totalBreaths} />
                        </div>
                    </div>
                    
                    {/* The Ticking Clock */}
                    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-red-500/30">
                         <h3 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4 text-center">{t('age.results.tickingClock')}</h3>
                         <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                            <StatCard label={t('age.results.years')} value={ageData.timeLeft.years} valueClassName="text-red-500 dark:text-red-400" />
                            <StatCard label={t('age.results.months')} value={ageData.timeLeft.months} valueClassName="text-red-500 dark:text-red-400" />
                            <StatCard label={t('age.results.days')} value={ageData.timeLeft.days} valueClassName="text-red-500 dark:text-red-400" />
                            <StatCard label={t('age.results.hours')} value={ageData.timeLeft.hours} valueClassName="text-red-500 dark:text-red-400" />
                            <StatCard label={t('age.results.minutes')} value={ageData.timeLeft.minutes} valueClassName="text-red-500 dark:text-red-400" />
                            <StatCard label={t('age.results.seconds')} value={ageData.timeLeft.seconds} valueClassName="text-red-500 dark:text-red-400" />
                         </div>
                         <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                           <strong>{t('age.results.disclaimer').split(':')[0]}:</strong> {t('age.results.disclaimer').split(':')[1]}
                         </p>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 justify-center gap-4 no-print">
                    <button onClick={handleDownloadPdf} disabled={!!isExporting} className="bg-teal-600 dark:bg-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-700 dark:hover:bg-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-300/50 transition-all duration-300 shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isExporting === 'pdf' ? t('report.downloadingPdf') : t('age.export.pdf')}
                    </button>
                    <button onClick={handleDownloadExcel} disabled={!!isExporting} className="bg-green-700 dark:bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-800 dark:hover:bg-green-500 focus:outline-none focus:ring-4 focus:ring-green-400/50 transition-all duration-300 shadow-lg shadow-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isExporting === 'excel' ? t('report.downloadingExcel') : t('age.export.excel')}
                    </button>
                </div>
                </>
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