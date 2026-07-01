import { OnProductRecipeSavedUpdateStrategy } from '@contexts/menu/product/application/on-product-recipe-saved/on-product-recipe-saved-update-strategy'
import { ProductRepository } from '@contexts/menu/product/domain/repositories/product.repository'
import { Product } from '@contexts/menu/product/domain/product'
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

describe('OnProductRecipeSavedUpdateStrategy', () => {
  let useCase: OnProductRecipeSavedUpdateStrategy
  let repository: jest.Mocked<ProductRepository>

  beforeEach(() => {
    repository = { search: jest.fn(), save: jest.fn() } as any
    useCase = new OnProductRecipeSavedUpdateStrategy(repository)
  })

  it('should mark a NONE product as RECIPE when a recipe is saved for it', async () => {
    const product = makeProduct('NONE')
    repository.search.mockResolvedValue(product)

    await useCase.run(product.id.value)

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0] as Product
    expect(saved.getInventoryStrategyType()).toBe('RECIPE')
  })

  it('should mark a DIRECT product as RECIPE when a recipe is saved for it', async () => {
    const product = makeProduct('DIRECT')
    repository.search.mockResolvedValue(product)

    await useCase.run(product.id.value)

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0] as Product
    expect(saved.getInventoryStrategyType()).toBe('RECIPE')
  })

  it('should skip save when product is already RECIPE', async () => {
    const product = makeProduct('RECIPE')
    repository.search.mockResolvedValue(product)

    await useCase.run(product.id.value)

    expect(repository.save).not.toHaveBeenCalled()
  })

  it('should do nothing when product does not exist', async () => {
    repository.search.mockResolvedValue(null)

    await useCase.run(UuidMother.random())

    expect(repository.save).not.toHaveBeenCalled()
  })
})
