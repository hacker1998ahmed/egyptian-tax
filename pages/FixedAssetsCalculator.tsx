import React, { useState, useMemo } from 'react';
import type { FixedAsset, DepreciationEntry } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import Modal from '../components/Modal';
import { useTranslation } from '../i18n/context';
import { TAX_YEARS } from '../constants';
import { generateAssetScheduleExcelDataUri, generateAnnualDepreciationExcelDataUri, downloadFile } from '../utils/reportGenerator';

const emptyAsset: Omit<FixedAsset, 'id'> = {
  name: '',
  purchaseDate: new Date().toISOString().split('T')[0],
  cost: 0,
  salvageValue: 0,
  usefulLife: 0,
  depreciationMethod: 'straight-line',
};

const calculateDepreciation = (asset: FixedAsset): DepreciationEntry[] => {
    const schedule: DepreciationEntry[] = [];
    let bookValue = asset.cost;
    let accumulatedDepreciation = 0;
    const purchaseDate = new Date(asset.purchaseDate);
    const purchaseYear = purchaseDate.getFullYear();
    const purchaseMonth = purchaseDate.getMonth();

    for (let i = 0; i < asset.usefulLife; i++) {
        const currentYear = purchaseYear + i;
        let depreciation = 0;

        if (asset.depreciationMethod === 'straight-line') {
            depreciation = (asset.cost - asset.salvageValue) / asset.usefulLife;
        } else { // double-declining
            depreciation = (bookValue * 2) / asset.usefulLife;
        }

        // Prorate for the first year if not purchased at the beginning
        if (i === 0 && purchaseMonth > 0) {
            depreciation *= (12 - purchaseMonth) / 12;
        }
        
        // Ensure book value doesn't go below salvage value
        if (bookValue - depreciation < asset.salvageValue) {
            depreciation = bookValue - asset.salvageValue;
        }

        bookValue -= depreciation;
        accumulatedDepreciation += depreciation;
        
        schedule.push({
            year: currentYear,
            depreciation,
            accumulatedDepreciation,
            bookValue
        });
        
        if (bookValue <= asset.salvageValue) break;
    }
    return schedule;
};


const AssetForm: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: FixedAsset) => void;
  assetToEdit: FixedAsset | null;
}> = ({ isOpen, onClose, onSave, assetToEdit }) => {
  const { t } = useTranslation();
  const [asset, setAsset] = useState<Omit<FixedAsset, 'id'>>(emptyAsset);

  React.useEffect(() => {
    setAsset(assetToEdit ? { ...assetToEdit } : emptyAsset);
  }, [assetToEdit, isOpen]);

  const handleChange = (field: keyof typeof emptyAsset, value: string | number) => {
    setAsset(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...asset, id: assetToEdit?.id || new Date().toISOString() });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={assetToEdit ? t('fixedAssets.assets.edit') : t('fixedAssets.assets.add')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField id="name" label={t('fixedAssets.form.name')} value={asset.name} onChange={e => handleChange('name', e.target.value)} required />
        <InputField id="purchaseDate" label={t('fixedAssets.form.purchaseDate')} type="date" value={asset.purchaseDate} onChange={e => handleChange('purchaseDate', e.target.value)} required />
        <InputField id="cost" label={t('fixedAssets.form.cost')} type="number" value={asset.cost || ''} onChange={e => handleChange('cost', parseFloat(e.target.value) || 0)} required />
        <InputField id="salvageValue" label={t('fixedAssets.form.salvageValue')} type="number" value={asset.salvageValue || ''} onChange={e => handleChange('salvageValue', parseFloat(e.target.value) || 0)} />
        <InputField id="usefulLife" label={t('fixedAssets.form.usefulLife')} type="number" value={asset.usefulLife || ''} onChange={e => handleChange('usefulLife', parseFloat(e.target.value) || 0)} required />
        <SelectField id="depreciationMethod" label={t('fixedAssets.form.depreciationMethod')} value={asset.depreciationMethod} onChange={e => handleChange('depreciationMethod', e.target.value)} options={[
            { value: 'straight-line', label: t('fixedAssets.method.straight-line') },
            { value: 'double-declining', label: t('fixedAssets.method.double-declining') }
        ]} />
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} className="bg-gray-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors">{t('payrollManager.form.cancel')}</button>
          <button type="submit" className="bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-700 transition-colors">{t('payrollManager.form.save')}</button>
        </div>
      </form>
    </Modal>
  );
};

