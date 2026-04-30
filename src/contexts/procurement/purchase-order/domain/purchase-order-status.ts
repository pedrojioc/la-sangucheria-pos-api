/**
 * PurchaseOrderStatus - Value Object (Enum)
 *
 * Estados del ciclo de vida de una orden de compra:
 *
 * DRAFT → PENDING_APPROVAL → APPROVED → PARTIALLY_RECEIVED → CLOSED
 *                                ↓
 *                            REJECTED
 *                                ↓
 *                            CANCELLED
 *
 * Nota: Los estados SENT y RECEIVED fueron eliminados.
 * - SENT: Reemplazado por el campo "purchaseMethod" (la comunicación es opcional)
 * - RECEIVED: Redundante, al recibir todo se pasa directo a CLOSED
 */
export enum PurchaseOrderStatus {
  /**
   * DRAFT: Borrador, aún se está editando
   * - Puede modificarse libremente
   * - No ha sido enviada para aprobación
   */
  DRAFT = 'DRAFT',

  /**
   * PENDING_APPROVAL: Enviada, esperando aprobación
   * - Ya no se puede editar
   * - Esperando revisión del aprobador
   */
  PENDING_APPROVAL = 'PENDING_APPROVAL',

  /**
   * APPROVED: Aprobada, lista para procesar
   * - Aprobada por el responsable
   * - Puede comunicarse al proveedor o ir a comprar directamente
   * - Opcional: Registrar método de compra (purchaseMethod)
   */
  APPROVED = 'APPROVED',

  /**
   * PARTIALLY_RECEIVED: Recibida parcialmente
   * - Al menos un item ha sido recibido
   * - Faltan items por recibir
   */
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',

  /**
   * CLOSED: Cerrada/Completada
   * - Todos los items recibidos
   * - Proceso finalizado
   * - Estado final exitoso
   */
  CLOSED = 'CLOSED',

  /**
   * REJECTED: Rechazada
   * - No aprobada por el responsable
   * - Estado final
   */
  REJECTED = 'REJECTED',

  /**
   * CANCELLED: Cancelada
   * - Cancelada antes de completarse
   * - Estado final
   */
  CANCELLED = 'CANCELLED'
}

/**
 * Helper para validar transiciones de estado válidas
 */
export class PurchaseOrderStatusTransitions {
  private static readonly VALID_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
    [PurchaseOrderStatus.DRAFT]: [
      PurchaseOrderStatus.PENDING_APPROVAL,
      PurchaseOrderStatus.CANCELLED
    ],
    [PurchaseOrderStatus.PENDING_APPROVAL]: [
      PurchaseOrderStatus.APPROVED,
      PurchaseOrderStatus.REJECTED,
      PurchaseOrderStatus.CANCELLED
    ],
    [PurchaseOrderStatus.APPROVED]: [
      PurchaseOrderStatus.PARTIALLY_RECEIVED,
      PurchaseOrderStatus.CLOSED, // Puede ir directo a CLOSED si se recibe todo de una vez
      PurchaseOrderStatus.CANCELLED
    ],
    [PurchaseOrderStatus.PARTIALLY_RECEIVED]: [
      PurchaseOrderStatus.CLOSED // Al recibir el resto, va directo a CLOSED
    ],
    [PurchaseOrderStatus.CLOSED]: [], // Estado final
    [PurchaseOrderStatus.REJECTED]: [], // Estado final
    [PurchaseOrderStatus.CANCELLED]: [] // Estado final
  }

  static canTransition(from: PurchaseOrderStatus, to: PurchaseOrderStatus): boolean {
    const validTransitions = this.VALID_TRANSITIONS[from]
    return validTransitions.includes(to)
  }

  static isTerminalStatus(status: PurchaseOrderStatus): boolean {
    return [
      PurchaseOrderStatus.CLOSED,
      PurchaseOrderStatus.REJECTED,
      PurchaseOrderStatus.CANCELLED
    ].includes(status)
  }

  static canBeEdited(status: PurchaseOrderStatus): boolean {
    return status === PurchaseOrderStatus.DRAFT
  }

  static canBeCancelled(status: PurchaseOrderStatus): boolean {
    return ![
      PurchaseOrderStatus.CLOSED,
      PurchaseOrderStatus.REJECTED,
      PurchaseOrderStatus.CANCELLED,
      PurchaseOrderStatus.PARTIALLY_RECEIVED
    ].includes(status)
  }
}
