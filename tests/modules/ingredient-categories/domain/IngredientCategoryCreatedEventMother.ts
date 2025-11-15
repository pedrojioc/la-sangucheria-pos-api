import { IngredientCategoryCreatedEvent } from '@contexts/inventory/ingredient-category/domain/events/ingredient-category-created.event'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { StringMother } from '@test/shared/__mothers__/StringMother'

export class IngredientCategoryCreatedEventMother {
  static create(params?: {
    id?: string
    name?: string
    metadata?: any
    eventId?: string
    occurredOn?: Date
  }): IngredientCategoryCreatedEvent {
    return new IngredientCategoryCreatedEvent(
      {
        id: params?.id ?? UuidMother.random(),
        name: params?.name ?? StringMother.random()
      },
      params?.metadata,
      params?.eventId,
      params?.occurredOn
    )
  }

  static random(): IngredientCategoryCreatedEvent {
    return this.create()
  }

  static withAggregateId(id: string): IngredientCategoryCreatedEvent {
    return this.create({ id })
  }

  static withName(name: string): IngredientCategoryCreatedEvent {
    return this.create({ name })
  }
}
