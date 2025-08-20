import React from 'react';
import type { Page } from '../types';
import CalculatorCard from '../components/dashboard/CalculatorCard';
import { useTranslation } from '../i18n/context';

interface DashboardProps {
  setActivePage: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActivePage }) => {
  const { t } = useTranslation();

  return (
    <div className="animate-fade-in space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-cyan-700 dark:text-cyan-400">{t('dashboard.title')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tax & Insurance Calculators */}
        <CalculatorCard 
          title={t('dashboard.salary.title')}
          description={t('dashboard.salary.description')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h1a2 2 0 002-2v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2h1m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>}
          onClick={() => setActivePage('salaryCalculator')}
        />
        <CalculatorCard 
          title={t('dashboard.corporate.title')}
          description={t('dashboard.corporate.description')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
          onClick={() => setActivePage('corporateCalculator')}
        />
         <CalculatorCard 
          title={t('dashboard.vat.title')}
          description={t('dashboard.vat.description')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>}
          onClick={() => setActivePage('vatCalculator')}
        />
        <CalculatorCard 
          title={t('dashboard.realEstate.title')}
          description={t('dashboard.realEstate.description')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
          onClick={() => setActivePage('realEstateCalculator')}
        />
        <CalculatorCard 
          title={t('dashboard.withholding.title')}
          description={t('dashboard.withholding.description')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>}
          onClick={() => setActivePage('withholdingCalculator')}
        />
        <CalculatorCard 
          title={t('dashboard.socialInsurance.title')}
          description={t('dashboard.socialInsurance.description')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          onClick={() => setActivePage('socialInsuranceCalculator')}
        />
         <CalculatorCard 
          title={t('dashboard.stampDuty.title')}
          description={t('dashboard.stampDuty.description')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          onClick={() => setActivePage('stampDutyCalculator')}
        />
         <CalculatorCard 
          title={t('dashboard.zakat.title')}
          description={t('dashboard.zakat.description')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.523 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.523 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
          onClick={() => setActivePage('zakatCalculator')}
        />
        <CalculatorCard 
          title={t('dashboard.investment.title')}
          description={t('dashboard.investment.description')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
          onClick={() => setActivePage('investmentCalculator')}
        />
        <CalculatorCard 
          title={t('dashboard.endOfService.title')}
          description={t('dashboard.endOfService.description')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>}
          onClick={() => setActivePage('endOfServiceCalculator')}
        />
        <CalculatorCard 
          title={t('dashboard.feasibility.title')}
          description={t('dashboard.feasibility.description')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM21 21l-5.197-5.197" /></svg>}
          onClick={() => setActivePage('feasibilityStudyCalculator')}
        />
        <CalculatorCard 
          title={t('dashboard.electricity.title')}
          description={t('dashboard.electricity.description')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>}
          onClick={() => setActivePage('electricityCalculator')}
        />
        <CalculatorCard 
          title={t('dashboard.bmi.title')}
          description={t('dashboard.bmi.description')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 0115 0m-15 0H3" /></svg>}
          onClick={() => setActivePage('bmiCalculator')}
        />
        <CalculatorCard 
          title={t('dashboard.inheritance.title')}
          description={t('dashboard.inheritance.description')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1.125-1.5M12 16.5l1.125-1.5m-1.125 1.5V14.25m0 2.25v-2.25m0 0l1.125 1.5M12 16.5l-1.125 1.5M12 14.25L10.875 15" /></svg>}
          onClick={() => setActivePage('inheritanceCalculator')}
        />
         <CalculatorCard 
          title={t('dashboard.customs.title')}
          description={t('dashboard.customs.description')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 003.375-3.375h1.5a1.125 1.125 0 011.125 1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-3 4.5a.75.75 0 100-1.5.75.75 0 000 1.5z" /></svg>}
          onClick={() => setActivePage('customsCalculator')}
        />
        
        {/* Financial & Life Tools */}
        <CalculatorCard 
          title={t('dashboard.loan.title')}
          description={t('dashboard.loan.description')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9.5V11a5.5 5.5 0 01-11 0V9.5m11 0a2.5 2.5 0 00-5 0m5 0V7.5a2.5 2.5 0 00-5 0V9.5m0 0a2.5 2.5 0 00-5 0m5 0V7.5a2.5 2.5 0 00-5 0v2M12 15.5a2.5 2.5 0 000-5m0 5a2.5 2.5 0 010-5m0 5v2.5m0-2.5a2.5 2.5 0 005 0m-5 0a2.5 2.5 0 01-5 0" /></svg>}
          onClick={() => setActivePage('loanCalculator')}
        />
        <CalculatorCard 
          title={t('dashboard.scientific.title')}
          description={t('dashboard.scientific.description')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 14h.01M9 11h.01M12 11h.01M15 11h.01M5.75 3h12.5a2.25 2.25 0 012.25 2.25v13.5a2.25 2.25 0 01-2.25 2.25H5.75A2.25 2.25 0 013.5 18.75V5.25A2.25 2.25 0 015.75 3z" /></svg>}
          onClick={() => setActivePage('scientificCalculator')}
        />
        <CalculatorCard 
          title={t('dashboard.age.title')}
          description={t('dashboard.age.description')}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0zM17.5 17.5c-1.5-1.5-3.5-2.5-5.5-2.5s-4 1-5.5 2.5" /></svg>}
          onClick={() => setActivePage('ageCalculator')}
        />
      </div>
    </div>
  );
};

export default Dashboard;