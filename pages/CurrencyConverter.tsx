import React, { useState, useEffect, useMemo } from 'react';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import { useTranslation } from '../i18n/context';

interface RatesData {
  base_code: string;
  rates: { [key: string]: number };
  time_last_update_utc: string;
}

const CurrencyConverter: React.FC = () => {
  const { t, language } = useTranslation();
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EGP');
  const [ratesData, setRatesData] = useState<RatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data: RatesData = await response.json();
        setRatesData(data);
      } catch (e) {
        setError(t('currency.error'));
        console.error("Failed to fetch exchange rates:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, [t]);

  const currencyOptions = useMemo(() => {
    if (!ratesData) return [{ value: 'USD', label: 'USD' }];
    return Object.keys(ratesData.rates).map(code => ({ value: code, label: code }));
  }, [ratesData]);

  const convertedResult = useMemo(() => {
    if (!ratesData || !ratesData.rates[fromCurrency] || !ratesData.rates[toCurrency]) {
      return { convertedAmount: 0, exchangeRate: 0 };
    }
    const amountNum = parseFloat(amount) || 0;
    const rateFrom = ratesData.rates[fromCurrency];
    const rateTo = ratesData.rates[toCurrency];
    // Convert amount from 'fromCurrency' to USD, then from USD to 'toCurrency'
    const convertedAmount = (amountNum / rateFrom) * rateTo;
    const exchangeRate = rateTo / rateFrom;
    return { convertedAmount, exchangeRate };
  }, [amount, fromCurrency, toCurrency, ratesData]);
  
  const handleSwap = () => {
      setFromCurrency(toCurrency);
      setToCurrency(fromCurrency);
  }

  const lastUpdatedDate = useMemo(() => {
      if (!ratesData) return '';
      const date = new Date(ratesData.time_last_update_utc);
      const locale = language === 'ar' ? 'ar-EG' : 'en-US';
      return date.toLocaleString(locale, {
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
  }, [ratesData, language]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center my-12 text-center animate-fade-in">
        <div className="w-16 h-16 border-4 border-cyan-500 dark:border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-cyan-600 dark:text-cyan-300 text-lg">{t('currency.loading')}</p>
      </div>
    );
  }
  
  if (error) {
       return (
        <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 p-4 rounded-lg text-center animate-fade-in">
            <p className="font-bold mb-2">{t('calculator.error.title')}</p>
            <p>{error}</p>
        </div>
       )
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
        <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('currency.title')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
                <InputField id="amount" label={t('currency.form.amount')} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="md:col-span-1">
                 <SelectField id="fromCurrency" label={t('currency.form.from')} value={fromCurrency} onChange={e => setFromCurrency(e.target.value)} options={currencyOptions} />
            </div>
             <button onClick={handleSwap} className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-cyan-500 dark:hover:bg-cyan-500 transition-colors group" aria-label={t('currency.form.swap')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800 dark:text-white group-hover:text-white dark:group-hover:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
             </button>
             <div className="md:col-span-1">
                 <SelectField id="toCurrency" label={t('currency.form.to')} value={toCurrency} onChange={e => setToCurrency(e.target.value)} options={currencyOptions} />
            </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-cyan-500/20 text-center">
             <p className="text-lg text-gray-600 dark:text-gray-400">{amount} {fromCurrency} =</p>
             <p className="text-4xl md:text-5xl font-bold text-cyan-700 dark:text-cyan-400 my-2" style={{textShadow: 'var(--header-shadow)'}}>
                <style>{`.dark p { --header-shadow: 0 0 5px #22d3ee; }`}</style>
                {convertedResult.convertedAmount.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {maximumFractionDigits: 4})} {toCurrency}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                {t('currency.results.rate')} 1 {fromCurrency} = {convertedResult.exchangeRate.toFixed(6)} {toCurrency}
            </p>
             <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                {t('currency.results.lastUpdated')} {lastUpdatedDate}
            </p>
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;
