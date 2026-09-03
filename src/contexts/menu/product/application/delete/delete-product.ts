import { EventBus } from '@/shared/domain/events'
import { ProductRepository } from '../../domain/repositories/product.repository'
import { ProductId } from '../../domain/product-id'
import { ProductNotExist } from '../../domain/exceptions/product-not-exist.exception'
import { ProductDeletedEvent } from '../../domain/events/product-deleted.event'
import { FileStorageRepository } from '@/shared/domain/file-storage/repositories/file-storage.repository'

export class DeleteProduct {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly fileStorage: FileStorageRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(id: string): Promise<void> {
    const productId = new ProductId(id)

    // 1. Verify product exists
    const product = await this.productRepository.search(productId)

    if (!product) {
      throw new ProductNotExist(productId)
    }

    // 2. Delete image from storage (if exists)
    const imageStorageKey = product.getImageStorageKey()
    if (imageStorageKey) {
      try {
        await this.fileStorage.delete(imageStorageKey)
      } catch (error) {
        // Log warning but don't fail the operation
        // The product deletion is more important than image deletion
        console.warn(`Failed to delete image ${imageStorageKey} for product ${id}:`, error)
      }
    }

    // 3. Delete product
    await this.productRepository.delete(productId)

    // 4. Publish event
    await this.eventBus.publish([
      new ProductDeletedEvent({
        productId: id
      })
    ])
  }
}
