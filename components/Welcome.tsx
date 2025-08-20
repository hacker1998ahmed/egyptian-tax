import React from 'react';
import { useTranslation } from '../i18n/context';

const Welcome: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="text-center bg-white dark:bg-gray-800/50 p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl shadow-gray-400/20 dark:shadow-2xl dark:shadow-cyan-500/10 dark:backdrop-blur-sm animate-fade-in">
      <h2 
        className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-4"
        style={{ textShadow: 'var(--welcome-header-shadow)' }}
      >
        <style>{`.dark h2 { --welcome-header-shadow: 0 0 5px #22d3ee, 0 0 10px #22d3ee; }`}</style>
        {t('calculator.welcome.title')}
      </h2>
      <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto leading-relaxed">
        {t('calculator.welcome.subtitle')}
      </p>
    </div>
  );
};

export default Welcome;