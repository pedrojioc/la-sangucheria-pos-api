import { ApprovePurchaseOrder } from '@/contexts/procurement/purchase-order/application/approve/approve-purchase-order'
import { PurchaseOrderRepository } from '@/contexts/procurement/purchase-order/domain/repositories/purchase-order.repository'
import { EventBus } from '@/shared/domain/events'
import { PurchaseOrderStatus } from '@/contexts/procurement/purchase-order/domain/purchase-order-status'
import { InvalidStatusTransition } from '@/contexts/procurement/purchase-order/domain/exceptions/invalid-status-transition.exception'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { PurchaseOrderMother } from '../__mothers__/PurchaseOrderMother'

describe('ApprovePurchaseOrder', () => {
  let useCase: ApprovePurchaseOrder
  let repository: jest.Mocked<PurchaseOrderRepository>
  let eventBus: jest.Mocked<EventBus>

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByOrderNumber: jest.fn(),
      findBySupplierId: jest.fn(),
      findByStatus: jest.fn(),
      findAll: jest.fn(),
      getNextSequenceNumber: jest.fn()
    } as any

    eventBus = {
      publish: jest.fn()
    } as any

    useCase = new ApprovePurchaseOrder(repository, eventBus)
  })

  it('should approve a purchase order in PENDING_APPROVAL status', async () => {
    const purchaseOrder = PurchaseOrderMother.pendingApproval()
    const orderId = purchaseOrder.toPrimitives().id
    const approvedBy = UuidMother.random()

    repository.findById.mockResolvedValue(purchaseOrder)

    await useCase.run(orderId, approvedBy)

    expect(repository.save).toHaveBeenCalledTimes(1)
    const savedOrder = repository.save.mock.calls[0][0]
    const primitives = savedOrder.toPrimitives()

    expect(primitives.status).toBe(PurchaseOrderStatus.APPROVED)
    expect(primitives.approvedBy).toBe(approvedBy)
    expect(primitives.approvedDate).toBeInstanceOf(Date)
  })

  it('should publish PurchaseOrderApprovedEvent', async () => {
    const purchaseOrder = PurchaseOrderMother.pendingApproval()
    repository.findById.mockResolvedValue(purchaseOrder)

    await useCase.run(purchaseOrder.toPrimitives().id, UuidMother.random())

    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const events = eventBus.publish.mock.calls[0][0]
    expect(events).toHaveLength(1)
    expect(events[0].eventName).toBe('procurement.purchase_order.approved')
  })

  it('should throw error when purchase order not found', async () => {
    repository.findById.mockResolvedValue(null)

    await expect(useCase.run(UuidMother.random(), UuidMother.random())).rejects.toThrow('not found')
  })

  it('should throw error when approving from invalid status', async () => {
    const purchaseOrder = PurchaseOrderMother.inDraft()
    repository.findById.mockResolvedValue(purchaseOrder)

    await expect(useCase.run(purchaseOrder.toPrimitives().id, UuidMother.random())).rejects.toThrow(
      InvalidStatusTransition
    )
  })
})
