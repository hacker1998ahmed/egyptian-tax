import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { TAX_YEARS, MONTHS_KEYS } from '../constants';
import { getPayrollReport } from '../services/offlineCalculationService';
import type { Employee, PayrollParams, PayrollRun, PayrollEmployeeRecord, CalculationRecord, ReportData } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import Modal from '../components/Modal';
import { useTranslation, TranslationKey } from '../i18n/context';
import { generatePayrollExcelDataUri, generatePdfDataUri, downloadFile, shareFile } from '../utils/reportGenerator';

const emptyEmployee: Omit<Employee, 'id'> = {
  name: '',
  department: '',
  grossMonthlySalary: 0,
  allowances: 0,
  deductions: 0,
};

// Sub-component for the Employee Form within a Modal
const EmployeeForm: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
  employeeToEdit: Employee | null;
}> = ({ isOpen, onClose, onSave, employeeToEdit }) => {
  const { t } = useTranslation();
  const [employee, setEmployee] = useState<Omit<Employee, 'id'>>(emptyEmployee);

  useEffect(() => {
    setEmployee(employeeToEdit ? { ...employeeToEdit } : emptyEmployee);
  }, [employeeToEdit, isOpen]);

  const handleChange = (field: keyof typeof emptyEmployee, value: string) => {
    const isNumeric = ['grossMonthlySalary', 'allowances', 'deductions'].includes(field);
    setEmployee(prev => ({ ...prev, [field]: isNumeric ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...employee, id: employeeToEdit?.id || new Date().toISOString() });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employeeToEdit ? t('payrollManager.employees.edit') : t('payrollManager.employees.add')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField id="name" label={t('payrollManager.form.name')} value={employee.name} onChange={e => handleChange('name', e.target.value)} required />
        <InputField id="department" label={t('payrollManager.form.department')} value={employee.department} onChange={e => handleChange('department', e.target.value)} />
        <InputField id="gross" label={t('payrollManager.form.gross')} type="number" value={employee.grossMonthlySalary || ''} onChange={e => handleChange('grossMonthlySalary', e.target.value)} required />
        <InputField id="allowances" label={t('payrollManager.form.allowances')} type="number" value={employee.allowances || ''} onChange={e => handleChange('allowances', e.target.value)} />
        <InputField id="deductions" label={t('payrollManager.form.deductions')} type="number" value={employee.deductions || ''} onChange={e => handleChange('deductions', e.target.value)} />
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} className="bg-gray-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors">{t('payrollManager.form.cancel')}</button>
          <button type="submit" className="bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-700 transition-colors">{t('payrollManager.form.save')}</button>
        </div>
      </form>
    </Modal>
  );
};


