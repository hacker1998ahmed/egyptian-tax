// All values are examples for recent years and should be updated for accuracy.

// Source: Law 30 of 2023 for 2024 brackets
export const SALARY_TAX_BRACKETS: { [key: number]: any } = {
  2024: {
    personalExemption: 15000,
    brackets: [
      { upTo: 30000, rate: 0 },
      { upTo: 15000, rate: 0.10 },
      { upTo: 15000, rate: 0.15 },
      { upTo: 140000, rate: 0.20 },
      { upTo: 200000, rate: 0.225 },
      { upTo: Infinity, rate: 0.25 },
    ],
    // Note: Higher income levels have different bracket structures (loss of 0% bracket).
    // This is a simplified model for income up to ~600k EGP.
  },
};

export const SOCIAL_INSURANCE_PARAMS: { [key: number]: any } = {
    2024: {
        min: 2000, // Min monthly contribution wage
        max: 12600, // Max monthly contribution wage
        employeeRate: 0.11,
        employerRate: 0.1875
    }
}

export const ELECTRICITY_BRACKETS: { [key: string]: any[] } = {
    residential: [
        { limit: 50, rate: 0.58 },
        { limit: 100, rate: 0.68 },
        { limit: 200, rate: 0.83 },
        { limit: 350, rate: 1.25 },
        { limit: 650, rate: 1.40 },
        { limit: 1000, rate: 1.50 },
        { limit: Infinity, rate: 1.65 },
    ],
    commercial: [
        { limit: 100, rate: 0.75 },
        { limit: 250, rate: 1.35 },
        { limit: 600, rate: 1.50 },
        { limit: 1000, rate: 1.65 },
        { limit: Infinity, rate: 1.80 },
    ]
}