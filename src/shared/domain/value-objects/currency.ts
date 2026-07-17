export const MONEY_CURRENCIES = ['COP', 'USD', 'MXN'] as const

export type MoneyCurrency = (typeof MONEY_CURRENCIES)[number]
