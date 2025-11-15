import { AggregateRoot } from '@/shared/domain/aggregate-root'
import { Money } from '@/shared/domain/value-objects/money'
import { PurchaseOrderId } from './purchase-order-id'
import { PurchaseOrderNumber } from './purchase-order-number'
import { PurchaseOrderStatus, PurchaseOrderStatusTransitions } from './purchase-order-status'
import { PurchaseOrderItem, PurchaseOrderItemPrimitives } from './purchase-order-item'
import { InvalidStatusTransition } from './exceptions/invalid-status-transition.exception'
import { PurchaseOrderCannotBeModified } from './exceptions/purchase-order-cannot-be-modified.exception'
import { PurchaseOrderHasNoItems } from './exceptions/purchase-order-has-no-items.exception'
import { PurchaseOrderCreatedEvent } from './events/purchase-order-created.event'
import { PurchaseOrderApprovedEvent } from './events/purchase-order-approved.event'
import { PurchaseOrderRejectedEvent } from './events/purchase-order-rejected.event'
import { PurchaseOrderSentEvent } from './events/purchase-order-sent.event'
import { PurchaseOrderItemReceivedEvent } from './events/purchase-order-item-received.event'
import { PurchaseOrderClosedEvent } from './events/purchase-order-closed.event'

export interface PurchaseOrderPrimitives {
  id: string
  orderNumber: string
  supplierId: string
  status: PurchaseOrderStatus
  items: PurchaseOrderItemPrimitives[]
  requestedBy: string
  approvedBy: string | null
  rejectedBy: string | null
  sentBy: string | null
  closedBy: string | null
  totalAmount: number
  currency: string
  requestedDate: Date
  expectedDeliveryDate: Date | null
  approvedDate: Date | null
  sentDate: Date | null
  receivedDate: Date | null
  closedDate: Date | null
  notes: string | null
}

/**
 * PurchaseOrder - Aggregate Root
 *
 * Representa una orden de compra a un proveedor.
 * Es el agregado principal del Procurement Context.
 *
 * Ciclo de vida:
 * DRAFT � PENDING_APPROVAL � APPROVED � SENT � [PARTIALLY_]RECEIVED � CLOSED
 *
 * Responsabilidades:
 * - Gestionar items de la orden
 * - Controlar transiciones de estado
 * - Calcular totales
 * - Registrar recepciones
 * - Emitir eventos de dominio
 *
 * Invariantes:
 * - Una orden debe tener al menos un item para ser aprobada
 * - Solo �rdenes en DRAFT pueden modificarse
 * - Las transiciones de estado deben ser v�lidas
 * - El total debe coincidir con la suma de los items
 */
export class PurchaseOrder extends AggregateRoot {
  private constructor(
    private readonly id: PurchaseOrderId,
    private readonly orderNumber: PurchaseOrderNumber,
    private readonly supplierId: string, // TODO: Usar SupplierId cuando exista
    private status: PurchaseOrderStatus,
    private items: PurchaseOrderItem[],
    private readonly requestedBy: string, // TODO: Usar UserId cuando exista
    private approvedBy: string | null,
    private rejectedBy: string | null,
    private sentBy: string | null,
    private closedBy: string | null,
    private readonly currency: string,
    private readonly requestedDate: Date,
    private expectedDeliveryDate: Date | null,
    private approvedDate: Date | null,
    private sentDate: Date | null,
    private receivedDate: Date | null,
    private closedDate: Date | null,
    private notes: string | null
  ) {
    super()
  }

