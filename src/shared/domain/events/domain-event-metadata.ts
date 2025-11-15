/**
 * DomainEventMetadata
 *
 * Metadata contextual que acompaña a todos los eventos de dominio.
 * Proporciona información sobre el contexto de ejecución del evento.
 *
 * @since 1.0.0 - Sprint 1: Domain Events Refactor
 */
export interface DomainEventMetadata {
  /**
   * ID del usuario que ejecutó la acción
   * @example "user-123"
   */
  userId?: string

  /**
   * Nombre legible del usuario (para logs y auditoría)
   * @example "Juan Pérez"
   */
  userName?: string

  /**
   * ID de correlación para tracing distribuido
   * Permite rastrear un request a través de múltiples eventos y servicios
   * @example "req-abc-xyz-123"
   */
  correlationId?: string

  /**
   * ID del evento que causó este evento
   * Útil para reconstruir la cadena de causalidad
   * @example "order-created-event-456"
   */
  causationId?: string

  /**
   * Dirección IP del cliente que originó la acción
   * @example "192.168.1.100"
   */
  ipAddress?: string

  /**
   * User agent del navegador/cliente
   * @example "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..."
   */
  userAgent?: string

  /**
   * ID de sesión del usuario
   * @example "session-789"
   */
  sessionId?: string

  /**
   * Versión del agregado (para optimistic locking)
   * Se incrementa con cada cambio al agregado
   * @example 3
   */
  aggregateVersion?: number

  /**
   * ID del tenant (para sistemas multi-tenant)
   * @example "tenant-acme-corp"
   */
  tenantId?: string

  /**
   * Entorno donde se generó el evento
   * @example "production" | "staging" | "development"
   */
  environment?: string

  /**
   * Campos adicionales extensibles
   * Permite agregar metadata específica sin cambiar la interface
   */
  [key: string]: unknown
}
