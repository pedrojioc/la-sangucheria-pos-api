import { PurchaseOrder } from '@/contexts/procurement/purchase-order/domain/purchase-order'
import { PurchaseOrderStatus } from '@/contexts/procurement/purchase-order/domain/purchase-order-status'
import { PurchaseOrderItem } from '@/contexts/procurement/purchase-order/domain/purchase-order-item'
import { InvalidStatusTransition } from '@/contexts/procurement/purchase-order/domain/exceptions/invalid-status-transition.exception'
import { PurchaseOrderCannotBeModified } from '@/contexts/procurement/purchase-order/domain/exceptions/purchase-order-cannot-be-modified.exception'
import { PurchaseOrderHasNoItems } from '@/contexts/procurement/purchase-order/domain/exceptions/purchase-order-has-no-items.exception'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { PurchaseOrderMother } from '../__mothers__/PurchaseOrderMother'
import { PurchaseOrderNumberMother } from '../__mothers__/PurchaseOrderNumberMother'
import { PurchaseOrderItemMother } from '../__mothers__/PurchaseOrderItemMother'

describe('PurchaseOrder', () => {
  describe('create', () => {
    it('should create a new purchase order in DRAFT status with items', () => {
      const id = UuidMother.random()
      const orderNumber = PurchaseOrderNumberMother.random()
      const supplierId = UuidMother.random()
      const requestedBy = UuidMother.random()
      const items = PurchaseOrderItemMother.createPrimitives(2)

      const purchaseOrder = PurchaseOrder.create(
        id,
        orderNumber,
        supplierId,
        requestedBy,
        'PEN',
        null,
        null,
        items
      )

      const primitives = purchaseOrder.toPrimitives()

      expect(primitives.id).toBe(id)
      expect(primitives.orderNumber).toBe(orderNumber)
      expect(primitives.status).toBe(PurchaseOrderStatus.DRAFT)
      expect(primitives.items).toHaveLength(2)
      expect(primitives.totalAmount).toBeGreaterThan(0)
    })

    it('should record PurchaseOrderCreatedEvent with items info', () => {
      const items = PurchaseOrderItemMother.createPrimitives(2)
      const purchaseOrder = PurchaseOrder.create(
        UuidMother.random(),
        PurchaseOrderNumberMother.random(),
        UuidMother.random(),
        UuidMother.random(),
        'PEN',
        null,
        null,
        items
      )

      const events = purchaseOrder.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0].eventName).toBe('procurement.purchase_order.created')
    })
  })

  describe('addItems', () => {
    it('should add items to order in DRAFT status', () => {
      const purchaseOrder = PurchaseOrderMother.withoutItems()
      const item = PurchaseOrderItem.create(
        UuidMother.random(),
        UuidMother.random(),
        10,
        UuidMother.random(),
        15.5,
        'PEN',
        null
      )

      purchaseOrder.addItems([item])

      const primitives = purchaseOrder.toPrimitives()
      expect(primitives.items).toHaveLength(1)
    })

    it('should throw error when adding items to non-DRAFT order', () => {
      const purchaseOrder = PurchaseOrderMother.pendingApproval()
      const item = PurchaseOrderItem.create(
        UuidMother.random(),
        UuidMother.random(),
        10,
        UuidMother.random(),
        15.5,
        'PEN',
        null
      )

      expect(() => purchaseOrder.addItems([item])).toThrow(
        PurchaseOrderCannotBeModified
      )
    })
  })

  describe('submitForApproval', () => {
    it('should transition from DRAFT to PENDING_APPROVAL', () => {
      const purchaseOrder = PurchaseOrderMother.inDraft()

      purchaseOrder.submitForApproval()

      const primitives = purchaseOrder.toPrimitives()
      expect(primitives.status).toBe(PurchaseOrderStatus.PENDING_APPROVAL)
    })

    it('should throw error when order has no items', () => {
      const purchaseOrder = PurchaseOrderMother.withoutItems()

      expect(() => purchaseOrder.submitForApproval()).toThrow(
        PurchaseOrderHasNoItems
      )
    })
  })

  describe('approve', () => {
    it('should transition from PENDING_APPROVAL to APPROVED', () => {
      const purchaseOrder = PurchaseOrderMother.pendingApproval()
      const approvedBy = UuidMother.random()

      purchaseOrder.approve(approvedBy)

      const primitives = purchaseOrder.toPrimitives()
      expect(primitives.status).toBe(PurchaseOrderStatus.APPROVED)
      expect(primitives.approvedBy).toBe(approvedBy)
      expect(primitives.approvedDate).toBeInstanceOf(Date)
    })

    it('should record PurchaseOrderApprovedEvent', () => {
      const purchaseOrder = PurchaseOrderMother.pendingApproval()

      purchaseOrder.approve(UuidMother.random())
      const events = purchaseOrder.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0].eventName).toBe('purchase-order.approved')
    })

    it('should throw error when approving from invalid status', () => {
      const purchaseOrder = PurchaseOrderMother.inDraft()

      expect(() => purchaseOrder.approve(UuidMother.random())).toThrow(
        InvalidStatusTransition
      )
    })
  })

  describe('reject', () => {
    it('should transition from PENDING_APPROVAL to REJECTED', () => {
      const purchaseOrder = PurchaseOrderMother.pendingApproval()
      const rejectedBy = UuidMother.random()
      const reason = 'Out of budget'

      purchaseOrder.reject(rejectedBy, reason)

      const primitives = purchaseOrder.toPrimitives()
      expect(primitives.status).toBe(PurchaseOrderStatus.REJECTED)
      expect(primitives.rejectedBy).toBe(rejectedBy)
      expect(primitives.notes).toContain(reason)
    })

    it('should record PurchaseOrderRejectedEvent', () => {
      const purchaseOrder = PurchaseOrderMother.pendingApproval()

      purchaseOrder.reject(UuidMother.random(), 'test reason')
      const events = purchaseOrder.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0].eventName).toBe('purchase-order.rejected')
    })
  })

  describe('markAsSent', () => {
    it('should transition from APPROVED to SENT', () => {
      const purchaseOrder = PurchaseOrderMother.approved()
      const sentBy = UuidMother.random()

      purchaseOrder.markAsSent(sentBy)

      const primitives = purchaseOrder.toPrimitives()
      expect(primitives.status).toBe(PurchaseOrderStatus.SENT)
      expect(primitives.sentBy).toBe(sentBy)
      expect(primitives.sentDate).toBeInstanceOf(Date)
    })

    it('should record PurchaseOrderSentEvent', () => {
      const purchaseOrder = PurchaseOrderMother.approved()

      purchaseOrder.markAsSent(UuidMother.random())
      const events = purchaseOrder.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0].eventName).toBe('purchase-order.sent')
    })
  })

  describe('close', () => {
    it('should transition to CLOSED status', () => {
      const purchaseOrder = PurchaseOrderMother.sent()
      const closedBy = UuidMother.random()

      purchaseOrder.close(closedBy)

      const primitives = purchaseOrder.toPrimitives()
      expect(primitives.status).toBe(PurchaseOrderStatus.CLOSED)
      expect(primitives.closedBy).toBe(closedBy)
      expect(primitives.closedDate).toBeInstanceOf(Date)
    })

    it('should record PurchaseOrderClosedEvent', () => {
      const purchaseOrder = PurchaseOrderMother.sent()

      purchaseOrder.close(UuidMother.random())
      const events = purchaseOrder.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0].eventName).toBe('purchase-order.closed')
    })
  })

  describe('getTotalAmount', () => {
    it('should calculate total amount from items', () => {
      const purchaseOrder = PurchaseOrderMother.withoutItems()
      const item1 = PurchaseOrderItem.create(
        UuidMother.random(),
        UuidMother.random(),
        10,
        UuidMother.random(),
        15.5,
        'PEN',
        null
      )
      const item2 = PurchaseOrderItem.create(
        UuidMother.random(),
        UuidMother.random(),
        5,
        UuidMother.random(),
        20,
        'PEN',
        null
      )

      purchaseOrder.addItems([item1, item2])

      const total = purchaseOrder.getTotalAmount()

      expect(total.amount).toBe(255) // (10 * 15.5) + (5 * 20)
    })
  })
})
