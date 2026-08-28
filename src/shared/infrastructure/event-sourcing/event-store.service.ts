import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, Repository } from 'typeorm'
import { EventStoreEntity } from './persistence/event-store.entity'
import { DomainEventMetadata } from '@/shared/domain/events'

/**
 * OutboxRow
 *
 * Shape of a single event_store insert used by EventBusRouter (D8) — both
 * dual-path branches append rows through appendInTransaction, passing an
 * explicit EntityManager rather than relying on the injected default one.
 */
export interface OutboxRow {
  aggregateId: string
  aggregateType: string
  eventType: string
  version: number
  eventSchemaVersion?: number
  payload: Record<string, unknown>
  metadata?: DomainEventMetadata | null
  correlationId?: string | null
  occurredAt: Date
  dispatchedAt: Date | null
}

/**
 * StoredEvent
 *
 * Representación de un evento almacenado en el Event Store
 */
export interface StoredEvent {
  eventId: string
  aggregateId: string
  aggregateType: string
  eventType: string
  version: number
  eventSchemaVersion: number
  payload: Record<string, unknown>
  metadata: DomainEventMetadata | null
  correlationId: string | null
  occurredAt: Date
  createdAt: Date
}

/**
 * EventStream
 *
 * Stream de eventos de un agregado específico
 */
export interface EventStream {
  events: StoredEvent[]
  aggregateId: string
  aggregateType: string
  currentVersion: number
}

/**
 * EventStoreService
 *
 * Servicio para acceder al Event Store.
 * Implementa patrones de Event Sourcing enterprise-grade.
 *
 * Características:
 * - Append-only: Solo inserta, nunca actualiza eventos
 * - Event replay: Reconstruir agregados desde eventos
 * - Temporal queries: Filtrar eventos por fecha
 * - Distributed tracing: Filtrar por correlationId
 * - Optimistic locking: Detectar conflictos de concurrencia
 *
 * Referencias:
 * - Greg Young: Event Store patterns
 * - Martin Fowler: Event Sourcing
 *
 * @since 1.0.0
 */
@Injectable()
export class EventStoreService {
  constructor(
    @InjectRepository(EventStoreEntity)
    private readonly eventStoreRepository: Repository<EventStoreEntity>
  ) {}

  /**
   * Guarda eventos en el Event Store
   *
   * @param events - Eventos a guardar
   * @returns Promise<void>
   *
   * @throws Error si hay un conflicto de versión (optimistic locking)
   */
  async saveEvents(
    events: Array<{
      aggregateId: string
      aggregateType: string
      eventType: string
      version: number
      eventSchemaVersion?: number
      payload: Record<string, unknown>
      metadata?: DomainEventMetadata | null
      correlationId?: string | null
      occurredAt: Date
    }>
  ): Promise<void> {
    const entities = events.map(event =>
      this.eventStoreRepository.create({
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        eventType: event.eventType,
        version: event.version,
        eventSchemaVersion: event.eventSchemaVersion || 1,
        payload: event.payload,
        metadata: event.metadata || null,
        correlationId: event.correlationId || null,
        occurredAt: event.occurredAt
      })
    )

    await this.eventStoreRepository.save(entities)
  }

  /**
   * Inserta filas en event_store usando un EntityManager explícito (no el
   * inyectado por defecto).
   *
   * Usado por EventBusRouter (design D8) en ambos paths de publish():
   * - Path A: se le pasa el EntityManager ambiental de la transacción del
   *   request (el insert se compromete/revierte junto con todo lo demás).
   * - Path B: se le pasa el manager de la transacción corta que el propio
   *   router abre cuando no hay contexto ambiental.
   *
   * dispatchedAt viene decidido por el caller: `now()` para filas de
   * auditoría de subscribers categoría 1 (ya despachados sincrónicamente),
   * `null` para filas categoría 2 pendientes de que el poller las despache.
   */
  async appendInTransaction(manager: EntityManager, rows: OutboxRow[]): Promise<void> {
    const repository = manager.getRepository(EventStoreEntity)
    const entities = rows.map(row =>
      repository.create({
        aggregateId: row.aggregateId,
        aggregateType: row.aggregateType,
        eventType: row.eventType,
        version: row.version,
        eventSchemaVersion: row.eventSchemaVersion ?? 1,
        payload: row.payload,
        metadata: row.metadata ?? null,
        correlationId: row.correlationId ?? null,
        occurredAt: row.occurredAt,
        dispatchedAt: row.dispatchedAt
      })
    )

    await repository.save(entities)
  }

  /**
   * Reclama hasta `limit` filas pendientes de despacho (dispatchedAt IS
   * NULL), bloqueándolas con FOR UPDATE SKIP LOCKED para que múltiples
   * instancias del poller (design D3) no despachen la misma fila dos veces.
   *
   * La query FOR UPDATE SKIP LOCKED en sí es integration-only (Slice 9) — el
   * unit test de este método (Slice 3) solo cubre call-shape/delegación.
   */
  async claimUndispatched(manager: EntityManager, limit: number): Promise<EventStoreEntity[]> {
    return manager
      .createQueryBuilder(EventStoreEntity, 'event')
      .where('event.dispatchedAt IS NULL')
      .orderBy('event.createdAt', 'ASC')
      .take(limit)
      .setLock('pessimistic_write')
      .setOnLocked('skip_locked')
      .getMany()
  }

  /**
   * Marca las filas dadas como despachadas (dispatchedAt = now()) usando el
   * EntityManager explícito de la transacción del poller.
   */
  async markDispatched(manager: EntityManager, ids: string[]): Promise<void> {
    await manager.update(EventStoreEntity, ids, { dispatchedAt: new Date() })
  }

  /**
   * Obtiene el stream de eventos de un agregado
   *
   * @param aggregateId - ID del agregado
   * @param fromVersion - Versión inicial (opcional, para incremental loading)
   * @returns EventStream con todos los eventos del agregado
   *
   * @example
   * ```typescript
   * // Reconstruir agregado completo
   * const stream = await eventStore.getEventStream('product-123')
   *
   * // Incremental loading (desde versión 10)
   * const stream = await eventStore.getEventStream('product-123', 10)
   * ```
   */
  async getEventStream(aggregateId: string, fromVersion?: number): Promise<EventStream> {
    const query = this.eventStoreRepository
      .createQueryBuilder('event')
      .where('event.aggregateId = :aggregateId', { aggregateId })
      .orderBy('event.version', 'ASC')

    if (fromVersion !== undefined) {
      query.andWhere('event.version > :fromVersion', { fromVersion })
    }

    const entities = await query.getMany()

    const events: StoredEvent[] = entities.map(entity => this.mapToStoredEvent(entity))

    return {
      events,
      aggregateId,
      aggregateType: entities[0]?.aggregateType || 'unknown',
      currentVersion: entities.length > 0 ? entities[entities.length - 1].version : 0
    }
  }

  /**
   * Obtiene la versión actual de un agregado
   *
   * @param aggregateId - ID del agregado
   * @returns Versión actual del agregado (0 si no existe)
   *
   * Útil para optimistic locking
   */
  async getAggregateVersion(aggregateId: string): Promise<number> {
    const result = await this.eventStoreRepository
      .createQueryBuilder('event')
      .select('MAX(event.version)', 'version')
      .where('event.aggregateId = :aggregateId', { aggregateId })
      .getRawOne()

    return result?.version || 0
  }

  /**
   * Obtiene todos los eventos de un tipo de agregado
   *
   * @param aggregateType - Tipo del agregado (ej: "product", "order")
   * @param options - Opciones de filtrado
   * @returns Array de eventos
   *
   * @example
   * ```typescript
   * // Todos los eventos de productos
   * const events = await eventStore.getEventsByAggregateType('product')
   *
   * // Eventos de productos desde una fecha
   * const events = await eventStore.getEventsByAggregateType('product', {
   *   fromDate: new Date('2025-01-01')
   * })
   * ```
   */
  async getEventsByAggregateType(
    aggregateType: string,
    options?: {
      fromDate?: Date
      toDate?: Date
      limit?: number
    }
  ): Promise<StoredEvent[]> {
    const query = this.eventStoreRepository
      .createQueryBuilder('event')
      .where('event.aggregateType = :aggregateType', { aggregateType })
      .orderBy('event.occurredAt', 'ASC')

    if (options?.fromDate) {
      query.andWhere('event.occurredAt >= :fromDate', { fromDate: options.fromDate })
    }

    if (options?.toDate) {
      query.andWhere('event.occurredAt <= :toDate', { toDate: options.toDate })
    }

    if (options?.limit) {
      query.take(options.limit)
    }

    const entities = await query.getMany()
    return entities.map(entity => this.mapToStoredEvent(entity))
  }

