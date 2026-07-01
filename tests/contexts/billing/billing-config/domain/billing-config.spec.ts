import { BillingConfig } from '@contexts/billing/billing-config/domain/billing-config'
import { BillingConfigUpdatedEvent } from '@contexts/billing/billing-config/domain/events/billing-config-updated.event'
import { InvalidResolucionRange } from '@contexts/billing/billing-config/domain/exceptions/invalid-resolucion-range.exception'
import { BillingConfigMother } from '../__mothers__/billing-config.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('BillingConfig', () => {
  describe('create()', () => {
    it('should create a valid BillingConfig', () => {
      // Arrange
      const id = UuidMother.random()
      const validFrom = new Date('2025-01-01')
      const validTo = new Date('2025-12-31')

      // Act
      const config = BillingConfig.create(
        id,
        'my-token',
        'https://api.factus.com',
        true,
        'SETP',
        1,
        1000,
        validFrom,
        validTo
      )

      // Assert
      const primitives = config.toPrimitives()
      expect(primitives.id).toBe(id)
      expect(primitives.factusApiToken).toBe('my-token')
      expect(primitives.factusApiBaseUrl).toBe('https://api.factus.com')
      expect(primitives.factusTestMode).toBe(true)
      expect(primitives.resolucionPrefix).toBe('SETP')
      expect(primitives.resolucionFrom).toBe(1)
      expect(primitives.resolucionTo).toBe(1000)
    })

    it('should throw InvalidResolucionRange when from > to', () => {
      // Arrange
      const id = UuidMother.random()

      // Act & Assert
      expect(() =>
        BillingConfig.create(
          id,
          'token',
          'https://api.factus.com',
          true,
          'SETP',
          1000,
          1,
          new Date('2025-01-01'),
          new Date('2025-12-31')
        )
      ).toThrow(InvalidResolucionRange)
    })

    it('should NOT record any domain event on create (first-time setup)', () => {
      // Arrange & Act
      const config = BillingConfigMother.create()

      // Assert
      const events = config.pullDomainEvents()
      expect(events).toHaveLength(0)
    })

    it('should allow from === to (edge case: single invoice number)', () => {
      // Arrange & Act
      const config = BillingConfig.create(
        UuidMother.random(),
        'token',
        'https://api.factus.com',
        false,
        'SETP',
        500,
        500,
        new Date('2025-01-01'),
        new Date('2025-12-31')
      )

      // Assert
      expect(config.toPrimitives().resolucionFrom).toBe(500)
      expect(config.toPrimitives().resolucionTo).toBe(500)
    })
  })

  describe('fromPrimitives()', () => {
    it('should reconstruct BillingConfig from valid primitives', () => {
      // Arrange
      const p = BillingConfigMother.primitives()

      // Act
      const config = BillingConfig.fromPrimitives(p)

      // Assert
      expect(config.toPrimitives()).toEqual(p)
    })

    it('should throw InvalidResolucionRange when from > to in primitives', () => {
      // Arrange
      const p = BillingConfigMother.primitives({ resolucionFrom: 999, resolucionTo: 1 })

      // Act & Assert
      expect(() => BillingConfig.fromPrimitives(p)).toThrow(InvalidResolucionRange)
    })
  })

  describe('update()', () => {
    it('should return updated BillingConfig and record BillingConfigUpdatedEvent', () => {
      // Arrange
      const config = BillingConfigMother.create()

      // Act
      const updated = config.update({ factusApiToken: 'new-token', resolucionFrom: 10, resolucionTo: 500 })

      // Assert
      expect(updated.toPrimitives().factusApiToken).toBe('new-token')
      expect(updated.toPrimitives().resolucionFrom).toBe(10)
      expect(updated.toPrimitives().resolucionTo).toBe(500)

      const events = updated.pullDomainEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(BillingConfigUpdatedEvent)
    })

    it('should throw InvalidResolucionRange when update produces from > to', () => {
      // Arrange
      const config = BillingConfigMother.create({ resolucionFrom: 1, resolucionTo: 100 })

      // Act & Assert
      expect(() => config.update({ resolucionFrom: 200, resolucionTo: 50 })).toThrow(InvalidResolucionRange)
    })

    it('should preserve unchanged fields when updating partial params', () => {
      // Arrange
      const original = BillingConfigMother.create({
        factusApiToken: 'original-token',
        resolucionPrefix: 'SETP',
        resolucionFrom: 1,
        resolucionTo: 1000
      })

      // Act
      const updated = original.update({ factusApiToken: 'new-token' })

      // Assert
      expect(updated.toPrimitives().resolucionPrefix).toBe('SETP')
      expect(updated.toPrimitives().resolucionFrom).toBe(1)
      expect(updated.toPrimitives().resolucionTo).toBe(1000)
    })
  })

  describe('isResolucionValid(at)', () => {
    it('should return true when date is within the validity range', () => {
      // Arrange
      const config = BillingConfigMother.fromPrimitives({
        resolucionValidFrom: new Date('2025-01-01'),
        resolucionValidTo: new Date('2025-12-31')
      })

      // Act & Assert
      expect(config.isResolucionValid(new Date('2025-06-15'))).toBe(true)
    })

    it('should return true when date is exactly the validFrom boundary', () => {
      // Arrange
      const config = BillingConfigMother.fromPrimitives({
        resolucionValidFrom: new Date('2025-01-01'),
        resolucionValidTo: new Date('2025-12-31')
      })

      // Act & Assert
      expect(config.isResolucionValid(new Date('2025-01-01'))).toBe(true)
    })

    it('should return true when date is exactly the validTo boundary', () => {
      // Arrange
      const config = BillingConfigMother.fromPrimitives({
        resolucionValidFrom: new Date('2025-01-01'),
        resolucionValidTo: new Date('2025-12-31')
      })

      // Act & Assert
      expect(config.isResolucionValid(new Date('2025-12-31'))).toBe(true)
    })

    it('should return false when date is before validFrom', () => {
      // Arrange
      const config = BillingConfigMother.fromPrimitives({
        resolucionValidFrom: new Date('2025-01-01'),
        resolucionValidTo: new Date('2025-12-31')
      })

      // Act & Assert
      expect(config.isResolucionValid(new Date('2024-12-31'))).toBe(false)
    })

    it('should return false when date is after validTo', () => {
      // Arrange
      const config = BillingConfigMother.fromPrimitives({
        resolucionValidFrom: new Date('2025-01-01'),
        resolucionValidTo: new Date('2025-12-31')
      })

      // Act & Assert
      expect(config.isResolucionValid(new Date('2026-01-01'))).toBe(false)
    })
  })
})
