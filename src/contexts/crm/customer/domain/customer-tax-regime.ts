export const TAX_REGIMES = ['SIMPLIFIED', 'COMMON'] as const
export type TaxRegimeValue = (typeof TAX_REGIMES)[number]
