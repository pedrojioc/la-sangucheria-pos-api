import { UpdateProduct } from '@contexts/menu/product/application/update/update-product'
import { ProductRepository } from '@contexts/menu/product/domain/repositories/product.repository'
import { Product } from '@contexts/menu/product/domain/product'
import { FindProductCategory } from '@contexts/menu/product-category/application/find/find-product-category'
import { IngredientExistencePort } from '@contexts/menu/product/application/ports/ingredient-existence.port'
import { FileStorageRepository } from '@shared/domain/file-storage/repositories/file-storage.repository'
import { EventBus } from '@shared/domain/events'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

function makeProduct(inventoryStrategyType: 'NONE' | 'RECIPE' | 'DIRECT'): Product {
  return Product.fromPrimitives({
    id: UuidMother.random(),
    name: 'Sandwich de lomo',
    description: null,
    categoryId: UuidMother.random(),
    ingredientId: inventoryStrategyType === 'DIRECT' ? UuidMother.random() : null,
    inventoryStrategyType,
    price: 12000,
    imageUrl: null,
    imageStorageKey: null,
    preparationTime: null,
    isActive: true,
    displayOrder: 0,
    sku: 'SND-001',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date()
  })
}

describe('UpdateProduct', () => {
  let useCase: UpdateProduct
  let productRepository: jest.Mocked<ProductRepository>
  let findProductCategory: jest.Mocked<FindProductCategory>
  let ingredientExistence: jest.Mocked<IngredientExistencePort>
  let fileStorage: jest.Mocked<FileStorageRepository>
  let eventBus: jest.Mocked<EventBus>

  beforeEach(() => {
    productRepository = {
      save: jest.fn(),
      search: jest.fn(),
      findBySku: jest.fn(),
      matching: jest.fn(),
      delete: jest.fn()
    } as any
    findProductCategory = { run: jest.fn() } as any
    ingredientExistence = { ensureExists: jest.fn() } as any
    fileStorage = { upload: jest.fn(), delete: jest.fn(), getPublicUrl: jest.fn() } as any
    eventBus = { publish: jest.fn(), addSubscribers: jest.fn() } as any

    useCase = new UpdateProduct(
      productRepository,
      findProductCategory,
      ingredientExistence,
      fileStorage,
      eventBus
    )
  })

  function runUseCase(
    product: Product,
    inventoryStrategyType?: 'NONE' | 'RECIPE' | 'DIRECT' | null,
    ingredientId?: string | null
  ) {
    return useCase.run(
      product.id.value,
      'Sandwich de lomo',
      UuidMother.random(),
      12000,
      inventoryStrategyType,
      null,
      ingredientId
    )
  }

  it('calls ensureExists and persists the update when strategy is DIRECT with a valid ingredient', async () => {
    const product = makeProduct('NONE')
    productRepository.search.mockResolvedValue(product)
    const ingredientId = UuidMother.random()

    await runUseCase(product, 'DIRECT', ingredientId)

    expect(ingredientExistence.ensureExists).toHaveBeenCalledWith(ingredientId)
    expect(productRepository.save).toHaveBeenCalledTimes(1)
  })

  it('propagates the failure and does not persist when the ingredient does not exist', async () => {
    const product = makeProduct('NONE')
    productRepository.search.mockResolvedValue(product)
    const ingredientId = UuidMother.random()
    const notFoundError = new Error('IngredientNotExist')
    ingredientExistence.ensureExists.mockRejectedValue(notFoundError)

    await expect(runUseCase(product, 'DIRECT', ingredientId)).rejects.toThrow(notFoundError)

    expect(productRepository.save).not.toHaveBeenCalled()
  })

  it('does not call ensureExists when strategy is not DIRECT', async () => {
    const product = makeProduct('RECIPE')
    productRepository.search.mockResolvedValue(product)

    await runUseCase(product, 'RECIPE', null)

    expect(ingredientExistence.ensureExists).not.toHaveBeenCalled()
    expect(productRepository.save).toHaveBeenCalledTimes(1)
  })

  it('does not call ensureExists when ingredientId is missing', async () => {
    const product = makeProduct('NONE')
    productRepository.search.mockResolvedValue(product)

    await runUseCase(product, 'NONE', null)

    expect(ingredientExistence.ensureExists).not.toHaveBeenCalled()
    expect(productRepository.save).toHaveBeenCalledTimes(1)
  })
})
