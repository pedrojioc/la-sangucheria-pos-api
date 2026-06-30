import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProductEntity } from '@contexts/menu/product/infrastructure/persistence/typeorm/product.entity'
import { ProductOptionGroupEntity } from '../persistence/typeorm/product-option-group.entity'
import { ProductRecipeEntity } from '@contexts/menu/product-recipe/infrastructure/persistence/typeorm/product-recipe.entity'

export interface OptionItemReadModel {
  id: string
  groupId: string
  label: string
  ingredientId: string
  quantity: number
  unitId: string
  extraPrice: number
  sortOrder: number
  isActive: boolean
}

export interface OptionGroupReadModel {
  id: string
  name: string
  type: 'SWAP' | 'ADD'
  required: boolean
  minSelections: number
  maxSelections: number
  isActive: boolean
  items: OptionItemReadModel[]
}

export interface ProductRecipeItemReadModel {
  ingredientId: string
  ingredientName: string
  quantity: number
  unitId: string
  unitName: string
  unitSymbol: string
  sortOrder: number
}

export interface ProductRecipeReadModel {
  id: string
  productId: string
  items: ProductRecipeItemReadModel[]
  createdAt: Date
  updatedAt: Date
}

export interface ProductWithOptionsReadModel {
  id: string
  name: string
  description: string | null
  categoryId: string
  ingredientId: string | null
  inventoryStrategyType: 'RECIPE' | 'DIRECT' | 'NONE'
  price: number
  imageUrl: string | null
  preparationTime: number | null
  isActive: boolean
  displayOrder: number
  sku: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  optionGroups: OptionGroupReadModel[]
  recipe: ProductRecipeReadModel | null
}

@Injectable()
export class TypeOrmProductWithOptionsQueryService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductOptionGroupEntity)
    private readonly pivotRepository: Repository<ProductOptionGroupEntity>,
    @InjectRepository(ProductRecipeEntity)
    private readonly productRecipeRepository: Repository<ProductRecipeEntity>
  ) {}

  async findById(productId: string): Promise<ProductWithOptionsReadModel | null> {
    const product = await this.productRepository.findOne({ where: { id: productId } })

    if (!product) return null

    const [pivotRows, recipeEntity] = await Promise.all([
      this.pivotRepository.find({
        where: { productId },
        relations: ['optionGroup', 'optionGroup.items'],
        order: { sortOrder: 'ASC' }
      }),
      this.productRecipeRepository.findOne({
        where: { productId },
        relations: ['items', 'items.ingredient', 'items.unit']
      })
    ])

    const optionGroups: OptionGroupReadModel[] = pivotRows.map(row => {
      const group = row.optionGroup
      const items = (group.items ?? [])
        .sort((a: OptionItemReadModel, b: OptionItemReadModel) => a.sortOrder - b.sortOrder)
        .map((item: OptionItemReadModel) => ({
          id: item.id,
          groupId: item.groupId,
          label: item.label,
          ingredientId: item.ingredientId,
          quantity: Number(item.quantity),
          unitId: item.unitId,
          extraPrice: Number(item.extraPrice),
          sortOrder: item.sortOrder,
          isActive: item.isActive
        }))

      return {
        id: group.id,
        name: group.name,
        type: group.type,
        required: group.required,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        isActive: group.isActive,
        items
      }
    })

    const recipe: ProductRecipeReadModel | null = recipeEntity
      ? {
          id: recipeEntity.id,
          productId: recipeEntity.productId,
          items: (recipeEntity.items ?? [])
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(item => ({
              ingredientId: item.ingredientId,
              ingredientName: item.ingredient.name,
              quantity: Number(item.quantity),
              unitId: item.unitId,
              unitName: item.unit.name,
              unitSymbol: item.unit.symbol,
              sortOrder: item.sortOrder
            })),
          createdAt: recipeEntity.createdAt,
          updatedAt: recipeEntity.updatedAt
        }
      : null

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      ingredientId: product.ingredientId,
      inventoryStrategyType: product.inventoryStrategyType,
      price: Number(product.price),
      imageUrl: product.imageUrl,
      preparationTime: product.preparationTime,
      isActive: product.isActive,
      displayOrder: product.displayOrder,
      sku: product.sku,
      tags: product.tags,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      optionGroups,
      recipe
    }
  }
}
