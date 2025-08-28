import type { ReportData, CalculationStep, TaxParams, CorporateTaxParams, VATTaxParams, RealEstateTaxParams, WithholdingTaxParams, SocialInsuranceParams, StampDutyParams, ZakatParams, InvestmentParams, EndOfServiceParams, FeasibilityStudyParams, ElectricityParams, InheritanceParams, CustomsParams, PayrollParams, ShareCapitalParams, RoiParams, RetirementParams, FreelancerTaxParams, CapitalGainsTaxParams, RealEstateTransactionTaxParams } from '../types';
import { SALARY_TAX_BRACKETS, SOCIAL_INSURANCE_PARAMS, ELECTRICITY_BRACKETS } from './taxBrackets';

const formatCurrency = (amount: number, locale = 'ar-EG') => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' }).format(amount);
};

// Each function now returns a Promise to maintain the async structure in the components
export const getTaxReport = async (params: TaxParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    
    const insuranceRules = SOCIAL_INSURANCE_PARAMS[params.year] || SOCIAL_INSURANCE_PARAMS[2024];
    const monthlyGross = params.income / 12;
    const contributionWage = Math.max(insuranceRules.min, Math.min(monthlyGross, insuranceRules.max));
    const totalInsurance = (contributionWage * insuranceRules.employeeRate) * 12;
    calculations.push({ description: `الأجر الخاضع للتأمينات (شهرياً ${formatCurrency(contributionWage)})`, amount: formatCurrency(contributionWage * 12) });
    calculations.push({ description: "إجمالي اشتراك التأمينات السنوي (حصة العامل)", amount: formatCurrency(totalInsurance) });

    const incomeAfterInsurance = params.income - totalInsurance;
    calculations.push({ description: "صافي الدخل بعد خصم التأمينات", amount: formatCurrency(incomeAfterInsurance) });

    const brackets = SALARY_TAX_BRACKETS[params.year] || SALARY_TAX_BRACKETS[2024];
    const taxableIncome = Math.max(0, incomeAfterInsurance - brackets.personalExemption);
    calculations.push({ description: `خصم الشريحة المعفاة (شخصي)`, amount: formatCurrency(brackets.personalExemption) });
    calculations.push({ description: "وعاء الضريبة", amount: formatCurrency(taxableIncome) });
    
    let totalTax = 0;
    let remainingIncome = taxableIncome;
    
    for (const bracket of brackets.brackets) {
        if (remainingIncome <= 0) break;
        const taxableInBracket = Math.min(remainingIncome, bracket.upTo);
        const taxInBracket = taxableInBracket * bracket.rate;
        totalTax += taxInBracket;
        remainingIncome -= taxableInBracket;
        calculations.push({ description: `شريحة ${formatCurrency(bracket.upTo)} بسعر ${bracket.rate * 100}%`, amount: formatCurrency(taxInBracket) });
    }

    const netIncome = params.income - totalInsurance - totalTax;

    return {
        summary: `بناءً على دخل سنوي قدره ${formatCurrency(params.income)} لسنة ${params.year}, وبعد حساب التأمينات والضرائب، يكون صافي الدخل النهائي هو ${formatCurrency(netIncome)}.`,
        calculations,
        grossIncome: params.income,
        totalTax,
        totalInsurance,
        netIncome,
        applicableLaws: ["قانون ضريبة الدخل رقم 91 لسنة 2005 وتعديلاته.", "قانون التأمينات الاجتماعية رقم 148 لسنة 2019."]
    };
};

export const getPayrollReport = async (params: PayrollParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    
    calculations.push({ description: "الراتب الإجمالي الشهري", amount: formatCurrency(params.grossMonthlySalary) });

    // Social Insurance Calculation
    const insuranceRules = SOCIAL_INSURANCE_PARAMS[params.year] || SOCIAL_INSURANCE_PARAMS[2024];
    const contributionWage = Math.max(insuranceRules.min, Math.min(params.grossMonthlySalary, insuranceRules.max));
    const monthlyInsurance = contributionWage * insuranceRules.employeeRate;
    calculations.push({ description: "خصم حصة العامل في التأمينات", amount: formatCurrency(-monthlyInsurance) });

    // Income Tax Calculation
    const annualGross = params.grossMonthlySalary * 12;
    const annualInsurance = monthlyInsurance * 12;
    const incomeAfterInsurance = annualGross - annualInsurance;
    
    const brackets = SALARY_TAX_BRACKETS[params.year] || SALARY_TAX_BRACKETS[2024];
    const taxableIncome = Math.max(0, incomeAfterInsurance - brackets.personalExemption);
    
    let annualTax = 0;
    let remainingIncome = taxableIncome;
    
    for (const bracket of brackets.brackets) {
        if (remainingIncome <= 0) break;
        const annualTaxableInBracket = Math.min(remainingIncome, bracket.upTo);
        const taxInBracket = annualTaxableInBracket * bracket.rate;
        annualTax += taxInBracket;
        remainingIncome -= annualTaxableInBracket;
    }
    const monthlyTax = annualTax / 12;
    calculations.push({ description: "خصم ضريبة كسب العمل الشهرية", amount: formatCurrency(-monthlyTax) });
    
    if(params.allowances > 0) {
        calculations.push({ description: "إضافة بدلات ومزايا أخرى", amount: formatCurrency(params.allowances) });
    }
    if(params.deductions > 0) {
        calculations.push({ description: "خصم استقطاعات أخرى", amount: formatCurrency(-params.deductions) });
    }

    const netSalary = params.grossMonthlySalary - monthlyInsurance - monthlyTax + params.allowances - params.deductions;
    
    return {
        summary: `بناءً على راتب شهري إجمالي قدره ${formatCurrency(params.grossMonthlySalary)}, وبعد حساب التأمينات والضرائب، يكون صافي الراتب المستحق هو ${formatCurrency(netSalary)}.`,
        calculations,
        grossIncome: params.grossMonthlySalary,
        totalTax: monthlyTax,
        totalInsurance: monthlyInsurance,
        netIncome: netSalary,
        applicableLaws: ["قانون ضريبة الدخل رقم 91 لسنة 2005 وتعديلاته.", "قانون التأمينات الاجتماعية رقم 148 لسنة 2019."]
    };
};


export const getCorporateTaxReport = async (params: CorporateTaxParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    let totalTax = 0;
    let netProfit = 0;
    let summary = '';
    
    switch(params.law) {
        case 'standard_22.5':
            netProfit = params.revenue - (params.expenses || 0);
            totalTax = netProfit * 0.225;
            calculations.push({ description: "صافي الربح (الإيرادات - المصروفات)", amount: formatCurrency(netProfit) });
            calculations.push({ description: "الضريبة المستحقة (22.5%)", amount: formatCurrency(totalTax) });
            summary = "تم تطبيق سعر الضريبة القياسي 22.5% على صافي الربح.";
            break;
        // Other corporate laws can be implemented here with their specific logic
        default:
             netProfit = params.revenue - (params.expenses || 0);
             totalTax = netProfit * 0.225;
             calculations.push({ description: "صافي الربح (الإيرادات - المصروفات)", amount: formatCurrency(netProfit) });
             calculations.push({ description: "الضريبة المستحقة (22.5%)", amount: formatCurrency(totalTax) });
             summary = "تم تطبيق سعر الضريبة القياسي 22.5% على صافي الربح.";
    }

    const netIncome = params.revenue - totalTax;

     return {
        summary,
        calculations,
        grossIncome: params.revenue,
        totalTax,
        totalInsurance: 0,
        netIncome,
        applicableLaws: ["قانون ضريبة الدخل رقم 91 لسنة 2005 وتعديلاته."]
    };
};


export const getVATTaxReport = async (params: VATTaxParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];

    const outputTax14 = params.sales.rate14 * 0.14;
    const outputTax10 = params.sales.rate10 * 0.10;
    const outputTax5 = params.sales.rate5 * 0.05;
    const totalOutputTax = outputTax14 + outputTax10 + outputTax5;
    calculations.push({ description: "ضريبة المخرجات (المبيعات)", amount: formatCurrency(totalOutputTax) });

    const inputTax14 = params.purchases.rate14 * 0.14;
    const inputTax10 = params.purchases.rate10 * 0.10;
    const inputTax5 = params.purchases.rate5 * 0.05;
    const totalInputTax = inputTax14 + inputTax10 + inputTax5;
    calculations.push({ description: "ضريبة المدخلات (المشتريات) القابلة للخصم", amount: formatCurrency(totalInputTax) });
    
    const netVat = totalOutputTax - totalInputTax;
    calculations.push({ description: "صافي ضريبة الفترة", amount: formatCurrency(netVat) });

    const finalResult = netVat - params.previousCredit;
    calculations.push({ description: "خصم الرصيد الدائن السابق", amount: formatCurrency(params.previousCredit) });
    
    const totalTax = Math.max(0, finalResult);
    const creditCarriedOver = Math.abs(Math.min(0, finalResult));

    return {
        summary: finalResult >= 0 ? `الضريبة واجبة السداد هي ${formatCurrency(totalTax)}` : `يوجد رصيد دائن قدره ${formatCurrency(creditCarriedOver)} يرحل للشهر التالي.`,
        calculations,
        grossIncome: params.sales.rate14 + params.sales.rate10 + params.sales.rate5 + params.sales.exempt,
        totalTax,
        totalInsurance: 0,
        netIncome: finalResult,
        applicableLaws: ["قانون ضريبة القيمة المضافة رقم 67 لسنة 2016."]
    };
};

export const getRealEstateTaxReport = async (params: RealEstateTaxParams): Promise<ReportData> => {
     const calculations: CalculationStep[] = [];
     const estimatedAnnualRentalValue = params.marketValue * 0.03; // Assumption
     calculations.push({ description: "القيمة الإيجارية السنوية التقديرية", amount: formatCurrency(estimatedAnnualRentalValue) });

     const maintenanceDeductionRate = params.propertyType === 'residential' ? 0.30 : 0.32;
     const maintenanceDeduction = estimatedAnnualRentalValue * maintenanceDeductionRate;
     calculations.push({ description: `خصم مصاريف صيانة (${maintenanceDeductionRate * 100}%)`, amount: formatCurrency(maintenanceDeduction) });

     const netRentalValue = estimatedAnnualRentalValue - maintenanceDeduction;
     calculations.push({ description: "صافي القيمة الإيجارية", amount: formatCurrency(netRentalValue) });

     const exemption = params.isPrimaryResidence === 'yes' && params.propertyType === 'residential' ? 24000 : 0;
     calculations.push({ description: "حد الإعفاء القانوني", amount: formatCurrency(exemption) });

     const taxableAmount = Math.max(0, netRentalValue - exemption);
     calculations.push({ description: "وعاء الضريبة", amount: formatCurrency(taxableAmount) });

     const totalTax = taxableAmount * 0.10;
     calculations.push({ description: "الضريبة المستحقة (10%)", amount: formatCurrency(totalTax) });

     return {
        summary: `الضريبة العقارية السنوية المستحقة على عقار بقيمة ${formatCurrency(params.marketValue)} هي ${formatCurrency(totalTax)}.`,
        calculations,
        grossIncome: params.marketValue,
        totalTax,
        totalInsurance: 0,
        netIncome: -totalTax, // Representing a liability
        applicableLaws: ["قانون الضريبة على العقارات المبنية رقم 196 لسنة 2008."]
    };
};

export const getWithholdingTaxReport = async (params: WithholdingTaxParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    let rate = 0;
    switch(params.transactionType){
        case "contracting_supplies": rate = 0.01; break;
        case "services": rate = 0.03; break;
        case "commissions_brokerage": rate = 0.05; break;
        default: rate = 0.01;
    }
    const totalTax = params.amount * rate;
    const netAmount = params.amount - totalTax;

    calculations.push({ description: `قيمة التعامل`, amount: formatCurrency(params.amount) });
    calculations.push({ description: `نسبة الخصم من المنبع (${rate * 100}%)`, amount: `${rate * 100}%` });
    calculations.push({ description: `قيمة الضريبة المخصومة`, amount: formatCurrency(totalTax) });
    
    return {
        summary: `يتم خصم مبلغ ${formatCurrency(totalTax)} تحت حساب الضريبة من إجمالي مبلغ ${formatCurrency(params.amount)}.`,
        calculations,
        grossIncome: params.amount,
        totalTax,
        totalInsurance: 0,
        netIncome: netAmount,
        applicableLaws: ["قانون ضريبة الدخل رقم 91 لسنة 2005."]
    }
};

export const getSocialInsuranceReport = async (params: SocialInsuranceParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    let summary = '';
    let grossIncome = 0;
    let totalTax = 0;
    let totalInsurance = 0;
    let netIncome = 0;

    switch (params.calculationType) {
        case 'contribution': {
            const { basicWage, variableWage, year } = params;
            const insuranceRules = SOCIAL_INSURANCE_PARAMS[year] || SOCIAL_INSURANCE_PARAMS[2024];
            const totalWage = basicWage + variableWage;
            const contributionWage = Math.max(insuranceRules.min, Math.min(totalWage, insuranceRules.max));
            
            const employeeContribution = contributionWage * insuranceRules.employeeRate;
            const employerContribution = contributionWage * insuranceRules.employerRate;
            totalInsurance = employeeContribution + employerContribution;

            calculations.push({ description: "الأجر الشامل الشهري", amount: formatCurrency(totalWage) });
            calculations.push({ description: `الأجر الخاضع للتأمين (بحد أقصى ${formatCurrency(insuranceRules.max)})`, amount: formatCurrency(contributionWage) });
            calculations.push({ description: `حصة العامل (${(insuranceRules.employeeRate * 100).toFixed(2)}%)`, amount: formatCurrency(employeeContribution) });
            calculations.push({ description: `حصة صاحب العمل (${(insuranceRules.employerRate * 100).toFixed(2)}%)`, amount: formatCurrency(employerContribution) });
            
            grossIncome = totalWage;
            netIncome = totalWage - employeeContribution; // Net from employee perspective
            summary = `إجمالي الاشتراك الشهري للتأمينات الاجتماعية هو ${formatCurrency(totalInsurance)} (حصة العامل ${formatCurrency(employeeContribution)} وصاحب العمل ${formatCurrency(employerContribution)}).`;
            break;
        }
        case 'pension': {
            const { averageWage, contributionYears } = params;
            // Simplified pension formula: (Average Wage * Contribution Years) / 45
            const pension = (averageWage * Math.min(contributionYears, 36)) / 45; // Max 36 years often used in calculations
            netIncome = pension;
            calculations.push({ description: "متوسط أجر الاشتراك", amount: formatCurrency(averageWage) });
            calculations.push({ description: "عدد سنوات الاشتراك", amount: contributionYears });
            calculations.push({ description: "معامل الحساب (1/45)", amount: "1/45" });
            summary = `المعاش الشهري التقريبي المستحق هو ${formatCurrency(pension)}.`;
            break;
        }
        case 'lumpSum': {
            const { averageWage, contributionYears } = params;
            // Simplified lump sum formula: Average Wage * 12 months * 15% * years
            const lumpSum = averageWage * 12 * 0.15 * contributionYears;
            netIncome = lumpSum;
            calculations.push({ description: "متوسط أجر الاشتراك", amount: formatCurrency(averageWage) });
            calculations.push({ description: "عدد سنوات الاشتراك", amount: contributionYears });
            calculations.push({ description: "معامل الحساب (15%)", amount: "15%" });
            summary = `مبلغ الدفعة الواحدة المستحق هو ${formatCurrency(lumpSum)}.`;
            break;
        }
    }

    return {
        summary,
        calculations,
        grossIncome,
        totalTax,
        totalInsurance,
        netIncome,
        applicableLaws: ["قانون التأمينات الاجتماعية الموحد رقم 148 لسنة 2019."]
    };
};

export const getStampDutyReport = async (params: StampDutyParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    let totalTax = 0;
    let rateText = '';

    // Simplified rates, not legally accurate but serve as a model
    switch (params.transactionType) {
        case 'supply_contracts':
            totalTax = params.amount * 0.004 * 2; // 0.4% on each party
            rateText = "0.4% على كل طرف";
            break;
        case 'commercial_ads':
            totalTax = params.amount * 0.20;
            rateText = "20% ضريبة نسبية";
            break;
        case 'insurance_premiums':
            totalTax = params.amount * 0.03;
            rateText = "3% على القسط";
            break;
        case 'bank_transactions':
            totalTax = 1; // Example of a fixed fee
            rateText = "ضريبة نوعية ثابتة";
            break;
        default:
            totalTax = 5; // Generic fixed fee
            rateText = "ضريبة نوعية ثابتة";
            break;
    }

    calculations.push({ description: "قيمة التعامل", amount: formatCurrency(params.amount) });
    calculations.push({ description: `الضريبة المطبقة (${rateText})`, amount: formatCurrency(totalTax) });

    return {
        summary: `ضريبة الدمغة المستحقة على هذا التعامل هي ${formatCurrency(totalTax)}.`,
        calculations,
        grossIncome: params.amount,
        totalTax,
        totalInsurance: 0,
        netIncome: params.amount - totalTax,
        applicableLaws: ["قانون ضريبة الدمغة رقم 111 لسنة 1980 وتعديلاته."]
    };
};

