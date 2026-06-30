import { StringValueObject } from '@/shared/domain/value-objects/string'

export class ProductCategoryColor extends StringValueObject {
  constructor(value: string) {
    super(value)
    this.ensureIsValid(value)
  }

  // Accepts a color name key (e.g. "red", "ocean-blue") or a hex color (#RRGGBB / #RGB)
  private ensureIsValid(value: string): void {
    const isHex = /^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(value)
    const isColorKey = /^[a-z][a-z0-9-]*$/.test(value)
    if (!isHex && !isColorKey) {
      throw new Error(
        'Category color must be a color key (e.g. "red") or a hex value (e.g. "#FF5733")'
      )
    }
  }
}
