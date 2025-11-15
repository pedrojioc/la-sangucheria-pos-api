import { Test, TestingModule } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TypeOrmPurchaseOrderRepository } from '@/contexts/procurement/purchase-order/infrastructure/persistence/typeorm/typeorm-purchase-order.repository'
import { PurchaseOrderEntity } from '@/contexts/procurement/purchase-order/infrastructure/persistence/typeorm/purchase-order.entity'
import { PurchaseOrderItemEntity } from '@/contexts/procurement/purchase-order/infrastructure/persistence/typeorm/purchase-order-item.entity'
import { PurchaseOrder } from '@/contexts/procurement/purchase-order/domain/purchase-order'
import { PurchaseOrderStatus } from '@/contexts/procurement/purchase-order/domain/purchase-order-status'
import { PurchaseOrderId } from '@/contexts/procurement/purchase-order/domain/purchase-order-id'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { PurchaseOrderNumberMother } from '../__mothers__/PurchaseOrderNumberMother'
import { PurchaseOrderItemMother } from '../__mothers__/PurchaseOrderItemMother'

describe('TypeOrmPurchaseOrderRepository', () => {
  let repository: TypeOrmPurchaseOrderRepository
  let module: TestingModule

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [PurchaseOrderEntity, PurchaseOrderItemEntity],
          synchronize: true
        }),
        TypeOrmModule.forFeature([PurchaseOrderEntity, PurchaseOrderItemEntity])
      ],
      providers: [TypeOrmPurchaseOrderRepository]
    }).compile()

    repository = module.get<TypeOrmPurchaseOrderRepository>(
      TypeOrmPurchaseOrderRepository
    )
  })

  afterAll(async () => {
    await module.close()
  })

  describe('save', () => {
    it('should save a purchase order with items', async () => {
      const id = UuidMother.random()
      const items = PurchaseOrderItemMother.createPrimitives(2)

      const purchaseOrder = PurchaseOrder.create(
        id,
        PurchaseOrderNumberMother.random(),
        UuidMother.random(),
        UuidMother.random(),
        'PEN',
        null,
        'Test order',
        items
      )

      await repository.save(purchaseOrder)

      const found = await repository.findById(new PurchaseOrderId(id))

      expect(found).toBeDefined()
      expect(found!.toPrimitives().id).toBe(id)
      expect(found!.toPrimitives().items).toHaveLength(2)
    })
  })

  describe('findById', () => {
    it('should find a purchase order by id', async () => {
      const id = UuidMother.random()
      const items = PurchaseOrderItemMother.createPrimitives(1)

      const purchaseOrder = PurchaseOrder.create(
        id,
        PurchaseOrderNumberMother.random(),
        UuidMother.random(),
        UuidMother.random(),
        'PEN',
        null,
        null,
        items
      )

      await repository.save(purchaseOrder)

      const found = await repository.findById(new PurchaseOrderId(id))

      expect(found).toBeDefined()
      expect(found!.toPrimitives().id).toBe(id)
    })

    it('should return null when purchase order not found', async () => {
      const found = await repository.findById(
        new PurchaseOrderId(UuidMother.random())
      )

      expect(found).toBeNull()
    })
  })

  describe('findByOrderNumber', () => {
    it('should find a purchase order by order number', async () => {
      const orderNumber = PurchaseOrderNumberMother.random()
      const items = PurchaseOrderItemMother.createPrimitives(1)

      const purchaseOrder = PurchaseOrder.create(
        UuidMother.random(),
        orderNumber,
        UuidMother.random(),
        UuidMother.random(),
        'PEN',
        null,
        null,
        items
      )

      await repository.save(purchaseOrder)

      const found = await repository.findByOrderNumber(orderNumber)

      expect(found).toBeDefined()
      expect(found!.toPrimitives().orderNumber).toBe(orderNumber)
    })
  })

  describe('findByStatus', () => {
    it('should find all purchase orders with specific status', async () => {
      const items1 = PurchaseOrderItemMother.createPrimitives(1)
      const items2 = PurchaseOrderItemMother.createPrimitives(1)

      const po1 = PurchaseOrder.create(
        UuidMother.random(),
        PurchaseOrderNumberMother.random(),
        UuidMother.random(),
        UuidMother.random(),
        'PEN',
        null,
        null,
        items1
      )

      const po2 = PurchaseOrder.create(
        UuidMother.random(),
        PurchaseOrderNumberMother.random(),
        UuidMother.random(),
        UuidMother.random(),
        'PEN',
        null,
        null,
        items2
      )

      await repository.save(po1)
      await repository.save(po2)

      const found = await repository.findByStatus(PurchaseOrderStatus.DRAFT)

      expect(found.length).toBeGreaterThanOrEqual(2)
      found.forEach(po => {
        expect(po.toPrimitives().status).toBe(PurchaseOrderStatus.DRAFT)
      })
    })
  })

  describe('getNextSequenceNumber', () => {
    it('should return next sequence number', async () => {
      const sequenceNumber = await repository.getNextSequenceNumber()

      expect(sequenceNumber).toBeGreaterThan(0)
    })
  })
})