export const getZakatReport = async (params: ZakatParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    const nisab = params.goldPrice * 85;
    calculations.push({ description: "النصاب (قيمة 85 جرام ذهب)", amount: formatCurrency(nisab) });
    
    const zakatableAssets = params.cash + params.stocks + params.tradeGoods;
    calculations.push({ description: "إجمالي الأصول الزكوية (نقد + أسهم + عروض تجارة)", amount: formatCurrency(zakatableAssets) });

    const zakatPool = zakatableAssets - params.debts;
    calculations.push({ description: "خصم الديون", amount: formatCurrency(params.debts) });
    calculations.push({ description: "صافي وعاء الزكاة", amount: formatCurrency(zakatPool) });
    
    const zakatDue = zakatPool > nisab ? zakatPool * 0.025 : 0;
    calculations.push({ description: "مقارنة الوعاء بالنصاب", amount: zakatPool > nisab ? "الوعاء أكبر من النصاب" : "الوعاء أقل من النصاب" });
    
    return {
        summary: zakatDue > 0 ? `الزكاة المستحقة للدفع هي ${formatCurrency(zakatDue)}.` : `لم يبلغ مالك النصاب، لا تجب عليك الزكاة هذا العام.`,
        calculations,
        grossIncome: zakatableAssets,
        totalTax: zakatDue,
        totalInsurance: 0,
        netIncome: zakatPool,
        applicableLaws: ["أحكام الزكاة في الشريعة الإسلامية."]
    };
};

export const getInvestmentReport = async (params: InvestmentParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    const { initialAmount, monthlyContribution, interestRate, years } = params;
    const n = years * 12;
    const r = interestRate / 100 / 12;

    const futureValueInitial = initialAmount * Math.pow(1 + r, n);
    const futureValueContributions = monthlyContribution * ((Math.pow(1 + r, n) - 1) / r);
    const totalFutureValue = futureValueInitial + futureValueContributions;
    
    const totalContributions = initialAmount + (monthlyContribution * n);
    const totalInterest = totalFutureValue - totalContributions;

    calculations.push({ description: "المبلغ المبدئي", amount: formatCurrency(initialAmount) });
    calculations.push({ description: "إجمالي المساهمات الشهرية", amount: formatCurrency(monthlyContribution * n) });
    calculations.push({ description: "إجمالي المساهمات", amount: formatCurrency(totalContributions) });
    calculations.push({ description: "إجمالي الأرباح المتوقعة", amount: formatCurrency(totalInterest) });

    return {
        summary: `بعد ${years} سنوات، من المتوقع أن تصل قيمة استثمارك إلى ${formatCurrency(totalFutureValue)}.`,
        calculations,
        grossIncome: totalContributions,
        totalTax: 0,
        totalInsurance: 0,
        netIncome: totalFutureValue,
        applicableLaws: ["صيغة القيمة المستقبلية للمبلغ الموحد وسلسلة الدفعات."]
    };
};

export const getEndOfServiceReport = async (params: EndOfServiceParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    const { lastSalary, yearsOfService } = params;
    
    let gratuity = 0;
    if (yearsOfService <= 5) {
        gratuity = yearsOfService * 0.5 * lastSalary;
        calculations.push({ description: `مكافأة أول 5 سنوات (${yearsOfService} سنوات × نصف شهر)`, amount: formatCurrency(gratuity) });
    } else {
        const first5YearsGratuity = 5 * 0.5 * lastSalary;
        const remainingYears = yearsOfService - 5;
        const remainingYearsGratuity = remainingYears * 1 * lastSalary;
        gratuity = first5YearsGratuity + remainingYearsGratuity;
        calculations.push({ description: "مكافأة أول 5 سنوات (5 سنوات × نصف شهر)", amount: formatCurrency(first5YearsGratuity) });
        calculations.push({ description: `مكافأة السنوات التالية (${remainingYears.toFixed(1)} سنوات × شهر كامل)`, amount: formatCurrency(remainingYearsGratuity) });
    }
    
    return {
        summary: `مكافأة نهاية الخدمة المستحقة عن ${yearsOfService} سنوات هي ${formatCurrency(gratuity)}.`,
        calculations,
        grossIncome: lastSalary,
        totalTax: 0,
        totalInsurance: 0,
        netIncome: gratuity,
        applicableLaws: ["قانون العمل المصري رقم 12 لسنة 2003."]
    };
};

export const getFeasibilityStudyReport = async (params: FeasibilityStudyParams): Promise<ReportData> => {
    const { fixedCosts, variableCostPerUnit, sellingPricePerUnit } = params;
    const contributionMargin = sellingPricePerUnit - variableCostPerUnit;
    
    if (contributionMargin <= 0) {
        throw new Error("error.unexpected");
    }

    const bepUnits = fixedCosts / contributionMargin;
    const bepValue = bepUnits * sellingPricePerUnit;
    
    const calculations = [
        { description: "هامش المساهمة للوحدة (سعر البيع - التكلفة المتغيرة)", amount: formatCurrency(contributionMargin) },
        { description: "نقطة التعادل (بالوحدات)", amount: `${bepUnits.toFixed(2)} وحدة` },
        { description: "نقطة التعادل (بالقيمة)", amount: formatCurrency(bepValue) }
    ];

    return {
        summary: `لتحقيق التعادل، يجب بيع ${bepUnits.toFixed(2)} وحدة، بما يعادل مبيعات بقيمة ${formatCurrency(bepValue)}.`,
        calculations,
        grossIncome: bepValue,
        totalTax: 0,
        totalInsurance: 0,
        netIncome: bepUnits,
        applicableLaws: ["مبادئ محاسبة التكاليف وتحليل التعادل."]
    };
};

