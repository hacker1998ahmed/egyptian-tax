import React from 'react';
import { useTranslation } from '../../i18n/context';

interface CalculatorCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  enabled?: boolean;
}

const CalculatorCard: React.FC<CalculatorCardProps> = ({ title, description, icon, onClick, enabled = true }) => {
  const { t } = useTranslation();
  const baseClasses = "p-6 rounded-lg border backdrop-blur-sm transition-all duration-300 group flex flex-col h-full";
  const enabledClasses = "bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-cyan-500/30 shadow-lg dark:shadow-2xl shadow-gray-400/20 dark:shadow-cyan-500/10 hover:border-cyan-500 dark:hover:border-cyan-400 hover:shadow-cyan-500/20 dark:hover:shadow-cyan-400/20 cursor-pointer";
  const disabledClasses = "bg-gray-200 dark:bg-gray-800/30 border-gray-300 dark:border-gray-600/50 cursor-not-allowed";

  return (
    <div 
      onClick={enabled ? onClick : undefined}
      className={`${baseClasses} ${enabled ? enabledClasses : disabledClasses}`}
    >
      <div className={`text-cyan-600 dark:text-cyan-400 transition-colors duration-300 ${!enabled && 'text-gray-500'}`}>
        {icon}
      </div>
      <h3 className={`text-2xl font-bold mt-4 ${enabled ? 'text-cyan-700 dark:text-cyan-400' : 'text-gray-500'}`}>
        {title}
      </h3>
      <p className={`mt-2 text-gray-600 dark:text-gray-400 flex-grow ${!enabled && 'dark:text-gray-600'}`}>
        {description}
      </p>
      {!enabled && (
        <span className="mt-4 text-xs font-bold text-yellow-600 dark:text-yellow-500 bg-yellow-200/50 dark:bg-yellow-900/50 px-3 py-1 rounded-full self-start">
          {t('common.comingSoon')}
        </span>
      )}
    </div>
  );
};

export default CalculatorCard;