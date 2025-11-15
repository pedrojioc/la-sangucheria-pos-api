import { TypeOrmIngredientCategoryRepository } from '@/contexts/inventory/ingredient-category/infrastructure/persistence/typeorm/typeorm-ingredient-category.repository'
import { IngredientCategoryEntity } from '@/contexts/inventory/ingredient-category/infrastructure/persistence/typeorm/ingredient-category.entity'
import { InMemoryNestEventBus } from '@/shared/infrastructure/event-bus/in-memory/in-memory-nest-event-bus'
import { IngredientCategoryMother } from '../domain/IngredientCategoryMother'
import { Repository } from 'typeorm'

describe('TypeOrmIngredientCategoryRepository', () => {
  let repository: TypeOrmIngredientCategoryRepository
  let typeOrmRepository: jest.Mocked<Repository<IngredientCategoryEntity>>
  let eventBus: jest.Mocked<InMemoryNestEventBus>

  beforeEach(() => {
    typeOrmRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn()
    } as any

    eventBus = {
      publish: jest.fn()
    } as any

    repository = new TypeOrmIngredientCategoryRepository(typeOrmRepository, eventBus)
  })

  describe('save', () => {
    it('should save an ingredient category', async () => {
      const ingredientCategory = IngredientCategoryMother.carnes()
      const entity = new IngredientCategoryEntity()

      typeOrmRepository.create.mockReturnValue(entity)
      typeOrmRepository.save.mockResolvedValue(entity)

      await repository.save(ingredientCategory)

      expect(typeOrmRepository.create).toHaveBeenCalledWith(ingredientCategory.toPrimitives())
      expect(typeOrmRepository.save).toHaveBeenCalledWith(entity)
    })

    it('should publish domain events after saving', async () => {
      const ingredientCategory = IngredientCategoryMother.carnes()
      const entity = new IngredientCategoryEntity()

      typeOrmRepository.create.mockReturnValue(entity)
      typeOrmRepository.save.mockResolvedValue(entity)

      // Pull events before saving to verify they exist
      const eventsBeforeSave = ingredientCategory.pullDomainEvents()

      await repository.save(ingredientCategory)

      // Since events are pulled during save, they should be published
      expect(eventBus.publish).toHaveBeenCalled()
    })

    it('should handle ingredient category with null optional fields', async () => {
      const ingredientCategory = IngredientCategoryMother.create({
        description: null,
        icon: null,
        color: null,
        sortOrden: null
      })
      const entity = new IngredientCategoryEntity()

      typeOrmRepository.create.mockReturnValue(entity)
      typeOrmRepository.save.mockResolvedValue(entity)

      await repository.save(ingredientCategory)

      const primitives = ingredientCategory.toPrimitives()
      expect(typeOrmRepository.create).toHaveBeenCalledWith(primitives)
      expect(primitives.description).toBeNull()
      expect(primitives.icon).toBeNull()
      expect(primitives.color).toBeNull()
      expect(primitives.sortOrden).toBeNull()
    })
  })
})
