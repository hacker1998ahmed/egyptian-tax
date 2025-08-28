import React, { useState, useMemo, useRef } from 'react';
import type { Customer, Invoice, InvoiceItem, InvoiceStatus } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { useTranslation } from '../i18n/context';
import Modal from '../components/Modal';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import { DEVELOPER_INFO } from '../constants';
import { generatePdfDataUri, downloadFile, shareFile } from '../utils/reportGenerator';

const Invoicing: React.FC = () => {
    const { t } = useTranslation();
    const [view, setView] = useState<'invoices' | 'customers' | 'details'>('invoices');
    const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', []);
    const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', []);

    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const [isInvoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);

    const handleNewInvoice = () => {
        setSelectedInvoice(null);
        setInvoiceModalOpen(true);
    };

    const handleEditInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setInvoiceModalOpen(true);
    };

    const handleViewInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setView('details');
    };
    
    const handleSaveInvoice = (invoice: Invoice) => {
        setInvoices(prev => {
            const existing = prev.find(i => i.id === invoice.id);
            return existing ? prev.map(i => (i.id === invoice.id ? invoice : i)) : [invoice, ...prev];
        });
    };

    const handleDeleteInvoice = (id: string) => {
        if(window.confirm(t('history.confirmDelete'))){
            setInvoices(prev => prev.filter(i => i.id !== id));
        }
    };

    const handleNewCustomer = () => {
        setSelectedCustomer(null);
        setCustomerModalOpen(true);
    };

    const handleEditCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setCustomerModalOpen(true);
    };

    const handleSaveCustomer = (customer: Customer) => {
        setCustomers(prev => {
            const existing = prev.find(c => c.id === customer.id);
            return existing ? prev.map(c => (c.id === customer.id ? customer : c)) : [customer, ...prev];
        });
    };
    
     const handleDeleteCustomer = (id: string) => {
        if(window.confirm(t('history.confirmDelete'))){
            setCustomers(prev => prev.filter(c => c.id !== id));
        }
    };


    const renderView = () => {
        if (view === 'details' && selectedInvoice) {
            return <InvoiceDetails invoice={selectedInvoice} customers={customers} onBack={() => setView('invoices')} onEdit={handleEditInvoice} />;
        }
        if (view === 'customers') {
            return <CustomerList customers={customers} onNew={handleNewCustomer} onEdit={handleEditCustomer} onDelete={handleDeleteCustomer} />;
        }
        return <InvoiceList invoices={invoices} customers={customers} onNew={handleNewInvoice} onEdit={handleEditInvoice} onView={handleViewInvoice} onDelete={handleDeleteInvoice} />;
    };
    
    return(
        <div className="max-w-7xl mx-auto animate-fade-in space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-center text-cyan-700 dark:text-cyan-400">{t('invoicing.title')}</h2>
                <div className="flex gap-2 p-1 bg-gray-200 dark:bg-gray-800 rounded-lg">
                    <button onClick={() => setView('invoices')} className={`px-4 py-2 rounded-md font-semibold transition-colors ${view === 'invoices' || view === 'details' ? 'bg-cyan-600 text-white' : 'hover:bg-gray-300 dark:hover:bg-gray-700'}`}>{t('invoicing.invoices.title')}</button>
                    <button onClick={() => setView('customers')} className={`px-4 py-2 rounded-md font-semibold transition-colors ${view === 'customers' ? 'bg-cyan-600 text-white' : 'hover:bg-gray-300 dark:hover:bg-gray-700'}`}>{t('invoicing.customers.manage')}</button>
                </div>
            </div>
            
            {renderView()}

            <InvoiceFormModal 
                isOpen={isInvoiceModalOpen}
                onClose={() => setInvoiceModalOpen(false)}
                onSave={handleSaveInvoice}
                invoiceToEdit={selectedInvoice}
                customers={customers}
                invoices={invoices}
            />
            <CustomerFormModal
                isOpen={isCustomerModalOpen}
                onClose={() => setCustomerModalOpen(false)}
                onSave={handleSaveCustomer}
                customerToEdit={selectedCustomer}
            />
        </div>
    );
};

