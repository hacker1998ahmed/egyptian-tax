import React, { useState, useMemo } from 'react';
import type { Product } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { useTranslation } from '../i18n/context';
import Modal from '../components/Modal';
import InputField from '../components/InputField';

const emptyProduct: Omit<Product, 'id'> = {
  name: '',
  sku: '',
  costPrice: 0,
  sellingPrice: 0,
  quantity: 0,
  lowStockThreshold: 5,
};

const SummaryCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800/60 p-4 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-lg flex items-center gap-4">
        <div className="text-3xl text-cyan-500 bg-cyan-100 dark:bg-cyan-900/50 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
    </div>
);

const ProductFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit: Product | null;
}> = ({ isOpen, onClose, onSave, productToEdit }) => {
  const { t } = useTranslation();
  const [product, setProduct] = useState<Omit<Product, 'id'>>(emptyProduct);

  React.useEffect(() => {
    setProduct(productToEdit ? { ...productToEdit } : emptyProduct);
  }, [productToEdit, isOpen]);

  const handleChange = (field: keyof typeof emptyProduct, value: string) => {
    const isNumeric = ['costPrice', 'sellingPrice', 'quantity', 'lowStockThreshold'].includes(field);
    setProduct(prev => ({ ...prev, [field]: isNumeric ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...product, id: productToEdit?.id || String(Date.now()) });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={productToEdit ? t('inventory.products.edit') : t('inventory.products.add')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField id="name" label={t('inventory.form.name')} value={product.name} onChange={e => handleChange('name', e.target.value)} required />
        <InputField id="sku" label={t('inventory.form.sku')} value={product.sku} onChange={e => handleChange('sku', e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
            <InputField id="costPrice" label={t('inventory.form.costPrice')} type="number" step="0.01" value={product.costPrice || ''} onChange={e => handleChange('costPrice', e.target.value)} required />
            <InputField id="sellingPrice" label={t('inventory.form.sellingPrice')} type="number" step="0.01" value={product.sellingPrice || ''} onChange={e => handleChange('sellingPrice', e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <InputField id="quantity" label={t('inventory.form.quantity')} type="number" value={product.quantity || ''} onChange={e => handleChange('quantity', e.target.value)} required />
            <InputField id="lowStockThreshold" label={t('inventory.form.lowStockThreshold')} type="number" value={product.lowStockThreshold || ''} onChange={e => handleChange('lowStockThreshold', e.target.value)} />
        </div>
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} className="bg-gray-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors">{t('payrollManager.form.cancel')}</button>
          <button type="submit" className="bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-700 transition-colors">{t('payrollManager.form.save')}</button>
        </div>
      </form>
    </Modal>
  );
};


const Inventory: React.FC = () => {
    const { t, language } = useTranslation();
    const [products, setProducts] = useLocalStorage<Product[]>('inventoryProducts', []);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const formatCurrency = (amount: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(amount);

    const handleOpenForm = (product?: Product) => {
        setEditingProduct(product || null);
        setIsFormOpen(true);
    };

    const handleSaveProduct = (productData: Product) => {
        setProducts(prev => {
            const existing = prev.find(p => p.id === productData.id);
            return existing ? prev.map(p => (p.id === productData.id ? productData : p)) : [...prev, productData];
        });
    };
    
    const handleDeleteProduct = (id: string) => {
        if (window.confirm(t('history.confirmDelete'))) {
            setProducts(prev => prev.filter(p => p.id !== id));
        }
    };

    const summaryData = useMemo(() => {
        const totalStockValue = products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0);
        const lowStockItems = products.filter(p => p.quantity <= p.lowStockThreshold).length;
        return { totalProducts: products.length, totalStockValue, lowStockItems };
    }, [products]);

    return (
        <div className="max-w-7xl mx-auto animate-fade-in space-y-8">
            <h2 className="text-3xl font-bold text-center text-cyan-700 dark:text-cyan-400">{t('inventory.title')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard title={t('inventory.summary.totalProducts')} value={summaryData.totalProducts} icon="📦" />
                <SummaryCard title={t('inventory.summary.totalStockValue')} value={formatCurrency(summaryData.totalStockValue)} icon="💰" />
                <SummaryCard title={t('inventory.summary.lowStockItems')} value={summaryData.lowStockItems} icon="⚠️" />
            </div>

            <section className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-cyan-800 dark:text-cyan-300">{t('inventory.products.title')}</h3>
                    <button onClick={() => handleOpenForm()} className="bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-700 transition-colors">{t('inventory.products.add')}</button>
                </div>
                {products.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('inventory.products.none')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-cyan-500/30">
                                    {['name', 'sku', 'costPrice', 'sellingPrice', 'quantity', 'stockValue', 'actions'].map(h => <th key={h} className="p-2 text-start">{t(`inventory.table.${h}` as any)}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => {
                                    const isLowStock = p.quantity <= p.lowStockThreshold;
                                    return (
                                    <tr key={p.id} className={`border-b dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 ${isLowStock ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}>
                                        <td className="p-2 font-semibold">{p.name}</td>
                                        <td className="p-2 font-mono">{p.sku}</td>
                                        <td className="p-2 font-mono">{formatCurrency(p.costPrice)}</td>
                                        <td className="p-2 font-mono">{formatCurrency(p.sellingPrice)}</td>
                                        <td className="p-2 font-mono font-bold">{p.quantity}</td>
                                        <td className="p-2 font-mono">{formatCurrency(p.costPrice * p.quantity)}</td>
                                        <td className="p-2 flex gap-2">
                                            <button onClick={() => handleOpenForm(p)} className="text-blue-500 hover:underline">{t('payrollManager.employees.edit')}</button>
                                            <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:underline">{t('history.item.delete')}</button>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
            
            <ProductFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={handleSaveProduct} productToEdit={editingProduct} />
        </div>
    );
};

export default Inventory;