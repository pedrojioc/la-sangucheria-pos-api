import { CreateIngredientCategory } from '@contexts/inventory/ingredient-category/application/create/create-ingredient-category'
import { IngredientCategoryRepository } from '@contexts/inventory/ingredient-category/domain/repositories/ingredient-category.repository'
import { IngredientCategory } from '@contexts/inventory/ingredient-category/domain/ingredient-category'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { StringMother } from '@test/shared/__mothers__/StringMother'

describe('CreateIngredientCategory', () => {
  let useCase: CreateIngredientCategory
  let repository: jest.Mocked<IngredientCategoryRepository>

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      search: jest.fn(),
      searchAll: jest.fn()
    } as jest.Mocked<IngredientCategoryRepository>

    useCase = new CreateIngredientCategory(repository)
  })

  it('should create a new ingredient category', async () => {
    const id = UuidMother.random()
    const name = 'Carnes'
    const description = 'Ingredientes cárnicos'
    const icon = 'meat'
    const color = '#FF5733'
    const sortOrder = 1
    const isActive = true

    await useCase.run(id, name, description, icon, color, sortOrder, isActive)

    expect(repository.save).toHaveBeenCalledTimes(1)
    const savedCategory = repository.save.mock.calls[0][0]
    expect(savedCategory).toBeInstanceOf(IngredientCategory)
    expect(savedCategory.toPrimitives()).toMatchObject({
      id,
      name,
      description,
      icon,
      color,
      sortOrder,
      isActive
    })
  })

  it('should create ingredient category with null optional fields', async () => {
    const id = UuidMother.random()
    const name = 'Vegetales'

    await useCase.run(id, name, null, null, null, null, true)

    expect(repository.save).toHaveBeenCalledTimes(1)
    const savedCategory = repository.save.mock.calls[0][0]
    const primitives = savedCategory.toPrimitives()
    expect(primitives.description).toBeNull()
    expect(primitives.icon).toBeNull()
    expect(primitives.color).toBeNull()
    expect(primitives.sortOrder).toBeNull()
  })

  it('should call repository save method', async () => {
    const id = UuidMother.random()
    const name = StringMother.word()

    await useCase.run(id, name, null, null, null, null, true)

    expect(repository.save).toHaveBeenCalled()
  })
})