// Sub-component to display a generated payroll run
const PayrollRunDisplay: React.FC<{
    payroll: PayrollRun,
    onBack: () => void
}> = ({ payroll, onBack }) => {
    const { t, language } = useTranslation();
    const reportContentRef = useRef<HTMLDivElement>(null);
    const [isProcessing, setIsProcessing] = useState<null | 'pdf' | 'excel' | 'share'>(null);

    const formatCurrency = (amount: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(amount);
    
    const handleExportExcel = async () => {
        if(isProcessing) return;
        setIsProcessing('excel');
        const uri = generatePayrollExcelDataUri(payroll, (key, ...args) => t(key as any, ...args));
        const filename = `Payroll-${payroll.year}-${payroll.month}.xlsx`;
        await downloadFile(filename, uri, (key) => t(key as any));
        setIsProcessing(null);
    };

    const handleExportPdf = async () => {
        if (!reportContentRef.current || isProcessing) return;
        setIsProcessing('pdf');
        const uri = await generatePdfDataUri(reportContentRef.current);
        const filename = `Payroll-${payroll.year}-${payroll.month}.pdf`;
        await downloadFile(filename, uri, (key) => t(key as any));
        setIsProcessing(null);
    };

    const handleShare = async () => {
        if (!reportContentRef.current || isProcessing) return;
        setIsProcessing('share');
        const uri = await generatePdfDataUri(reportContentRef.current);
        if (uri) {
            const filename = `Payroll-${payroll.year}-${payroll.month}.pdf`;
            const summaryText = t('payrollManager.report.summaryTitle') + `\n` + t('payrollManager.report.totalNet') + `: ${formatCurrency(payroll.summary.totalNet)}`;
            await shareFile(
                t('payrollManager.report.title', t(`month.${payroll.month}` as any), payroll.year), 
                summaryText, 
                filename,
                uri,
                'application/pdf',
                (key) => t(key as any)
            );
        }
        setIsProcessing(null);
    };
    
    return (
        <div className="animate-fade-in">
            <div ref={reportContentRef} className="printable-area bg-gray-100 dark:bg-gray-900 p-4">
                <h2 className="text-3xl font-bold text-center text-cyan-700 dark:text-cyan-400 mb-6">{t('payrollManager.report.title', t(`month.${payroll.month}` as any), payroll.year)}</h2>
                
                <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 mb-6 printable-card">
                    <h3 className="text-xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4">{t('payrollManager.report.summaryTitle')}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                        <div className="bg-gray-100 dark:bg-gray-900/50 p-2 rounded-md"><p className="text-xs">{t('payrollManager.report.employeeCount')}</p><p className="font-bold">{payroll.summary.employeeCount}</p></div>
                        <div className="bg-gray-100 dark:bg-gray-900/50 p-2 rounded-md"><p className="text-xs">{t('payrollManager.report.totalGross')}</p><p className="font-bold">{formatCurrency(payroll.summary.totalGross)}</p></div>
                        <div className="bg-gray-100 dark:bg-gray-900/50 p-2 rounded-md"><p className="text-xs">{t('payrollManager.report.totalInsurance')}</p><p className="font-bold">{formatCurrency(payroll.summary.totalInsurance)}</p></div>
                        <div className="bg-gray-100 dark:bg-gray-900/50 p-2 rounded-md"><p className="text-xs">{t('payrollManager.report.totalTax')}</p><p className="font-bold">{formatCurrency(payroll.summary.totalTax)}</p></div>
                        <div className="bg-gray-100 dark:bg-gray-900/50 p-2 rounded-md"><p className="text-xs">{t('payrollManager.report.totalNet')}</p><p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(payroll.summary.totalNet)}</p></div>
                    </div>
                </div>

                <div className="overflow-x-auto bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 printable-card">
                    <table className="w-full text-sm">
                        <thead className="border-b-2 border-fuchsia-500/30">
                            <tr>
                                {[ 'name', 'department', 'gross', 'allowances', 'deductions' ].map(key => <th key={key} className="p-2 text-start">{t(`payrollManager.form.${key}` as any)}</th>)}
                                <th className="p-2 text-start">{t('report.totalInsurance')}</th>
                                <th className="p-2 text-start">{t('report.totalTax')}</th>
                                <th className="p-2 text-start font-bold">{t('report.netIncome')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payroll.records.map(r => (
                                <tr key={r.id} className="border-b dark:border-gray-700/50 last:border-0">
                                    <td className="p-2">{r.name}</td>
                                    <td className="p-2">{r.department}</td>
                                    <td className="p-2 font-mono">{formatCurrency(r.grossMonthlySalary)}</td>
                                    <td className="p-2 font-mono">{formatCurrency(r.allowances)}</td>
                                    <td className="p-2 font-mono">{formatCurrency(r.deductions)}</td>
                                    <td className="p-2 font-mono text-yellow-600 dark:text-yellow-400">{formatCurrency(r.totalInsurance)}</td>
                                    <td className="p-2 font-mono text-red-600 dark:text-red-400">{formatCurrency(r.totalTax)}</td>
                                    <td className="p-2 font-mono font-bold text-green-600 dark:text-green-400">{formatCurrency(r.netSalary)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 no-print">
                <button onClick={onBack} className="bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors">{t('payrollManager.report.back')}</button>
                <button onClick={handleExportPdf} disabled={!!isProcessing} className="bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50">{isProcessing === 'pdf' ? t('report.downloadingPdf') : t('report.downloadPdf')}</button>
                <button onClick={handleExportExcel} disabled={!!isProcessing} className="bg-green-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50">{isProcessing === 'excel' ? t('report.downloadingExcel') : t('payrollManager.report.export')}</button>
                <button onClick={handleShare} disabled={!!isProcessing} className="bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50">{isProcessing === 'share' ? t('common.sharing') : t('common.share')}</button>
            </div>
        </div>
    );
};


// Main Component
const PayrollManager: React.FC = () => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', []);
  const [payrolls, setPayrolls] = useLocalStorage<PayrollRun[]>('payrollHistory', []);
  const [, setTaxHistory] = useLocalStorage<CalculationRecord[]>('taxHistory', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [currentPayroll, setCurrentPayroll] = useState<PayrollRun | null>(null);

  const [genYear, setGenYear] = useState(new Date().getFullYear());
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);

  const monthOptions = useMemo(() => MONTHS_KEYS.map(key => ({ value: key, label: t(`month.${key}` as TranslationKey) })), [t]);

  const handleOpenModal = (employee?: Employee) => {
    setEditingEmployee(employee || null);
    setIsModalOpen(true);
  };
  
  const handleSaveEmployee = (employeeData: Employee) => {
    setEmployees(prev => {
      const existing = prev.find(e => e.id === employeeData.id);
      if (existing) {
        return prev.map(e => e.id === employeeData.id ? employeeData : e);
      }
      return [...prev, employeeData];
    });
  };

  const handleDeleteEmployee = (id: string) => {
    if (window.confirm("Are you sure?")) {
        setEmployees(prev => prev.filter(e => e.id !== id));
    }
  }

  const handleGeneratePayroll = async () => {
    if (employees.length === 0) {
        alert(t('payrollManager.generate.noEmployees'));
        return;
    }
    const payrollId = `${genYear}-${String(genMonth).padStart(2, '0')}`;
    if (payrolls.some(p => p.id === payrollId)) {
        if (!window.confirm(t('payrollManager.generate.alreadyExists'))) return;
    }

    const records: PayrollEmployeeRecord[] = [];
    let summary = { totalGross: 0, totalInsurance: 0, totalTax: 0, totalNet: 0, employeeCount: employees.length };

    for (const emp of employees) {
        const params: PayrollParams = {
            grossMonthlySalary: emp.grossMonthlySalary,
            allowances: emp.allowances,
            deductions: emp.deductions,
            year: genYear,
        };
        const report = await getPayrollReport(params);
        records.push({ ...emp, totalInsurance: report.totalInsurance, totalTax: report.totalTax, netSalary: report.netIncome });
        summary.totalGross += emp.grossMonthlySalary + emp.allowances;
        summary.totalInsurance += report.totalInsurance;
        summary.totalTax += report.totalTax;
        summary.totalNet += report.netIncome;
    }

    const newPayroll: PayrollRun = {
        id: payrollId,
        timestamp: new Date().toISOString(),
        year: genYear,
        month: genMonth,
        records,
        summary
    };
    
    setPayrolls(prev => [newPayroll, ...prev.filter(p => p.id !== payrollId)]);
    
    // Save summary to main history
    const summaryReport: ReportData = {
        summary: `Payroll summary for ${t(`month.${genMonth}` as any)} ${genYear}. Processed ${summary.employeeCount} employees.`,
        calculations: [
            { description: t('payrollManager.report.totalGross'), amount: summary.totalGross },
            { description: t('payrollManager.report.totalInsurance'), amount: summary.totalInsurance },
            { description: t('payrollManager.report.totalTax'), amount: summary.totalTax },
            { description: t('payrollManager.report.totalNet'), amount: summary.totalNet },
        ],
        grossIncome: summary.totalGross,
        totalTax: summary.totalTax,
        totalInsurance: summary.totalInsurance,
        netIncome: summary.totalNet,
        applicableLaws: ["Income Tax Law No. 91 of 2005", "Social Insurance Law No. 148 of 2019"]
    };

    const newRecord: CalculationRecord = {
        id: newPayroll.id,
        timestamp: newPayroll.timestamp,
        type: 'payroll',
        params: {
            year: genYear,
            month: genMonth,
            employeeCount: summary.employeeCount,
        } as any,
        report: summaryReport
    };
    setTaxHistory(prev => [newRecord, ...prev]);

    setCurrentPayroll(newPayroll);
  };
  
  const sortedPayrolls = useMemo(() => [...payrolls].sort((a,b) => b.id.localeCompare(a.id)), [payrolls]);

  if(currentPayroll) {
    return <PayrollRunDisplay payroll={currentPayroll} onBack={() => setCurrentPayroll(null)} />
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-8">
      <h2 className="text-3xl font-bold text-center text-cyan-700 dark:text-cyan-400">{t('payrollManager.title')}</h2>

      {/* Employee Management Section */}
      <section className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-cyan-800 dark:text-cyan-300">{t('payrollManager.employees.title')}</h3>
          <button onClick={() => handleOpenModal()} className="bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-700 transition-colors">{t('payrollManager.employees.add')}</button>
        </div>
        {employees.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">{t('payrollManager.employees.none')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead><tr className="border-b-2 border-cyan-500/30">
                    <th className="p-2 text-start">{t('payrollManager.table.name')}</th>
                    <th className="p-2 text-start">{t('payrollManager.table.department')}</th>
                    <th className="p-2 text-start">{t('payrollManager.table.gross')}</th>
                    <th className="p-2 text-start">{t('payrollManager.table.actions')}</th>
                </tr></thead>
                <tbody>{employees.map(emp => (
                    <tr key={emp.id} className="border-b dark:border-gray-700/50 last:border-0">
                        <td className="p-2 font-semibold">{emp.name}</td>
                        <td className="p-2">{emp.department}</td>
                        <td className="p-2 font-mono">{new Intl.NumberFormat().format(emp.grossMonthlySalary)}</td>
                        <td className="p-2 flex gap-2">
                            <button onClick={() => handleOpenModal(emp)} className="text-blue-500 hover:underline">Edit</button>
                            <button onClick={() => handleDeleteEmployee(emp.id)} className="text-red-500 hover:underline">Delete</button>
                        </td>
                    </tr>
                ))}</tbody>
            </table>
          </div>
        )}
      </section>
      
      {/* Generate & History Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
            <h3 className="text-2xl font-bold text-cyan-800 dark:text-cyan-300 mb-4">{t('payrollManager.generate.title')}</h3>
            <div className="flex gap-4 mb-4">
                <SelectField id="genMonth" label={t('vat.form.period.month')} value={genMonth} onChange={e => setGenMonth(parseInt(e.target.value))} options={monthOptions} />
                <SelectField id="genYear" label={t('vat.form.period.year')} value={genYear} onChange={e => setGenYear(parseInt(e.target.value))} options={TAX_YEARS.map(y => ({ value: y, label: y.toString() }))} />
            </div>
            <button onClick={handleGeneratePayroll} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400" disabled={employees.length === 0}>{t('payrollManager.generate.button')}</button>
        </section>
        
        <section className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
            <h3 className="text-2xl font-bold text-cyan-800 dark:text-cyan-300 mb-4">{t('payrollManager.history.title')}</h3>
            {payrolls.length === 0 ? (
                 <p className="text-center text-gray-500 dark:text-gray-400 py-4">{t('payrollManager.history.none')}</p>
            ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {sortedPayrolls.map(p => (
                        <li key={p.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-900/50 p-2 rounded-md">
                            <span>{t('payrollManager.report.title', t(`month.${p.month}` as any), p.year)}</span>
                            <button onClick={() => setCurrentPayroll(p)} className="text-cyan-500 hover:underline font-semibold">{t('payrollManager.history.view')}</button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
      </div>

      <EmployeeForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveEmployee} employeeToEdit={editingEmployee} />
    </div>
  );
};

export default PayrollManager;