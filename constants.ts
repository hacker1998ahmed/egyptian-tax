import type { CorporateTaxLaw } from "./types";

export const DEVELOPER_INFO = {
  name: "Ahmed Mostafa Ibrahim",
  phone: "0122515329",
  email: "gogom8870@gmail.com",
};

export const TAX_YEARS = Array.from({ length: 26 }, (_, i) => 2025 - i); // 2000 to 2025

export const MONTHS_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const TAX_TYPE_KEYS = [
  "salary",
  "vat",
  "commercial_industrial_profit",
  "non_commercial_profession",
  "real_estate",
];

export const INSURANCE_TYPE_KEYS = [
  "private_sector_employee",
  "employer",
  "comprehensive_health",
  "none",
];

export const ENTITY_TYPE_KEYS = [
  "individual",
  "partnership",
  "corporation",
  "public_entity",
];

export const CORPORATE_TAX_LAWS: { value: CorporateTaxLaw, labelKey: string }[] = [
    { value: 'standard_22.5', labelKey: 'corporateLaw.standard' },
    { value: 'law_175_2023', labelKey: 'corporateLaw.law_175_2023' },
    { value: 'law_30_2023', labelKey: 'corporateLaw.law_30_2023' },
    { value: 'law_6_2025', labelKey: 'corporateLaw.law_6_2025' },
];

export const PROPERTY_TYPE_KEYS = [
    "residential",
    "non_residential",
];

export const YES_NO_OPTIONS: { value: 'yes' | 'no', labelKey: string }[] = [
    { value: "yes", labelKey: 'common.yes' },
    { value: "no", labelKey: 'common.no' },
];

export const WITHHOLDING_TYPE_KEYS = [
  "contracting_supplies",
  "services",
  "freelance_consulting",
  "commissions_brokerage",
  "non_resident_payments",
];

export const STAMP_DUTY_TYPE_KEYS = [
    "supply_contracts",
    "commercial_ads",
    "promissory_notes",
    "company_incorporation",
    "insurance_premiums",
    "bank_transactions",
];

export const GENDER_OPTIONS: { value: string, labelKey: string }[] = [
    { value: "male", labelKey: 'age.gender.male' },
    { value: "female", labelKey: 'age.gender.female' },
];

export const ZAKAT_ASSET_TYPES = [
    { key: "cash", labelKey: "zakat.form.cash" },
    { key: "gold", labelKey: "zakat.form.gold" },
    { key: "silver", labelKey: "zakat.form.silver" },
    { key: "stocks", labelKey: "zakat.form.stocks" },
    { key: "tradeGoods", labelKey: "zakat.form.tradeGoods" },
];

export const ELECTRICITY_METER_TYPE_KEYS = [
    "residential",
    "commercial",
];

export const COUNTRIES = ["China", "USA", "Germany", "Japan", "India", "South Korea", "Italy", "France", "Turkey", "Brazil", "United Kingdom", "Russia", "Saudi Arabia", "UAE", "Egypt", "Other"];

export const CUSTOMS_CATEGORY_KEYS = [
    "electronics",
    "clothing",
    "cars",
    "food",
    "other",
];
