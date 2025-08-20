import React from 'react';
import { useTranslation } from '../i18n/context';
import type { Language } from '../types';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useTranslation();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const buttonClasses = (lang: Language) => 
    `px-4 py-2 rounded-md font-bold transition-colors duration-200 ${
      language === lang 
        ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-black shadow-lg' 
        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
    }`;

  return (
    <div className="flex items-center space-x-2 rtl:space-x-reverse bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg">
      <button onClick={() => handleLanguageChange('en')} className={buttonClasses('en')}>
        EN 🇺🇸
      </button>
      <button onClick={() => handleLanguageChange('ar')} className={buttonClasses('ar')}>
        AR 🇪🇬
      </button>
    </div>
  );
};

export default LanguageSwitcher;
