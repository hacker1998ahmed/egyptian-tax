import React, { useState, useCallback, useMemo } from 'react';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import { useTranslation } from '../i18n/context';
import type { AmortizationEntry, CalculationRecord, LoanParams } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';

type LoanResult = {
  monthlyPayment: string;
  totalPayment: string;
  totalInterest: string;
  amortizationSchedule: AmortizationEntry[];
} | {
  firstPayment: string;
  lastPayment: string;
  totalPayment: string;
  totalInterest: string;
  amortizationSchedule: AmortizationEntry[];
};

const ResultCard: React.FC<{ title: string; value: string; colorClass: string }> = ({ title, value, colorClass }) => (
  <div className={`p-4 rounded-lg bg-gray-200 dark:bg-gray-900/50 border-l-4 ${colorClass}`}>
    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
  </div>
);

const LoanCalculator: React.FC = () => {
  const { t, language } = useTranslation();
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [term, setTerm] = useState('');
  const [loanType, setLoanType] = useState<'amortizing' | 'decreasing'>('amortizing');
  
  const [results, setResults] = useState<LoanResult | null>(null);
  const [, setHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);

  const formatCurrency = (value: number) => {
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EGP',
    }).format(value);
  };

  const loanTypeOptions = useMemo(() => [
    { value: 'amortizing', label: t('loan.type.amortizing') },
    { value: 'decreasing', label: t('loan.type.decreasing') },
  ], [t]);

  const handleCalculate = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(amount); // Principal
    const r = parseFloat(interestRate) / 100 / 12; // Monthly interest rate
    const n = parseFloat(term) * 12; // Number of months

    if (!(p > 0 && r > 0 && n > 0)) {
        setResults(null);
        return;
    }

    let calculatedResults: LoanResult | null = null;
    let reportDataForHistory;

    if (loanType === 'amortizing') {
        const monthlyPayment = p * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayment = monthlyPayment * n;
        const totalInterest = totalPayment - p;

        let remainingBalance = p;
        const amortizationSchedule: AmortizationEntry[] = [];
        for (let i = 1; i <= n; i++) {
            const interest = remainingBalance * r;
            const principal = monthlyPayment - interest;
            remainingBalance -= principal;
            amortizationSchedule.push({
                month: i,
                payment: monthlyPayment,
                principal,
                interest,
                remainingBalance: Math.max(0, remainingBalance),
            });
        }
        
        calculatedResults = {
            monthlyPayment: formatCurrency(monthlyPayment),
            totalPayment: formatCurrency(totalPayment),
            totalInterest: formatCurrency(totalInterest),
            amortizationSchedule,
        };
        reportDataForHistory = { grossIncome: p, totalTax: totalInterest, netIncome: totalPayment };
    } else { // decreasing
        const monthlyPrincipal = p / n;
        let totalInterest = 0;
        let totalPayment = 0;
        let remainingBalance = p;
        const amortizationSchedule: AmortizationEntry[] = [];

        for (let i = 1; i <= n; i++) {
            const interest = remainingBalance * r;
            const payment = monthlyPrincipal + interest;
            remainingBalance -= monthlyPrincipal;
            totalInterest += interest;
            totalPayment += payment;
            amortizationSchedule.push({
                month: i,
                payment,
                principal: monthlyPrincipal,
                interest,
                remainingBalance: Math.max(0, remainingBalance),
            });
        }
        
        calculatedResults = {
            firstPayment: formatCurrency(amortizationSchedule[0]?.payment || 0),
            lastPayment: formatCurrency(amortizationSchedule[n - 1]?.payment || 0),
            totalPayment: formatCurrency(totalPayment),
            totalInterest: formatCurrency(totalInterest),
            amortizationSchedule,
        };
        reportDataForHistory = { grossIncome: p, totalTax: totalInterest, netIncome: totalPayment };
    }

    setResults(calculatedResults);
    
    // Save to history
    const params: LoanParams = { amount: p, interestRate: parseFloat(interestRate), term: parseFloat(term), loanType };
    const newRecord: CalculationRecord = {
        id: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        type: 'loan',
        params,
        report: {
            summary: `Loan calculation for ${formatCurrency(p)} over ${term} years.`,
            calculations: [],
            grossIncome: reportDataForHistory.grossIncome,
            totalTax: reportDataForHistory.totalTax,
            totalInsurance: 0,
            netIncome: reportDataForHistory.netIncome,
            applicableLaws: ['Standard loan calculation formulas.'],
        },
    };
    setHistory(prevHistory => [newRecord, ...prevHistory]);

  }, [amount, interestRate, term, loanType, language, setHistory]);
  
  const resetForm = () => {
      setAmount('');
      setInterestRate('');
      setTerm('');
      setResults(null);
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl shadow-gray-400/20 dark:shadow-2xl dark:shadow-cyan-500/10 dark:backdrop-blur-sm">
        <form onSubmit={handleCalculate}>
          <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('loan.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField id="loanAmount" label={t('loan.form.amount.label')} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t('loan.form.amount.placeholder')} required/>
            <InputField id="interestRate" label={t('loan.form.interest.label')} type="number" step="0.01" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder={t('loan.form.interest.placeholder')} required />
            <InputField id="loanTerm" label={t('loan.form.term.label')} type="number" value={term} onChange={(e) => setTerm(e.target.value)} placeholder={t('loan.form.term.placeholder')} required />
            <SelectField id="loanType" label={t('loan.form.type.label')} value={loanType} onChange={(e) => setLoanType(e.target.value as 'amortizing' | 'decreasing')} options={loanTypeOptions} />
          </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                 <button type="button" onClick={resetForm} className="w-full bg-gray-500 dark:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-400/50 transition-all duration-300 shadow-lg">
                    {t('calculator.clear')}
                </button>
                 <button type="submit" className="w-full bg-cyan-600 dark:bg-cyan-500 text-white dark:text-black font-bold py-3 px-6 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-300/50 transition-all duration-300 shadow-lg shadow-cyan-500/30">
                    {t('calculator.calculate')}
                </button>
            </div>
        </form>
      </div>

      {results && (
        <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in space-y-8">
          <div>
            <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('loan.results.title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {'monthlyPayment' in results ? (
                <ResultCard title={t('loan.results.monthlyPayment')} value={results.monthlyPayment} colorClass="border-cyan-500" />
              ) : (
                <>
                 <ResultCard title={t('loan.results.firstPayment')} value={results.firstPayment} colorClass="border-cyan-500" />
                 <ResultCard title={t('loan.results.lastPayment')} value={results.lastPayment} colorClass="border-blue-500" />
                </>
              )}
              <ResultCard title={t('loan.results.totalInterest')} value={results.totalInterest} colorClass="border-red-500" />
              <ResultCard title={t('loan.results.totalPayment')} value={results.totalPayment} colorClass="border-green-500" />
            </div>
          </div>
          
          <div>
              <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('loan.schedule.title')}</h3>
              <div className="max-h-96 overflow-y-auto border border-gray-300 dark:border-fuchsia-500/20 rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-fuchsia-700 dark:text-fuchsia-400 uppercase bg-gray-100 dark:bg-gray-900/50 sticky top-0">
                        <tr>
                            <th scope="col" className="px-4 py-3">{t('loan.schedule.month')}</th>
                            <th scope="col" className="px-4 py-3 text-right">{t('loan.schedule.payment')}</th>
                            <th scope="col" className="px-4 py-3 text-right">{t('loan.schedule.principal')}</th>
                            <th scope="col" className="px-4 py-3 text-right">{t('loan.schedule.interest')}</th>
                            <th scope="col" className="px-4 py-3 text-right">{t('loan.schedule.balance')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.amortizationSchedule.map(row => (
                            <tr key={row.month} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-4 py-2">{row.month}</td>
                                <td className="px-4 py-2 text-right font-mono">{formatCurrency(row.payment)}</td>
                                <td className="px-4 py-2 text-right font-mono text-green-600 dark:text-green-400">{formatCurrency(row.principal)}</td>
                                <td className="px-4 py-2 text-right font-mono text-red-600 dark:text-red-400">{formatCurrency(row.interest)}</td>
                                <td className="px-4 py-2 text-right font-mono">{formatCurrency(row.remainingBalance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanCalculator;