import { UnitName } from '@contexts/shared-kernel/unit/domain/unit-name'
import { UnitNameTooLong } from '@contexts/shared-kernel/unit/domain/exceptions/unit-name-too-long'

describe('UnitName', () => {
  it('should create a valid unit name', () => {
    const value = 'Kilogram'
    const unitName = new UnitName(value)

    expect(unitName.value).toBe(value)
  })

  it('should throw error when name is too long', () => {
    const longName = 'a'.repeat(51)

    expect(() => new UnitName(longName)).toThrow(UnitNameTooLong)
  })

  it('should accept name at maximum length', () => {
    const maxLengthName = 'a'.repeat(50)

    const unitName = new UnitName(maxLengthName)

    expect(unitName.value).toBe(maxLengthName)
  })
})
