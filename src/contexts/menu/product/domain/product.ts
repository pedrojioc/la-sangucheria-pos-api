import { AggregateRoot } from '@/shared/domain/aggregate-root'
import { ProductId } from './product-id'
import { ProductName } from './product-name'
import { ProductDescription } from './product-description'
import { ProductCategoryId } from './product-category-id'
import { RecipeId } from '../../../kitchen/recipe/domain/recipe-id'
import { ProductPrice } from './product-price'
import { ProductImageUrl } from './product-image-url'
import { ProductImageStorageKey } from './product-image-storage-key'
import { PreparationTime } from './preparation-time'
import { ProductIsActive } from './product-is-active'
import { ProductDisplayOrder } from './product-display-order'
import { ProductSku } from './product-sku'
import { ProductTags } from './product-tags'
import { ProductCreatedEvent } from './events/product-created.event'
import { ProductUpdatedEvent } from './events/product-updated.event'
import {
  ProductPriceChangedEvent,
  ProductPriceChangedPayload
} from './events/product-price-changed.event'
import { DomainEventMetadata } from '@/shared/domain/events'

export interface ProductPrimitives {
  id: string
  name: string
  description: string | null
  categoryId: string
  recipeId: string | null
  price: number
  imageUrl: string | null
  imageStorageKey: string | null
  preparationTime: number | null
  isActive: boolean
  displayOrder: number
  sku: string
  tags: string[]
  inventoryStrategyType: 'RECIPE' | 'DIRECT' | null
  createdAt: Date
  updatedAt: Date
}

