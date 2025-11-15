import { Uuid } from '../value-objects/uuid'
import { DomainEventMetadata } from './domain-event-metadata'

type DomainEventAttributes = any

/**
 * DomainEventFromPrimitivesParams
 *
 * Parámetros para el método estático fromPrimitives de eventos de dominio.
 * Utilizado para reconstruir eventos desde primitives (deserialización).
 */
export interface DomainEventFromPrimitivesParams {
  /**
   * ID del agregado que generó este evento
   */
  aggregateId: string

  /**
   * ID único del evento
   */
  eventId: string

  /**
   * Fecha y hora en que ocurrió el evento
   */
  occurredOn: Date

  /**
   * Payload del evento (datos de negocio)
   */
  payload: DomainEventAttributes

  /**
   * Metadata contextual del evento
   */
  metadata: DomainEventMetadata

  /**
   * Versión del schema del evento
   */
  version: number
}

/**
 * DomainEventConstructor
 *
 * Parámetros del constructor para eventos de dominio con payload genérico.
 *
 * @template TPayload - Tipo del payload específico del evento
 */
export interface DomainEventConstructor {
  /**
   * Nombre único del evento (ej: "product.created", "order.cancelled")
   */
  eventName: string

  /**
   * ID del agregado que generó este evento
   */
  aggregateId: string

  /**
   * Payload del evento (datos de negocio)
   * Este campo contiene toda la información específica del evento
   */
  payload: DomainEventAttributes

  /**
   * Metadata contextual del evento (usuario, correlación, etc.)
   * @optional
   */
  metadata?: DomainEventMetadata

  /**
   * Versión del schema del evento
   * Útil para evolución de eventos y event upcasting
   * @optional - Se usa VERSION estático de la clase si no se proporciona
   */
  version?: number

  /**
   * ID único del evento
   * @optional - Se genera automáticamente si no se proporciona
   */
  eventId?: string

  /**
   * Fecha y hora en que ocurrió el evento
   * @optional - Se usa new Date() si no se proporciona
   */
  occurredOn?: Date
}

/**
 * DomainEvent<TPayload>
 *
 * Clase base para eventos de dominio con payload genérico tipado.
 *
 * Los eventos de dominio representan algo que sucedió en el pasado en el dominio.
 * Son inmutables y contienen toda la información necesaria para reconstruir el estado.
 *
 * Características:
 * - Generic payload tipado (reduce duplicación de código)
 * - Metadata contextual (userId, correlationId, etc.)
 * - Versionado explícito de eventos
 * - toPrimitives() genérico heredado por defecto
 *
 * @template TPayload - Tipo del payload específico del evento
 *
 * @example
 * ```typescript
 * // 1. Definir payload tipado
 * interface ProductCreatedPayload {
 *   productId: string
 *   name: string
 *   price: number
 * }
 *
 * // 2. Crear evento concreto
 * export class ProductCreatedEvent extends DomainEvent {
 *   static readonly EVENT_NAME = 'product.created'
 *   static readonly VERSION = 1
 *
 *   constructor(
 *     payload: DomainEventAttributes,
 *     metadata?: DomainEventMetadata,
 *     eventId?: string,
 *     occurredOn?: Date
 *   ) {
 *     super({
 *       eventName: ProductCreatedEvent.EVENT_NAME,
 *       aggregateId: payload.productId,
 *       payload,
 *       metadata,
 *       eventId,
 *       occurredOn
 *     })
 *   }
 *
 *   static fromPrimitives(params: {
 *     aggregateId: string
 *     eventId: string
 *     occurredOn: Date
 *     payload: DomainEventAttributes
 *     metadata?: DomainEventMetadata
 *     version?: number
 *   }): ProductCreatedEvent {
 *     const typedPayload: ProductCreatedPayload = {
 *       productId: params.payload.productId as string,
 *       name: params.payload.name as string,
 *       price: params.payload.price as number
 *     }
 *
 *     return new ProductCreatedEvent(
 *       typedPayload,
 *       params.metadata,
 *       params.eventId,
 *       params.occurredOn
 *     )
 *   }
 * }
 *
 * // 3. Usar evento con type safety completo
 * const event = new ProductCreatedEvent(
 *   { productId: '123', name: 'Sandwich', price: 15.50 },
 *   { userId: 'user-456', correlationId: 'req-789' }
 * )
 *
 * console.log(event.payload.name)  // ✅ TypeScript sabe que es string
 * console.log(event.metadata.userId)  // ✅ TypeScript sabe que es string | undefined
 * ```
 *
 * @since 1.0.0
 */
export abstract class DomainEvent {
  /**
   * Nombre único del evento (definido en clase concreta)
   * @static
   * @example "product.created"
   */
  static EVENT_NAME: string

  /**
   * Versión del schema del evento (definido en clase concreta)
   * @static
   * @default 1
   * @example 2
   */
  static VERSION: number = 1

  /**
   * ID del agregado que generó este evento
   * @readonly
   */
  readonly aggregateId: string

  /**
   * ID único del evento
   * @readonly
   */
  readonly eventId: string

  /**
   * Fecha y hora en que ocurrió el evento
   * @readonly
   */
  readonly occurredOn: Date

  /**
   * Nombre único del evento
   * @readonly
   */
  readonly eventName: string

  /**
   * Versión del schema del evento
   * @readonly
   */
  readonly version: number

  /**
   * Metadata contextual del evento
   * Incluye información sobre el usuario, tracing, auditoría, etc.
   * @readonly
   */
  readonly metadata: DomainEventMetadata

  /**
   * Payload del evento (datos de negocio)
   * Tipado fuertemente con el generic TPayload
   * @readonly
   */
  readonly payload: DomainEventAttributes

  constructor(params: DomainEventConstructor) {
    const { aggregateId, eventName, payload, metadata, version, eventId, occurredOn } = params

    this.aggregateId = aggregateId
    this.eventId = eventId || Uuid.random().value
    this.occurredOn = occurredOn || new Date()
    this.eventName = eventName
    this.version = version || (this.constructor as any).VERSION || 1
    this.metadata = metadata || {}
    this.payload = payload
  }

  /**
   * Serializa el evento a un objeto plano (primitives)
   *
   * Implementación por defecto que retorna SOLO el payload
   * (sin metadata, que se persiste por separado en Event Store)
   *
   * Sobreescribir en eventos concretos si hay lógica especial
   * (ej: serializar Date a ISO string).
   *
   * @returns Objeto plano con el payload del evento
   */
  abstract toPrimitives(): DomainEventAttributes

  /**
   * Reconstruye un evento desde primitives
   *
   * Debe ser implementado por cada evento concreto.
   * Útil para deserialización desde Event Store.
   *
   * ⚠️ IMPORTANTE: Parámetro 'payload' (no 'attributes')
   * - payload: Datos de negocio del evento (de columna event_store.payload)
   * - metadata: Metadata contextual (de columna event_store.metadata)
   *
   * @static
   * @abstract
   */
  static fromPrimitives: (params: DomainEventFromPrimitivesParams) => DomainEvent
}

/**
 * DomainEventClass
 *
 * Type para clases de eventos de dominio (no instancias).
 * Útil para dependency injection y event subscribers.
 */
export type DomainEventClass = {
  EVENT_NAME: string
  VERSION: number
  fromPrimitives(params: {
    aggregateId: string
    eventId: string
    occurredOn: Date
    payload: DomainEventAttributes
    metadata?: DomainEventMetadata
    version?: number
  }): DomainEvent
}
