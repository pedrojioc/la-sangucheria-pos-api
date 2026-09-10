import { ReserveIngredientsOnOrderSentToKitchen } from '@contexts/orders/order/application/subscribers/reserve-ingredients-on-order-sent-to-kitchen'
import {
  ProductDeductionPlan,
  ProductDeductionPlanPort,
  RecipeDeductionItem
} from '@contexts/orders/order/application/ports/product-deduction-plan.port'
import {
  StockReservationLine,
  StockReservationPort
} from '@contexts/orders/order/application/ports/stock-reservation.port'
import {
  OrderSentToKitchenEvent,
  OrderSentToKitchenPayload,
  SentToKitchenItem
} from '@contexts/orders/order/domain/events/order-sent-to-kitchen.event'
import { OrderType } from '@contexts/orders/order/domain/order-type'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

const DIRECT_DEDUCTION_UNIT_ID = 'unit'

describe('ReserveIngredientsOnOrderSentToKitchen', () => {
  let subscriber: ReserveIngredientsOnOrderSentToKitchen
  let productDeductionPlanPort: jest.Mocked<ProductDeductionPlanPort>
  let stockReservationPort: jest.Mocked<StockReservationPort>

  beforeEach(() => {
    productDeductionPlanPort = {
      findPlan: jest.fn(),
      findRecipeItems: jest.fn()
    } as any

    stockReservationPort = {
      reserve: jest.fn(),
      releaseForItem: jest.fn(),
      releaseForOrder: jest.fn(),
      consume: jest.fn()
    } as any

    subscriber = new ReserveIngredientsOnOrderSentToKitchen(
      productDeductionPlanPort,
      stockReservationPort
    )
  })

  function buildItem(overrides: Partial<SentToKitchenItem> = {}): SentToKitchenItem {
    return {
      itemId: UuidMother.random(),
      productId: UuidMother.random(),
      stationId: null,
      productName: 'Sanguche de la Casa',
      quantity: 2,
      notes: null,
      modifiers: [],
      ...overrides
    }
  }

  function buildEvent(items: SentToKitchenItem[], orderId?: string): OrderSentToKitchenEvent {
    const payload: OrderSentToKitchenPayload = {
      orderId: orderId ?? UuidMother.random(),
      orderNumber: '#001',
      ticketId: UuidMother.random(),
      ticketNumber: 1,
      items,
      sentBy: 'waiter-1',
      sentAt: new Date(),
      tableId: null,
      tableLabel: null,
      orderType: OrderType.DINE_IN
    }
    return new OrderSentToKitchenEvent(payload)
  }

  it('should subscribe to OrderSentToKitchenEvent', () => {
    expect(subscriber.subscribedTo()).toContain(OrderSentToKitchenEvent)
  })

  it('should reserve the direct ingredient for a DIRECT-strategy item', async () => {
    const productId = UuidMother.random()
    const ingredientId = UuidMother.random()
    const plan: ProductDeductionPlan = { strategy: 'DIRECT', ingredientId }
    productDeductionPlanPort.findPlan.mockResolvedValue(plan)

    const item = buildItem({ productId, quantity: 3 })
    const event = buildEvent([item])
    const orderId = event.toPrimitives().orderId

    await subscriber.on(event)

    expect(stockReservationPort.reserve).toHaveBeenCalledTimes(1)
    const lines = stockReservationPort.reserve.mock.calls[0][1] as StockReservationLine[]
    expect(stockReservationPort.reserve.mock.calls[0][0]).toBe(orderId)
    expect(lines).toEqual([
      {
        itemId: item.itemId,
        ingredientId,
        quantity: 3,
        unitId: DIRECT_DEDUCTION_UNIT_ID
      }
    ])
    expect(productDeductionPlanPort.findRecipeItems).not.toHaveBeenCalled()
  })

  it('should reserve every scaled recipe ingredient for a RECIPE-strategy item', async () => {
    const productId = UuidMother.random()
    const plan: ProductDeductionPlan = { strategy: 'RECIPE', ingredientId: null }
    productDeductionPlanPort.findPlan.mockResolvedValue(plan)

    const bread = UuidMother.random()
    const meat = UuidMother.random()
    const recipeItems: RecipeDeductionItem[] = [
      { ingredientId: bread, quantity: 2, unitId: 'unit' },
      { ingredientId: meat, quantity: 150, unitId: 'g' }
    ]
    productDeductionPlanPort.findRecipeItems.mockResolvedValue(recipeItems)

    const item = buildItem({ productId, quantity: 3 })
    const event = buildEvent([item])

    await subscriber.on(event)

    const lines = stockReservationPort.reserve.mock.calls[0][1] as StockReservationLine[]
    expect(lines).toEqual([
      { itemId: item.itemId, ingredientId: bread, quantity: 6, unitId: 'unit' },
      { itemId: item.itemId, ingredientId: meat, quantity: 450, unitId: 'g' }
    ])
  })

  it('should produce no reservation line for a NONE-strategy item and not call reserve', async () => {
    const productId = UuidMother.random()
    const plan: ProductDeductionPlan = { strategy: 'NONE', ingredientId: null }
    productDeductionPlanPort.findPlan.mockResolvedValue(plan)

    const item = buildItem({ productId })
    const event = buildEvent([item])

    await subscriber.on(event)

    expect(stockReservationPort.reserve).not.toHaveBeenCalled()
  })

  it('should skip items whose product no longer exists', async () => {
    const productId = UuidMother.random()
    productDeductionPlanPort.findPlan.mockResolvedValue(null)

    const item = buildItem({ productId })
    const event = buildEvent([item])

    await subscriber.on(event)

    expect(stockReservationPort.reserve).not.toHaveBeenCalled()
  })

  it('should aggregate lines across multiple items into a single reserve call', async () => {
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

    const directItem = buildItem({ productId: directProductId, quantity: 1 })
    const noneItem = buildItem({ productId: noneProductId, quantity: 1 })
    const event = buildEvent([directItem, noneItem])

    await subscriber.on(event)

    expect(stockReservationPort.reserve).toHaveBeenCalledTimes(1)
    const lines = stockReservationPort.reserve.mock.calls[0][1] as StockReservationLine[]
    expect(lines).toEqual([
      {
        itemId: directItem.itemId,
        ingredientId: directIngredientId,
        quantity: 1,
        unitId: DIRECT_DEDUCTION_UNIT_ID
      }
    ])
  })

  it('should not call reserve at all when every item resolves to zero reservation lines', async () => {
    const productId = UuidMother.random()
    productDeductionPlanPort.findPlan.mockResolvedValue(null)

    const event = buildEvent([buildItem({ productId })])

    await subscriber.on(event)

    expect(stockReservationPort.reserve).not.toHaveBeenCalled()
  })

  it('should propagate InsufficientStockForReservation so the caller can roll back the transaction', async () => {
    const productId = UuidMother.random()
    const ingredientId = UuidMother.random()
    const plan: ProductDeductionPlan = { strategy: 'DIRECT', ingredientId }
    productDeductionPlanPort.findPlan.mockResolvedValue(plan)
    stockReservationPort.reserve.mockRejectedValue(new Error('Insufficient stock'))

    const event = buildEvent([buildItem({ productId })])

    await expect(subscriber.on(event)).rejects.toThrow('Insufficient stock')
  })
})
