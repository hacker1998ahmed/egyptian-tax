import React, { useState } from 'react';
import { useTranslation } from '../i18n/context';

const ScientificCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');

  const handleButtonClick = (value: string) => {
    if (display.length > 20) return;

    if (value === 'AC') {
      setDisplay('0');
      setExpression('');
    } else if (value === 'C') {
      setDisplay(display.slice(0, -1) || '0');
    } else if (value === '=') {
      try {
        // Basic safety: only allow valid characters
        const sanitizedExpression = expression.replace(/[^-()\d/*+.]/g, '');
        const result = eval(sanitizedExpression);
        setDisplay(String(result));
        setExpression(String(result));
      } catch {
        setDisplay(t('scientific.error'));
        setExpression('');
      }
    } else if (['sin', 'cos', 'tan', 'log', 'ln', '√'].includes(value)) {
        try {
            const num = parseFloat(display);
            let result;
            switch(value) {
                case 'sin': result = Math.sin(num * Math.PI / 180); break;
                case 'cos': result = Math.cos(num * Math.PI / 180); break;
                case 'tan': result = Math.tan(num * Math.PI / 180); break;
                case 'log': result = Math.log10(num); break;
                case 'ln': result = Math.log(num); break;
                case '√': result = Math.sqrt(num); break;
                default: result = num;
            }
            setDisplay(String(result));
            setExpression(String(result));
        } catch {
            setDisplay(t('scientific.error'));
            setExpression('');
        }
    } else if (value === 'π') {
        setDisplay(String(Math.PI));
        setExpression(prev => prev + String(Math.PI));
    } else if (value === 'e') {
        setDisplay(String(Math.E));
        setExpression(prev => prev + String(Math.E));
    }
    else {
      if (display === '0' || display === t('scientific.error')) {
        setDisplay(value);
        setExpression(value);
      } else {
        setDisplay(prev => prev + value);
        setExpression(prev => prev + value);
      }
    }
  };
  
  const CalcButton: React.FC<{ value: string, className?: string, onClick: (val: string) => void, children?: React.ReactNode }> = ({ value, className = '', onClick, children }) => {
    const baseClasses = "text-xl sm:text-2xl font-bold rounded-lg h-16 sm:h-20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors duration-200 flex justify-center items-center shadow-md";
    let colorClasses = "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white";
    if (['/', '*', '-', '+', '=', '**'].includes(value)) {
        colorClasses = "bg-cyan-600 dark:bg-cyan-500 text-white dark:text-black hover:bg-cyan-700 dark:hover:bg-cyan-400";
    } else if (['AC', 'C'].includes(value)) {
        colorClasses = "bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-500";
    }
    return <button onClick={() => onClick(value)} className={`${baseClasses} ${colorClasses} ${className}`}>{children || value}</button>
  }

  const buttons = [
    'AC', 'C', 'sin', 'cos', 'tan',
    '7', '8', '9', '/', 'log',
    '4', '5', '6', '*', 'ln',
    '1', '2', '3', '-', '√',
    '0', '.', '=', '+', 'π',
    '(', ')', 'x^y', 'e',
  ];

  return (
    <div className="max-w-md mx-auto animate-fade-in">
      <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl shadow-gray-400/20 dark:shadow-2xl dark:shadow-cyan-500/10">
        <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-4 text-center">{t('scientific.title')}</h2>
        <div className="bg-gray-100 dark:bg-gray-900/70 p-4 rounded-lg text-right text-4xl font-mono break-words mb-4 shadow-inner">
          {display}
        </div>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {buttons.map(btn => {
                 if(btn === '=') return <CalcButton key={btn} value={btn} onClick={handleButtonClick} className="col-span-1"/>
                 if(btn === 'x^y') return <CalcButton key={btn} value={"**"} onClick={handleButtonClick} className="col-span-1">x<sup>y</sup></CalcButton>
                 return <CalcButton key={btn} value={btn} onClick={handleButtonClick} />
            })}
        </div>
      </div>
    </div>
  );
};

export default ScientificCalculator;