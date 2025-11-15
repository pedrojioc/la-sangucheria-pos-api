import { EventBus } from '@/shared/domain/events'
import { ProductRepository } from '../../domain/repositories/product.repository'
import { Product } from '../../domain/product'
import { ProductSku } from '../../domain/product-sku'
import { ProductSkuAlreadyExists } from '../../domain/exceptions/product-sku-already-exists'

import { FileStorageRepository } from '@/shared/domain/file-storage/repositories/file-storage.repository'
import { FileUploadPrimitives } from '@/shared/domain/file-storage/file-upload'
import { ProductImageUpload } from '../../domain/product-image-upload'
import { FindProductCategory } from '@/contexts/menu/product-category/application/find/find-product-category'

export class CreateProduct {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly findProductCategory: FindProductCategory,
    private readonly fileStorage: FileStorageRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    name: string,
    categoryId: string,
    price: number,
    sku: string,
    description?: string | null,
    recipeId?: string | null,
    imageFile?: FileUploadPrimitives | null,
    preparationTime?: number | null,
    displayOrder?: number,
    tags?: string[]
  ): Promise<void> {
    // 1. Verify category exists
    const category = await this.findProductCategory.run(categoryId)

    // 2. Verify SKU is unique
    const skuVO = new ProductSku(sku)
    const existingProduct = await this.productRepository.findBySku(skuVO)

    if (existingProduct) {
      throw new ProductSkuAlreadyExists(sku)
    }

    // 3. Upload image if provided
    let imageUrl: string | null = null
    let imageStorageKey: string | null = null

    if (imageFile) {
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

    // 4. Create product with image
    const product = Product.create(
      id,
      name,
      categoryId,
      price,
      sku,
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

/*
{
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  maxSizeInBytes: 10 * 1024 * 1024, // 10MB (Cloudflare Images limit)
  requireSignedURLs: false, // Public images
  metadata: {
    productId: id,
    productName: name,
    uploadedBy: 'system'
  }
}
*/
