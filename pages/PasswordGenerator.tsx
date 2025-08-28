import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '../i18n/context';

const PasswordGenerator: React.FC = () => {
    const { t } = useTranslation();
    const [length, setLength] = useState(16);
    const [includeUppercase, setIncludeUppercase] = useState(true);
    const [includeLowercase, setIncludeLowercase] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSymbols, setIncludeSymbols] = useState(true);
    const [password, setPassword] = useState('');
    const [copied, setCopied] = useState(false);

    const generatePassword = useCallback(() => {
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
        
        let charset = '';
        if (includeUppercase) charset += upper;
        if (includeLowercase) charset += lower;
        if (includeNumbers) charset += numbers;
        if (includeSymbols) charset += symbols;
        
        if (charset === '') {
            setPassword('');
            return;
        };

        let newPassword = '';
        for (let i = 0; i < length; i++) {
            newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setPassword(newPassword);
        setCopied(false);
    }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

    useEffect(() => {
        generatePassword();
    }, [generatePassword]);
    
    const copyToClipboard = () => {
        if (!password) return;
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const Checkbox: React.FC<{label:string, checked:boolean, onChange:()=>void}> = ({label, checked, onChange}) => (
        <label className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md cursor-pointer select-none">
            <input type="checkbox" checked={checked} onChange={onChange} className="h-5 w-5 rounded accent-cyan-500" />
            <span>{label}</span>
        </label>
    );

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('password.title')}</h2>
                
                <div className="relative flex items-center mb-6">
                    <input 
                        type="text" 
                        value={password} 
                        readOnly 
                        aria-label="Generated Password"
                        className="w-full bg-gray-100 dark:bg-gray-900/70 p-4 rounded-lg text-2xl font-mono break-words shadow-inner text-gray-800 dark:text-white"
                    />
                    <button onClick={copyToClipboard} className="absolute end-3 bg-cyan-500 text-white dark:text-black px-4 py-2 rounded-md hover:bg-cyan-600 dark:hover:bg-cyan-400 transition-colors">
                        {copied ? t('password.form.copied') : t('password.form.copy')}
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <label htmlFor="length" className="whitespace-nowrap">{t('password.form.length')}: {length}</label>
                        <input 
                            type="range" 
                            id="length" 
                            min="8" 
                            max="64" 
                            value={length} 
                            onChange={e => setLength(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-cyan-500"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Checkbox label={t('password.form.uppercase')} checked={includeUppercase} onChange={() => setIncludeUppercase(p => !p)} />
                        <Checkbox label={t('password.form.lowercase')} checked={includeLowercase} onChange={() => setIncludeLowercase(p => !p)} />
                        <Checkbox label={t('password.form.numbers')} checked={includeNumbers} onChange={() => setIncludeNumbers(p => !p)} />
                        <Checkbox label={t('password.form.symbols')} checked={includeSymbols} onChange={() => setIncludeSymbols(p => !p)} />
                    </div>
                </div>

                <div className="mt-8 text-center">
                     <button onClick={generatePassword} className="bg-cyan-600 text-white dark:text-black font-bold py-3 px-8 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/30">
                        {t('password.form.generate')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PasswordGenerator;
