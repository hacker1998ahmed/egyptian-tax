import type { ReportData, CalculationStep, TaxParams, CorporateTaxParams, VATTaxParams, RealEstateTaxParams, WithholdingTaxParams, SocialInsuranceParams, StampDutyParams, ZakatParams, InvestmentParams, EndOfServiceParams, FeasibilityStudyParams, ElectricityParams, InheritanceParams, CustomsParams } from '../types';
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
     const insuranceRules = SOCIAL_INSURANCE_PARAMS[params.year] || SOCIAL_INSURANCE_PARAMS[2024];
     const totalMonthlyWage = params.basicWage + params.variableWage;
     const contributionWage = Math.max(insuranceRules.min, Math.min(totalMonthlyWage, insuranceRules.max));
     
     calculations.push({ description: "الأجر الشامل الشهري", amount: formatCurrency(totalMonthlyWage) });
     calculations.push({ description: "أجر الاشتراك التأميني المعتمد", amount: formatCurrency(contributionWage) });

     const employeeShare = contributionWage * insuranceRules.employeeRate;
     const employerShare = contributionWage * insuranceRules.employerRate;
     const totalInsurance = employeeShare + employerShare;
     
     calculations.push({ description: `حصة العامل (${insuranceRules.employeeRate * 100}%)`, amount: formatCurrency(employeeShare) });
     calculations.push({ description: `حصة صاحب العمل (${insuranceRules.employerRate * 100}%)`, amount: formatCurrency(employerShare) });

    return {
        summary: `إجمالي اشتراك التأمينات الشهري هو ${formatCurrency(totalInsurance)}، مقسمة إلى ${formatCurrency(employeeShare)} حصة العامل و ${formatCurrency(employerShare)} حصة صاحب العمل.`,
        calculations,
        grossIncome: totalMonthlyWage,
        totalTax: 0,
        totalInsurance: totalInsurance,
        netIncome: employeeShare, // Representing employee's monthly deduction
        applicableLaws: ["قانون التأمينات الاجتماعية الموحد رقم 148 لسنة 2019."]
    };
};

export const getStampDutyReport = async (params: StampDutyParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    let rate = 0.004; // Default proportional rate
    if(params.transactionType === 'commercial_ads') rate = 0.20;
    const totalTax = params.amount * rate;
    
    calculations.push({ description: `قيمة التعامل`, amount: formatCurrency(params.amount) });
    calculations.push({ description: `ضريبة الدمغة النسبية (${rate * 100}%)`, amount: formatCurrency(totalTax) });

    return {
        summary: `ضريبة الدمغة المستحقة على التعامل هي ${formatCurrency(totalTax)}.`,
        calculations,
        grossIncome: params.amount,
        totalTax,
        totalInsurance: 0,
        netIncome: -totalTax,
        applicableLaws: ["قانون ضريبة الدمغة رقم 111 لسنة 1980."]
    };
};


export const getZakatReport = async (params: ZakatParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    const nisab = params.goldPrice * 85;
    calculations.push({ description: "نصاب الزكاة (ما يعادل 85 جرام ذهب)", amount: formatCurrency(nisab) });

    const zakatPool = params.cash + params.stocks + params.tradeGoods;
    calculations.push({ description: "إجمالي الأموال الزكوية", amount: formatCurrency(zakatPool) });
    
    const netPool = zakatPool - params.debts;
    calculations.push({ description: "خصم الديون", amount: formatCurrency(params.debts) });
    calculations.push({ description: "صافي وعاء الزكاة", amount: formatCurrency(netPool) });

    let totalTax = 0;
    if (netPool >= nisab) {
        totalTax = netPool * 0.025;
    }
    
    return {
        summary: netPool >= nisab ? `صافي أموالك بلغ النصاب. الزكاة المستحقة هي ${formatCurrency(totalTax)}.` : `صافي أموالك لم يبلغ النصاب (${formatCurrency(nisab)}). لا تجب عليك الزكاة.`,
        calculations,
        grossIncome: zakatPool,
        totalTax,
        totalInsurance: 0,
        netIncome: netPool,
        applicableLaws: ["أحكام الزكاة في الشريعة الإسلامية."]
    };
};


