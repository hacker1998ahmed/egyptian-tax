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

export type SocialInsuranceContributionParams = {
    calculationType: 'contribution';
    basicWage: number;
    variableWage: number;
    year: number;
};
export type SocialInsurancePensionParams = {
    calculationType: 'pension';
    averageWage: number;
    contributionYears: number;
};
export type SocialInsuranceLumpSumParams = {
    calculationType: 'lumpSum';
    averageWage: number;
    contributionYears: number;
};

export type SocialInsuranceParams = SocialInsuranceContributionParams | SocialInsurancePensionParams | SocialInsuranceLumpSumParams;


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

export interface Employee {
  id: string;
  name: string;
  department: string;
  grossMonthlySalary: number;
  allowances: number;
  deductions: number;
}

export interface PayrollEmployeeRecord extends Employee {
    totalInsurance: number;
    totalTax: number;
    netSalary: number;
}

export interface PayrollRun {
  id: string; // e.g., "2024-05"
  timestamp: string;
  month: number;
  year: number;
  records: PayrollEmployeeRecord[];
  summary: {
      totalGross: number;
      totalInsurance: number;
      totalTax: number;
      totalNet: number;
      employeeCount: number;
  }
}

export interface DepreciationEntry {
    year: number;
    depreciation: number;
    accumulatedDepreciation: number;
    bookValue: number;
}

export interface FixedAsset {
    id: string;
    name: string;
    purchaseDate: string;
    cost: number;
    salvageValue: number;
    usefulLife: number; // in years
    depreciationMethod: 'straight-line' | 'double-declining';
}

export interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
}

export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

export type InvoiceStatus = 'draft' | 'paid' | 'overdue';

export interface Invoice {
    id: string; // e.g., "INV-2024-001"
    customerId: string;
    issueDate: string;
    dueDate: string;
    items: InvoiceItem[];
    notes?: string;
    status: InvoiceStatus;
    taxRate: number; // e.g., 0.14 for 14% VAT
}

export interface Product {
    id: string;
    name: string;
    sku: string; // Stock Keeping Unit
    costPrice: number;
    sellingPrice: number;
    quantity: number;
    lowStockThreshold: number;
}

export interface ShareCapitalParams {
    authorizedCapital: number;
    issuedCapital: number;
    paidInCapital: number;
    numberOfShares: number;
}

export interface TipParams {
    billAmount: number;
    tipPercentage: number;
    numberOfPeople: number;
}

export interface FuelCostParams {
    distance: number;
    efficiency: number;
    pricePerLiter: number;
}

export interface RoiParams {
    initialInvestment: number;
    finalValue: number;
}

export interface RetirementParams {
    currentAge: number;
    retirementAge: number;
    currentSavings: number;
    monthlyContribution: number;
    annualReturn: number;
    desiredMonthlyIncome: number;
}

export interface FreelancerTaxParams {
    revenue: number;
    expenseType: 'actual' | 'deemed';
    actualExpenses?: number;
    year: number;
}

export interface CapitalGainsTaxParams {
    purchasePrice: number;
    sellingPrice: number;
    costs: number; // Brokerage fees, etc.
    year: number;
}

export interface RealEstateTransactionTaxParams {
    saleValue: number;
    year: number;
}

export interface BmiParams {
    height: number;
    weight: number;
}
export interface GpaParams {
    courses: { name: string; credits: number; grade: number }[];
}
export interface CalorieParams {
    age: number;
    gender: 'male' | 'female';
    height: number;
    weight: number;
    activity: number;
}
export interface DiscountParams {
    originalPrice: number;
    discount: number;
}
export interface PaceParams {
    distance: number;
    hours: number;
    minutes: number;
    seconds: number;
}
export interface RiderType {
    id: number;
    count: number;
    fare: number;
}
export interface TransportationParams {
    mode: 'group' | 'personal';
    groupParams?: RiderType[];
    personalParams?: { farePerTrip: number; tripsPerDay: number; daysPerWeek: number };
}
export interface InflationParams {
    amount: number;
    rate: number;
    years: number;
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
  'profitMargin' |
  'shareCapital' |
  'roi' |
  'retirement' |
  'freelancer' |
  'capitalGains' |
  'realEstateTransaction' |
  'bmi' |
  'savingsGoal' |
  'tip' |
  'fuelCost' |
  'gpa' |
  'calorie' |
  'discount' |
  'pace' |
  'transportation' |
  'inflation';

export interface CalculationRecord {
  id: string;
  timestamp: string;
  type: CalculationRecordType;
  params: TaxParams | CorporateTaxParams | VATTaxParams | RealEstateTaxParams | WithholdingTaxParams | SocialInsuranceParams | StampDutyParams | ZakatParams | InvestmentParams | EndOfServiceParams | FeasibilityStudyParams | ElectricityParams | InheritanceParams | CustomsParams | PayrollParams | LoanParams | SavingsGoalParams | ProfitMarginParams | ShareCapitalParams | RoiParams | RetirementParams | FreelancerTaxParams | CapitalGainsTaxParams | RealEstateTransactionTaxParams | BmiParams | TipParams | FuelCostParams | GpaParams | CalorieParams | DiscountParams | PaceParams | TransportationParams | InflationParams;
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
  'fixedAssetsCalculator' |
  'invoicing' |
  'inventory' |
  'financialDashboard' |
  'taxPlanner' |
  'performanceAnalysis' |
  'taxForecast' |
  'currencyConverter' |
  'savingsGoalCalculator' |
  'profitMarginCalculator' |
  'shareCapitalCalculator' |
  'tipCalculator' |
  'fuelCostCalculator' |
  'dateDifferenceCalculator' |
  'timeCalculator' |
  'percentageCalculator' |
  'unitConverter' |
  'gpaCalculator' |
  'dueDateCalculator' |
  'ovulationCalculator' |
  'calorieCalculator' |
  'discountCalculator' |
  'paceCalculator' |
  'transportationFareCalculator' |
  'passwordGenerator' |
  'qrCodeGenerator' |
  'roiCalculator' |
  'inflationCalculator' |
  'retirementCalculator' |
  'cookingConverter' |
  'freelancerTaxCalculator' |
  'capitalGainsTaxCalculator' |
  'realEstateTransactionTaxCalculator' |
  'history' | 
  'settings' | 
  'askExpert' | 
  'roadmap';

export type Theme = 'light' | 'dark';
export type Language = 'ar' | 'en';