const AssetDetailsModal: React.FC<{
    asset: FixedAsset | null;
    onClose: () => void;
}> = ({ asset, onClose }) => {
    const { t, language } = useTranslation();
    const depreciationSchedule = useMemo(() => asset ? calculateDepreciation(asset) : [], [asset]);

    if (!asset) return null;

    const formatCurrency = (amount: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP', minimumFractionDigits: 2 }).format(amount);
    
    const handleExport = () => {
        const uri = generateAssetScheduleExcelDataUri(asset, depreciationSchedule, t);
        const filename = `Depreciation-Schedule-${asset.name}.xlsx`;
        downloadFile(filename, uri, t);
    };

    return (
        <Modal isOpen={!!asset} onClose={onClose} title={t('fixedAssets.details.title')}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>{t('fixedAssets.table.cost')}:</strong> {formatCurrency(asset.cost)}</div>
                    <div><strong>{t('fixedAssets.table.life')}:</strong> {asset.usefulLife} {t('common.year')}</div>
                    <div><strong>{t('fixedAssets.form.salvageValue')}:</strong> {formatCurrency(asset.salvageValue)}</div>
                    <div><strong>{t('fixedAssets.table.method')}:</strong> {t(`fixedAssets.method.${asset.depreciationMethod}` as any)}</div>
                </div>
                <div className="max-h-80 overflow-y-auto border border-gray-300 dark:border-cyan-500/30 rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-100 dark:bg-gray-900">
                            <tr className="border-b dark:border-cyan-500/30">
                                <th className="p-2">{t('fixedAssets.schedule.year')}</th>
                                <th className="p-2">{t('fixedAssets.schedule.depreciation')}</th>
                                <th className="p-2">{t('fixedAssets.schedule.accumulated')}</th>
                                <th className="p-2">{t('fixedAssets.schedule.bookValue')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {depreciationSchedule.map(entry => (
                                <tr key={entry.year} className="border-b dark:border-gray-700/50 last:border-0">
                                    <td className="p-2 text-center">{entry.year}</td>
                                    <td className="p-2 text-center font-mono">{formatCurrency(entry.depreciation)}</td>
                                    <td className="p-2 text-center font-mono">{formatCurrency(entry.accumulatedDepreciation)}</td>
                                    <td className="p-2 text-center font-mono">{formatCurrency(entry.bookValue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end">
                    <button onClick={handleExport} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">{t('fixedAssets.details.export')}</button>
                </div>
            </div>
        </Modal>
    );
};

const FixedAssetsCalculator: React.FC = () => {
    const { t, language } = useTranslation();
    const [assets, setAssets] = useLocalStorage<FixedAsset[]>('fixedAssets', []);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
    const [viewingAsset, setViewingAsset] = useState<FixedAsset | null>(null);
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const [annualReport, setAnnualReport] = useState<any[] | null>(null);

    const formatCurrency = (amount: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP', minimumFractionDigits: 2 }).format(amount);

    const handleOpenForm = (asset?: FixedAsset) => {
        setEditingAsset(asset || null);
        setIsFormOpen(true);
    };

    const handleSaveAsset = (assetData: FixedAsset) => {
        setAssets(prev => {
            const existing = prev.find(a => a.id === assetData.id);
            return existing ? prev.map(a => (a.id === assetData.id ? assetData : a)) : [...prev, assetData];
        });
    };
    
    const handleDeleteAsset = (id: string) => {
        if (window.confirm(t('history.confirmDelete'))) {
            setAssets(prev => prev.filter(a => a.id !== id));
        }
    };
    
    const handleGenerateAnnualReport = () => {
        const reportData = assets.map(asset => {
            const schedule = calculateDepreciation(asset);
            const yearEntry = schedule.find(e => e.year === reportYear);
            return {
                name: asset.name,
                depreciation: yearEntry ? yearEntry.depreciation : 0,
                bookValue: yearEntry ? yearEntry.bookValue : 0,
            };
        });
        setAnnualReport(reportData);
    };

    const handleExportAnnualReport = () => {
        if (!annualReport) return;
        const uri = generateAnnualDepreciationExcelDataUri(reportYear, annualReport, t);
        const filename = `Annual-Depreciation-Report-${reportYear}.xlsx`;
        downloadFile(filename, uri, t);
    }
    
    const totalAnnualDepreciation = useMemo(() => {
        if (!annualReport) return 0;
        return annualReport.reduce((sum, item) => sum + item.depreciation, 0);
    }, [annualReport]);

    return (
        <div className="max-w-6xl mx-auto animate-fade-in space-y-8">
            <h2 className="text-3xl font-bold text-center text-cyan-700 dark:text-cyan-400">{t('fixedAssets.title')}</h2>

            <section className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-cyan-800 dark:text-cyan-300">{t('fixedAssets.assets.title')}</h3>
                    <button onClick={() => handleOpenForm()} className="bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-700 transition-colors">{t('fixedAssets.assets.add')}</button>
                </div>
                {assets.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">{t('fixedAssets.assets.none')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-cyan-500/30">
                                    <th className="p-2 text-start">{t('fixedAssets.table.name')}</th>
                                    <th className="p-2 text-start">{t('fixedAssets.table.cost')}</th>
                                    <th className="p-2 text-start">{t('fixedAssets.table.purchaseDate')}</th>
                                    <th className="p-2 text-start">{t('fixedAssets.table.method')}</th>
                                    <th className="p-2 text-start">{t('fixedAssets.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map(asset => (
                                    <tr key={asset.id} className="border-b dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="p-2 font-semibold cursor-pointer hover:underline" onClick={() => setViewingAsset(asset)}>{asset.name}</td>
                                        <td className="p-2 font-mono">{formatCurrency(asset.cost)}</td>
                                        <td className="p-2">{new Date(asset.purchaseDate).toLocaleDateString(language)}</td>
                                        <td className="p-2">{t(`fixedAssets.method.${asset.depreciationMethod}` as any)}</td>
                                        <td className="p-2 flex gap-2">
                                            <button onClick={() => handleOpenForm(asset)} className="text-blue-500 hover:underline">{t('payrollManager.employees.edit')}</button>
                                            <button onClick={() => handleDeleteAsset(asset.id)} className="text-red-500 hover:underline">{t('history.item.delete')}</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
            
            <section className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <h3 className="text-2xl font-bold text-cyan-800 dark:text-cyan-300 mb-4">{t('fixedAssets.annualReport.title')}</h3>
                 <div className="flex flex-col sm:flex-row gap-4 mb-4 items-end">
                    <div className="flex-grow">
                        <SelectField id="reportYear" label={t('salary.form.year.label')} value={reportYear} onChange={e => setReportYear(parseInt(e.target.value))} options={TAX_YEARS.map(y => ({ value: y, label: y.toString() }))} />
                    </div>
                    <button onClick={handleGenerateAnnualReport} className="w-full sm:w-auto bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors">{t('fixedAssets.annualReport.generate')}</button>
                </div>
                {annualReport && (
                    <div className="mt-4 animate-fade-in">
                        <div className="flex justify-between items-center mb-2">
                             <h4 className="font-bold">{t('fixedAssets.annualReport.total')}: <span className="text-green-600 dark:text-green-400 font-mono">{formatCurrency(totalAnnualDepreciation)}</span></h4>
                             <button onClick={handleExportAnnualReport} className="bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors text-sm">{t('fixedAssets.annualReport.export')}</button>
                        </div>
                        <div className="max-h-60 overflow-y-auto border rounded-lg">
                           <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-gray-100 dark:bg-gray-900"><tr className="border-b dark:border-cyan-500/30">
                                    <th className="p-2">{t('fixedAssets.table.name')}</th>
                                    <th className="p-2">{t('fixedAssets.annualReport.depreciationForYear')}</th>
                                    <th className="p-2">{t('fixedAssets.annualReport.bookValue')}</th>
                                </tr></thead>
                                <tbody>
                                    {annualReport.map(item => (
                                        <tr key={item.name} className="border-b dark:border-gray-700/50 last:border-0">
                                            <td className="p-2">{item.name}</td>
                                            <td className="p-2 font-mono text-center">{formatCurrency(item.depreciation)}</td>
                                            <td className="p-2 font-mono text-center">{formatCurrency(item.bookValue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                           </table>
                        </div>
                    </div>
                )}
            </section>
            
            <AssetForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={handleSaveAsset} assetToEdit={editingAsset} />
            <AssetDetailsModal asset={viewingAsset} onClose={() => setViewingAsset(null)} />
        </div>
    );
};

export default FixedAssetsCalculator;
