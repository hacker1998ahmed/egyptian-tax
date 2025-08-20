import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { Language } from '../types';
import ar from './locales/ar';
import en from './locales/en';

const translations = { ar, en };

// This generates a type that includes all keys from the 'ar' translation file.
// It ensures type safety when using the t() function.
export type TranslationKey = keyof typeof ar;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, ...args: (string | number)[]) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useLocalStorage<Language>('language', 'ar');

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.title = language === 'ar' ? 'حاسبة الضرائب والتأمينات المصرية' : 'Egyptian Tax & Insurance Calculator';
  }, [language]);

  const t = (key: TranslationKey, ...args: (string | number)[]): string => {
    // Fallback logic: Try current language, then English, then just return the key.
    let translation = translations[language][key] || translations['en'][key] || String(key);
    
    // Replace placeholders like {0}, {1} with arguments
    if (args.length > 0) {
      args.forEach((arg, index) => {
        translation = translation.replace(new RegExp(`\\{${index}\\}`, 'g'), String(arg));
      });
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};