export const getElectricityReport = async (params: ElectricityParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    const brackets = ELECTRICITY_BRACKETS[params.meterType] || ELECTRICITY_BRACKETS.residential;
    let remainingKwh = params.consumptionKwh;
    let totalCost = 0;
    let lastLimit = 0;

    for (const bracket of brackets) {
        if (remainingKwh <= 0) break;
        const kwhInBracket = Math.min(remainingKwh, bracket.limit - lastLimit);
        const costInBracket = kwhInBracket * bracket.rate;
        totalCost += costInBracket;
        calculations.push({ description: `شريحة حتى ${bracket.limit} كيلوواط (${kwhInBracket.toFixed(0)} كيلوواط × ${bracket.rate} جنيه)`, amount: formatCurrency(costInBracket) });
        remainingKwh -= kwhInBracket;
        lastLimit = bracket.limit;
    }
    
    const serviceFee = 20;
    totalCost += serviceFee;
    calculations.push({ description: "مقابل خدمة عملاء", amount: formatCurrency(serviceFee) });

    return {
        summary: `الفاتورة التقديرية لاستهلاك ${params.consumptionKwh} كيلوواط/ساعة هي ${formatCurrency(totalCost)}.`,
        calculations,
        grossIncome: params.consumptionKwh,
        totalTax: totalCost,
        totalInsurance: 0,
        netIncome: -totalCost,
        applicableLaws: ["أسعار شرائح الكهرباء المعلنة من جهاز تنظيم مرفق الكهرباء."]
    };
};

export const getInheritanceReport = async (params: InheritanceParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    let remainingEstate = params.estateValue;
    const hasChildren = params.sons > 0 || params.daughters > 0;

    const addShare = (heir: string, shareFraction: string, amount: number) => {
        if (amount > 0) {
            calculations.push({ description: `نصيب ${heir} (${shareFraction})`, amount: amount });
            remainingEstate -= amount;
        }
    };
    
    if (params.hasSpouse === 'husband') {
        const share = hasChildren ? 1/4 : 1/2;
        addShare('الزوج', hasChildren ? 'الربع' : 'النصف', params.estateValue * share);
    }
    if (params.hasSpouse === 'wife') {
        const share = hasChildren ? 1/8 : 1/4;
        addShare('الزوجة', hasChildren ? 'الثمن' : 'الربع', params.estateValue * share);
    }
    if (params.father) {
        const share = 1/6;
        addShare('الأب', 'السدس', params.estateValue * share);
    }
    if (params.mother) {
        const share = 1/6;
        addShare('الأم', 'السدس', params.estateValue * share);
    }

    if (remainingEstate > 0 && hasChildren) {
        const totalParts = (params.sons * 2) + params.daughters;
        if (totalParts > 0) {
            const sonShare = (remainingEstate / totalParts) * 2;
            const daughterShare = remainingEstate / totalParts;
            if (params.sons > 0) calculations.push({ description: `إجمالي نصيب الأبناء (${params.sons})`, amount: sonShare * params.sons });
            if (params.daughters > 0) calculations.push({ description: `إجمالي نصيب البنات (${params.daughters})`, amount: daughterShare * params.daughters });
        }
    }
    
    return {
        summary: `تم توزيع التركة البالغة ${formatCurrency(params.estateValue)} على الورثة المحددين.`,
        calculations,
        grossIncome: params.estateValue,
        totalTax: 0,
        totalInsurance: 0,
        netIncome: params.estateValue,
        applicableLaws: ["أحكام المواريث في الشريعة الإسلامية والقانون المصري."]
    };
};

