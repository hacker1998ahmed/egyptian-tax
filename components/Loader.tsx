import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../i18n/context';

const Loader: React.FC = () => {
  const { t } = useTranslation();

  const LOADING_MESSAGES = useMemo(() => [
    t('loader.contacting'),
    t('loader.analyzing'),
    t('loader.calculating'),
    t('loader.compiling'),
    t('loader.finalizing'),
  ], [t]);

  const [message, setMessage] = useState(LOADING_MESSAGES[0]);

  useEffect(() => {
    // Update message immediately if language changes
    setMessage(LOADING_MESSAGES[0]);

    const intervalId = setInterval(() => {
      setMessage(prevMessage => {
        const currentIndex = LOADING_MESSAGES.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
        return LOADING_MESSAGES[nextIndex];
      });
    }, 2500);

    return () => clearInterval(intervalId);
  }, [LOADING_MESSAGES]);

  return (
    <div className="flex flex-col justify-center items-center my-12 text-center animate-fade-in">
      <div 
        className="w-16 h-16 border-4 border-cyan-500 dark:border-cyan-400 border-t-transparent rounded-full animate-spin"
        style={{
          boxShadow: 'var(--loader-shadow)'
        }}
      >
         <style>{`.dark div { --loader-shadow: 0 0 10px #22d3ee, 0 0 20px #22d3ee, inset 0 0 10px #22d3ee; }`}</style>
      </div>
      <p className="mt-4 text-cyan-600 dark:text-cyan-300 text-lg transition-opacity duration-500" style={{textShadow: 'var(--loader-text-shadow)'}}>
        <style>{`.dark p { --loader-text-shadow: 0 0 5px #22d3ee; }`}</style>
        {message}
      </p>
    </div>
  );
};

export default Loader;