export const getInvestmentReport = async (params: InvestmentParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    const monthlyRate = params.interestRate / 100 / 12;
    const months = params.years * 12;

    const futureValueInitial = params.initialAmount * Math.pow(1 + monthlyRate, months);
    const futureValueMonthly = params.monthlyContribution * ( (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate );
    const totalFutureValue = futureValueInitial + futureValueMonthly;
    
    const totalContribution = params.initialAmount + (params.monthlyContribution * months);
    const totalGains = totalFutureValue - totalContribution;

    calculations.push({ description: "إجمالي المساهمات", amount: formatCurrency(totalContribution) });
    calculations.push({ description: "إجمالي الأرباح المتوقعة", amount: formatCurrency(totalGains) });
    calculations.push({ description: "القيمة المستقبلية الإجمالية", amount: formatCurrency(totalFutureValue) });

    return {
        summary: `بعد ${params.years} سنوات، من المتوقع أن تصل قيمة استثمارك إلى ${formatCurrency(totalFutureValue)}، بأرباح قدرها ${formatCurrency(totalGains)}.`,
        calculations,
        grossIncome: totalContribution,
        totalTax: 0,
        totalInsurance: 0,
        netIncome: totalFutureValue,
        applicableLaws: ["صيغة حساب الفائدة المركبة."]
    };
};

export const getEndOfServiceReport = async (params: EndOfServiceParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    const first5Years = Math.min(params.yearsOfService, 5);
    const after5Years = Math.max(0, params.yearsOfService - 5);

    const gratuityFirst5 = first5Years * (params.lastSalary / 2);
    calculations.push({ description: `مكافأة أول 5 سنوات (${first5Years} سنة * نصف شهر)`, amount: formatCurrency(gratuityFirst5) });

    const gratuityAfter5 = after5Years * params.lastSalary;
    calculations.push({ description: `مكافأة ما بعد 5 سنوات (${after5Years} سنة * شهر كامل)`, amount: formatCurrency(gratuityAfter5) });
    
    const totalGratuity = gratuityFirst5 + gratuityAfter5;
    
    return {
        summary: `مكافأة نهاية الخدمة المستحقة عن ${params.yearsOfService} سنة خدمة هي ${formatCurrency(totalGratuity)}.`,
        calculations,
        grossIncome: params.lastSalary,
        totalTax: 0,
        totalInsurance: 0,
        netIncome: totalGratuity,
        applicableLaws: ["قانون العمل المصري رقم 12 لسنة 2003."]
    };
};

export const getFeasibilityStudyReport = async (params: FeasibilityStudyParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    const contributionMargin = params.sellingPricePerUnit - params.variableCostPerUnit;
    calculations.push({ description: "هامش المساهمة للوحدة", amount: formatCurrency(contributionMargin) });
    
    const bepUnits = contributionMargin > 0 ? params.fixedCosts / contributionMargin : Infinity;
    calculations.push({ description: "نقطة التعادل بالوحدات", amount: isFinite(bepUnits) ? bepUnits.toFixed(2) : "N/A" });

    const bepValue = bepUnits * params.sellingPricePerUnit;
    calculations.push({ description: "نقطة التعادل بالقيمة", amount: isFinite(bepValue) ? formatCurrency(bepValue) : "N/A" });

    return {
        summary: `لتحقيق التعادل، يجب بيع ${bepUnits.toFixed(2)} وحدة شهريًا، بما يعادل مبيعات بقيمة ${formatCurrency(bepValue)}.`,
        calculations,
        grossIncome: isFinite(bepValue) ? bepValue : 0,
        totalTax: 0,
        totalInsurance: 0,
        netIncome: isFinite(bepUnits) ? bepUnits : 0,
        applicableLaws: ["مبادئ تحليل نقطة التعادل."]
    };
};

export const getElectricityReport = async (params: ElectricityParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    const brackets = ELECTRICITY_BRACKETS[params.meterType];
    let remainingKwh = params.consumptionKwh;
    let totalCost = 0;
    let lastBracketKwh = 0;

    for (const bracket of brackets) {
        if (remainingKwh <= 0) break;
        const kwhInBracket = Math.min(remainingKwh, bracket.limit - lastBracketKwh);
        const costInBracket = kwhInBracket * bracket.rate;
        totalCost += costInBracket;
        remainingKwh -= kwhInBracket;
        calculations.push({ description: `شريحة من ${lastBracketKwh + 1} إلى ${bracket.limit} كيلوواط`, amount: formatCurrency(costInBracket) });
        lastBracketKwh = bracket.limit;
    }

    return {
        summary: `التكلفة التقديرية لاستهلاك ${params.consumptionKwh} كيلوواط/ساعة هي ${formatCurrency(totalCost)}.`,
        calculations,
        grossIncome: params.consumptionKwh,
        totalTax: totalCost,
        totalInsurance: 0,
        netIncome: totalCost,
        applicableLaws: ["تعريفة الكهرباء المعتمدة."]
    };
};

export const getInheritanceReport = async (params: InheritanceParams): Promise<ReportData> => {
     // Simplified model
    const calculations: CalculationStep[] = [];
    let remainingEstate = params.estateValue;
    
    let spouseShare = 0;
    if(params.hasSpouse === 'wife' && params.sons + params.daughters > 0) spouseShare = params.estateValue * (1/8);
    else if(params.hasSpouse === 'wife') spouseShare = params.estateValue * (1/4);
    else if(params.hasSpouse === 'husband' && params.sons + params.daughters > 0) spouseShare = params.estateValue * (1/4);
    else if(params.hasSpouse === 'husband') spouseShare = params.estateValue * (1/2);
    
    if (spouseShare > 0) {
        calculations.push({ description: `نصيب ال${params.hasSpouse === 'wife' ? 'زوجة' : 'زوج'}`, amount: formatCurrency(spouseShare) });
        remainingEstate -= spouseShare;
    }

    let fatherShare = 0;
    if (params.father) {
        fatherShare = params.estateValue * (1/6);
        calculations.push({ description: "نصيب الأب", amount: formatCurrency(fatherShare) });
        remainingEstate -= fatherShare;
    }

    let motherShare = 0;
    if (params.mother) {
        motherShare = params.estateValue * (1/6);
        calculations.push({ description: "نصيب الأم", amount: formatCurrency(motherShare) });
        remainingEstate -= motherShare;
    }

    const sharesForChildren = params.sons * 2 + params.daughters;
    if (sharesForChildren > 0) {
        const sonShareValue = remainingEstate * (2 / sharesForChildren);
        const daughterShareValue = remainingEstate * (1 / sharesForChildren);
        if (params.sons > 0) calculations.push({ description: `نصيب كل ابن`, amount: formatCurrency(sonShareValue) });
        if (params.daughters > 0) calculations.push({ description: `نصيب كل بنت`, amount: formatCurrency(daughterShareValue) });
    }

    return {
        summary: `تم توزيع التركة بناءً على الورثة المحددين. هذه حسابات مبسطة وقد تختلف في الحالات المعقدة.`,
        calculations,
        grossIncome: params.estateValue,
        totalTax: 0,
        totalInsurance: 0,
        netIncome: params.estateValue,
        applicableLaws: ["قانون المواريث المصري المستمد من الشريعة الإسلامية (نموذج مبسط)."]
    };
};

export const getCustomsReport = async (params: CustomsParams): Promise<ReportData> => {
    const calculations: CalculationStep[] = [];
    const CATEGORY_RATES: { [key: string]: number } = { electronics: 0.05, clothing: 0.30, cars: 0.40, food: 0.10, other: 0.15 };
    const customsRate = CATEGORY_RATES[params.category] || 0.15;

    const customsDuty = params.shipmentValue * customsRate;
    calculations.push({ description: `الضريبة الجمركية (${customsRate * 100}%)`, amount: formatCurrency(customsDuty) });
    
    const developmentFee = params.shipmentValue * 0.03; // Assumption
    calculations.push({ description: `رسم تنمية (3%)`, amount: formatCurrency(developmentFee) });
    
    const vatBase = params.shipmentValue + customsDuty + developmentFee;
    calculations.push({ description: `وعاء ضريبة القيمة المضافة`, amount: formatCurrency(vatBase) });

    const vat = vatBase * 0.14;
    calculations.push({ description: `ضريبة القيمة المضافة (14%)`, amount: formatCurrency(vat) });

    const totalTax = customsDuty + developmentFee + vat;
    const totalCost = params.shipmentValue + totalTax;

    return {
        summary: `التكلفة الإجمالية المقدرة للشحنة بعد إضافة الرسوم والضرائب هي ${formatCurrency(totalCost)}.`,
        calculations,
        grossIncome: params.shipmentValue,
        totalTax,
        totalInsurance: 0,
        netIncome: totalCost,
        applicableLaws: ["قانون الجمارك المصري.", "قانون ضريبة القيمة المضافة."]
    };
};