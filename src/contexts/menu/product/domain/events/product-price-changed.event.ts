import {
  DomainEvent,
  DomainEventMetadata,
  DomainEventFromPrimitivesParams
} from '@/shared/domain/events'

/**
 * ProductPriceChangedPayload
 *
 * Datos de negocio del evento de cambio de precio de producto.
 */
export interface ProductPriceChangedPayload {
  /**
   * ID del producto cuyo precio cambió
   */
  productId: string

  /**
   * Nombre del producto (para facilitar búsquedas y logs)
   */
  productName: string

  /**
   * Precio anterior
   */
  previousPrice: number

  /**
   * Precio nuevo
   */
  newPrice: number

  /**
   * Porcentaje de cambio (positivo = incremento, negativo = descuento)
   * @example 15.5 significa 15.5% de incremento
   * @example -20 significa 20% de descuento
   */
  priceChangePercentage: number

  /**
   * Moneda del precio
   * @example "PEN", "USD", "EUR"
   */
  currency: string

  /**
   * Fecha y hora exacta del cambio
   */
  changedAt: Date

  /**
   * ID del usuario que hizo el cambio (opcional)
   */
  changedBy?: string

  /**
   * Razón del cambio de precio
   */
  reason?: 'promotion' | 'cost_increase' | 'manual' | 'automatic'
}

/**
 * ProductPriceChangedEvent
 *
 * Evento que representa un cambio de precio en un producto.
 *
 * Este evento se dispara cuando:
 * - Un administrador cambia manualmente el precio
 * - Se aplica una promoción automática
 * - Hay un ajuste por incremento de costos
 *
 * Subscribers que reaccionan a este evento:
 * - InvalidateCacheOnPriceChanged: Invalida caché del producto
 * - UpdateSearchIndex: Actualiza índice de búsqueda
 * - NotifyCustomersOnDiscount: Notifica a clientes si hay descuento > 20%
 *
 * @since 1.0.0 - Sprint 1: Domain Events Refactor
 */
export class ProductPriceChangedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'product.price_changed'
  static readonly VERSION = 1

  constructor(
    payload: ProductPriceChangedPayload,
    metadata?: DomainEventMetadata,
    eventId?: string,
    occurredOn?: Date
  ) {
    super({
      eventName: ProductPriceChangedEvent.EVENT_NAME,
      aggregateId: payload.productId,
      payload,
      metadata,
      version: ProductPriceChangedEvent.VERSION,
      eventId,
      occurredOn
    })
  }

  /**
   * Serializa el evento a primitives
   *
   * Sobreescribimos toPrimitives() porque tenemos un campo Date (changedAt)
   * que necesita ser serializado a ISO string.
   */
  toPrimitives(): ProductPriceChangedPayload {
    return {
      ...this.payload,
      changedAt: this.payload.changedAt.toISOString() as any
    }
  }

  /**
   * Reconstruye el evento desde primitives
   *
   * Usado para deserializar eventos desde Event Store.
   */
  static fromPrimitives(params: DomainEventFromPrimitivesParams): ProductPriceChangedEvent {
    const typedPayload: ProductPriceChangedPayload = {
      productId: params.payload.productId as string,
      productName: params.payload.productName as string,
      previousPrice: params.payload.previousPrice as number,
      newPrice: params.payload.newPrice as number,
      priceChangePercentage: params.payload.priceChangePercentage as number,
      currency: params.payload.currency as string,
      changedAt: new Date(params.payload.changedAt as string),
      changedBy: params.payload.changedBy as string | undefined,
      reason: params.payload.reason as
        | 'promotion'
        | 'cost_increase'
        | 'manual'
        | 'automatic'
        | undefined
    }

    return new ProductPriceChangedEvent(
      typedPayload,
      params.metadata,
      params.eventId,
      params.occurredOn
    )
  }
}