export class Product extends AggregateRoot {
  private constructor(
    public readonly id: ProductId,
    private name: ProductName,
    private description: ProductDescription | null,
    private categoryId: ProductCategoryId,
    private recipeId: RecipeId | null,
    private price: ProductPrice,
    private imageUrl: ProductImageUrl | null,
    private imageStorageKey: ProductImageStorageKey | null,
    private preparationTime: PreparationTime | null,
    private isActive: ProductIsActive,
    private displayOrder: ProductDisplayOrder,
    public readonly sku: ProductSku,
    private tags: ProductTags,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {
    super()
  }

  static create(
    id: string,
    name: string,
    categoryId: string,
    price: number,
    sku: string,
    description?: string | null,
    recipeId?: string | null,
    imageUrl?: string | null,
    imageStorageKey?: string | null,
    preparationTime?: number | null,
    displayOrder?: number,
    tags?: string[],
    inventoryStrategyType?: 'RECIPE' | 'DIRECT' | null
  ): Product {
    const product = Product.fromPrimitives({
      id,
      name,
      categoryId,
      price,
      sku,
      description: description ?? null,
      recipeId: recipeId ?? null,
      imageUrl: imageUrl ?? null,
      imageStorageKey: imageStorageKey ?? null,
      preparationTime: preparationTime ?? null,
      isActive: true,
      displayOrder: displayOrder ?? 0,
      tags: tags ?? [],
      inventoryStrategyType: inventoryStrategyType ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    product.record(
      new ProductCreatedEvent({
        productId: id,
        name,
        categoryId,
        price,
        sku,
        description: description ?? null,
        recipeId: recipeId ?? null,
        image: imageUrl ?? null,
        preparationTime: preparationTime ?? null,
        isActive: true,
        displayOrder: displayOrder ?? 0,
        tags: tags ?? []
      })
    )

    return product
  }

  update(
    name: string,
    categoryId: string,
    price: number,
    description?: string | null,
    recipeId?: string | null,
    imageUrl?: string | null,
    imageStorageKey?: string | null,
    preparationTime?: number | null,
    displayOrder?: number,
    tags?: string[]
  ): void {
    this.name = new ProductName(name)
    this.categoryId = new ProductCategoryId(categoryId)
    this.price = new ProductPrice(price)
    this.description = description ? new ProductDescription(description) : null
    this.recipeId = recipeId ? new RecipeId(recipeId) : null
    this.imageUrl = imageUrl ? new ProductImageUrl(imageUrl) : null
    this.imageStorageKey = imageStorageKey ? new ProductImageStorageKey(imageStorageKey) : null
    this.preparationTime = preparationTime ? new PreparationTime(preparationTime) : null
    this.displayOrder = new ProductDisplayOrder(displayOrder ?? 0)
    this.tags = ProductTags.fromArray(tags ?? [])
    this.updatedAt = new Date()

    this.record(
      new ProductUpdatedEvent({
        productId: this.id.value,
        name,
        categoryId,
        price,
        description: description ?? null,
        recipeId: recipeId ?? null,
        image: imageUrl ?? null,
        preparationTime: preparationTime ?? null,
        isActive: this.isActive.value,
        displayOrder: displayOrder ?? 0,
        tags: tags ?? []
      })
    )
  }

  updatePrice(
    newPrice: number,
    context?: {
      userId?: string
      userName?: string
      correlationId?: string
      reason?: 'promotion' | 'cost_increase' | 'manual' | 'automatic'
    }
  ): void {
    const previousPrice = this.price.value

    // Actualizar precio
    this.price = new ProductPrice(newPrice)
    this.updatedAt = new Date()

    // Calcular porcentaje de cambio
    const priceChangePercentage = ((newPrice - previousPrice) / previousPrice) * 100

    // Crear payload del evento
    const payload: ProductPriceChangedPayload = {
      productId: this.id.value,
      productName: this.name.value,
      previousPrice,
      newPrice,
      priceChangePercentage,
      currency: 'PEN', // Por ahora hardcodeado, puede venir de configuración
      changedAt: new Date(),
      changedBy: context?.userId,
      reason: context?.reason
    }

    // Crear metadata del evento
    const metadata: DomainEventMetadata = {
      userId: context?.userId,
      userName: context?.userName,
      correlationId: context?.correlationId
    }

    // Registrar evento
    this.record(new ProductPriceChangedEvent(payload, metadata))
  }

  addTag(tag: string): void {
    this.tags = this.tags.add(tag)
    this.updatedAt = new Date()
  }

  removeTag(tag: string): void {
    this.tags = this.tags.remove(tag)
    this.updatedAt = new Date()
  }

  activate(): void {
    this.isActive = ProductIsActive.active()
    this.updatedAt = new Date()
  }

  deactivate(): void {
    this.isActive = ProductIsActive.inactive()
    this.updatedAt = new Date()
  }

  updateImage(imageUrl: string, imageStorageKey: string): void {
    this.imageUrl = new ProductImageUrl(imageUrl)
    this.imageStorageKey = new ProductImageStorageKey(imageStorageKey)
    this.updatedAt = new Date()
  }

  removeImage(): void {
    this.imageUrl = null
    this.imageStorageKey = null
    this.updatedAt = new Date()
  }

  getImageUrl(): string | null {
    return this.imageUrl?.value ?? null
  }

  getImageStorageKey(): string | null {
    return this.imageStorageKey?.value ?? null
  }

  hasImage(): boolean {
    return this.imageUrl !== null && this.imageStorageKey !== null
  }

  toPrimitives(): ProductPrimitives {
    return {
      id: this.id.value,
      name: this.name.value,
      description: this.description?.value ?? null,
      categoryId: this.categoryId.value,
      recipeId: this.recipeId?.value ?? null,
      price: this.price.value,
      imageUrl: this.imageUrl?.value ?? null,
      imageStorageKey: this.imageStorageKey?.value ?? null,
      preparationTime: this.preparationTime?.value ?? null,
      isActive: this.isActive.value,
      displayOrder: this.displayOrder.value,
      sku: this.sku.value,
      tags: this.tags.value,
      inventoryStrategyType: this.recipeId ? 'RECIPE' : 'DIRECT',
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  static fromPrimitives(primitives: ProductPrimitives): Product {
    return new Product(
      new ProductId(primitives.id),
      new ProductName(primitives.name),
      primitives.description ? new ProductDescription(primitives.description) : null,
      new ProductCategoryId(primitives.categoryId),
      primitives.recipeId ? new RecipeId(primitives.recipeId) : null,
      new ProductPrice(primitives.price),
      primitives.imageUrl ? new ProductImageUrl(primitives.imageUrl) : null,
      primitives.imageStorageKey ? new ProductImageStorageKey(primitives.imageStorageKey) : null,
      primitives.preparationTime ? new PreparationTime(primitives.preparationTime) : null,
      new ProductIsActive(primitives.isActive),
      new ProductDisplayOrder(primitives.displayOrder),
      new ProductSku(primitives.sku),
      ProductTags.fromArray(primitives.tags),
      primitives.createdAt,
      primitives.updatedAt
    )
  }
}
