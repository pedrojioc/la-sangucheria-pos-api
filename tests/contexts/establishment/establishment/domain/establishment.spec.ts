import { Establishment } from '@contexts/establishment/establishment/domain/establishment'
import { TaxType } from '@shared/domain/value-objects/tax-type'
import { KitchenMode } from '@contexts/establishment/establishment/domain/kitchen-mode'
import { EstablishmentSettingsUpdatedEvent } from '@contexts/establishment/establishment/domain/events/establishment-settings-updated.event'
import { EstablishmentMother } from '../__mothers__/establishment.mother'

describe('Establishment aggregate', () => {
  describe('create', () => {
    it('should create with valid Colombian defaults and toPrimitives returns expected values', () => {
      const establishment = EstablishmentMother.create()
      const p = establishment.toPrimitives()

      expect(p.id).toBe('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
      expect(p.name).toBe('Mi Establecimiento')
      expect(p.defaultCurrency).toBe('COP')
      expect(p.defaultTaxRate).toBe(0.08)
      expect(p.defaultTaxType).toBe(TaxType.INC)
      expect(p.taxInclusive).toBe(true)
      expect(p.kitchenMode).toBe(KitchenMode.NONE)
      expect(p.timezone).toBe('America/Bogota')
      expect(p.locale).toBe('es-CO')
      expect(p.loyaltyEnabled).toBe(false)
    })

    it('should be an instance of Establishment', () => {
      expect(EstablishmentMother.create()).toBeInstanceOf(Establishment)
    })
  })

  describe('update — invalid defaultCurrency', () => {
    it('should throw when updating with a non-ISO-4217 currency code', () => {
      const establishment = EstablishmentMother.create()

      expect(() => establishment.update({ defaultCurrency: 'NOTISO' })).toThrow()
    })

    it('should throw with a single-char currency code', () => {
      const establishment = EstablishmentMother.create()

      expect(() => establishment.update({ defaultCurrency: 'X' })).toThrow()
    })
  })

  describe('update — invalid defaultTaxRate', () => {
    it('should throw when tax rate exceeds 1', () => {
      const establishment = EstablishmentMother.create()

      expect(() => establishment.update({ defaultTaxRate: 1.5 })).toThrow()
    })

    it('should throw when tax rate is negative', () => {
      const establishment = EstablishmentMother.create()

      expect(() => establishment.update({ defaultTaxRate: -0.01 })).toThrow()
    })
  })

  describe('update — invalid kitchenMode', () => {
    it('should throw for an invalid enum value', () => {
      const establishment = EstablishmentMother.create()

      expect(() => establishment.update({ kitchenMode: 'OVEN' as KitchenMode })).toThrow()
    })
  })

  describe('update — valid update records a domain event', () => {
    it('should record exactly one EstablishmentSettingsUpdatedEvent after a valid update', () => {
      const establishment = EstablishmentMother.create()

      const updated = establishment.update({ name: 'Updated Name' })
      const events = updated.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(EstablishmentSettingsUpdatedEvent)
    })

    it('should reflect the new name in toPrimitives after update', () => {
      const establishment = EstablishmentMother.create()

      const updated = establishment.update({ name: 'New Restaurant' })

      expect(updated.toPrimitives().name).toBe('New Restaurant')
    })
  })

  describe('withKitchenMode factory', () => {
    it('should create an Establishment with the given kitchen mode', () => {
      const establishment = EstablishmentMother.withKitchenMode(KitchenMode.SINGLE_PRINTER)

      expect(establishment.toPrimitives().kitchenMode).toBe(KitchenMode.SINGLE_PRINTER)
    })
  })

  describe('withLoyaltyEnabled factory', () => {
    it('should create an Establishment with loyaltyEnabled true', () => {
      const establishment = EstablishmentMother.withLoyaltyEnabled()

      expect(establishment.toPrimitives().loyaltyEnabled).toBe(true)
    })
  })
})
