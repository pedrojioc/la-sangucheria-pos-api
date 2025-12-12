import { StringValueObject } from '@/shared/domain/value-objects/string'

export class SupplierWhatsappNumber extends StringValueObject {
  constructor(value: string) {
    super(value)
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: string): void {
    // Remove common formatting characters
    const cleaned = value.replace(/[\s\-\(\)]/g, '')

    // Must contain only digits and optional + at the start
    const isValidFormat = /^\+?\d{8,15}$/.test(cleaned)

    if (!isValidFormat) {
      throw new Error('WhatsApp number must contain 8-15 digits and can start with +')
    }
  }
}
