import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNavBar from './components/navigation/BottomNavBar';
import type { Page, Theme, Language } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { LanguageProvider } from './i18n/context';

// Dynamic page imports
import Dashboard from './pages/Dashboard';
import SalaryTaxCalculator from './pages/SalaryTaxCalculator';
import CorporateTaxCalculator from './pages/CorporateTaxCalculator';
import VATTaxCalculator from './pages/VATTaxCalculator';
import RealEstateTaxCalculator from './pages/RealEstateTaxCalculator';
import WithholdingTaxCalculator from './pages/WithholdingTaxCalculator';
import SocialInsuranceCalculator from './pages/SocialInsuranceCalculator';
import StampDutyCalculator from './pages/StampDutyCalculator';
import LoanCalculator from './pages/LoanCalculator';
import ScientificCalculator from './pages/ScientificCalculator';
import AgeCalculator from './pages/AgeCalculator';
import History from './pages/History';
import Settings from './pages/Settings';
import AskExpert from './pages/AskExpert';
import Roadmap from './pages/Roadmap';
import ZakatCalculator from './pages/ZakatCalculator';
import InvestmentCalculator from './pages/InvestmentCalculator';
import EndOfServiceCalculator from './pages/EndOfServiceCalculator';
import FeasibilityStudyCalculator from './pages/FeasibilityStudyCalculator';
import ElectricityCalculator from './pages/ElectricityCalculator';
import BMICalculator from './pages/BMICalculator';
import InheritanceCalculator from './pages/InheritanceCalculator';
import CustomsCalculator from './pages/CustomsCalculator';
import PayrollCalculator from './pages/PayrollCalculator';


function AppContent(): React.ReactNode {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setActivePage={setCurrentPage} />;
      case 'salaryCalculator':
        return <SalaryTaxCalculator />;
      case 'corporateCalculator':
        return <CorporateTaxCalculator />;
      case 'vatCalculator':
        return <VATTaxCalculator />;
      case 'realEstateCalculator':
        return <RealEstateTaxCalculator />;
      case 'withholdingCalculator':
        return <WithholdingTaxCalculator />;
      case 'socialInsuranceCalculator':
        return <SocialInsuranceCalculator />;
      case 'stampDutyCalculator':
        return <StampDutyCalculator />;
      case 'loanCalculator':
        return <LoanCalculator />;
      case 'scientificCalculator':
        return <ScientificCalculator />;
      case 'ageCalculator':
        return <AgeCalculator />;
      case 'zakatCalculator':
        return <ZakatCalculator />;
      case 'investmentCalculator':
        return <InvestmentCalculator />;
      case 'endOfServiceCalculator':
        return <EndOfServiceCalculator />;
      case 'feasibilityStudyCalculator':
        return <FeasibilityStudyCalculator />;
      case 'electricityCalculator':
        return <ElectricityCalculator />;
      case 'bmiCalculator':
        return <BMICalculator />;
      case 'inheritanceCalculator':
        return <InheritanceCalculator />;
      case 'customsCalculator':
        return <CustomsCalculator />;
      case 'payrollCalculator':
        return <PayrollCalculator />;
      case 'history':
        return <History />;
      case 'askExpert':
        return <AskExpert />;
      case 'settings':
        return <Settings setActivePage={setCurrentPage} theme={theme} setTheme={setTheme} />;
      case 'roadmap':
        return <Roadmap setActivePage={setCurrentPage} />;
      default:
        return <Dashboard setActivePage={setCurrentPage} />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white flex flex-col selection:bg-cyan-500 selection:text-black transition-colors duration-300">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 pb-24">
        {renderCurrentPage()}
      </main>
      <BottomNavBar activePage={currentPage} setActivePage={setCurrentPage} />
    </div>
  );
}

function App(): React.ReactNode {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App;