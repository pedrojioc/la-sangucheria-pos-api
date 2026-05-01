export const CUSTOMER_STATUSES = ['active', 'inactive'] as const
export type CustomerStatusValue = (typeof CUSTOMER_STATUSES)[number]
