import React, { useState, useMemo } from 'react';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import { useTranslation } from '../i18n/context';

type Ingredient = 'flour' | 'sugar' | 'butter' | 'water' | 'milk';

// Density in g/mL
const DENSITIES: Record<Ingredient, number> = {
    flour: 0.528,
    sugar: 0.845,
    butter: 0.911,
    water: 1,
    milk: 1.03,
};

// Conversion factors to base units (mL for volume, g for weight)
const CONVERSIONS: Record<string, { factor: number, type: 'volume' | 'weight' }> = {
    gram: { factor: 1, type: 'weight' },
    kilogram: { factor: 1000, type: 'weight' },
    ounce: { factor: 28.3495, type: 'weight' },
    pound: { factor: 453.592, type: 'weight' },
    milliliter: { factor: 1, type: 'volume' },
    liter: { factor: 1000, type: 'volume' },
    cup: { factor: 236.588, type: 'volume' },
    tablespoon: { factor: 14.7868, type: 'volume' },
    teaspoon: { factor: 4.92892, type: 'volume' },
};

const CookingConverter: React.FC = () => {
    const { t } = useTranslation();
    const [ingredient, setIngredient] = useState<Ingredient>('flour');
    const [amount, setAmount] = useState('1');
    const [fromUnit, setFromUnit] = useState('cup');
    const [toUnit, setToUnit] = useState('gram');

    const ingredientOptions = Object.keys(DENSITIES).map(ing => ({ value: ing, label: t(`cooking.ingredient.${ing}` as any) }));
    const unitOptions = Object.keys(CONVERSIONS).map(unit => ({ value: unit, label: t(`cooking.unit.${unit}` as any) }));

    const result = useMemo(() => {
        const inputAmount = parseFloat(amount);
        if (isNaN(inputAmount)) return '';

        const from = CONVERSIONS[fromUnit];
        const to = CONVERSIONS[toUnit];
        const density = DENSITIES[ingredient];

        let baseValue: number; // in grams

        // Convert input to grams
        if (from.type === 'weight') {
            baseValue = inputAmount * from.factor;
        } else { // volume
            baseValue = inputAmount * from.factor * density;
        }

        // Convert from grams to target unit
        let outputValue: number;
        if (to.type === 'weight') {
            outputValue = baseValue / to.factor;
        } else { // volume
            outputValue = (baseValue / density) / to.factor;
        }

        return outputValue.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }, [amount, ingredient, fromUnit, toUnit]);

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('cooking.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <SelectField id="ingredient" label={t('cooking.form.ingredient')} value={ingredient} onChange={e => setIngredient(e.target.value as Ingredient)} options={ingredientOptions} />
                    <InputField id="amount" label={t('cooking.form.amount')} type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                    <div></div>
                    <SelectField id="fromUnit" label={t('cooking.form.from')} value={fromUnit} onChange={e => setFromUnit(e.target.value)} options={unitOptions} />
                    <div className="text-center text-3xl font-bold pb-2">=</div>
                    <SelectField id="toUnit" label={t('cooking.form.to')} value={toUnit} onChange={e => setToUnit(e.target.value)} options={unitOptions} />
                </div>
            </div>

            <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in text-center">
                <h3 className="text-xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-2">{t('percentage.results.result')}</h3>
                <p className="text-5xl font-mono font-bold text-gray-800 dark:text-white">
                    {result} <span className="text-2xl text-gray-500">{t(`cooking.unit.${toUnit}` as any)}</span>
                </p>
            </div>
        </div>
    );
};

export default CookingConverter;