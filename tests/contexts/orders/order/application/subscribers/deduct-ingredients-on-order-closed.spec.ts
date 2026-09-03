import { DeductIngredientsOnOrderClosed } from '@contexts/orders/order/application/subscribers/deduct-ingredients-on-order-closed'
import {
  ProductDeductionPlan,
  ProductDeductionPlanPort,
  RecipeDeductionItem
} from '@contexts/orders/order/application/ports/product-deduction-plan.port'
import { IngredientDeductionPort } from '@contexts/orders/order/application/ports/ingredient-deduction.port'
import {
  OrderClosedEvent,
  OrderClosedItemPayload
} from '@contexts/orders/order/domain/events/order-closed.event'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('DeductIngredientsOnOrderClosed', () => {
  let subscriber: DeductIngredientsOnOrderClosed
  let productDeductionPlanPort: jest.Mocked<ProductDeductionPlanPort>
  let ingredientDeductionPort: jest.Mocked<IngredientDeductionPort>

  beforeEach(() => {
    productDeductionPlanPort = {
      findPlan: jest.fn(),
      findRecipeItems: jest.fn()
    } as any

    ingredientDeductionPort = {
      deduct: jest.fn()
    } as any

    subscriber = new DeductIngredientsOnOrderClosed(
      productDeductionPlanPort,
      ingredientDeductionPort
    )
  })

  function buildItem(overrides: Partial<OrderClosedItemPayload> = {}): OrderClosedItemPayload {
    return {
      productId: UuidMother.random(),
      productName: 'Sanguche de la Casa',
      quantity: 2,
      unitPrice: 10,
      lineTotal: 20,
      taxAmount: 0,
      ...overrides
    }
  }

  function buildEvent(items: OrderClosedItemPayload[], orderId?: string): OrderClosedEvent {
    return new OrderClosedEvent({
      orderId: orderId ?? UuidMother.random(),
      orderNumber: 'ORD-1',
      tableId: null,
      customerId: null,
      total: 20,
      tip: null,
      currency: 'USD',
      payments: null,
      splits: null,
      closedBy: null,
      closedAt: new Date(),
      subtotal: 20,
      discountTotal: 0,
      taxBase: 20,
      taxAmount: 0,
      taxConfig: { rate: 0, type: 'NONE', inclusive: false },
      items,
      customerDocumentType: null,
      customerDocumentNumber: null
    })
  }

  it('should subscribe to OrderClosedEvent', () => {
    expect(subscriber.subscribedTo()).toContain(OrderClosedEvent)
  })

  it('should deduct the ingredient directly for a DIRECT-strategy product', async () => {
    const productId = UuidMother.random()
    const ingredientId = UuidMother.random()
    const plan: ProductDeductionPlan = { strategy: 'DIRECT', ingredientId }
    productDeductionPlanPort.findPlan.mockResolvedValue(plan)

    const item = buildItem({ productId, quantity: 3 })
    const event = buildEvent([item])

    await subscriber.on(event)

    expect(ingredientDeductionPort.deduct).toHaveBeenCalledTimes(1)
    expect(ingredientDeductionPort.deduct).toHaveBeenCalledWith(
      ingredientId,
      3,
      'unit',
      expect.any(String),
      event.toPrimitives().orderId
    )
    expect(productDeductionPlanPort.findRecipeItems).not.toHaveBeenCalled()
  })

  it('should deduct every scaled recipe ingredient for a RECIPE-strategy product', async () => {
    const productId = UuidMother.random()
    const plan: ProductDeductionPlan = { strategy: 'RECIPE', ingredientId: null }
    productDeductionPlanPort.findPlan.mockResolvedValue(plan)

    const bread = UuidMother.random()
    const meat = UuidMother.random()
    const items: RecipeDeductionItem[] = [
      { ingredientId: bread, quantity: 2, unitId: 'unit' },
      { ingredientId: meat, quantity: 150, unitId: 'g' }
    ]
    productDeductionPlanPort.findRecipeItems.mockResolvedValue(items)

    const item = buildItem({ productId, quantity: 3 })
    const event = buildEvent([item])

    await subscriber.on(event)

    expect(ingredientDeductionPort.deduct).toHaveBeenCalledTimes(2)
    expect(ingredientDeductionPort.deduct).toHaveBeenCalledWith(
      bread,
      6,
      'unit',
      expect.any(String),
      event.toPrimitives().orderId
    )
    expect(ingredientDeductionPort.deduct).toHaveBeenCalledWith(
      meat,
      450,
      'g',
      expect.any(String),
      event.toPrimitives().orderId
    )
  })

  it('should skip deduction for a NONE-strategy product', async () => {
    const productId = UuidMother.random()
    const plan: ProductDeductionPlan = { strategy: 'NONE', ingredientId: null }
    productDeductionPlanPort.findPlan.mockResolvedValue(plan)

    const item = buildItem({ productId })
    const event = buildEvent([item])

    await subscriber.on(event)

    expect(ingredientDeductionPort.deduct).not.toHaveBeenCalled()
    expect(productDeductionPlanPort.findRecipeItems).not.toHaveBeenCalled()
  })

  it('should skip items whose product no longer exists', async () => {
    const productId = UuidMother.random()
    productDeductionPlanPort.findPlan.mockResolvedValue(null)

    const item = buildItem({ productId })
    const event = buildEvent([item])

    await subscriber.on(event)

    expect(ingredientDeductionPort.deduct).not.toHaveBeenCalled()
  })

  it('should skip deduction when a RECIPE-strategy product has no recipe', async () => {
    const productId = UuidMother.random()
    const plan: ProductDeductionPlan = { strategy: 'RECIPE', ingredientId: null }
    productDeductionPlanPort.findPlan.mockResolvedValue(plan)
    productDeductionPlanPort.findRecipeItems.mockResolvedValue(null)

    const item = buildItem({ productId })
    const event = buildEvent([item])

    await expect(subscriber.on(event)).resolves.toBeUndefined()

    expect(ingredientDeductionPort.deduct).not.toHaveBeenCalled()
  })

  it('should process multiple order items independently', async () => {
    const directProductId = UuidMother.random()
    const directIngredientId = UuidMother.random()
    const directPlan: ProductDeductionPlan = {
      strategy: 'DIRECT',
      ingredientId: directIngredientId
    }

    const noneProductId = UuidMother.random()
    const nonePlan: ProductDeductionPlan = { strategy: 'NONE', ingredientId: null }

    productDeductionPlanPort.findPlan.mockImplementation(productId => {
      if (productId === directProductId) return Promise.resolve(directPlan)
      if (productId === noneProductId) return Promise.resolve(nonePlan)
      return Promise.resolve(null)
    })

    const event = buildEvent([
      buildItem({ productId: directProductId, quantity: 1 }),
      buildItem({ productId: noneProductId, quantity: 1 })
    ])

    await subscriber.on(event)

    expect(ingredientDeductionPort.deduct).toHaveBeenCalledTimes(1)
    expect(ingredientDeductionPort.deduct).toHaveBeenCalledWith(
      directIngredientId,
      1,
      'unit',
      expect.any(String),
      event.toPrimitives().orderId
    )
  })

  it('should propagate a deduction failure so the caller can roll back the transaction', async () => {
    const productId = UuidMother.random()
    const ingredientId = UuidMother.random()
    const plan: ProductDeductionPlan = { strategy: 'DIRECT', ingredientId }
    productDeductionPlanPort.findPlan.mockResolvedValue(plan)
    ingredientDeductionPort.deduct.mockRejectedValue(new Error('No stock available'))

    const event = buildEvent([buildItem({ productId })])

    await expect(subscriber.on(event)).rejects.toThrow('No stock available')
  })
})
