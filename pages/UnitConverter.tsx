import React, { useState, useMemo } from 'react';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import { useTranslation } from '../i18n/context';

type Category = 'length' | 'weight' | 'temperature';

const units = {
    length: {
        meters: 1,
        kilometers: 1000,
        centimeters: 0.01,
        millimeters: 0.001,
        miles: 1609.34,
        yards: 0.9144,
        feet: 0.3048,
        inches: 0.0254
    },
    weight: {
        kilograms: 1,
        grams: 0.001,
        milligrams: 0.000001,
        tons: 1000,
        pounds: 0.453592,
        ounces: 0.0283495
    },
    temperature: {
        celsius: (c: number) => c,
        fahrenheit: (f: number) => (f - 32) * 5/9,
        kelvin: (k: number) => k - 273.15,
    }
};

const tempConversions = {
    celsius: {
        fahrenheit: (c: number) => (c * 9/5) + 32,
        kelvin: (c: number) => c + 273.15,
    },
    fahrenheit: {
        celsius: (f: number) => (f - 32) * 5/9,
        kelvin: (f: number) => (f - 32) * 5/9 + 273.15,
    },
    kelvin: {
        celsius: (k: number) => k - 273.15,
        fahrenheit: (k: number) => (k - 273.15) * 9/5 + 32,
    }
};

const UnitConverter: React.FC = () => {
    const { t } = useTranslation();
    const [category, setCategory] = useState<Category>('length');
    const [fromUnit, setFromUnit] = useState('meters');
    const [toUnit, setToUnit] = useState('kilometers');
    const [inputValue, setInputValue] = useState('1');

    const unitOptions = useMemo(() => {
        return Object.keys(units[category]).map(unit => ({ value: unit, label: t(`unitConverter.unit.${unit}` as any) }));
    }, [category, t]);

    const result = useMemo(() => {
        const input = parseFloat(inputValue);
        if (isNaN(input)) return '';

        if (category === 'temperature') {
            if (fromUnit === toUnit) return input.toString();
            // @ts-ignore
            return tempConversions[fromUnit][toUnit](input).toFixed(2);
        } else {
            // @ts-ignore
            const fromFactor = units[category][fromUnit];
            // @ts-ignore
            const toFactor = units[category][toUnit];
            const valueInBase = input * fromFactor;
            return (valueInBase / toFactor).toLocaleString();
        }
    }, [inputValue, fromUnit, toUnit, category]);
    
    const handleCategoryChange = (cat: Category) => {
        setCategory(cat);
        const newUnits = Object.keys(units[cat]);
        setFromUnit(newUnits[0]);
        setToUnit(newUnits[1]);
    };
    

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('unitConverter.title')}</h2>
                <div className="mb-4">
                    <SelectField id="category" label={t('unitConverter.form.category')} value={category} onChange={e => handleCategoryChange(e.target.value as Category)} options={[
                        { value: 'length', label: t('unitConverter.category.length')},
                        { value: 'weight', label: t('unitConverter.category.weight')},
                        { value: 'temperature', label: t('unitConverter.category.temperature')},
                    ]}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="flex flex-col gap-2">
                        <InputField id="input" label={fromUnit} type="number" value={inputValue} onChange={e => setInputValue(e.target.value)} />
                        <SelectField id="fromUnit" label="" value={fromUnit} onChange={e => setFromUnit(e.target.value)} options={unitOptions} />
                    </div>
                    <div className="text-center text-3xl font-bold">=</div>
                    <div className="flex flex-col gap-2">
                        <InputField id="result" label={toUnit} value={result} readOnly className="bg-gray-100 dark:bg-gray-900 font-bold" />
                        <SelectField id="toUnit" label="" value={toUnit} onChange={e => setToUnit(e.target.value)} options={unitOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnitConverter;