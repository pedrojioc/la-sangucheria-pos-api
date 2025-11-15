import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { DomainEvent } from '@/shared/domain/events'
import { EventStoreService } from '../event-store.service'

/**
 * PersistDomainEventsSubscriber
 *
 * Subscriber universal que persiste TODOS los eventos de dominio en el Event Store.
 * Este subscriber se ejecuta para cualquier evento que se publique.
 *
 * Patrón: Event Sourcing (Greg Young, Martin Fowler)
 * - Todos los eventos son guardados en el Event Store (append-only)
 * - Permite event replay, auditoría, y reconstrucción de agregados
 * - No se actualizan eventos, solo se insertan (immutability)
 *
 * @since 1.0.0
 */
@Injectable()
export class PersistDomainEventsSubscriber {
  constructor(private readonly eventStoreService: EventStoreService) {}

  /**
   * Escucha TODOS los eventos de dominio usando wildcard
   * @nestjs/event-emitter permite usar '**' para capturar todos los eventos
   */
  @OnEvent('**', { async: true })
  async handleDomainEvent(event: DomainEvent): Promise<void> {
    try {
      // Solo procesar si es un DomainEvent válido
      if (!this.isDomainEvent(event)) {
        return
      }

      console.log(
        `[EventStore] Persisting event: ${event.eventName} for aggregate: ${event.aggregateId}`
      )

      // Preparar datos para Event Store
      const eventStoreData = {
        // ID del agregado
        aggregateId: event.aggregateId,

        // Tipo del agregado (extraído del eventName)
        // Ejemplo: "product.created" → "product"
        aggregateType: this.extractAggregateType(event.eventName),

        // Tipo del evento
        eventType: event.eventName,

        // Versión del stream del agregado
        version: event.version,

        // Schema version del evento (para event upcasting)
        eventSchemaVersion: event.version,

        // ✅ Payload: SOLO datos de negocio (sin metadata)
        payload: event.toPrimitives(),

        // ✅ Metadata: Contextual info (userId, correlationId, etc.)
        metadata: event.metadata || null,

        // ✅ Correlation ID: Duplicado para índice (performance)
        correlationId: event.metadata?.correlationId || null,

        // Timestamp del dominio (cuándo ocurrió el evento)
        occurredAt: event.occurredOn
      }

      // Guardar usando el repositorio del EventStoreService
      await this.saveEventToStore(eventStoreData)

      console.log(`[EventStore] Event persisted successfully: ${event.eventId}`)
    } catch (error) {
      console.error(`[EventStore] Error persisting event ${event.eventName}:`, error)
      // No lanzamos el error para no interrumpir otros subscribers
    }
  }

  /**
   * Type guard para verificar que el objeto es un DomainEvent válido
   */
  private isDomainEvent(event: any): event is DomainEvent {
    return (
      event &&
      typeof event === 'object' &&
      'eventName' in event &&
      'aggregateId' in event &&
      'eventId' in event &&
      'occurredOn' in event &&
      typeof event.toPrimitives === 'function'
    )
  }

  /**
   * Extrae el tipo del agregado desde el nombre del evento
   *
   * Ejemplos:
   * - "ingredient-category.created" → "ingredient-category"
   * - "product.price_changed" → "product"
   * - "order.cancelled" → "order"
   */
  private extractAggregateType(eventName: string): string {
    const parts = eventName.split('.')
    return parts[0] || 'unknown'
  }

  /**
   * Guarda el evento en el Event Store usando el método público
   */
  private async saveEventToStore(eventData: {
    aggregateId: string
    aggregateType: string
    eventType: string
    version: number
    eventSchemaVersion: number
    payload: Record<string, unknown>
    metadata: any
    correlationId: string | null
    occurredAt: Date
  }): Promise<void> {
    await this.eventStoreService.saveEvents([eventData])
  }
}
