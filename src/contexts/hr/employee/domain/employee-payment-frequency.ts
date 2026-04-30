export const PAYMENT_FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly'] as const
export type PaymentFrequencyValue = (typeof PAYMENT_FREQUENCIES)[number]

export class EmployeePaymentFrequency {
  constructor(public readonly value: PaymentFrequencyValue) {
    if (!PAYMENT_FREQUENCIES.includes(value)) {
      throw new Error(
        `Invalid payment frequency: ${value}. Valid values: ${PAYMENT_FREQUENCIES.join(', ')}`
      )
    }
  }
}
