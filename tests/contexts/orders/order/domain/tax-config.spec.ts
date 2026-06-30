import { Money } from '@shared/domain/value-objects/money'
import { TaxConfig } from '@contexts/orders/order/domain/tax-config'
import { TaxType } from '@contexts/orders/order/domain/tax-type'

describe('TaxConfig', () => {
  describe('INC extraction (8%)', () => {
    it('should extract tax base and tax amount from inclusive total', () => {
      const config = TaxConfig.create(0.08, TaxType.INC, true)
      const netTotal = new Money(25000, 'COP')

      const { taxBase, taxAmount } = config.extractTax(netTotal)

      // taxBase = 25000 / 1.08 = 23148.148... → rounded to 23148.15
      expect(taxBase.amount).toBeCloseTo(23148.15, 2)
      // taxAmount = 25000 - 23148.15 = 1851.85
      expect(taxAmount.amount).toBeCloseTo(1851.85, 2)
      expect(taxBase.amount + taxAmount.amount).toBeCloseTo(25000, 2)
    })
  })

  describe('IVA extraction (19%)', () => {
    it('should extract tax base and tax amount from inclusive total', () => {
      const config = TaxConfig.create(0.19, TaxType.IVA, true)
      const netTotal = new Money(25000, 'COP')

      const { taxBase, taxAmount } = config.extractTax(netTotal)

      // taxBase = 25000 / 1.19 = 21008.403... → rounded to 21008.40
      expect(taxBase.amount).toBeCloseTo(21008.4, 2)
      // taxAmount = 25000 - 21008.40 = 3991.60
      expect(taxAmount.amount).toBeCloseTo(3991.6, 2)
      expect(taxBase.amount + taxAmount.amount).toBeCloseTo(25000, 2)
    })
  })

  describe('EXEMPT', () => {
    it('should return full amount as tax base and zero tax', () => {
      const config = TaxConfig.create(0, TaxType.EXEMPT, true)
      const netTotal = new Money(25000, 'COP')

      const { taxBase, taxAmount } = config.extractTax(netTotal)

      expect(taxBase.amount).toBe(25000)
      expect(taxAmount.amount).toBe(0)
    })
  })

  describe('zero rate with non-exempt type', () => {
    it('should return full amount as tax base and zero tax', () => {
      const config = TaxConfig.create(0, TaxType.INC, true)
      const netTotal = new Money(25000, 'COP')

      const { taxBase, taxAmount } = config.extractTax(netTotal)

      expect(taxBase.amount).toBe(25000)
      expect(taxAmount.amount).toBe(0)
    })
  })

  describe('defaultColombia', () => {
    it('should create INC 8% inclusive config', () => {
      const config = TaxConfig.defaultColombia()

      expect(config.rate).toBe(0.08)
      expect(config.type).toBe(TaxType.INC)
      expect(config.inclusive).toBe(true)
    })
  })

  describe('validation', () => {
    it('should reject negative rate', () => {
      expect(() => TaxConfig.create(-0.01, TaxType.INC, true)).toThrow(
        'Tax rate cannot be negative'
      )
    })

    it('should reject rate above 1', () => {
      expect(() => TaxConfig.create(1.5, TaxType.INC, true)).toThrow(
        'Tax rate must be expressed as a decimal'
      )
    })
  })

  describe('serialization', () => {
    it('should round-trip through toPrimitives/fromPrimitives', () => {
      const config = TaxConfig.create(0.19, TaxType.IVA, true)

      const primitives = config.toPrimitives()
      const restored = TaxConfig.fromPrimitives(primitives)

      expect(restored.rate).toBe(0.19)
      expect(restored.type).toBe(TaxType.IVA)
      expect(restored.inclusive).toBe(true)
    })
  })
})
