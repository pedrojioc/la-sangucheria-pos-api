import { CreateIngredientCategoryCommandHandler } from '@/contexts/inventory/ingredient-category/application/create/create-ingredient-category.handler'
import { CreateIngredientCategoryCommand } from '@/contexts/inventory/ingredient-category/application/create/create-ingredient-category.command'
import { CreateIngredientCategory } from '@/contexts/inventory/ingredient-category/application/create/create-ingredient-category'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('CreateIngredientCategoryCommandHandler', () => {
  let handler: CreateIngredientCategoryCommandHandler
  let useCase: jest.Mocked<CreateIngredientCategory>

  beforeEach(() => {
    useCase = {
      run: jest.fn()
    } as any

    handler = new CreateIngredientCategoryCommandHandler(useCase)
  })

  it('should execute use case with command data', async () => {
    const command = new CreateIngredientCategoryCommand(
      UuidMother.random(),
      'Carnes',
      'Ingredientes cárnicos',
      'meat',
      '#FF5733',
      1,
      true
    )

    await handler.execute(command)

    expect(useCase.run).toHaveBeenCalledWith(
      command.id,
      command.name,
      command.description,
      command.icon,
      command.color,
      command.sortOrden,
      command.isActive
    )
  })

  it('should handle command with null optional fields', async () => {
    const command = new CreateIngredientCategoryCommand(
      UuidMother.random(),
      'Vegetales',
      null,
      null,
      null,
      null,
      true
    )

    await handler.execute(command)

    expect(useCase.run).toHaveBeenCalledWith(
      command.id,
      command.name,
      null,
      null,
      null,
      null,
      true
    )
  })
})
