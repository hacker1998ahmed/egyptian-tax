import React, { useState, useMemo } from 'react';
import InputField from '../components/InputField';
import { useTranslation } from '../i18n/context';

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

  const formatCurrency = (value: number) => {
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EGP',
    }).format(value);
  };

  const results = useMemo(() => {
    const p = parseFloat(amount); // Principal
    const r = parseFloat(interestRate) / 100 / 12; // Monthly interest rate
    const n = parseFloat(term) * 12; // Number of months

    if (p > 0 && r > 0 && n > 0) {
      const monthlyPayment = p * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const totalPayment = monthlyPayment * n;
      const totalInterest = totalPayment - p;

      return {
        monthlyPayment: formatCurrency(monthlyPayment),
        totalPayment: formatCurrency(totalPayment),
        totalInterest: formatCurrency(totalInterest),
      };
    }
    return null;
  }, [amount, interestRate, term, language]);
  
  const resetForm = () => {
      setAmount('');
      setInterestRate('');
      setTerm('');
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl shadow-gray-400/20 dark:shadow-2xl dark:shadow-cyan-500/10 dark:backdrop-blur-sm">
        <form onSubmit={(e) => e.preventDefault()}>
          <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('loan.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField
              id="loanAmount"
              label={t('loan.form.amount.label')}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('loan.form.amount.placeholder')}
              required
            />
            <InputField
              id="interestRate"
              label={t('loan.form.interest.label')}
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder={t('loan.form.interest.placeholder')}
              required
            />
            <InputField
              id="loanTerm"
              label={t('loan.form.term.label')}
              type="number"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t('loan.form.term.placeholder')}
              required
            />
          </div>
            <div className="flex justify-center mt-6">
                 <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-500 dark:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-400/50 transition-all duration-300 shadow-lg"
                    >
                    {t('calculator.clear')}
                </button>
            </div>
        </form>
      </div>

      {results && (
        <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in">
          <h3 className="text-2xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{t('loan.results.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResultCard title={t('loan.results.monthlyPayment')} value={results.monthlyPayment} colorClass="border-cyan-500" />
            <ResultCard title={t('loan.results.totalInterest')} value={results.totalInterest} colorClass="border-red-500" />
            <ResultCard title={t('loan.results.totalPayment')} value={results.totalPayment} colorClass="border-green-500" />
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanCalculator;