import {
  ProductWithOptionsReadModel,
  ProductRecipeReadModel
} from '../../infrastructure/query-services/typeorm-product-with-options-query.service'
import { OptionGroupResponse } from './option-group.response'
import { OptionItemResponse } from './option-item.response'

export class ProductRecipeItemResponse {
  constructor(
    public readonly ingredientId: string,
    public readonly ingredientName: string,
    public readonly quantity: number,
    public readonly unitId: string,
    public readonly unitName: string,
    public readonly unitSymbol: string,
    public readonly sortOrder: number
  ) {}
}

export class ProductRecipeResponse {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly items: ProductRecipeItemResponse[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromReadModel(model: ProductRecipeReadModel): ProductRecipeResponse {
    return new ProductRecipeResponse(
      model.id,
      model.productId,
      model.items.map(
        i =>
          new ProductRecipeItemResponse(
            i.ingredientId,
            i.ingredientName,
            i.quantity,
            i.unitId,
            i.unitName,
            i.unitSymbol,
            i.sortOrder
          )
      ),
      model.createdAt,
      model.updatedAt
    )
  }
}

export class ProductWithOptionsResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly categoryId: string,
    public readonly ingredientId: string | null,
    public readonly inventoryStrategyType: 'RECIPE' | 'DIRECT' | 'NONE',
    public readonly price: number,
    public readonly imageUrl: string | null,
    public readonly preparationTime: number | null,
    public readonly isActive: boolean,
    public readonly displayOrder: number,
    public readonly sku: string,
    public readonly tags: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly optionGroups: OptionGroupResponse[],
    public readonly recipe: ProductRecipeResponse | null
  ) {}

  static fromReadModel(model: ProductWithOptionsReadModel): ProductWithOptionsResponse {
    const optionGroups = model.optionGroups.map(
      group =>
        new OptionGroupResponse(
          group.id,
          group.name,
          group.type,
          group.required,
          group.minSelections,
          group.maxSelections,
          group.isActive,
          group.items.map(
            item =>
              new OptionItemResponse(
                item.id,
                item.groupId,
                item.label,
                item.ingredientId,
                item.quantity,
                item.unitId,
                item.extraPrice,
                item.sortOrder,
                item.isActive
              )
          )
        )
    )

    return new ProductWithOptionsResponse(
      model.id,
      model.name,
      model.description,
      model.categoryId,
      model.ingredientId,
      model.inventoryStrategyType,
      model.price,
      model.imageUrl,
      model.preparationTime,
      model.isActive,
      model.displayOrder,
      model.sku,
      model.tags,
      model.createdAt,
      model.updatedAt,
      optionGroups,
      model.recipe ? ProductRecipeResponse.fromReadModel(model.recipe) : null
    )
  }
}