  /**
   * Obtiene eventos por tipo de evento
   *
   * @param eventType - Tipo del evento (ej: "product.created")
   * @param limit - Límite de resultados (opcional)
   * @returns Array de eventos
   *
   * @example
   * ```typescript
   * // Últimos 10 eventos de precio cambiado
   * const events = await eventStore.getEventsByType('product.price_changed', 10)
   * ```
   */
  async getEventsByType(eventType: string, limit?: number): Promise<StoredEvent[]> {
    const query = this.eventStoreRepository
      .createQueryBuilder('event')
      .where('event.eventType = :eventType', { eventType })
      .orderBy('event.occurredAt', 'DESC')

    if (limit) {
      query.take(limit)
    }

    const entities = await query.getMany()
    return entities.map(entity => this.mapToStoredEvent(entity))
  }

  /**
   * Obtiene eventos por correlation ID (distributed tracing)
   *
   * @param correlationId - Correlation ID del request
   * @returns Array de eventos ordenados por occurredAt
   *
   * @example
   * ```typescript
   * // Todos los eventos de un request HTTP
   * const events = await eventStore.getEventsByCorrelationId('req-abc-xyz')
   * ```
   */
  async getEventsByCorrelationId(correlationId: string): Promise<StoredEvent[]> {
    const entities = await this.eventStoreRepository.find({
      where: { correlationId },
      order: { occurredAt: 'ASC' }
    })

    return entities.map(entity => this.mapToStoredEvent(entity))
  }

  /**
   * Obtiene eventos entre fechas (temporal queries)
   *
   * @param fromDate - Fecha inicial
   * @param toDate - Fecha final
   * @param options - Opciones adicionales
   * @returns Array de eventos
   *
   * @example
   * ```typescript
   * // Todos los eventos del mes de noviembre 2025
   * const events = await eventStore.getEventsBetween(
   *   new Date('2025-11-01'),
   *   new Date('2025-11-30')
   * )
   * ```
   */
  async getEventsBetween(
    fromDate: Date,
    toDate: Date,
    options?: {
      aggregateType?: string
      eventType?: string
      limit?: number
    }
  ): Promise<StoredEvent[]> {
    const query = this.eventStoreRepository
      .createQueryBuilder('event')
      .where('event.occurredAt >= :fromDate', { fromDate })
      .andWhere('event.occurredAt <= :toDate', { toDate })
      .orderBy('event.occurredAt', 'ASC')

    if (options?.aggregateType) {
      query.andWhere('event.aggregateType = :aggregateType', {
        aggregateType: options.aggregateType
      })
    }

    if (options?.eventType) {
      query.andWhere('event.eventType = :eventType', { eventType: options.eventType })
    }

    if (options?.limit) {
      query.take(options.limit)
    }

    const entities = await query.getMany()
    return entities.map(entity => this.mapToStoredEvent(entity))
  }

  /**
   * Obtiene eventos de un usuario específico (auditoría)
   *
   * @param userId - ID del usuario
   * @param limit - Límite de resultados (opcional)
   * @returns Array de eventos
   *
   * @example
   * ```typescript
   * // Últimas 50 acciones de un usuario
   * const events = await eventStore.getEventsByUserId('user-123', 50)
   * ```
   */
  async getEventsByUserId(userId: string, limit?: number): Promise<StoredEvent[]> {
    const query = this.eventStoreRepository
      .createQueryBuilder('event')
      .where("event.metadata->>'userId' = :userId", { userId })
      .orderBy('event.occurredAt', 'DESC')

    if (limit) {
      query.take(limit)
    }

    const entities = await query.getMany()
    return entities.map(entity => this.mapToStoredEvent(entity))
  }

  /**
   * Mapea EventStoreEntity a StoredEvent
   */
  private mapToStoredEvent(entity: EventStoreEntity): StoredEvent {
    return {
      eventId: entity.id,
      aggregateId: entity.aggregateId,
      aggregateType: entity.aggregateType,
      eventType: entity.eventType,
      version: entity.version,
      eventSchemaVersion: entity.eventSchemaVersion,
      payload: entity.payload,
      metadata: entity.metadata,
      correlationId: entity.correlationId,
      occurredAt: entity.occurredAt,
      createdAt: entity.createdAt
    }
  }
}
