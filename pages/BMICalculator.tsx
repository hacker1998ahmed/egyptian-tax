import React, { useState, useMemo } from 'react';
import InputField from '../components/InputField';
import { useTranslation } from '../i18n/context';
import useLocalStorage from '../hooks/useLocalStorage';
import type { CalculationRecord, BmiParams, ReportData } from '../types';

const ResultCard: React.FC<{ title: string; value: string; colorClass?: string }> = ({ title, value, colorClass = 'border-cyan-500' }) => (
  <div className={`p-4 rounded-lg bg-gray-200 dark:bg-gray-900/50 border-l-4 ${colorClass}`}>
    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
  </div>
);

const BMICalculator: React.FC = () => {
  const { t } = useTranslation();
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);
  const [isSaved, setIsSaved] = useState(false);

  const bmiResult = useMemo(() => {
    setIsSaved(false); // Reset saved state on new calculation
    const h = parseFloat(height);
    const w = parseFloat(weight);

    if (h > 0 && w > 0) {
      const bmi = w / ((h / 100) ** 2);
      const bmiFormatted = bmi.toFixed(1);

      let category = '';
      let colorClass = '';
      
      if (bmi < 18.5) {
        category = t('bmi.category.underweight');
        colorClass = 'border-blue-500';
      } else if (bmi >= 18.5 && bmi < 25) {
        category = t('bmi.category.normal');
        colorClass = 'border-green-500';
      } else if (bmi >= 25 && bmi < 30) {
        category = t('bmi.category.overweight');
        colorClass = 'border-yellow-500';
      } else {
        category = t('bmi.category.obesity');
        colorClass = 'border-red-500';
      }
      
      const healthyMin = (18.5 * ((h/100)**2)).toFixed(1);
      const healthyMax = (24.9 * ((h/100)**2)).toFixed(1);

      return {
        bmi: bmiFormatted,
        category,
        colorClass,
        healthyRange: `${healthyMin}kg - ${healthyMax}kg`
      };
    }
    return null;
  }, [height, weight, t]);

  const handleSave = () => {
    if (!bmiResult) return;
    const params: BmiParams = { height: parseFloat(height), weight: parseFloat(weight) };
    const report: ReportData = {
      summary: `BMI calculation for height ${params.height}cm and weight ${params.weight}kg resulted in a BMI of ${bmiResult.bmi} (${bmiResult.category}).`,
      calculations: [
        { description: t('bmi.results.bmi'), amount: bmiResult.bmi },
        { description: t('bmi.results.category'), amount: bmiResult.category },
        { description: t('bmi.results.healthyRange'), amount: bmiResult.healthyRange },
      ],
      grossIncome: params.weight,
      netIncome: parseFloat(bmiResult.bmi),
      totalTax: 0,
      totalInsurance: 0,
      applicableLaws: ['WHO BMI classification standards.'],
    };
    const newRecord: CalculationRecord = {
      id: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      type: 'bmi',
      params,
      report,
    };
    setHistory(prev => [newRecord, ...prev]);
    setIsSaved(true);
  };
  
  const resetForm = () => {
      setHeight('');
      setWeight('');
      setIsSaved(false);
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
        <form onSubmit={(e) => e.preventDefault()}>
          <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('bmi.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              id="height"
              label={t('bmi.form.height.label')}
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder={t('bmi.form.height.placeholder')}
              required
            />
            <InputField
              id="weight"
              label={t('bmi.form.weight.label')}
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={t('bmi.form.weight.placeholder')}
              required
            />
          </div>
            <div className="flex justify-center mt-6">
                 <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-500 dark:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-400/50 transition-all duration-300 shadow-lg"
                    >
                    {t('calculator.clear')}
                </button>
            </div>
        </form>
      </div>

      {bmiResult && (
        <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in">
          <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('bmi.results.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResultCard title={t('bmi.results.bmi')} value={bmiResult.bmi} colorClass={bmiResult.colorClass} />
            <ResultCard title={t('bmi.results.category')} value={bmiResult.category} colorClass={bmiResult.colorClass} />
            <ResultCard title={t('bmi.results.healthyRange')} value={bmiResult.healthyRange} colorClass="border-cyan-500" />
          </div>
            <div className="text-center mt-6">
                <button onClick={handleSave} disabled={isSaved} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isSaved ? t('common.done') : t('history.item.save')}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default BMICalculator;