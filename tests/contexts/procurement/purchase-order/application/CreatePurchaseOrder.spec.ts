import { CreatePurchaseOrder } from '@/contexts/procurement/purchase-order/application/create/create-purchase-order'
import { PurchaseOrderRepository } from '@/contexts/procurement/purchase-order/domain/repositories/purchase-order.repository'
import { EventBus } from '@/shared/domain/events'
import { PurchaseOrder } from '@/contexts/procurement/purchase-order/domain/purchase-order'
import { PurchaseOrderStatus } from '@/contexts/procurement/purchase-order/domain/purchase-order-status'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { PurchaseOrderItemMother } from '../__mothers__/PurchaseOrderItemMother'

describe('CreatePurchaseOrder', () => {
  let useCase: CreatePurchaseOrder
  let repository: jest.Mocked<PurchaseOrderRepository>
  let validationService: any
  let eventBus: jest.Mocked<EventBus>

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByOrderNumber: jest.fn(),
      findBySupplierId: jest.fn(),
      findByStatus: jest.fn(),
      findAll: jest.fn(),
      getNextSequenceNumber: jest.fn().mockResolvedValue(1),
      matching: jest.fn()
    } as any

    validationService = {
      validateIngredientsExists: jest.fn()
    }

    eventBus = {
      publish: jest.fn()
    } as any

    useCase = new CreatePurchaseOrder(repository, validationService, eventBus)
  })

  it('should create a purchase order in DRAFT status with items', async () => {
    const id = UuidMother.random()
    const supplierId = UuidMother.random()
    const requestedBy = UuidMother.random()
    const items = PurchaseOrderItemMother.createPrimitives(2)

    await useCase.run(id, supplierId, requestedBy, 'PEN', null, null, items)

    expect(repository.save).toHaveBeenCalledTimes(1)
    const savedOrder = repository.save.mock.calls[0][0] as PurchaseOrder
    const primitives = savedOrder.toPrimitives()

    expect(primitives.id).toBe(id)
    expect(primitives.orderNumber).toMatch(/^PO-\d{4}-\d{3}$/) // Auto-generated format
    expect(primitives.status).toBe(PurchaseOrderStatus.DRAFT)
    expect(primitives.items).toHaveLength(2)
  })

  it('should publish PurchaseOrderCreatedEvent with items info', async () => {
    const items = PurchaseOrderItemMother.createPrimitives(2)

    await useCase.run(
      UuidMother.random(),
      UuidMother.random(),
      UuidMother.random(),
      'PEN',
      null,
      null,
      items
    )

    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const events = eventBus.publish.mock.calls[0][0]
    expect(events).toHaveLength(1)
    expect(events[0].eventName).toBe('procurement.purchase_order.created')
  })

  it('should save order with expected delivery date and items', async () => {
    const expectedDeliveryDate = new Date('2025-12-31')
    const items = PurchaseOrderItemMother.createPrimitives(1)

    await useCase.run(
      UuidMother.random(),
      UuidMother.random(),
      UuidMother.random(),
      'PEN',
      expectedDeliveryDate,
      'Urgent order',
      items
    )

    const savedOrder = repository.save.mock.calls[0][0] as PurchaseOrder
    const primitives = savedOrder.toPrimitives()

    expect(primitives.expectedDeliveryDate).toEqual(expectedDeliveryDate)
    expect(primitives.notes).toBe('Urgent order')
    expect(primitives.items).toHaveLength(1)
  })
})
