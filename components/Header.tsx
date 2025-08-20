import React from 'react';
import { useTranslation } from '../i18n/context';

const Header: React.FC = () => {
  const { t } = useTranslation();
  return (
    <header className="py-6 text-center border-b-2 border-gray-200 dark:border-cyan-500/30 shadow-lg shadow-gray-500/10 dark:shadow-cyan-500/10">
      <h1 
        className="text-3xl md:text-5xl font-bold text-cyan-600 dark:text-cyan-400"
        style={{ textShadow: 'var(--header-shadow)' }}
      >
        <style>{`.dark h1 { --header-shadow: 0 0 5px #22d3ee, 0 0 10px #22d3ee, 0 0 15px #22d3ee; }`}</style>
        {t('header.title')}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-2">{t('header.subtitle')}</p>
    </header>
  );
};

export default Header;