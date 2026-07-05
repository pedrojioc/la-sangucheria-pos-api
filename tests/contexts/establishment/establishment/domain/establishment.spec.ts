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

  describe('SDD-2 defaults', () => {
    it('should default enabledOrderTypes to all three types', () => {
      const establishment = EstablishmentMother.create()
      const p = establishment.toPrimitives()
      expect(p.enabledOrderTypes).toEqual(['DINE_IN', 'DELIVERY', 'TAKEOUT'])
    })

    it('should default paymentMethods to [CASH, CARD]', () => {
      const establishment = EstablishmentMother.create()
      expect(establishment.toPrimitives().paymentMethods).toEqual(['CASH', 'CARD'])
    })

    it('should default splitCheck to false', () => {
      const establishment = EstablishmentMother.create()
      expect(establishment.toPrimitives().splitCheck).toBe(false)
    })

    it('should default operatingHours to null', () => {
      const establishment = EstablishmentMother.create()
      expect(establishment.toPrimitives().operatingHours).toBeNull()
    })

    it('should default serviceCharge to null', () => {
      const establishment = EstablishmentMother.create()
      expect(establishment.toPrimitives().serviceCharge).toBeNull()
    })

    it('should default tipSuggestions to null', () => {
      const establishment = EstablishmentMother.create()
      expect(establishment.toPrimitives().tipSuggestions).toBeNull()
    })
  })

  describe('update — SDD-2 fields round-trip', () => {
    it('should update enabledOrderTypes and leave other fields unchanged', () => {
      const establishment = EstablishmentMother.create()
      const updated = establishment.update({ enabledOrderTypes: ['DINE_IN'] })
      const p = updated.toPrimitives()
      expect(p.enabledOrderTypes).toEqual(['DINE_IN'])
      expect(p.paymentMethods).toEqual(['CASH', 'CARD'])
      expect(p.splitCheck).toBe(false)
    })

    it('should update paymentMethods independently', () => {
      const establishment = EstablishmentMother.create()
      const updated = establishment.update({ paymentMethods: ['CASH', 'TRANSFER', 'VOUCHER'] })
      expect(updated.toPrimitives().paymentMethods).toEqual(['CASH', 'TRANSFER', 'VOUCHER'])
    })

    it('should update splitCheck to true', () => {
      const establishment = EstablishmentMother.create()
      const updated = establishment.update({ splitCheck: true })
      expect(updated.toPrimitives().splitCheck).toBe(true)
    })

    it('should update serviceCharge from null to a FIXED value', () => {
      const establishment = EstablishmentMother.create()
      const updated = establishment.update({ serviceCharge: { type: 'FIXED', value: 2000 } })
      expect(updated.toPrimitives().serviceCharge).toEqual({ type: 'FIXED', value: 2000 })
    })

    it('should update tipSuggestions from null to a valid tuple', () => {
      const establishment = EstablishmentMother.create()
      const updated = establishment.update({ tipSuggestions: [0.05, 0.10, 0.15] })
      expect(updated.toPrimitives().tipSuggestions).toEqual([0.05, 0.10, 0.15])
    })

    it('should update operatingHours from null to a configured value', () => {
      const establishment = EstablishmentMother.create()
      const updated = establishment.update({
        operatingHours: {
          schedule: [{ day: 'MON', open: '08:00', close: '22:00', closed: false }],
          holidays: ['2024-12-25']
        }
      })
      expect(updated.toPrimitives().operatingHours?.schedule[0].day).toBe('MON')
    })
  })

  describe('fromPrimitives / toPrimitives symmetry', () => {
    it('should round-trip all SDD-2 fields without data loss', () => {
      const primitives = {
        id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        name: 'Test',
        displayName: 'Test',
        legalName: 'Test S.A.S.',
        taxId: '900000001-1',
        phone: null,
        email: null,
        address: null,
        logoUrl: null,
        websiteUrl: null,
        defaultCurrency: 'COP',
        defaultTaxRate: 0.08,
        defaultTaxType: TaxType.INC,
        taxInclusive: true,
        kitchenMode: KitchenMode.NONE,
        receiptHeader: null,
        receiptFooter: null,
        timezone: 'America/Bogota',
        locale: 'es-CO',
        loyaltyEnabled: false,
        operatingHours: {
          schedule: [{ day: 'MON' as const, open: '09:00', close: '21:00', closed: false }],
          holidays: ['2024-12-25']
        },
        enabledOrderTypes: ['DINE_IN', 'DELIVERY'],
        serviceCharge: { type: 'PERCENTAGE' as const, value: 0.10 },
        tipSuggestions: [0.05, 0.10, 0.15] as [number, number, number],
        splitCheck: true,
        paymentMethods: ['CASH', 'TRANSFER'],
        autoSendToKitchen: false
      }

      const establishment = Establishment.fromPrimitives(primitives)
      const result = establishment.toPrimitives()

      expect(result.operatingHours).toEqual(primitives.operatingHours)
      expect(result.enabledOrderTypes).toEqual(primitives.enabledOrderTypes)
      expect(result.serviceCharge).toEqual(primitives.serviceCharge)
      expect(result.tipSuggestions).toEqual(primitives.tipSuggestions)
      expect(result.splitCheck).toBe(primitives.splitCheck)
      expect(result.paymentMethods).toEqual(primitives.paymentMethods)
    })
  })

  describe('autoSendToKitchen field', () => {
    it('should default to false', () => {
      const establishment = EstablishmentMother.create()
      expect(establishment.toPrimitives().autoSendToKitchen).toBe(false)
    })

    it('should round-trip autoSendToKitchen=true through fromPrimitives/toPrimitives', () => {
      const establishment = EstablishmentMother.withAutoSendToKitchen(true)
      expect(establishment.toPrimitives().autoSendToKitchen).toBe(true)
    })

    it('should update autoSendToKitchen via update()', () => {
      const establishment = EstablishmentMother.create()
      const updated = establishment.update({ autoSendToKitchen: true })
      expect(updated.toPrimitives().autoSendToKitchen).toBe(true)
    })
  })
})
