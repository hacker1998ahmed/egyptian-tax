import React, { useState } from 'react';
import Modal from '../components/Modal';
import { DEVELOPER_INFO } from '../constants';
import type { Page, Theme } from '../types';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from '../i18n/context';

interface SettingsProps {
  setActivePage: (page: Page) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const Settings: React.FC<SettingsProps> = ({ setActivePage, theme, setTheme }) => {
  const { t } = useTranslation();
  const [isAboutModalOpen, setAboutModalOpen] = useState(false);
  const [isPrivacyModalOpen, setPrivacyModalOpen] = useState(false);

  const aboutContent = (
    <div className="space-y-4 text-gray-700 dark:text-gray-300">
      <h3 className="text-xl font-bold text-cyan-700 dark:text-cyan-400">{t('settings.about.modal.title')}</h3>
      <p>
        {t('settings.about.modal.p1')}
      </p>
      
      <div className="pt-4 border-t border-gray-200 dark:border-cyan-500/20">
        <h3 className="text-xl font-bold text-cyan-700 dark:text-cyan-400">{t('settings.about.modal.developerGroupTitle')}</h3>
        <p>
          <a href="https://www.facebook.com/profile.php?id=100049475271023&sk=followers" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors font-bold">
            {t('settings.about.modal.developerGroupName')}
          </a>
        </p>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-cyan-500/20">
        <h3 className="text-xl font-bold text-cyan-700 dark:text-cyan-400">{t('settings.about.modal.developerTitle')}</h3>
        <ul className="space-y-2">
            <li><strong>{t('settings.about.modal.name')}:</strong> {DEVELOPER_INFO.name}</li>
            <li><strong>{t('settings.about.modal.phone')}:</strong> <a href={`tel:${DEVELOPER_INFO.phone}`} className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">{DEVELOPER_INFO.phone}</a></li>
            <li><strong>{t('settings.about.modal.email')}:</strong> <a href={`mailto:${DEVELOPER_INFO.email}`} className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">{DEVELOPER_INFO.email}</a></li>
        </ul>
      </div>
    </div>
  );

  const privacyContent = (
    <div className="space-y-4 text-gray-700 dark:text-gray-300">
      <h3 className="text-xl font-bold text-cyan-700 dark:text-cyan-400">{t('settings.privacy.modal.title')}</h3>
      <p>{t('settings.privacy.modal.p1')}</p>
      <p>{t('settings.privacy.modal.p2')}</p>
      <p>{t('settings.privacy.modal.p3')}</p>
    </div>
  );
  
  const SettingsItem: React.FC<{title: string, description: string, onClick?: () => void, children?: React.ReactNode}> = ({title, description, onClick, children}) => (
    <div 
        onClick={onClick}
        className={`w-full text-start p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-cyan-500/30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
    >
        <div className="flex justify-between items-center">
            <div>
                <h3 className="text-lg font-bold text-cyan-800 dark:text-cyan-300">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            {children && <div className="flex-shrink-0">{children}</div>}
        </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-bold text-cyan-700 dark:text-cyan-400 mb-6" style={{ textShadow: 'var(--settings-header-shadow)' }}>
         <style>{`.dark h2 { --settings-header-shadow: 0 0 5px #22d3ee; }`}</style>
         {t('settings.title')}
      </h2>
      <div className="space-y-4">
        
        <SettingsItem title={t('settings.theme.title')} description={t('settings.theme.description')}>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </SettingsItem>

        <SettingsItem title={t('settings.language.title')} description={t('settings.language.description')}>
          <LanguageSwitcher />
        </SettingsItem>
        
        <SettingsItem 
            title={t('settings.about.title')}
            description={t('settings.about.description')}
            onClick={() => setAboutModalOpen(true)}
        />
        <SettingsItem 
            title={t('settings.privacy.title')} 
            description={t('settings.privacy.description')}
            onClick={() => setPrivacyModalOpen(true)}
        />
        <SettingsItem 
            title={t('settings.roadmap.title')} 
            description={t('settings.roadmap.description')}
            onClick={() => setActivePage('roadmap')}
        />
      </div>
      
      <Modal 
        isOpen={isAboutModalOpen} 
        onClose={() => setAboutModalOpen(false)} 
        title={t('settings.about.title')}
      >
        {aboutContent}
      </Modal>
      <Modal 
        isOpen={isPrivacyModalOpen} 
        onClose={() => setPrivacyModalOpen(false)} 
        title={t('settings.privacy.title')}
      >
        {privacyContent}
      </Modal>
    </div>
  );
};

export default Settings;