export type Industry = 'retail' | 'manufacturing' | 'software' | 'construction' | 'food' | 'services';

export const industryBenchmarks: Record<Industry, { grossMargin: number, netMargin: number }> = {
    retail: {
        grossMargin: 0.35, // 35%
        netMargin: 0.04,   // 4%
    },
    manufacturing: {
        grossMargin: 0.45, // 45%
        netMargin: 0.08,   // 8%
    },
    software: {
        grossMargin: 0.80, // 80%
        netMargin: 0.25,   // 25%
    },
    construction: {
        grossMargin: 0.20, // 20%
        netMargin: 0.05,   // 5%
    },
    food: {
        grossMargin: 0.30, // 30%
        netMargin: 0.03,   // 3%
    },
    services: {
        grossMargin: 0.60, // 60%
        netMargin: 0.15,   // 15%
    }
};

export const industryOptions: { value: Industry, labelKey: string }[] = [
    { value: 'retail', labelKey: 'performanceAnalysis.industry.retail' },
    { value: 'manufacturing', labelKey: 'performanceAnalysis.industry.manufacturing' },
    { value: 'software', labelKey: 'performanceAnalysis.industry.software' },
    { value: 'construction', labelKey: 'performanceAnalysis.industry.construction' },
    { value: 'food', labelKey: 'performanceAnalysis.industry.food' },
    { value: 'services', labelKey: 'performanceAnalysis.industry.services' },
];