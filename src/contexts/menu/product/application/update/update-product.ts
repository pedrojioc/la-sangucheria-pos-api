import { EventBus } from '@/shared/domain/events'
import { ProductRepository } from '../../domain/repositories/product.repository'
import { ProductId } from '../../domain/product-id'
import { ProductNotExist } from '../../domain/exceptions/product-not-exist'
import { ProductCategoryRepository } from '@/contexts/menu/product-category/domain/repositories/product-category.repository'
import { ProductCategoryId } from '@/contexts/menu/product-category/domain/product-category-id'
import { ProductCategoryNotExist } from '@/contexts/menu/product-category/domain/exceptions/product-category-not-exist.exception'
import { FileStorageRepository } from '@/shared/domain/file-storage/repositories/file-storage.repository'
import { FileUploadPrimitives } from '@/shared/domain/file-storage/file-upload'
import { ProductImageUpload } from '../../domain/product-image-upload'

export class UpdateProduct {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productCategoryRepository: ProductCategoryRepository,
    private readonly fileStorage: FileStorageRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    name: string,
    categoryId: string,
    price: number,
    description?: string | null,
    recipeId?: string | null,
    imageFile?: FileUploadPrimitives | null,
    removeImage?: boolean,
    preparationTime?: number | null,
    displayOrder?: number,
    tags?: string[]
  ): Promise<void> {
    // 1. Find product
    const productId = new ProductId(id)
    const product = await this.productRepository.search(productId)

    if (!product) {
      throw new ProductNotExist(productId)
    }

    // 2. Verify category exists
    const categoryIdVO = new ProductCategoryId(categoryId)
    const category = await this.productCategoryRepository.search(categoryIdVO)

    if (!category) {
      throw new ProductCategoryNotExist(categoryIdVO)
    }

    // 3. Handle image update
    let imageUrl: string | null = product.getImageUrl()
    let imageStorageKey: string | null = product.getImageStorageKey()

    // If uploading a new image
    if (imageFile) {
      // Delete old image from storage (if exists)
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

      // Upload new image
      const uploadedFile = await this.fileStorage.upload(fileUpload)

      imageUrl = uploadedFile.publicUrl
      imageStorageKey = uploadedFile.storageKey
    }

    // If removing image without uploading a new one
    if (removeImage && !imageFile) {
      const oldStorageKey = product.getImageStorageKey()
      if (oldStorageKey) {
        await this.fileStorage.delete(oldStorageKey)
      }
      imageUrl = null
      imageStorageKey = null
    }

    // 4. Update product
    product.update(
      name,
      categoryId,
      price,
      description,
      recipeId,
      imageUrl,
      imageStorageKey,
      preparationTime,
      displayOrder,
      tags
    )

    // 5. Save and publish events
    await this.productRepository.save(product)

    const events = product.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
