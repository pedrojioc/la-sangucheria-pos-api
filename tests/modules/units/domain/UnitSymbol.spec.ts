import { UnitSymbol } from '@contexts/shared-kernel/unit/domain/unit-symbol'
import { UnitSymbolTooLong } from '@contexts/shared-kernel/unit/domain/exceptions/unit-symbol-too-long'

describe('UnitSymbol', () => {
  it('should create a valid unit symbol', () => {
    const value = 'kg'
    const unitSymbol = new UnitSymbol(value)

    expect(unitSymbol.value).toBe(value)
  })

  it('should throw error when symbol is too long', () => {
    const longSymbol = 'a'.repeat(11)

    expect(() => new UnitSymbol(longSymbol)).toThrow(UnitSymbolTooLong)
  })

  it('should accept symbol at maximum length', () => {
    const maxLengthSymbol = 'a'.repeat(10)

    const unitSymbol = new UnitSymbol(maxLengthSymbol)

    expect(unitSymbol.value).toBe(maxLengthSymbol)
  })
})