// Sub-components for different views
const InvoiceList: React.FC<{invoices: Invoice[], customers: Customer[], onNew: ()=>void, onEdit: (i: Invoice)=>void, onView: (i: Invoice)=>void, onDelete: (id: string)=>void}> = ({invoices, customers, onNew, onEdit, onView, onDelete}) => {
    const {t, language} = useTranslation();
    const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c.name])), [customers]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(amount);
    
    const getStatusChip = (status: InvoiceStatus) => {
        const base = 'px-2 py-1 text-xs font-bold rounded-full';
        switch(status){
            case 'paid': return `${base} bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300`;
            case 'overdue': return `${base} bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300`;
            default: return `${base} bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
        }
    }

    return (
        <section className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-cyan-800 dark:text-cyan-300">{t('invoicing.invoices.title')}</h3>
                <button onClick={onNew} className="bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-700 transition-colors">{t('invoicing.invoices.new')}</button>
            </div>
            {invoices.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('invoicing.invoices.none')}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b-2 border-cyan-500/30">
                            {['invoiceNo', 'customer', 'issueDate', 'dueDate', 'total', 'status', 'actions'].map(h => <th key={h} className="p-2 text-start">{t(`invoicing.table.${h}` as any)}</th>)}
                        </tr></thead>
                        <tbody>
                            {invoices.map(inv => {
                                const subtotal = inv.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
                                const total = subtotal * (1 + inv.taxRate);
                                return (
                                <tr key={inv.id} className="border-b dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="p-2 font-mono cursor-pointer text-cyan-600 dark:text-cyan-400 hover:underline" onClick={() => onView(inv)}>{inv.id}</td>
                                    <td className="p-2">{customerMap.get(inv.customerId) || 'N/A'}</td>
                                    <td className="p-2">{new Date(inv.issueDate).toLocaleDateString(language)}</td>
                                    <td className="p-2">{new Date(inv.dueDate).toLocaleDateString(language)}</td>
                                    <td className="p-2 font-mono">{formatCurrency(total)}</td>
                                    <td className="p-2"><span className={getStatusChip(inv.status)}>{t(`invoicing.status.${inv.status}` as any)}</span></td>
                                    <td className="p-2 flex gap-2">
                                        <button onClick={() => onEdit(inv)} className="text-blue-500 hover:underline">{t('payrollManager.employees.edit')}</button>
                                        <button onClick={() => onDelete(inv.id)} className="text-red-500 hover:underline">{t('history.item.delete')}</button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

const CustomerList: React.FC<{customers: Customer[], onNew: ()=>void, onEdit: (c: Customer)=>void, onDelete: (id: string)=>void}> = ({customers, onNew, onEdit, onDelete}) => {
    const {t} = useTranslation();
    return (
         <section className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-cyan-800 dark:text-cyan-300">{t('invoicing.customers.title')}</h3>
                <button onClick={onNew} className="bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-700 transition-colors">{t('invoicing.customers.new')}</button>
            </div>
            {customers.length === 0 ? (
                 <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('invoicing.customers.none')}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b-2 border-cyan-500/30">
                            {['name', 'email', 'phone', 'address', 'actions'].map(h => <th key={h} className="p-2 text-start">{t(`invoicing.form.customer.${h}` as any) || t(`invoicing.table.${h}` as any)}</th>)}
                        </tr></thead>
                        <tbody>
                            {customers.map(cust => (
                                <tr key={cust.id} className="border-b dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="p-2 font-semibold">{cust.name}</td>
                                    <td className="p-2">{cust.email}</td>
                                    <td className="p-2">{cust.phone}</td>
                                    <td className="p-2">{cust.address}</td>
                                    <td className="p-2 flex gap-2">
                                        <button onClick={() => onEdit(cust)} className="text-blue-500 hover:underline">{t('payrollManager.employees.edit')}</button>
                                        <button onClick={() => onDelete(cust.id)} className="text-red-500 hover:underline">{t('history.item.delete')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

const InvoiceDetails: React.FC<{invoice: Invoice, customers: Customer[], onBack: ()=>void, onEdit: (i: Invoice)=>void}> = ({invoice, customers, onBack, onEdit}) => {
    const { t, language } = useTranslation();
    const customer = customers.find(c => c.id === invoice.customerId);
    const invoiceRef = useRef<HTMLDivElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const formatCurrency = (amount: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(amount);

    const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = subtotal * invoice.taxRate;
    const total = subtotal + taxAmount;
    
    const handleDownload = async () => {
        if (!invoiceRef.current || isProcessing) return;
        setIsProcessing(true);
        const uri = await generatePdfDataUri(invoiceRef.current);
        await downloadFile(`Invoice-${invoice.id}.pdf`, uri, (key) => t(key as any));
        setIsProcessing(false);
    };

    const handleShare = async () => {
        if (!invoiceRef.current || isProcessing) return;
        setIsProcessing(true);
        const uri = await generatePdfDataUri(invoiceRef.current);
        if (uri) {
            await shareFile(
                `${t('invoicing.details.invoice')} ${invoice.id}`,
                `${t('invoicing.details.total')}: ${formatCurrency(total)}`,
                `Invoice-${invoice.id}.pdf`,
                uri,
                'application/pdf',
                (key) => t(key as any)
            );
        }
        setIsProcessing(false);
    };
    
    return (
        <div className="animate-fade-in">
            <div ref={invoiceRef} className="p-4 md:p-8 bg-white dark:bg-gray-800 printable-area border border-gray-200 dark:border-cyan-500/30 rounded-lg">
                <div className="grid grid-cols-2 gap-8 items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{DEVELOPER_INFO.name}</h1>
                        <p className="text-sm text-gray-500">{DEVELOPER_INFO.email}</p>
                    </div>
                    <div className="text-end">
                        <h2 className="text-4xl font-bold uppercase text-gray-400 dark:text-gray-500">{t('invoicing.details.invoice')}</h2>
                        <p className="font-mono">{t('invoicing.details.invoiceNo')} {invoice.id}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-8 mt-12 border-t pt-8">
                    <div>
                        <p className="font-bold text-gray-500 dark:text-gray-400">{t('invoicing.details.billTo')}</p>
                        <p className="font-bold text-lg">{customer?.name}</p>
                        <p>{customer?.address}</p>
                        <p>{customer?.email}</p>
                        <p>{customer?.phone}</p>
                    </div>
                    <div className="text-end">
                        <p><strong>{t('invoicing.table.issueDate')}:</strong> {new Date(invoice.issueDate).toLocaleDateString(language)}</p>
                        <p><strong>{t('invoicing.table.dueDate')}:</strong> {new Date(invoice.dueDate).toLocaleDateString(language)}</p>
                    </div>
                </div>
                <div className="mt-8 overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100 dark:bg-gray-900"><tr className="border-b-2 border-gray-300 dark:border-cyan-500/30">
                            <th className="p-2 text-start">{t('invoicing.form.item.description')}</th>
                            <th className="p-2 text-center">{t('invoicing.form.item.quantity')}</th>
                            <th className="p-2 text-end">{t('invoicing.form.item.unitPrice')}</th>
                            <th className="p-2 text-end">{t('invoicing.form.item.total')}</th>
                        </tr></thead>
                        <tbody>
                            {invoice.items.map(item => (
                                <tr key={item.id} className="border-b dark:border-gray-700/50">
                                    <td className="p-2">{item.description}</td>
                                    <td className="p-2 text-center font-mono">{item.quantity}</td>
                                    <td className="p-2 text-end font-mono">{formatCurrency(item.unitPrice)}</td>
                                    <td className="p-2 text-end font-mono">{formatCurrency(item.quantity * item.unitPrice)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="mt-8 flex justify-end">
                    <div className="w-full max-w-xs space-y-2">
                        <div className="flex justify-between"><span className="font-bold">{t('invoicing.details.subtotal')}:</span> <span className="font-mono">{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between"><span className="font-bold">{t('invoicing.details.tax')} ({invoice.taxRate * 100}%):</span> <span className="font-mono">{formatCurrency(taxAmount)}</span></div>
                        <div className="flex justify-between text-xl font-bold border-t-2 pt-2 border-gray-300 dark:border-cyan-500/30"><span className="">{t('invoicing.details.total')}:</span> <span className="font-mono text-cyan-600 dark:text-cyan-400">{formatCurrency(total)}</span></div>
                    </div>
                </div>
                {invoice.notes && <div className="mt-8 border-t pt-4"><p className="font-bold">{t('invoicing.details.notes')}</p><p className="text-sm text-gray-600 dark:text-gray-400">{invoice.notes}</p></div>}
            </div>
             <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 no-print">
                <button onClick={onBack} disabled={isProcessing} className="bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50">{t('invoicing.details.back')}</button>
                <button onClick={() => onEdit(invoice)} disabled={isProcessing} className="bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">{t('payrollManager.employees.edit')}</button>
                <button onClick={handleDownload} disabled={isProcessing} className="bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50">{isProcessing ? t('report.downloadingPdf') : t('invoicing.details.downloadPdf')}</button>
                <button onClick={handleShare} disabled={isProcessing} className="bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50">{isProcessing ? t('common.sharing') : t('common.share')}</button>
            </div>
        </div>
    );
};

// Form Modals
const InvoiceFormModal: React.FC<{isOpen: boolean, onClose: ()=>void, onSave: (i: Invoice)=>void, invoiceToEdit: Invoice|null, customers: Customer[], invoices: Invoice[]}> = ({isOpen, onClose, onSave, invoiceToEdit, customers, invoices}) => {
    const {t} = useTranslation();
    const [invoice, setInvoice] = useState<Omit<Invoice, 'id'>>({ customerId: '', issueDate: new Date().toISOString().split('T')[0], dueDate: '', items: [{id: '1', description: '', quantity: 1, unitPrice: 0}], status: 'draft', taxRate: 0.14, notes: '' });
    
    React.useEffect(() => {
        if(isOpen){
            if (invoiceToEdit) {
                setInvoice(invoiceToEdit);
            } else {
                const lastId = invoices[0]?.id.split('-').pop() || '0';
                const newIdNumber = parseInt(lastId) + 1;
                const newId = `INV-${new Date().getFullYear()}-${String(newIdNumber).padStart(3, '0')}`;
                setInvoice({ customerId: customers[0]?.id || '', issueDate: new Date().toISOString().split('T')[0], dueDate: '', items: [{id: '1', description: '', quantity: 1, unitPrice: 0}], status: 'draft', taxRate: 0.14, notes: '' });
            }
        }
    }, [invoiceToEdit, isOpen, customers, invoices]);

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: string) => {
        const newItems = [...invoice.items];
        const item = newItems[index];
        if(field === 'description') item.description = value;
        else if (field === 'quantity') item.quantity = parseFloat(value) || 0;
        else if (field === 'unitPrice') item.unitPrice = parseFloat(value) || 0;
        setInvoice(prev => ({...prev, items: newItems}));
    };
    
    const addItem = () => setInvoice(prev => ({...prev, items: [...prev.items, {id: String(Date.now()), description: '', quantity: 1, unitPrice: 0}]}));
    const removeItem = (index: number) => setInvoice(prev => ({...prev, items: prev.items.filter((_, i) => i !== index)}));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalId = invoiceToEdit?.id || `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
        onSave({...invoice, id: finalId});
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('invoicing.form.title')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <SelectField id="customer" label={t('invoicing.form.customer.label')} value={invoice.customerId} onChange={e => setInvoice(p => ({...p, customerId: e.target.value}))} options={customers.map(c => ({value: c.id, label: c.name}))} required/>
                 <div className="grid grid-cols-2 gap-4">
                     <InputField id="issueDate" label={t('invoicing.form.issueDate.label')} type="date" value={invoice.issueDate} onChange={e => setInvoice(p=>({...p, issueDate: e.target.value}))} required/>
                     <InputField id="dueDate" label={t('invoicing.form.dueDate.label')} type="date" value={invoice.dueDate} onChange={e => setInvoice(p=>({...p, dueDate: e.target.value}))} required/>
                 </div>
                 <h4 className="font-bold pt-2">{t('invoicing.form.items.title')}</h4>
                 <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {invoice.items.map((item, index) => (
                        <div key={item.id} className="flex gap-2 items-end">
                            <div className="flex-grow"><InputField id={`desc-${index}`} label={t('invoicing.form.item.description')} value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} /></div>
                            <div className="w-20"><InputField id={`qty-${index}`} label={t('invoicing.form.item.quantity')} type="number" value={item.quantity||''} onChange={e => handleItemChange(index, 'quantity', e.target.value)}/></div>
                            <div className="w-24"><InputField id={`price-${index}`} label={t('invoicing.form.item.unitPrice')} type="number" value={item.unitPrice||''} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)}/></div>
                            <button type="button" onClick={() => removeItem(index)} className="bg-red-500 text-white rounded-md p-2 h-10 mb-0.5">X</button>
                        </div>
                    ))}
                 </div>
                 <button type="button" onClick={addItem} className="text-sm text-cyan-600 hover:underline">{t('invoicing.form.items.add')}</button>
                 <InputField id="notes" label={t('invoicing.form.notes.label')} value={invoice.notes} onChange={e => setInvoice(p => ({...p, notes: e.target.value}))} />
                 <div className="grid grid-cols-2 gap-4">
                    <InputField id="taxRate" label={t('invoicing.form.taxRate.label')} type="number" step="0.01" value={invoice.taxRate * 100 || ''} onChange={e => setInvoice(p => ({...p, taxRate: parseFloat(e.target.value)/100 || 0}))}/>
                    <SelectField id="status" label={t('invoicing.form.status.label')} value={invoice.status} onChange={e => setInvoice(p => ({...p, status: e.target.value as InvoiceStatus}))} options={['draft', 'paid', 'overdue'].map(s => ({value: s, label: t(`invoicing.status.${s}` as any)}))} />
                 </div>
                 <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600">{t('payrollManager.form.cancel')}</button>
                    <button type="submit" className="bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-700">{t('invoicing.form.save')}</button>
                </div>
            </form>
        </Modal>
    );
};

