import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, Unique } from 'typeorm'

/**
 * EventStoreEntity
 *
 * Tabla optimizada para Event Sourcing siguiendo patrones enterprise:
 *
 * Referencias:
 * - Greg Young: Event Store Design (https://eventstore.com/)
 * - Martin Fowler: Event Sourcing (https://martinfowler.com/eaaDev/EventSourcing.html)
 * - Vaughn Vernon: Implementing DDD - Chapter 8 (Domain Events)
 *
 * Características:
 * - Immutable (append-only): No se actualizan eventos, solo se insertan
 * - Optimized for reads: Índices en aggregate_id + version para reconstrucción rápida
 * - Stream-based: Eventos agrupados por aggregate (event stream)
 * - Temporal queries: Índice en occurred_at para time-based queries
 * - Event replay: Soporte para event sourcing completo
 * - Metadata separation: Payload vs metadata (tracing, auditoría)
 *
 * @since 1.0.0 - Sprint 2: Event Store Refactor
 */
@Entity('event_store')
// Índice compuesto para reconstruir agregados eficientemente
@Index('idx_event_store_aggregate_stream', ['aggregateId', 'version'])
// Índice para queries por tipo de agregado
@Index('idx_event_store_aggregate_type', ['aggregateType'])
// Índice para queries por tipo de evento
@Index('idx_event_store_event_type', ['eventType'])
// Índice para queries temporales (event replay)
@Index('idx_event_store_occurred_at', ['occurredAt'])
// Índice para correlación distribuida (tracing)
@Index('idx_event_store_correlation_id', ['correlationId'])
// Constraint único: No duplicar versiones en el stream
@Unique('uq_event_store_aggregate_version', ['aggregateId', 'version'])
export class EventStoreEntity {
  /**
   * ID único del evento (UUID v4)
   * Inmutable, generado automáticamente
   * Usado para idempotencia y deduplicación
   */
  @PrimaryGeneratedColumn('uuid')
  id: string

  /**
   * ID del agregado que emitió este evento
   * Todos los eventos del mismo agregado forman un "event stream"
   *
   * Ejemplo:
   * - "product-123" → stream de eventos del producto 123
   * - "order-456" → stream de eventos del orden 456
   *
   * @indexed Para reconstruir agregados rápidamente
   */
  @Column({ name: 'aggregate_id', type: 'uuid' })
  aggregateId: string

  /**
   * Tipo del agregado (bounded context + entity name)
   *
   * Formato: "{bounded-context}.{aggregate-name}"
   * Ejemplos:
   * - "catalog.product"
   * - "inventory.stock-level"
   * - "orders.order"
   *
   * Útil para:
   * - Event routing hacia diferentes subscribers
   * - Queries por tipo de agregado
   * - Segregación de eventos por contexto
   *
   * @indexed Para filtrar eventos por tipo de agregado
   */
  @Column({ name: 'aggregate_type', type: 'varchar', length: 100 })
  aggregateType: string

  /**
   * Nombre único del evento (formato dot notation)
   *
   * Formato: "{aggregate}.{action}" o "{bounded-context}.{aggregate}.{action}"
   * Ejemplos:
   * - "product.created"
   * - "product.price_changed"
   * - "order.cancelled"
   *
   * Usado para:
   * - Event deserialization (EventRegistry.get(eventType))
   * - Event filtering en subscribers
   * - Metrics y monitoring
   *
   * @indexed Para queries por tipo de evento
   */
  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType: string

  /**
   * Versión del evento dentro del stream del agregado
   *
   * Secuencia monótonamente creciente: 1, 2, 3, ...
   *
   * Propósito:
   * - Optimistic locking: Detectar conflictos de concurrencia
   * - Event ordering: Ordenar eventos dentro del stream
   * - Snapshot optimization: Saber desde qué versión aplicar eventos
   *
   * Constraint recomendado en DB:
   * UNIQUE(aggregate_id, version) → Garantiza no duplicar versiones
   *
   * Ejemplo de stream:
   * aggregate_id | version | event_type
   * product-123  | 1       | product.created
   * product-123  | 2       | product.price_changed
   * product-123  | 3       | product.activated
   *
   * @indexed Para reconstruir agregados en orden
   */
  @Column({ type: 'int' })
  version: number

