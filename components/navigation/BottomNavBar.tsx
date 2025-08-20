import React from 'react';
import type { Page } from '../../types';
import { useTranslation } from '../../i18n/context';

interface BottomNavBarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  const activeClasses = 'text-cyan-600 dark:text-cyan-400';
  const inactiveClasses = 'text-gray-500 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-300';

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
    >
      <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
        {icon}
      </div>
      <span className="text-xs mt-1">{label}</span>
      {isActive && (
         <div className="w-8 h-1 bg-cyan-500 dark:bg-cyan-400 rounded-full mt-1 shadow-lg shadow-cyan-500/50" />
      )}
    </button>
  );
};


const BottomNavBar: React.FC<BottomNavBarProps> = ({ activePage, setActivePage }) => {
  const { t } = useTranslation();
  
  const isDashboardView = ![
    'history', 'askExpert', 'settings', 'roadmap'
  ].includes(activePage);
  
  const isSettingsView = ['settings', 'roadmap'].includes(activePage);

  const navItems = [
    {
      id: 'dashboard',
      label: t('nav.home'),
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
      isActive: isDashboardView,
      onClick: () => setActivePage('dashboard'),
    },
    {
      id: 'history',
      label: t('nav.history'),
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      isActive: activePage === 'history',
      onClick: () => setActivePage('history'),
    },
    {
      id: 'askExpert',
      label: t('nav.askExpert'),
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
      isActive: activePage === 'askExpert',
      onClick: () => setActivePage('askExpert'),
    },
    {
      id: 'settings',
      label: t('nav.settings'),
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      isActive: isSettingsView,
      onClick: () => setActivePage('settings'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-cyan-500/30 shadow-2xl dark:shadow-cyan-500/20 z-50">
      <div className="flex justify-around h-full">
        {navItems.map(item => (
          <NavItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            isActive={item.isActive}
            onClick={item.onClick}
          />
        ))}
      </div>
    </nav>
  );
};

export default BottomNavBar;