const CustomerFormModal: React.FC<{isOpen: boolean, onClose: ()=>void, onSave: (c: Customer)=>void, customerToEdit: Customer|null}> = ({isOpen, onClose, onSave, customerToEdit}) => {
    const { t } = useTranslation();
    const [customer, setCustomer] = useState<Omit<Customer, 'id'>>({ name: '', email: '', phone: '', address: '' });
    
    React.useEffect(() => {
        setCustomer(customerToEdit ? {...customerToEdit} : { name: '', email: '', phone: '', address: '' });
    }, [customerToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...customer, id: customerToEdit?.id || String(Date.now()) });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={customerToEdit ? t('invoicing.customers.edit') : t('invoicing.customers.new')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField id="cust-name" label={t('invoicing.form.customer.name')} value={customer.name} onChange={e => setCustomer(p => ({...p, name: e.target.value}))} required/>
                <InputField id="cust-email" label={t('invoicing.form.customer.email')} type="email" value={customer.email} onChange={e => setCustomer(p => ({...p, email: e.target.value}))} />
                <InputField id="cust-phone" label={t('invoicing.form.customer.phone')} value={customer.phone} onChange={e => setCustomer(p => ({...p, phone: e.target.value}))} />
                <InputField id="cust-address" label={t('invoicing.form.customer.address')} value={customer.address} onChange={e => setCustomer(p => ({...p, address: e.target.value}))} />
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600">{t('payrollManager.form.cancel')}</button>
                    <button type="submit" className="bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-700">{t('payrollManager.form.save')}</button>
                </div>
            </form>
        </Modal>
    );
};

export default Invoicing;