import React from 'react';
import type { Page } from '../types';
import { useTranslation } from '../i18n/context';

interface RoadmapProps {
  setActivePage: (page: Page) => void;
}

const PhaseCard: React.FC<{ phase: string; title: string; children: React.ReactNode; icon: React.ReactNode }> = ({ phase, title, children, icon }) => (
  <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 shadow-xl shadow-gray-400/20 dark:shadow-2xl dark:shadow-fuchsia-500/10 dark:backdrop-blur-sm relative overflow-hidden">
    <div className="absolute -top-4 -right-4 text-gray-200 dark:text-gray-700/50 text-6xl font-bold">{icon}</div>
    <div className="relative">
      <span className="text-sm font-bold text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/50 px-3 py-1 rounded-full">{phase}</span>
      <h3 className="text-2xl font-bold mt-3 text-fuchsia-800 dark:text-fuchsia-300">{title}</h3>
      <ul className="mt-4 space-y-2 text-gray-700 dark:text-gray-300 list-disc list-inside">
        {children}
      </ul>
    </div>
  </div>
);

const Roadmap: React.FC<RoadmapProps> = ({ setActivePage }) => {
  const { t } = useTranslation();
  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center mb-6">
         <button onClick={() => setActivePage('settings')} className="ms-4 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors" aria-label={t('roadmap.back')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
         </button>
         <h2 className="text-3xl font-bold text-fuchsia-700 dark:text-fuchsia-400" style={{ textShadow: 'var(--roadmap-header-shadow)' }}>
            <style>{`.dark h2 { --roadmap-header-shadow: 0 0 5px #e879f9; }`}</style>
            {t('roadmap.title')}
         </h2>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
        {t('roadmap.subtitle')}
      </p>

      <div className="space-y-8">
        <PhaseCard phase={t('roadmap.phase.1')} title={t('roadmap.phase1.title')} icon={<span>🚀</span>}>
          <li><strong>{t('roadmap.phase1.item1')}</strong></li>
          <li><strong>{t('roadmap.phase1.item2')}</strong></li>
          <li><strong>{t('roadmap.phase1.item3')}</strong></li>
          <li><strong>{t('roadmap.phase1.item4')}</strong></li>
        </PhaseCard>

        <PhaseCard phase={t('roadmap.phase.2')} title={t('roadmap.phase2.title')} icon={<span>🧩</span>}>
          <li><strong>{t('roadmap.phase2.item1')} <span className="text-xs font-bold text-green-600 dark:text-green-400">({t('common.done')})</span></strong></li>
          <li><strong>{t('roadmap.phase2.item2')} <span className="text-xs font-bold text-green-600 dark:text-green-400">({t('common.done')})</span></strong></li>
          <li><strong>{t('roadmap.phase2.item3')} <span className="text-xs font-bold text-green-600 dark:text-green-400">({t('common.done')})</span></strong></li>
          <li><strong>{t('roadmap.phase2.item4')} <span className="text-xs font-bold text-green-600 dark:text-green-400">({t('common.done')})</span></strong></li>
          <li><strong>{t('roadmap.phase2.item5')}</strong></li>
        </PhaseCard>

        <PhaseCard phase={t('roadmap.phase.3')} title={t('roadmap.phase3.title')} icon={<span>💡</span>}>
          <li><strong>{t('roadmap.phase3.item1')} <span className="text-xs font-bold text-green-600 dark:text-green-400">({t('common.done')})</span></strong></li>
          <li><strong>{t('roadmap.phase3.item2')} <span className="text-xs font-bold text-green-600 dark:text-green-400">({t('common.done')})</span></strong></li>
          <li><strong>{t('roadmap.phase3.item3')} <span className="text-xs font-bold text-green-600 dark:text-green-400">({t('common.done')})</span></strong></li>
          <li><strong>{t('roadmap.phase3.item4')} <span className="text-xs font-bold text-green-600 dark:text-green-400">({t('common.done')})</span></strong></li>
        </PhaseCard>
        
         <PhaseCard phase={t('roadmap.phase.4')} title={t('roadmap.phase4.title')} icon={<span>💬</span>}>
          <li><strong>{t('roadmap.phase4.item1')}</strong></li>
          <li><strong>{t('roadmap.phase4.item2')}</strong></li>
          <li><strong>{t('roadmap.phase4.item3')}</strong></li>
        </PhaseCard>
      </div>
    </div>
  );
};

export default Roadmap;