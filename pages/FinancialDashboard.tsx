import React, { useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { useTranslation } from '../i18n/context';
import type { Invoice, Product, PayrollRun, InvoiceStatus } from '../types';

const SummaryCard: React.FC<{ title: string, value: string, icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800/60 p-4 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-lg flex items-center gap-4">
        <div className="text-3xl text-cyan-500 bg-cyan-100 dark:bg-cyan-900/50 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
    </div>
);

const ChartContainer: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 shadow-xl shadow-gray-400/20 dark:shadow-2xl dark:shadow-fuchsia-500/10">
        <h3 className="text-xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4 text-center">{title}</h3>
        {children}
    </div>
);

const DoughnutChart: React.FC<{ data: { label: string, value: number, color: string }[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <div className="text-center text-gray-500 py-12">No data</div>;

    const circumference = 2 * Math.PI * 45;
    let accumulatedOffset = 0;

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="-rotate-90">
                    {data.map((item, index) => {
                        const percentage = item.value / total;
                        const dashoffset = circumference - accumulatedOffset;
                        const dasharray = `${percentage * circumference} ${circumference}`;
                        accumulatedOffset += percentage * circumference;
                        return (
                            <circle
                                key={index}
                                cx="50" cy="50" r="45"
                                fill="none"
                                stroke={item.color}
                                strokeWidth="10"
                                strokeDasharray={dasharray}
                                strokeDashoffset={dashoffset}
                            />
                        )
                    })}
                </svg>
            </div>
            <div className="w-full md:w-60 space-y-2">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                            <span className="w-3 h-3 rounded-full me-2" style={{ backgroundColor: item.color }}></span>
                            <span>{item.label}</span>
                        </div>
                        <span className="font-mono">{item.value} ({(item.value / total * 100).toFixed(1)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BarChart: React.FC<{ data: { label: string, value: number }[], formatValue: (v: number) => string }> = ({ data, formatValue }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const barColor = 'currentColor';

    return (
        <div className="w-full h-64">
            <svg width="100%" height="100%" viewBox={`0 0 400 200`}>
                {/* Y-axis lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(tick => (
                    <g key={tick} className="text-gray-200 dark:text-gray-700">
                        <line x1="30" x2="400" y1={180 - tick * 160} y2={180 - tick * 160} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2" />
                        <text x="25" y={185 - tick * 160} textAnchor="end" fontSize="10" className="fill-current text-gray-500 dark:text-gray-400">
                            {formatValue(tick * maxValue)}
                        </text>
                    </g>
                ))}

                {/* Bars and X-axis labels */}
                {data.map((item, index) => {
                    const barHeight = (item.value / maxValue) * 160;
                    const x = 40 + index * (360 / data.length);
                    const y = 180 - barHeight;
                    const barWidth = 20;
                    return (
                        <g key={index} className="text-cyan-500 dark:text-cyan-400 hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-colors">
                            <title>{`${item.label}: ${formatValue(item.value)}`}</title>
                            <rect x={x - barWidth/2} y={y} width={barWidth} height={barHeight} fill={barColor} rx="2" />
                            <text x={x} y="195" textAnchor="middle" fontSize="10" className="fill-current text-gray-600 dark:text-gray-300">
                                {item.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

const FinancialDashboard: React.FC = () => {
    const { t, language } = useTranslation();
    const [invoices] = useLocalStorage<Invoice[]>('invoices', []);
    const [products] = useLocalStorage<Product[]>('inventoryProducts', []);
    const [payrolls] = useLocalStorage<PayrollRun[]>('payrollHistory', []);

    const formatCurrency = (amount: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);

    const kpiData = useMemo(() => {
        const totalRevenue = invoices
            .filter(i => i.status === 'paid')
            .reduce((sum, i) => sum + i.items.reduce((itemSum, item) => itemSum + item.quantity * item.unitPrice, 0) * (1 + i.taxRate), 0);

        const outstandingRevenue = invoices
            .filter(i => i.status === 'draft' || i.status === 'overdue')
            .reduce((sum, i) => sum + i.items.reduce((itemSum, item) => itemSum + item.quantity * item.unitPrice, 0) * (1 + i.taxRate), 0);

        const inventoryValue = products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

        const lastPayrollCost = [...payrolls].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]?.summary.totalNet || 0;
        
        return { totalRevenue, outstandingRevenue, inventoryValue, lastPayrollCost };
    }, [invoices, products, payrolls]);

    const chartData = useMemo(() => {
        const invoiceStatus = invoices.reduce((acc, i) => {
            acc[i.status] = (acc[i.status] || 0) + 1;
            return acc;
        }, {} as Record<InvoiceStatus, number>);

        const invoiceStatusData = [
            { label: t('invoicing.status.paid'), value: invoiceStatus.paid || 0, color: '#22c55e' },
            { label: t('invoicing.status.overdue'), value: invoiceStatus.overdue || 0, color: '#ef4444' },
            { label: t('invoicing.status.draft'), value: invoiceStatus.draft || 0, color: '#6b7280' },
        ];
        
        const monthlyRevenue = Array(6).fill(0).map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return { month: d.getMonth() + 1, year: d.getFullYear(), revenue: 0, label: t(`month.${d.getMonth() + 1}` as any) };
        }).reverse();

        invoices.filter(i => i.status === 'paid').forEach(i => {
            const issueDate = new Date(i.issueDate);
            const month = issueDate.getMonth() + 1;
            const year = issueDate.getFullYear();
            const targetMonth = monthlyRevenue.find(m => m.month === month && m.year === year);
            if(targetMonth) {
                targetMonth.revenue += i.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) * (1 + i.taxRate);
            }
        });

        const monthlyRevenueData = monthlyRevenue.map(m => ({ label: m.label, value: m.revenue }));

        return { invoiceStatusData, monthlyRevenueData };
    }, [invoices, t]);

    const hasData = invoices.length > 0 || products.length > 0 || payrolls.length > 0;

    return (
        <div className="animate-fade-in space-y-8">
            <h2 className="text-3xl font-bold text-center text-cyan-700 dark:text-cyan-400">{t('financialDashboard.title')}</h2>
            
            {!hasData && (
                 <div className="text-center bg-white dark:bg-gray-800/50 p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30">
                    <p className="text-gray-600 dark:text-gray-400">{t('financialDashboard.noData')}</p>
                 </div>
            )}

            {hasData && (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SummaryCard title={t('financialDashboard.totalRevenue')} value={formatCurrency(kpiData.totalRevenue)} icon="💵" />
                    <SummaryCard title={t('financialDashboard.outstandingRevenue')} value={formatCurrency(kpiData.outstandingRevenue)} icon="⏳" />
                    <SummaryCard title={t('financialDashboard.inventoryValue')} value={formatCurrency(kpiData.inventoryValue)} icon="📦" />
                    <SummaryCard title={t('financialDashboard.payrollCost')} value={formatCurrency(kpiData.lastPayrollCost)} icon="👥" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ChartContainer title={t('financialDashboard.invoiceStatus')}>
                        <DoughnutChart data={chartData.invoiceStatusData} />
                    </ChartContainer>
                    <ChartContainer title={t('financialDashboard.monthlyRevenue')}>
                        <BarChart data={chartData.monthlyRevenueData} formatValue={formatCurrency} />
                    </ChartContainer>
                </div>
                </>
            )}

        </div>
    );
};

export default FinancialDashboard;