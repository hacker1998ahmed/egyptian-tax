import React from 'react';
import { useTranslation } from '../i18n/context';

interface IncomeChartProps {
  grossIncome: number;
  netIncome: number;
  totalTax: number;
  totalInsurance: number;
}


const LegendItem: React.FC<{ color: string, label: string, value: number, percentage: string, formatCurrency: (val: number) => string }> = ({ color, label, value, percentage, formatCurrency }) => (
  <div className="flex items-center justify-between text-sm">
    <div className="flex items-center">
      <span className="w-3 h-3 rounded-full me-2" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}></span>
      <span>{label}</span>
    </div>
    <div className="font-mono text-right">
        <span>{percentage}%</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 block">{formatCurrency(value)}</span>
    </div>
  </div>
);

const IncomeChart: React.FC<IncomeChartProps> = ({ grossIncome, netIncome, totalTax, totalInsurance }) => {
  const { t, language } = useTranslation();

  const formatCurrency = (amount: number) => {
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (grossIncome <= 0) return null;

  const taxPercent = (totalTax / grossIncome) * 100;
  const insurancePercent = (totalInsurance / grossIncome) * 100;
  const netPercent = 100 - taxPercent - insurancePercent;

  const circumference = 2 * Math.PI * 45; // radius = 45
  
  const taxColor = document.documentElement.classList.contains('dark') ? '#ef4444' : '#dc2626';
  const insuranceColor = document.documentElement.classList.contains('dark') ? '#facc15' : '#d97706';
  const netColor = document.documentElement.classList.contains('dark') ? '#4ade80' : '#16a34a';


  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-4">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="-rotate-90">
          {/* Background Circle */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="10" />
          
          {/* Segments are drawn as a stack */}
          {netPercent > 0 && (
             <circle
              cx="50" cy="50" r="45" fill="none" stroke={netColor} strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (netPercent/100)*circumference}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          )}
          {insurancePercent > 0 && (
            <circle
              cx="50" cy="50" r="45" fill="none" stroke={insuranceColor} strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - ((netPercent + insurancePercent)/100)*circumference}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          )}
          {taxPercent > 0 && (
            <circle
              cx="50" cy="50" r="45" fill="none" stroke={taxColor} strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={0}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          )}

        </svg>
         <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('report.grossIncomeShort')}</span>
            <span className="font-bold text-lg text-gray-800 dark:text-white">
              {formatCurrency(grossIncome)}
            </span>
        </div>
      </div>
      <div className="w-full md:w-60 space-y-3">
        <LegendItem color={netColor} label={t('report.netIncome')} value={netIncome} percentage={netPercent.toFixed(1)} formatCurrency={formatCurrency}/>
        <LegendItem color={taxColor} label={t('report.totalTax')} value={totalTax} percentage={taxPercent.toFixed(1)} formatCurrency={formatCurrency} />
        <LegendItem color={insuranceColor} label={t('report.totalInsurance')} value={totalInsurance} percentage={insurancePercent.toFixed(1)} formatCurrency={formatCurrency} />
      </div>
    </div>
  );
};

export default IncomeChart;