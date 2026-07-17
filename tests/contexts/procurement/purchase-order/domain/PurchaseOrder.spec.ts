import { PurchaseOrder } from '@/contexts/procurement/purchase-order/domain/purchase-order'
import { PurchaseOrderStatus } from '@/contexts/procurement/purchase-order/domain/purchase-order-status'
import { InvalidStatusTransition } from '@/contexts/procurement/purchase-order/domain/exceptions/invalid-status-transition.exception'
import { PurchaseOrderCannotBeModified } from '@/contexts/procurement/purchase-order/domain/exceptions/purchase-order-cannot-be-modified.exception'
import { PurchaseOrderHasNoItems } from '@/contexts/procurement/purchase-order/domain/exceptions/purchase-order-has-no-items.exception'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { PurchaseOrderMother } from '../__mothers__/PurchaseOrderMother'
import { PurchaseOrderNumberMother } from '../__mothers__/PurchaseOrderNumberMother'
import { PurchaseOrderItemMother } from '../__mothers__/PurchaseOrderItemMother'

describe('PurchaseOrder', () => {
  describe('create', () => {
    it('should create a new purchase order in DRAFT status', () => {
      const id = UuidMother.random()
      const orderNumber = PurchaseOrderNumberMother.random()
      const supplierId = UuidMother.random()
      const requestedBy = UuidMother.random()
      const items = Array.from({ length: 2 }, () => PurchaseOrderItemMother.random())

      const po = PurchaseOrder.create(
        id,
        orderNumber,
        supplierId,
        requestedBy,
        'COP',
        null,
        null,
        items
      )
      const p = po.toPrimitives()

      expect(p.id).toBe(id)
      expect(p.orderNumber).toBe(orderNumber)
      expect(p.status).toBe(PurchaseOrderStatus.DRAFT)
      expect(p.items).toHaveLength(2)
      expect(p.totalAmount).toBeGreaterThan(0)
    })

    it('should record PurchaseOrderCreatedEvent', () => {
      const po = PurchaseOrder.create(
        UuidMother.random(),
        PurchaseOrderNumberMother.random(),
        UuidMother.random(),
        UuidMother.random(),
        'COP',
        null,
        null,
        [PurchaseOrderItemMother.random()]
      )
      const events = po.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0].eventName).toBe('procurement.purchase_order.created')
    })
  })

  describe('addItems', () => {
    it('should add items to a DRAFT order', () => {
      const po = PurchaseOrderMother.withoutItems()
      const item = PurchaseOrderItemMother.random()

      po.addItems([item])

      expect(po.toPrimitives().items).toHaveLength(1)
    })

    it('should throw when adding items to a non-DRAFT order', () => {
      const po = PurchaseOrderMother.pendingApproval()
      const item = PurchaseOrderItemMother.random()

      expect(() => po.addItems([item])).toThrow(PurchaseOrderCannotBeModified)
    })
  })

  describe('submitForApproval', () => {
    it('should transition DRAFT → PENDING_APPROVAL', () => {
      const po = PurchaseOrderMother.inDraft()
      po.submitForApproval(UuidMother.random())

      expect(po.toPrimitives().status).toBe(PurchaseOrderStatus.PENDING_APPROVAL)
    })

    it('should throw when order has no items', () => {
      const po = PurchaseOrderMother.withoutItems()

      expect(() => po.submitForApproval(UuidMother.random())).toThrow(PurchaseOrderHasNoItems)
    })
  })

  describe('approve', () => {
    it('should transition PENDING_APPROVAL → APPROVED', () => {
      const po = PurchaseOrderMother.pendingApproval()
      const approvedBy = UuidMother.random()

      po.approve(approvedBy)
      const p = po.toPrimitives()

      expect(p.status).toBe(PurchaseOrderStatus.APPROVED)
      expect(p.approvedBy).toBe(approvedBy)
      expect(p.approvedDate).toBeInstanceOf(Date)
    })

    it('should record PurchaseOrderApprovedEvent', () => {
      const po = PurchaseOrderMother.pendingApproval()
      po.approve(UuidMother.random())
      const events = po.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0].eventName).toBe('procurement.purchase_order.approved')
    })

    it('should throw when approving from DRAFT', () => {
      const po = PurchaseOrderMother.inDraft()

      expect(() => po.approve(UuidMother.random())).toThrow(InvalidStatusTransition)
    })
  })

  describe('reject', () => {
    it('should transition PENDING_APPROVAL → REJECTED', () => {
      const po = PurchaseOrderMother.pendingApproval()
      const rejectedBy = UuidMother.random()

      po.reject(rejectedBy, 'Out of budget')
      const p = po.toPrimitives()

      expect(p.status).toBe(PurchaseOrderStatus.REJECTED)
      expect(p.rejectedBy).toBe(rejectedBy)
    })

    it('should record PurchaseOrderRejectedEvent', () => {
      const po = PurchaseOrderMother.pendingApproval()
      po.reject(UuidMother.random(), 'test reason')
      const events = po.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0].eventName).toBe('procurement.purchase_order.rejected')
    })
  })

  describe('close', () => {
    it('should transition PARTIALLY_RECEIVED → CLOSED', () => {
      const po = PurchaseOrderMother.partiallyReceived()
      const closedBy = UuidMother.random()

      po.close(closedBy)
      const p = po.toPrimitives()

      expect(p.status).toBe(PurchaseOrderStatus.CLOSED)
      expect(p.closedBy).toBe(closedBy)
      expect(p.closedDate).toBeInstanceOf(Date)
    })

    it('should record PurchaseOrderClosedEvent', () => {
      const po = PurchaseOrderMother.partiallyReceived()
      po.close(UuidMother.random())
      const events = po.pullDomainEvents()

      expect(events).toHaveLength(1)
      expect(events[0].eventName).toBe('procurement.purchase_order.closed')
    })
  })
})