export const getCustomsReport = async (params: CustomsParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    const { shipmentValue, category } = params;
    
    const dutyRates: Record<string, number> = { electronics: 0.05, clothing: 0.30, cars: 0.40, food: 0.10, other: 0.20 };
    const dutyRate = dutyRates[category] || 0.20;

    const customsDuty = shipmentValue * dutyRate;
    calculations.push({ description: `الرسم الجمركي (${(dutyRate * 100).toFixed(0)}%)`, amount: formatCurrency(customsDuty) });
    
    const vatBase = shipmentValue + customsDuty;
    const vat = vatBase * 0.14;
    calculations.push({ description: "ضريبة القيمة المضافة (14%)", amount: formatCurrency(vat) });

    const otherFees = 100;
    calculations.push({ description: "رسوم أخرى (تقديرية)", amount: formatCurrency(otherFees) });
    
    const totalFees = customsDuty + vat + otherFees;

    return {
        summary: `إجمالي الرسوم التقديرية على شحنة بقيمة ${formatCurrency(shipmentValue)} هو ${formatCurrency(totalFees)}.`,
        calculations,
        grossIncome: shipmentValue,
        totalTax: totalFees,
        totalInsurance: 0,
        netIncome: shipmentValue + totalFees,
        applicableLaws: ["قانون الجمارك رقم 207 لسنة 2020.", "قانون ضريبة القيمة المضافة رقم 67 لسنة 2016."]
    };
};

export const getShareCapitalReport = async (params: ShareCapitalParams): Promise<ReportData> => {
    const { authorizedCapital, issuedCapital, paidInCapital, numberOfShares } = params;
    const parValue = numberOfShares > 0 ? issuedCapital / numberOfShares : 0;
    const unpaidCapital = issuedCapital - paidInCapital;
    const unissuedCapital = authorizedCapital - issuedCapital;

    const calculations: CalculationStep[] = [
        { description: "القيمة الاسمية للسهم", amount: formatCurrency(parValue) },
        { description: "رأس المال غير المدفوع", amount: formatCurrency(unpaidCapital) },
        { description: "رأس المال غير المصدر", amount: formatCurrency(unissuedCapital) }
    ];

    return {
        summary: `تحليل هيكل رأس المال يظهر قيمة اسمية للسهم تبلغ ${formatCurrency(parValue)} ورأس مال غير مدفوع بقيمة ${formatCurrency(unpaidCapital)}.`,
        calculations,
        grossIncome: authorizedCapital,
        totalTax: 0,
        totalInsurance: 0,
        netIncome: paidInCapital,
        applicableLaws: ["قانون شركات المساهمة رقم 159 لسنة 1981."]
    };
};

export const getRoiReport = async (params: RoiParams): Promise<ReportData> => {
    const { initialInvestment, finalValue } = params;
    const netProfit = finalValue - initialInvestment;
    const roi = initialInvestment > 0 ? (netProfit / initialInvestment) * 100 : 0;

    const calculations: CalculationStep[] = [
        { description: "صافي الربح (القيمة النهائية - الاستثمار الأولي)", amount: formatCurrency(netProfit) },
        { description: "العائد على الاستثمار (ROI)", amount: `${roi.toFixed(2)}%` }
    ];

    return {
        summary: `حقق الاستثمار صافي ربح قدره ${formatCurrency(netProfit)}، بعائد على الاستثمار يبلغ ${roi.toFixed(2)}%.`,
        calculations,
        grossIncome: finalValue,
        totalTax: 0,
        totalInsurance: 0,
        netIncome: netProfit,
        applicableLaws: ["صيغة حساب العائد على الاستثمار."]
    };
};

export const getRetirementReport = async (params: RetirementParams): Promise<ReportData> => {
    const { currentAge, retirementAge, currentSavings, monthlyContribution, annualReturn, desiredMonthlyIncome } = params;
    const yearsToRetirement = retirementAge - currentAge;
    
    const n = yearsToRetirement * 12;
    const r = annualReturn / 100 / 12;
    const fvCurrentSavings = currentSavings * Math.pow(1 + r, n);
    const fvContributions = monthlyContribution * ((Math.pow(1 + r, n) - 1) / r);
    const projectedSavings = fvCurrentSavings + fvContributions;

    const capitalNeeded = desiredMonthlyIncome * 12 * 25;
    const shortfallOrSurplus = projectedSavings - capitalNeeded;
    
    const calculations = [
        { description: "رأس المال المطلوب عند التقاعد (قاعدة 4%)", amount: formatCurrency(capitalNeeded) },
        { description: "قيمة المدخرات الحالية عند التقاعد", amount: formatCurrency(fvCurrentSavings) },
        { description: "قيمة المساهمات الشهرية عند التقاعد", amount: formatCurrency(fvContributions) },
        { description: `الفائض أو العجز`, amount: formatCurrency(shortfallOrSurplus) },
    ];

    return {
        summary: `لتحقيق دخل شهري قدره ${formatCurrency(desiredMonthlyIncome)}، تحتاج إلى رأس مال يبلغ ${formatCurrency(capitalNeeded)}. من المتوقع أن تصل مدخراتك إلى ${formatCurrency(projectedSavings)}، مما ينتج عنه ${shortfallOrSurplus >= 0 ? 'فائض' : 'عجز'} بقيمة ${formatCurrency(Math.abs(shortfallOrSurplus))}.`,
        calculations,
        grossIncome: capitalNeeded,
        totalTax: 0,
        totalInsurance: 0,
        netIncome: projectedSavings,
        applicableLaws: ["مبادئ التخطيط المالي للتقاعد."]
    };
};

