import { CreateIngredientCategory } from '@/contexts/inventory/ingredient-category/application/create/create-ingredient-category'
import { IngredientCategoryRepository } from '@/contexts/inventory/ingredient-category/domain/repositories/ingredient-category.repository'
import { IngredientCategory } from '@/contexts/inventory/ingredient-category/domain/ingredient-category'
import { IngredientCategoryCreatedEvent } from '@/contexts/inventory/ingredient-category/domain/events/ingredient-category-created.event'
import { EventBus } from '@/shared/domain/events'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('CreateIngredientCategory', () => {
  let useCase: CreateIngredientCategory
  let repository: jest.Mocked<IngredientCategoryRepository>
  let eventBus: jest.Mocked<EventBus>

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      search: jest.fn(),
      searchAll: jest.fn()
    } as jest.Mocked<IngredientCategoryRepository>

    eventBus = { publish: jest.fn() } as any

    useCase = new CreateIngredientCategory(repository, eventBus)
  })

  it('should create an ingredient category with all fields', async () => {
    const id = UuidMother.random()

    await useCase.run(id, 'Carnes', 'Ingredientes cárnicos', 'meat', '#FF5733', 1, true)

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0] as IngredientCategory
    const p = saved.toPrimitives()
    expect(p.id).toBe(id)
    expect(p.name).toBe('Carnes')
    expect(p.description).toBe('Ingredientes cárnicos')
    expect(p.icon).toBe('meat')
    expect(p.color).toBe('#FF5733')
    expect(p.sortOrder).toBe(1)
    expect(p.isActive).toBe(true)
  })

  it('should create an ingredient category with null optional fields', async () => {
    const id = UuidMother.random()

    await useCase.run(id, 'Vegetales', null, null, null, null, true)

    const saved = repository.save.mock.calls[0][0] as IngredientCategory
    const p = saved.toPrimitives()
    expect(p.description).toBeNull()
    expect(p.icon).toBeNull()
    expect(p.color).toBeNull()
    expect(p.sortOrder).toBeNull()
  })

  it('should publish IngredientCategoryCreatedEvent', async () => {
    await useCase.run(UuidMother.random(), 'Lácteos', null, null, null, null, true)

    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const events = eventBus.publish.mock.calls[0][0]
    expect(events).toHaveLength(1)
    expect(events[0]).toBeInstanceOf(IngredientCategoryCreatedEvent)
  })
})
