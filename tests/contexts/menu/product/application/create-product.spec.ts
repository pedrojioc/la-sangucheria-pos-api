import { CreateProduct } from '@contexts/menu/product/application/create/create-product'
import { ProductRepository } from '@contexts/menu/product/domain/repositories/product.repository'
import { FindProductCategory } from '@contexts/menu/product-category/application/find/find-product-category'
import { IngredientExistencePort } from '@contexts/menu/product/application/ports/ingredient-existence.port'
import { FileStorageRepository } from '@shared/domain/file-storage/repositories/file-storage.repository'
import { EventBus } from '@shared/domain/events'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('CreateProduct', () => {
  let useCase: CreateProduct
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

    useCase = new CreateProduct(
      productRepository,
      findProductCategory,
      ingredientExistence,
      fileStorage,
      eventBus
    )

    productRepository.findBySku.mockResolvedValue(null)
  })

  function runUseCase(
    inventoryStrategyType?: 'NONE' | 'RECIPE' | 'DIRECT' | null,
    ingredientId?: string | null
  ) {
    return useCase.run(
      UuidMother.random(),
      'Sandwich de lomo',
      UuidMother.random(),
      12000,
      'SND-001',
      inventoryStrategyType,
      null,
      ingredientId
    )
  }

  it('calls ensureExists and persists the product when strategy is DIRECT with a valid ingredient', async () => {
    const ingredientId = UuidMother.random()

    await runUseCase('DIRECT', ingredientId)

    expect(ingredientExistence.ensureExists).toHaveBeenCalledWith(ingredientId)
    expect(productRepository.save).toHaveBeenCalledTimes(1)
  })

  it('propagates the failure and does not persist when the ingredient does not exist', async () => {
    const ingredientId = UuidMother.random()
    const notFoundError = new Error('IngredientNotExist')
    ingredientExistence.ensureExists.mockRejectedValue(notFoundError)

    await expect(runUseCase('DIRECT', ingredientId)).rejects.toThrow(notFoundError)

    expect(productRepository.save).not.toHaveBeenCalled()
  })

  it('does not call ensureExists when strategy is not DIRECT', async () => {
    await runUseCase('RECIPE', null)

    expect(ingredientExistence.ensureExists).not.toHaveBeenCalled()
    expect(productRepository.save).toHaveBeenCalledTimes(1)
  })

  it('does not call ensureExists when ingredientId is missing', async () => {
    await runUseCase('NONE', null)

    expect(ingredientExistence.ensureExists).not.toHaveBeenCalled()
    expect(productRepository.save).toHaveBeenCalledTimes(1)
  })
})
