import React, { useState, useMemo } from 'react';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import { useTranslation } from '../i18n/context';
import useLocalStorage from '../hooks/useLocalStorage';
import type { CalculationRecord, GpaParams, ReportData } from '../types';

interface Course {
    id: number;
    name: string;
    credits: number;
    grade: number;
}

const GpaCalculator: React.FC = () => {
    const { t } = useTranslation();
    const [courses, setCourses] = useState<Course[]>([{ id: 1, name: '', credits: 3, grade: 4 }]);
    const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);
    const [isSaved, setIsSaved] = useState(false);

    const gradeOptions = [
        { value: 4.0, label: t('gpa.grade.A') },
        { value: 3.0, label: t('gpa.grade.B') },
        { value: 2.0, label: t('gpa.grade.C') },
        { value: 1.0, label: t('gpa.grade.D') },
        { value: 0.0, label: t('gpa.grade.F') },
    ];
    
    const gpa = useMemo(() => {
        setIsSaved(false);
        const totalPoints = courses.reduce((sum, course) => sum + (course.credits * course.grade), 0);
        const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
        return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    }, [courses]);

    const handleCourseChange = (id: number, field: keyof Course, value: string | number) => {
        setCourses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const addCourse = () => {
        setCourses(prev => [...prev, { id: Date.now(), name: '', credits: 3, grade: 4 }]);
    };
    
    const removeCourse = (id: number) => {
        setCourses(prev => prev.filter(c => c.id !== id));
    };

    const handleSave = () => {
        if (!gpa || courses.length === 0) return;
        const params: GpaParams = { courses: courses.map(({name, credits, grade}) => ({name, credits, grade})) };
        const report: ReportData = {
            summary: `GPA calculation for ${courses.length} course(s), resulting in a GPA of ${gpa}.`,
            calculations: courses.map(c => ({
                description: `${c.name || 'Course'} (${c.credits} credits)`,
                amount: `Grade: ${gradeOptions.find(g => g.value === c.grade)?.label || c.grade}`
            })),
            grossIncome: courses.reduce((sum, c) => sum + c.credits, 0),
            netIncome: parseFloat(gpa),
            totalTax: 0, totalInsurance: 0,
            applicableLaws: ["Standard GPA calculation method."]
        };
        const newRecord: CalculationRecord = {
            id: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            type: 'gpa',
            params,
            report,
        };
        setHistory(prev => [newRecord, ...prev]);
        setIsSaved(true);
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('gpa.title')}</h2>
                <div className="space-y-4">
                    {courses.map((course, index) => (
                        <div key={course.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                            <InputField id={`name-${index}`} label={t('gpa.form.courseName')} value={course.name} onChange={e => handleCourseChange(course.id, 'name', e.target.value)} placeholder={`${t('gpa.form.courseName')} ${index + 1}`} />
                            <InputField id={`credits-${index}`} label={t('gpa.form.credits')} type="number" value={course.credits || ''} onChange={e => handleCourseChange(course.id, 'credits', Number(e.target.value))} />
                            <SelectField id={`grade-${index}`} label={t('gpa.form.grade')} value={course.grade} onChange={e => handleCourseChange(course.id, 'grade', Number(e.target.value))} options={gradeOptions.map(g => ({value: g.value, label: g.label}))} />
                            <button onClick={() => removeCourse(course.id)} className="bg-red-500 text-white h-10 self-end rounded-md">X</button>
                        </div>
                    ))}
                </div>
                <button onClick={addCourse} className="mt-4 text-cyan-600 dark:text-cyan-400 hover:underline">{t('gpa.form.addCourse')}</button>
            </div>
            
            <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in text-center">
                <h3 className="text-xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-2">{t('gpa.results.title')}</h3>
                <p className="text-6xl font-mono font-bold text-gray-800 dark:text-white">{gpa}</p>
                 <div className="text-center mt-6">
                    <button onClick={handleSave} disabled={isSaved || courses.length === 0} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isSaved ? t('common.done') : t('history.item.save' as any)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GpaCalculator;