export const getFreelancerTaxReport = async (params: FreelancerTaxParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    calculations.push({ description: "إجمالي الإيرادات السنوية", amount: formatCurrency(params.revenue) });

    let expenses = 0;
    if (params.expenseType === 'deemed') {
        expenses = params.revenue * 0.10;
        calculations.push({ description: "خصم المصروفات الحكمية (10%)", amount: formatCurrency(expenses) });
    } else {
        expenses = params.actualExpenses || 0;
        calculations.push({ description: "خصم المصروفات الفعلية", amount: formatCurrency(expenses) });
    }

    const netProfit = params.revenue - expenses;
    calculations.push({ description: "صافي الربح الخاضع للضريبة", amount: formatCurrency(netProfit) });
    
    const brackets = SALARY_TAX_BRACKETS[params.year] || SALARY_TAX_BRACKETS[2024];
    const taxableIncome = Math.max(0, netProfit - brackets.personalExemption);
    calculations.push({ description: `خصم الشريحة المعفاة (شخصي)`, amount: formatCurrency(brackets.personalExemption) });
    calculations.push({ description: "وعاء الضريبة النهائي", amount: formatCurrency(taxableIncome) });
    
    let totalTax = 0;
    let remainingIncome = taxableIncome;
    for (const bracket of brackets.brackets) {
        if (remainingIncome <= 0) break;
        const taxableInBracket = Math.min(remainingIncome, bracket.upTo);
        const taxInBracket = taxableInBracket * bracket.rate;
        totalTax += taxInBracket;
        remainingIncome -= taxableInBracket;
        calculations.push({ description: `شريحة ${formatCurrency(bracket.upTo)} بسعر ${bracket.rate * 100}%`, amount: formatCurrency(taxInBracket) });
    }

    return {
        summary: `الضريبة السنوية المستحقة على إيرادات المهن الحرة هي ${formatCurrency(totalTax)}.`,
        calculations,
        grossIncome: params.revenue,
        totalTax,
        totalInsurance: 0,
        netIncome: params.revenue - totalTax,
        applicableLaws: ["قانون ضريبة الدخل رقم 91 لسنة 2005 (مواد المهن غير التجارية)."]
    };
};

export const getCapitalGainsTaxReport = async (params: CapitalGainsTaxParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    const netProfit = params.sellingPrice - params.purchasePrice - params.costs;
    calculations.push({ description: "إجمالي سعر البيع", amount: formatCurrency(params.sellingPrice) });
    calculations.push({ description: "خصم تكلفة الشراء", amount: formatCurrency(params.purchasePrice) });
    calculations.push({ description: "خصم مصاريف السمسرة", amount: formatCurrency(params.costs) });
    calculations.push({ description: "صافي الربح الرأسمالي", amount: formatCurrency(netProfit) });

    const totalTax = netProfit > 0 ? netProfit * 0.10 : 0;
    calculations.push({ description: "الضريبة المستحقة (10%)", amount: formatCurrency(totalTax) });

    return {
        summary: `الضريبة المستحقة على الأرباح الرأسمالية هي ${formatCurrency(totalTax)}.`,
        calculations,
        grossIncome: params.sellingPrice,
        totalTax,
        totalInsurance: 0,
        netIncome: netProfit - totalTax,
        applicableLaws: ["قانون ضريبة الدخل رقم 91 لسنة 2005 (ضريبة الأرباح الرأسمالية)."]
    };
};

export const getRealEstateTransactionTaxReport = async (params: RealEstateTransactionTaxParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    const taxRate = 0.025;
    const totalTax = params.saleValue * taxRate;

    calculations.push({ description: "إجمالي قيمة البيع", amount: formatCurrency(params.saleValue) });
    calculations.push({ description: `الضريبة المستحقة (${taxRate * 100}%)`, amount: formatCurrency(totalTax) });

    return {
        summary: `ضريبة التصرفات العقارية المستحقة هي ${formatCurrency(totalTax)}.`,
        calculations,
        grossIncome: params.saleValue,
        totalTax,
        totalInsurance: 0,
        netIncome: params.saleValue - totalTax,
        applicableLaws: ["قانون ضريبة الدخل رقم 91 لسنة 2005 (المادة 42)."]
    };
};