  /**
   * Crea una nueva orden de compra en estado DRAFT con items iniciales
   *
   * El agregado maneja la creación de los items internamente,
   * recibiendo primitivos desde la capa de aplicación.
   */
  static create(
    id: string,
    orderNumber: string,
    supplierId: string,
    requestedBy: string,
    currency: string,
    expectedDeliveryDate: Date | null,
    notes: string | null = null,
    items: PurchaseOrderItem[]
  ): PurchaseOrder {
    const now = new Date()

    const order = new PurchaseOrder(
      new PurchaseOrderId(id),
      new PurchaseOrderNumber(orderNumber),
      supplierId,
      PurchaseOrderStatus.DRAFT,
      items,
      requestedBy,
      null, // approvedBy
      null, // rejectedBy
      null, // sentBy
      null, // closedBy
      currency,
      now, // requestedDate
      expectedDeliveryDate,
      null, // approvedDate
      null, // sentDate
      null, // receivedDate
      null, // closedDate
      notes
    )

    // Evento de dominio con información de items
    order.record(
      new PurchaseOrderCreatedEvent({
        purchaseOrderId: order.id.value,
        orderNumber: order.orderNumber.value,
        supplierId: order.supplierId,
        requestedBy: order.requestedBy,
        expectedDeliveryDate: order.expectedDeliveryDate,
        itemsCount: items.length,
        totalAmount: order.getTotalAmount().amount
      })
    )

    return order
  }
  static createOrderItems(
    items: Array<{
      id: string
      ingredientId: string
      quantityRequested: number
      unitId: string
      unitCost: number
      currency: string
      notes: string | null
    }>
  ): PurchaseOrderItem[] {
    return items.map(item =>
      PurchaseOrderItem.create(
        item.id,
        item.ingredientId,
        item.quantityRequested,
        item.unitId,
        item.unitCost,
        item.currency,
        item.notes
      )
    )
  }

  // ===== Gesti�n de Items =====

  /**
   * Agrega un item a la orden (solo en DRAFT)
   */
  addItems(items: PurchaseOrderItem[]): void {
    this.ensureCanBeModified()
    this.items.push(...items)
  }

  /**
   * Remueve un item de la orden (solo en DRAFT)
   */
  removeItem(itemId: string): void {
    this.ensureCanBeModified()
    this.items = this.items.filter(item => item.id.value !== itemId)
  }

  // ===== Transiciones de Estado =====

  /**
   * Env�a la orden para aprobaci�n
   */
  submitForApproval(): void {
    this.ensureHasItems()
    this.transitionTo(PurchaseOrderStatus.PENDING_APPROVAL)
  }

  /**
   * Aprueba la orden
   */
  approve(approvedBy: string): void {
    this.transitionTo(PurchaseOrderStatus.APPROVED)
    this.approvedBy = approvedBy
    this.approvedDate = new Date()

    this.record(
      new PurchaseOrderApprovedEvent({
        purchaseOrderId: this.id.value,
        orderNumber: this.orderNumber.value,
        approvedBy: approvedBy,
        approvedDate: this.approvedDate,
        totalAmount: this.getTotalAmount().amount,
        currency: this.currency
      })
    )
  }

  /**
   * Rechaza la orden
   */
  reject(rejectedBy: string, reason: string | null = null): void {
    this.transitionTo(PurchaseOrderStatus.REJECTED)
    this.rejectedBy = rejectedBy
    if (reason) {
      this.notes = this.notes ? `${this.notes}\nRejection: ${reason}` : reason
    }

    this.record(
      new PurchaseOrderRejectedEvent({
        purchaseOrderId: this.id.value,
        orderNumber: this.orderNumber.value,
        rejectedBy: rejectedBy,
        reason: reason
      })
    )
  }

  /**
   * Marca la orden como enviada al proveedor
   */
  markAsSent(sentBy: string): void {
    this.transitionTo(PurchaseOrderStatus.SENT)
    this.sentBy = sentBy
    this.sentDate = new Date()

    this.record(
      new PurchaseOrderSentEvent({
        purchaseOrderId: this.id.value,
        orderNumber: this.orderNumber.value,
        supplierId: this.supplierId,
        sentBy: sentBy,
        sentDate: this.sentDate,
        expectedDeliveryDate: this.expectedDeliveryDate,
        items: this.items.map(item => {
          const itemData = item.toPrimitives()
          return {
            ingredientId: itemData.ingredientId,
            quantityRequested: itemData.quantityRequested,
            unitId: itemData.quantityRequestedUnitId,
            unitCost: itemData.unitCost,
            currency: itemData.currency,
            notes: itemData.notes
          }
        })
      })
    )
  }

