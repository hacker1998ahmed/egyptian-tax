export interface CalculationStep {
  description: string;
  amount: string | number;
}

export interface ReportData {
  summary: string;
  calculations: CalculationStep[];
  grossIncome: number;
  totalTax: number;
  totalInsurance: number;
  netIncome: number;
  applicableLaws: string[];
}

export interface TaxParams {
  income: number;
  year: number;
  taxType: string;
  insuranceType: string;
}

export type CorporateTaxLaw = 'standard_22.5' | 'law_175_2023' | 'law_30_2023' | 'law_6_2025';

export interface CorporateTaxParams {
  revenue: number;
  expenses?: number; // Optional, as it's not needed for turnover tax
  entityType: string;
  year: number;
  law: CorporateTaxLaw;
}

export interface VatBreakdown {
  rate14: number;
  rate10: number;
  rate5: number;
  exempt: number;
  creditNote: number; // For sales returns or purchase returns
  debitNote: number;  // For additional charges
}

export interface VATTaxParams {
  month: number;
  year: number;
  sales: VatBreakdown;
  purchases: VatBreakdown;
  previousCredit: number;
}


export interface RealEstateTaxParams {
  marketValue: number;
  propertyType: string;
  isPrimaryResidence: 'yes' | 'no';
  year: number;
}

export interface WithholdingTaxParams {
  amount: number;
  transactionType: string;
  year: number;
}

export interface SocialInsuranceParams {
    basicWage: number;
    variableWage: number;
    year: number;
}

export interface StampDutyParams {
    amount: number;
    transactionType: string;
    year: number;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

// New Param Interfaces
export interface ZakatParams {
  goldPrice: number;
  cash: number;
  stocks: number;
  tradeGoods: number;
  debts: number;
}

export interface InvestmentParams {
  initialAmount: number;
  monthlyContribution: number;
  interestRate: number;
  years: number;
}

export interface EndOfServiceParams {
  lastSalary: number;
  yearsOfService: number;
}

export interface FeasibilityStudyParams {
  fixedCosts: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
}

export interface ElectricityParams {
  consumptionKwh: number;
  meterType: string;
}

export interface InheritanceParams {
  estateValue: number;
  hasSpouse: 'no' | 'husband' | 'wife';
  sons: number;
  daughters: number;
  father: boolean;
  mother: boolean;
  paternalGrandfather: boolean;
  maternalGrandmother: boolean;
  paternalGrandmother: boolean;
  fullBrothers: number;
  fullSisters: number;
  paternalBrothers: number;
  paternalSisters: number;
  maternalSiblings: number; // brothers or sisters
}

export interface CustomsParams {
    shipmentValue: number;
    description: string;
    countryOfOrigin: string;
    category: string;
}

export interface PayrollParams {
  grossMonthlySalary: number;
  allowances: number;
  deductions: number;
  year: number;
}

export interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}
export interface LoanParams {
  amount: number;
  interestRate: number;
  term: number;
  loanType: 'amortizing' | 'decreasing';
}

export interface SavingsGoalParams {
    goalName: string;
    targetAmount: number;
    initialDeposit: number;
    monthlyContribution: number;
    annualRate: number;
}

export interface ProfitMarginParams {
    revenue: number;
    cogs: number;
    operatingExpenses: number;
}


export type CalculationRecordType = 
  'salary' | 
  'corporate' | 
  'vat' | 
  'realEstate' | 
  'withholding' | 
  'socialInsurance' | 
  'stampDuty' |
  'zakat' |
  'investment' |
  'endOfService' |
  'feasibilityStudy' |
  'electricity' |
  'inheritance' |
  'customs' |
  'payroll' |
  'loan' |
  'profitMargin';

export interface CalculationRecord {
  id: string;
  timestamp: string;
  type: CalculationRecordType;
  params: TaxParams | CorporateTaxParams | VATTaxParams | RealEstateTaxParams | WithholdingTaxParams | SocialInsuranceParams | StampDutyParams | ZakatParams | InvestmentParams | EndOfServiceParams | FeasibilityStudyParams | ElectricityParams | InheritanceParams | CustomsParams | PayrollParams | LoanParams | SavingsGoalParams | ProfitMarginParams;
  report: ReportData;
}

export type Page = 
  'dashboard' | 
  'salaryCalculator' | 
  'corporateCalculator' | 
  'vatCalculator' | 
  'realEstateCalculator' | 
  'withholdingCalculator' | 
  'socialInsuranceCalculator' | 
  'stampDutyCalculator' | 
  'loanCalculator' |
  'scientificCalculator' |
  'ageCalculator' |
  'zakatCalculator' |
  'investmentCalculator' |
  'endOfServiceCalculator' |
  'feasibilityStudyCalculator' |
  'electricityCalculator' |
  'bmiCalculator' |
  'inheritanceCalculator' |
  'customsCalculator' |
  'payrollCalculator' |
  'currencyConverter' |
  'savingsGoalCalculator' |
  'profitMarginCalculator' |
  'history' | 
  'settings' | 
  'askExpert' | 
  'roadmap';

export type Theme = 'light' | 'dark';
export type Language = 'ar' | 'en';