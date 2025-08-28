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
import FixedAssetsCalculator from './pages/FixedAssetsCalculator';
import Invoicing from './pages/Invoicing';
import Inventory from './pages/Inventory';
import CurrencyConverter from './pages/CurrencyConverter';
import SavingsGoalCalculator from './pages/SavingsGoalCalculator';
import ProfitMarginCalculator from './pages/ProfitMarginCalculator';
import FinancialDashboard from './pages/FinancialDashboard';
import TaxPlanner from './pages/TaxPlanner';
import PerformanceAnalysis from './pages/PerformanceAnalysis';
import TaxForecast from './pages/TaxForecast';
import ShareCapitalCalculator from './pages/ShareCapitalCalculator';
import TipCalculator from './pages/TipCalculator';
import FuelCostCalculator from './pages/FuelCostCalculator';
import DateDifferenceCalculator from './pages/DateDifferenceCalculator';
import TimeCalculator from './pages/TimeCalculator';
import PercentageCalculator from './pages/PercentageCalculator';
import UnitConverter from './pages/UnitConverter';
import GpaCalculator from './pages/GpaCalculator';
import DueDateCalculator from './pages/DueDateCalculator';
import CalorieCalculator from './pages/CalorieCalculator';
import DiscountCalculator from './pages/DiscountCalculator';
import PaceCalculator from './pages/PaceCalculator';
import TransportationFareCalculator from './pages/TransportationFareCalculator';
import PasswordGenerator from './pages/PasswordGenerator';
import QrCodeGenerator from './pages/QrCodeGenerator';
import RoiCalculator from './pages/RoiCalculator';
import InflationCalculator from './pages/InflationCalculator';
import RetirementCalculator from './pages/RetirementCalculator';
import CookingConverter from './pages/CookingConverter';
import OvulationCalculator from './pages/OvulationCalculator';
import FreelancerTaxCalculator from './pages/FreelancerTaxCalculator';
import CapitalGainsTaxCalculator from './pages/CapitalGainsTaxCalculator';
import RealEstateTransactionTaxCalculator from './pages/RealEstateTransactionTaxCalculator';


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
      case 'fixedAssetsCalculator':
        return <FixedAssetsCalculator />;
      case 'invoicing':
        return <Invoicing />;
      case 'inventory':
        return <Inventory />;
      case 'financialDashboard':
        return <FinancialDashboard />;
      case 'taxPlanner':
        return <TaxPlanner />;
      case 'performanceAnalysis':
        return <PerformanceAnalysis />;
      case 'taxForecast':
        return <TaxForecast />;
      case 'currencyConverter':
        return <CurrencyConverter />;
      case 'savingsGoalCalculator':
        return <SavingsGoalCalculator />;
      case 'profitMarginCalculator':
        return <ProfitMarginCalculator />;
      case 'shareCapitalCalculator':
        return <ShareCapitalCalculator />;
      case 'tipCalculator':
        return <TipCalculator />;
      case 'fuelCostCalculator':
        return <FuelCostCalculator />;
      case 'dateDifferenceCalculator':
        return <DateDifferenceCalculator />;
      case 'timeCalculator':
        return <TimeCalculator />;
      case 'percentageCalculator':
        return <PercentageCalculator />;
      case 'unitConverter':
        return <UnitConverter />;
      case 'gpaCalculator':
        return <GpaCalculator />;
      case 'dueDateCalculator':
        return <DueDateCalculator />;
      case 'ovulationCalculator':
        return <OvulationCalculator />;
      case 'calorieCalculator':
        return <CalorieCalculator />;
      case 'discountCalculator':
        return <DiscountCalculator />;
      case 'paceCalculator':
        return <PaceCalculator />;
      case 'transportationFareCalculator':
        return <TransportationFareCalculator />;
      case 'passwordGenerator':
        return <PasswordGenerator />;
      case 'qrCodeGenerator':
        return <QrCodeGenerator />;
      case 'roiCalculator':
        return <RoiCalculator />;
      case 'inflationCalculator':
        return <InflationCalculator />;
      case 'retirementCalculator':
        return <RetirementCalculator />;
      case 'cookingConverter':
        return <CookingConverter />;
      case 'freelancerTaxCalculator':
        return <FreelancerTaxCalculator />;
      case 'capitalGainsTaxCalculator':
        return <CapitalGainsTaxCalculator />;
      case 'realEstateTransactionTaxCalculator':
        return <RealEstateTransactionTaxCalculator />;
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
    <div className="h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white flex flex-col selection:bg-cyan-500 selection:text-black transition-colors duration-300">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 pb-24 overflow-y-auto">
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