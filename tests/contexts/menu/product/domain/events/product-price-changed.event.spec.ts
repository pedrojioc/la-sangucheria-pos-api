import {
  ProductPriceChangedEvent,
  ProductPriceChangedPayload
} from '@contexts/menu/product/domain/events/product-price-changed.event'
import { DomainEventMetadata } from '@/shared/domain/events'

describe('ProductPriceChangedEvent', () => {
  describe('constructor', () => {
    it('should create event with all required fields', () => {
      const payload: ProductPriceChangedPayload = {
        productId: 'product-123',
        productName: 'Sandwich Clásico',
        previousPrice: 10.0,
        newPrice: 12.0,
        priceChangePercentage: 20,
        currency: 'PEN',
        changedAt: new Date('2025-11-03T10:00:00Z'),
        changedBy: 'user-456',
        reason: 'manual'
      }

      const metadata: DomainEventMetadata = {
        userId: 'user-456',
        userName: 'Juan Pérez',
        correlationId: 'req-789'
      }

      const event = new ProductPriceChangedEvent(payload, metadata)

      expect(event.eventName).toBe('product.price_changed')
      expect(event.aggregateId).toBe('product-123')
      expect(event.version).toBe(1)
      expect(event.payload).toEqual(payload)
      expect(event.metadata).toEqual(metadata)
      expect(event.eventId).toBeDefined()
      expect(event.occurredOn).toBeInstanceOf(Date)
    })

    it('should create event without metadata', () => {
      const payload: ProductPriceChangedPayload = {
        productId: 'product-123',
        productName: 'Sandwich Clásico',
        previousPrice: 10.0,
        newPrice: 12.0,
        priceChangePercentage: 20,
        currency: 'PEN',
        changedAt: new Date()
      }

      const event = new ProductPriceChangedEvent(payload)

      expect(event.metadata).toEqual({})
    })

    it('should accept custom eventId and occurredOn', () => {
      const payload: ProductPriceChangedPayload = {
        productId: 'product-123',
        productName: 'Sandwich Clásico',
        previousPrice: 10.0,
        newPrice: 12.0,
        priceChangePercentage: 20,
        currency: 'PEN',
        changedAt: new Date()
      }

      const customEventId = 'custom-event-id'
      const customOccurredOn = new Date('2025-01-01T00:00:00Z')

      const event = new ProductPriceChangedEvent(
        payload,
        undefined,
        customEventId,
        customOccurredOn
      )

      expect(event.eventId).toBe(customEventId)
      expect(event.occurredOn).toEqual(customOccurredOn)
    })
  })

  describe('toPrimitives', () => {
    it('should serialize event to primitives with ISO date string', () => {
      const changedAt = new Date('2025-11-03T10:00:00Z')
      const payload: ProductPriceChangedPayload = {
        productId: 'product-123',
        productName: 'Sandwich Clásico',
        previousPrice: 10.0,
        newPrice: 12.0,
        priceChangePercentage: 20,
        currency: 'PEN',
        changedAt,
        changedBy: 'user-456',
        reason: 'manual'
      }

      const metadata: DomainEventMetadata = {
        userId: 'user-456',
        correlationId: 'req-789'
      }

      const event = new ProductPriceChangedEvent(payload, metadata)
      const primitives = event.toPrimitives()

      expect(primitives).toEqual({
        productId: 'product-123',
        productName: 'Sandwich Clásico',
        previousPrice: 10.0,
        newPrice: 12.0,
        priceChangePercentage: 20,
        currency: 'PEN',
        changedAt: changedAt.toISOString(),
        changedBy: 'user-456',
        reason: 'manual'
      })
    })

    it('should handle optional fields', () => {
      const payload: ProductPriceChangedPayload = {
        productId: 'product-123',
        productName: 'Sandwich Clásico',
        previousPrice: 10.0,
        newPrice: 12.0,
        priceChangePercentage: 20,
        currency: 'PEN',
        changedAt: new Date()
      }

      const event = new ProductPriceChangedEvent(payload)
      const primitives = event.toPrimitives()

      expect(primitives.changedBy).toBeUndefined()
      expect(primitives.reason).toBeUndefined()
    })
  })

  describe('fromPrimitives', () => {
    it('should reconstruct event from primitives', () => {
      const aggregateId = 'product-123'
      const eventId = 'event-456'
      const occurredOn = new Date('2025-11-03T10:00:00Z')
      const changedAt = new Date('2025-11-03T09:00:00Z')

      const attributes = {
        version: 1,
        productId: 'product-123',
        productName: 'Sandwich Clásico',
        previousPrice: 10.0,
        newPrice: 12.0,
        priceChangePercentage: 20,
        currency: 'PEN',
        changedAt: changedAt.toISOString(),
        changedBy: 'user-456',
        reason: 'manual',
        metadata: {
          userId: 'user-456',
          userName: 'Juan Pérez',
          correlationId: 'req-789'
        }
      }

      const event = ProductPriceChangedEvent.fromPrimitives({
        aggregateId,
        eventId,
        occurredOn,
        version: 1,
        payload: attributes,
        metadata: attributes.metadata as DomainEventMetadata
      })

      expect(event.aggregateId).toBe(aggregateId)
      expect(event.eventId).toBe(eventId)
      expect(event.occurredOn).toEqual(occurredOn)
      expect(event.eventName).toBe('product.price_changed')
      expect(event.version).toBe(1)
      expect(event.payload.productId).toBe('product-123')
      expect(event.payload.productName).toBe('Sandwich Clásico')
      expect(event.payload.previousPrice).toBe(10.0)
      expect(event.payload.newPrice).toBe(12.0)
      expect(event.payload.priceChangePercentage).toBe(20)
      expect(event.payload.currency).toBe('PEN')
      expect(event.payload.changedAt).toEqual(changedAt)
      expect(event.payload.changedBy).toBe('user-456')
      expect(event.payload.reason).toBe('manual')
      expect(event.metadata.userId).toBe('user-456')
      expect(event.metadata.userName).toBe('Juan Pérez')
      expect(event.metadata.correlationId).toBe('req-789')
    })

    it('should handle optional fields in fromPrimitives', () => {
      const attributes = {
        version: 1,
        productId: 'product-123',
        productName: 'Sandwich Clásico',
        previousPrice: 10.0,
        newPrice: 12.0,
        priceChangePercentage: 20,
        currency: 'PEN',
        changedAt: new Date().toISOString(),
        metadata: {}
      }

      const event = ProductPriceChangedEvent.fromPrimitives({
        aggregateId: 'product-123',
        eventId: 'event-456',
        occurredOn: new Date(),
        version: 1,
        payload: attributes,
        metadata: attributes.metadata as DomainEventMetadata
      })

      expect(event.payload.changedBy).toBeUndefined()
      expect(event.payload.reason).toBeUndefined()
    })
  })

  describe('serialization roundtrip', () => {
    it('should maintain data integrity through serialization and deserialization', () => {
      const originalPayload: ProductPriceChangedPayload = {
        productId: 'product-123',
        productName: 'Sandwich Clásico',
        previousPrice: 10.0,
        newPrice: 12.0,
        priceChangePercentage: 20,
        currency: 'PEN',
        changedAt: new Date('2025-11-03T10:00:00Z'),
        changedBy: 'user-456',
        reason: 'manual'
      }

      const originalMetadata: DomainEventMetadata = {
        userId: 'user-456',
        userName: 'Juan Pérez',
        correlationId: 'req-789'
      }

      const originalEvent = new ProductPriceChangedEvent(
        originalPayload,
        originalMetadata,
        'event-id-123',
        new Date('2025-11-03T11:00:00Z')
      )

      // Serialize
      const primitives = originalEvent.toPrimitives()

      // Deserialize
      const reconstructedEvent = ProductPriceChangedEvent.fromPrimitives({
        aggregateId: originalEvent.aggregateId,
        eventId: originalEvent.eventId,
        occurredOn: originalEvent.occurredOn,
        version: originalEvent.version,
        payload: primitives,
        metadata: originalEvent.metadata
      })

      // Verify
      expect(reconstructedEvent.aggregateId).toBe(originalEvent.aggregateId)
      expect(reconstructedEvent.eventId).toBe(originalEvent.eventId)
      expect(reconstructedEvent.occurredOn).toEqual(originalEvent.occurredOn)
      expect(reconstructedEvent.payload.productId).toBe(originalPayload.productId)
      expect(reconstructedEvent.payload.productName).toBe(originalPayload.productName)
      expect(reconstructedEvent.payload.previousPrice).toBe(originalPayload.previousPrice)
      expect(reconstructedEvent.payload.newPrice).toBe(originalPayload.newPrice)
      expect(reconstructedEvent.payload.priceChangePercentage).toBe(
        originalPayload.priceChangePercentage
      )
      expect(reconstructedEvent.payload.changedAt.toISOString()).toBe(
        originalPayload.changedAt.toISOString()
      )
      expect(reconstructedEvent.metadata.userId).toBe(originalMetadata.userId)
      expect(reconstructedEvent.metadata.userName).toBe(originalMetadata.userName)
      expect(reconstructedEvent.metadata.correlationId).toBe(originalMetadata.correlationId)
    })
  })
})
