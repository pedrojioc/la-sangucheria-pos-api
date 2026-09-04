import { EventBus } from '@/shared/domain/events'
import { ProductRepository } from '../../domain/repositories/product.repository'
import { ProductId } from '../../domain/product-id'
import { ProductNotExist } from '../../domain/exceptions/product-not-exist.exception'
import { FindProductCategory } from '@/contexts/menu/product-category/application/find/find-product-category'
import { IngredientExistencePort } from '../ports/ingredient-existence.port'
import { FileStorageRepository } from '@/shared/domain/file-storage/repositories/file-storage.repository'
import { FileUploadPrimitives } from '@/shared/domain/file-storage/file-upload'
import { ProductImageUpload } from '../../domain/product-image-upload'
import { InventoryStrategyType } from '../../domain/inventory-strategy-type'

export class UpdateProduct {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly findProductCategory: FindProductCategory,
    private readonly ingredientExistence: IngredientExistencePort,
    private readonly fileStorage: FileStorageRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    name: string,
    categoryId: string,
    price: number,
    inventoryStrategyType?: InventoryStrategyType | null,
    description?: string | null,
    ingredientId?: string | null,
    imageFile?: FileUploadPrimitives | null,
    removeImage?: boolean,
    preparationTime?: number | null,
    displayOrder?: number,
    tags?: string[]
  ): Promise<void> {
    const productId = new ProductId(id)
    const product = await this.productRepository.search(productId)

    if (!product) {
      throw new ProductNotExist(productId)
    }

    await this.findProductCategory.run(categoryId)

    if (inventoryStrategyType === 'DIRECT' && ingredientId) {
      await this.ingredientExistence.ensureExists(ingredientId)
    }

    let imageUrl: string | null = product.getImageUrl()
    let imageStorageKey: string | null = product.getImageStorageKey()

    if (imageFile) {
      const oldStorageKey = product.getImageStorageKey()
      if (oldStorageKey) {
        await this.fileStorage.delete(oldStorageKey)
      }
      const fileUpload = ProductImageUpload.fromUploadedFile(
        imageFile.buffer,
        imageFile.originalName,
        imageFile.mimeType,
        imageFile.size
      )

      const uploadedFile = await this.fileStorage.upload(fileUpload)

      imageUrl = uploadedFile.publicUrl
      imageStorageKey = uploadedFile.storageKey
    }

    if (removeImage && !imageFile) {
      const oldStorageKey = product.getImageStorageKey()
      if (oldStorageKey) {
        await this.fileStorage.delete(oldStorageKey)
      }
      imageUrl = null
      imageStorageKey = null
    }

    product.update(
      name,
      categoryId,
      price,
      inventoryStrategyType ?? product.getInventoryStrategyType(),
      description,
      ingredientId,
      imageUrl,
      imageStorageKey,
      preparationTime,
      displayOrder,
      tags
    )

    await this.productRepository.save(product)

    const events = product.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
