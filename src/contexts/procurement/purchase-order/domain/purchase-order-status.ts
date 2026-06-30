/**
 * PurchaseOrderStatus - Value Object (Enum)
 *
 * Estados del ciclo de vida de una orden de compra:
 *
 * DRAFT → PENDING_APPROVAL → APPROVED → ORDERED → PARTIALLY_RECEIVED → CLOSED
 *                                ↓           ↓
 *                            REJECTED    CANCELLED
 *
 * - ORDERED: La orden fue comunicada al proveedor (via send()). Distingue
 *   "aprobada sin comunicar" de "ya pedida y esperando entrega".
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
   * APPROVED: Aprobada, pendiente de comunicar al proveedor
   * - Aprobada por el responsable
   * - Aún no se comunicó al proveedor
   * - Usar send() para pasar a ORDERED
   */
  APPROVED = 'APPROVED',

  /**
   * ORDERED: Comunicada al proveedor, esperando entrega
   * - El pedido fue enviado/comunicado al proveedor
   * - Registrado purchaseMethod (whatsapp, llamada, email, etc.)
   * - Esperando que llegue la mercancía
   */
  ORDERED = 'ORDERED',

  /**
   * PARTIALLY_RECEIVED: Recibida parcialmente
   * - Al menos un item ha llegado físicamente al local
   * - Faltan items por recibir
   */
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',

  /**
   * CLOSED: Cerrada/Completada
   * - Todos los items recibidos o cancelados
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
    [PurchaseOrderStatus.APPROVED]: [PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.CANCELLED],
    [PurchaseOrderStatus.ORDERED]: [
      PurchaseOrderStatus.PARTIALLY_RECEIVED,
      PurchaseOrderStatus.CLOSED,
      PurchaseOrderStatus.CANCELLED
    ],
    [PurchaseOrderStatus.PARTIALLY_RECEIVED]: [PurchaseOrderStatus.CLOSED],
    [PurchaseOrderStatus.CLOSED]: [],
    [PurchaseOrderStatus.REJECTED]: [],
    [PurchaseOrderStatus.CANCELLED]: []
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
    return [PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.ORDERED].includes(status)
  }
}