  /**
   * Schema version del evento
   *
   * Útil para event upcasting cuando cambia la estructura del payload
   *
   * Ejemplo:
   * - v1: ProductCreated con solo { name, price }
   * - v2: ProductCreated con { name, price, categoryId }
   *
   * Al leer v1, se puede "upcast" automáticamente a v2
   *
   * @default 1
   */
  @Column({ name: 'event_schema_version', type: 'int', default: 1 })
  eventSchemaVersion: number

  /**
   * Payload del evento (datos de negocio)
   *
   * Contiene SOLO los datos específicos del evento (payload puro)
   * SIN campos de infraestructura (eventId, aggregateId, occurredOn)
   *
   * Estructura:
   * {
   *   "productId": "product-123",
   *   "productName": "Sandwich de Pollo",
   *   "previousPrice": 15.00,
   *   "newPrice": 18.50,
   *   "priceChangePercentage": 23.33,
   *   "currency": "PEN",
   *   "changedAt": "2025-11-03T12:00:00Z"
   * }
   *
   * Formato: JSONB para queries eficientes en PostgreSQL
   *
   * ⚠️ IMPORTANTE: Esta columna es INMUTABLE (append-only)
   */
  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>

  /**
   * Metadata contextual del evento (NO es parte del payload de negocio)
   *
   * Contiene información de tracing, auditoría, y contexto de ejecución:
   *
   * {
   *   "userId": "user-123",              // Quién ejecutó la acción
   *   "userName": "Juan Pérez",          // Nombre legible del usuario
   *   "correlationId": "req-abc-xyz",    // Request ID (distributed tracing)
   *   "causationId": "event-def-123",    // ID del evento que causó este
   *   "ipAddress": "192.168.1.1",        // IP del cliente
   *   "userAgent": "Mozilla/5.0...",     // User agent del navegador
   *   "sessionId": "sess-456",           // Sesión del usuario
   *   "tenantId": "tenant-789",          // Multi-tenancy (si aplica)
   *   "environment": "production"        // Ambiente de ejecución
   * }
   *
   * Útil para:
   * - Auditoría: Quién hizo qué y cuándo
   * - Debugging: Rastrear request completo (correlationId)
   * - Compliance: GDPR, SOC2, ISO27001
   * - Analytics: Patrones de uso
   *
   * Separado del payload porque:
   * - NO es parte del dominio
   * - Puede cambiar sin afectar event sourcing
   * - Permite queries eficientes (ej: eventos de un usuario)
   *
   * @nullable Algunos eventos pueden no tener metadata
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    userId?: string
    userName?: string
    correlationId?: string
    causationId?: string
    ipAddress?: string
    userAgent?: string
    sessionId?: string
    tenantId?: string
    environment?: string
    [key: string]: unknown
  } | null

  /**
   * Correlation ID (índice separado para performance)
   *
   * Duplicado de metadata.correlationId para queries rápidas
   * Permite rastrear todos los eventos de un request distribuido
   *
   * Ejemplo: Un request HTTP genera múltiples eventos
   * - ProductCreated (correlationId: req-123)
   * - InventoryReserved (correlationId: req-123)
   * - OrderConfirmed (correlationId: req-123)
   *
   * Query eficiente:
   * SELECT * FROM event_store WHERE correlation_id = 'req-123' ORDER BY occurred_at
   *
   * @nullable No todos los eventos tienen correlationId
   * @indexed Para distributed tracing
   */
  @Column({ name: 'correlation_id', type: 'varchar', length: 100, nullable: true })
  correlationId: string | null

  /**
   * Timestamp de cuándo ocurrió el evento en el DOMINIO
   *
   * Diferente de created_at (cuándo se guardó en DB)
   * Útil para:
   * - Event replay desde una fecha específica
   * - Time-travel queries
   * - Auditoría temporal
   *
   * Ejemplo:
   * occurredAt:  2025-11-03 10:00:00 (evento ocurrió)
   * createdAt:   2025-11-03 10:00:05 (guardado en DB 5s después)
   *
   * @indexed Para time-based queries
   */
  @Column({ name: 'occurred_at', type: 'timestamp with time zone' })
  occurredAt: Date

  /**
   * Timestamp de cuándo se insertó el evento en la DB
   *
   * Útil para:
   * - Debugging: Detectar retrasos en persistencia
   * - Monitoring: Latencia del event bus
   * - Replication: Orden de llegada a la DB
   *
   * @auto Generado automáticamente por TypeORM
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
