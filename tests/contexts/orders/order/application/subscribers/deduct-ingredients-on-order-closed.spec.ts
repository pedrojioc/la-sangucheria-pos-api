import { DeductIngredientsOnOrderClosed } from '@contexts/orders/order/application/subscribers/deduct-ingredients-on-order-closed'
import { ProductRepository } from '@contexts/menu/product/domain/repositories/product.repository'
import { ProductRecipeRepository } from '@contexts/menu/product-recipe/domain/repositories/product-recipe.repository'
import { DeductIngredient } from '@contexts/inventory/stock-level/application/deduct/deduct-ingredient'
import { Product } from '@contexts/menu/product/domain/product'
import { ProductRecipe } from '@contexts/menu/product-recipe/domain/product-recipe'
import { ProductRecipeItem } from '@contexts/menu/product-recipe/domain/product-recipe-item'
import {
  OrderClosedEvent,
  OrderClosedItemPayload
} from '@contexts/orders/order/domain/events/order-closed.event'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('DeductIngredientsOnOrderClosed', () => {
  let subscriber: DeductIngredientsOnOrderClosed
  let productRepository: jest.Mocked<ProductRepository>
  let productRecipeRepository: jest.Mocked<ProductRecipeRepository>
  let deductIngredient: jest.Mocked<DeductIngredient>

  beforeEach(() => {
    productRepository = {
      save: jest.fn(),
      search: jest.fn(),
      findBySku: jest.fn(),
      matching: jest.fn(),
      delete: jest.fn(),
      getLastSkuNumber: jest.fn()
    } as any

    productRecipeRepository = {
      save: jest.fn(),
      findByProductId: jest.fn()
    } as any

    deductIngredient = {
      run: jest.fn()
    } as any

    subscriber = new DeductIngredientsOnOrderClosed(
      productRepository,
      productRecipeRepository,
      deductIngredient
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
    const product = Product.create(
      productId,
      'Bottled Water',
      UuidMother.random(),
      2,
      'SKU-1',
      'DIRECT',
      null,
      ingredientId
    )
    productRepository.search.mockResolvedValue(product)

    const item = buildItem({ productId, quantity: 3 })
    const event = buildEvent([item])

    await subscriber.on(event)

    expect(deductIngredient.run).toHaveBeenCalledTimes(1)
    expect(deductIngredient.run).toHaveBeenCalledWith(
      ingredientId,
      3,
      'unit',
      expect.any(String),
      event.toPrimitives().orderId,
      null
    )
    expect(productRecipeRepository.findByProductId).not.toHaveBeenCalled()
  })

  it('should deduct every scaled recipe ingredient for a RECIPE-strategy product', async () => {
    const productId = UuidMother.random()
    const product = Product.create(productId, 'Sanguche', UuidMother.random(), 8, 'SKU-2', 'RECIPE')
    productRepository.search.mockResolvedValue(product)

    const bread = UuidMother.random()
    const meat = UuidMother.random()
    const recipe = ProductRecipe.create(UuidMother.random(), productId, [
      ProductRecipeItem.create(bread, 2, 'unit'),
      ProductRecipeItem.create(meat, 150, 'g')
    ])
    productRecipeRepository.findByProductId.mockResolvedValue(recipe)

    const item = buildItem({ productId, quantity: 3 })
    const event = buildEvent([item])

    await subscriber.on(event)

    expect(deductIngredient.run).toHaveBeenCalledTimes(2)
    expect(deductIngredient.run).toHaveBeenCalledWith(
      bread,
      6,
      'unit',
      expect.any(String),
      event.toPrimitives().orderId,
      null
    )
    expect(deductIngredient.run).toHaveBeenCalledWith(
      meat,
      450,
      'g',
      expect.any(String),
      event.toPrimitives().orderId,
      null
    )
  })

  it('should skip deduction for a NONE-strategy product', async () => {
    const productId = UuidMother.random()
    const product = Product.create(
      productId,
      'Merch T-Shirt',
      UuidMother.random(),
      15,
      'SKU-3',
      'NONE'
    )
    productRepository.search.mockResolvedValue(product)

    const item = buildItem({ productId })
    const event = buildEvent([item])

    await subscriber.on(event)

    expect(deductIngredient.run).not.toHaveBeenCalled()
    expect(productRecipeRepository.findByProductId).not.toHaveBeenCalled()
  })

  it('should skip items whose product no longer exists', async () => {
    const productId = UuidMother.random()
    productRepository.search.mockResolvedValue(null)

    const item = buildItem({ productId })
    const event = buildEvent([item])

    await subscriber.on(event)

    expect(deductIngredient.run).not.toHaveBeenCalled()
  })

  it('should process multiple order items independently', async () => {
    const directProductId = UuidMother.random()
    const directIngredientId = UuidMother.random()
    const directProduct = Product.create(
      directProductId,
      'Soda',
      UuidMother.random(),
      3,
      'SKU-4',
      'DIRECT',
      null,
      directIngredientId
    )

    const noneProductId = UuidMother.random()
    const noneProduct = Product.create(
      noneProductId,
      'Sticker',
      UuidMother.random(),
      1,
      'SKU-5',
      'NONE'
    )

    productRepository.search.mockImplementation(id => {
      if (id.value === directProductId) return Promise.resolve(directProduct)
      if (id.value === noneProductId) return Promise.resolve(noneProduct)
      return Promise.resolve(null)
    })

    const event = buildEvent([
      buildItem({ productId: directProductId, quantity: 1 }),
      buildItem({ productId: noneProductId, quantity: 1 })
    ])

    await subscriber.on(event)

    expect(deductIngredient.run).toHaveBeenCalledTimes(1)
    expect(deductIngredient.run).toHaveBeenCalledWith(
      directIngredientId,
      1,
      'unit',
      expect.any(String),
      event.toPrimitives().orderId,
      null
    )
  })

  it('should propagate a deduction failure so the caller can roll back the transaction', async () => {
    const productId = UuidMother.random()
    const ingredientId = UuidMother.random()
    const product = Product.create(
      productId,
      'Bottled Water',
      UuidMother.random(),
      2,
      'SKU-6',
      'DIRECT',
      null,
      ingredientId
    )
    productRepository.search.mockResolvedValue(product)
    deductIngredient.run.mockRejectedValue(new Error('No stock available'))

    const event = buildEvent([buildItem({ productId })])

    await expect(subscriber.on(event)).rejects.toThrow('No stock available')
  })
})