  /**
   * Registra la recepci�n de un item
   */
  registerItemReception(itemId: string, quantityReceived: number, unitId: string): void {
    const item = this.items.find(i => i.id.value === itemId)
    if (!item) {
      throw new Error(`Item ${itemId} not found in purchase order`)
    }

    item.registerReception(quantityReceived, unitId)

    // Actualizar estado de la orden
    if (this.areAllItemsFullyReceived()) {
      this.transitionTo(PurchaseOrderStatus.RECEIVED)
      this.receivedDate = new Date()
    } else if (this.status === PurchaseOrderStatus.SENT) {
      this.transitionTo(PurchaseOrderStatus.PARTIALLY_RECEIVED)
    }

    const now = new Date()
    const itemData = item.toPrimitives()
    // Emitir evento para que Inventory reaccione
    this.record(
      new PurchaseOrderItemReceivedEvent({
        purchaseOrderId: this.id.value,
        orderNumber: this.orderNumber.value,
        itemId: itemData.id,
        ingredientId: itemData.ingredientId,
        quantityReceived: quantityReceived,
        unitId: unitId,
        unitCost: itemData.unitCost,
        currency: itemData.currency,
        supplierId: this.supplierId,
        receivedDate: now,
        occurredOn: now
      })
    )
  }

  /**
   * Cierra la orden (estado final)
   */
  close(closedBy: string): void {
    this.transitionTo(PurchaseOrderStatus.CLOSED)
    this.closedBy = closedBy
    this.closedDate = new Date()

    this.record(
      new PurchaseOrderClosedEvent({
        purchaseOrderId: this.id.value,
        orderNumber: this.orderNumber.value,
        closedBy: closedBy,
        closedDate: this.closedDate,
        totalAmount: this.getTotalAmount().amount,
        currency: this.currency,
        itemsReceived: this.items.length
      })
    )
  }

  // ===== C�lculos =====

  /**
   * Calcula el monto total de la orden
   */
  getTotalAmount(): Money {
    const total = this.items.reduce((sum, item) => sum + item.totalCost.amount, 0)
    return new Money(total, this.currency)
  }

  /**
   * Verifica si todos los items han sido completamente recibidos
   */
  private areAllItemsFullyReceived(): boolean {
    return this.items.every(item => item.isFullyReceived())
  }

  // ===== Validaciones =====

  private ensureCanBeModified(): void {
    if (!PurchaseOrderStatusTransitions.canBeEdited(this.status)) {
      throw new PurchaseOrderCannotBeModified(this.status)
    }
  }

  private ensureHasItems(): void {
    if (this.items.length === 0) {
      throw new PurchaseOrderHasNoItems()
    }
  }

  private transitionTo(newStatus: PurchaseOrderStatus): void {
    if (!PurchaseOrderStatusTransitions.canTransition(this.status, newStatus)) {
      throw new InvalidStatusTransition(this.status, newStatus)
    }
    this.status = newStatus
  }

  // ===== Serialización =====

  toPrimitives(): PurchaseOrderPrimitives {
    return {
      id: this.id.value,
      orderNumber: this.orderNumber.value,
      supplierId: this.supplierId,
      status: this.status,
      items: this.items.map(item => item.toPrimitives()),
      requestedBy: this.requestedBy,
      approvedBy: this.approvedBy,
      rejectedBy: this.rejectedBy,
      sentBy: this.sentBy,
      closedBy: this.closedBy,
      totalAmount: this.getTotalAmount().amount,
      currency: this.currency,
      requestedDate: this.requestedDate,
      expectedDeliveryDate: this.expectedDeliveryDate,
      approvedDate: this.approvedDate,
      sentDate: this.sentDate,
      receivedDate: this.receivedDate,
      closedDate: this.closedDate,
      notes: this.notes
    }
  }

  static fromPrimitives(primitives: PurchaseOrderPrimitives): PurchaseOrder {
    const order = new PurchaseOrder(
      new PurchaseOrderId(primitives.id),
      new PurchaseOrderNumber(primitives.orderNumber),
      primitives.supplierId,
      primitives.status,
      primitives.items.map(item => PurchaseOrderItem.fromPrimitives(item)),
      primitives.requestedBy,
      primitives.approvedBy,
      primitives.rejectedBy,
      primitives.sentBy,
      primitives.closedBy,
      primitives.currency,
      primitives.requestedDate,
      primitives.expectedDeliveryDate,
      primitives.approvedDate,
      primitives.sentDate,
      primitives.receivedDate,
      primitives.closedDate,
      primitives.notes
    )

    return order
  }
}
