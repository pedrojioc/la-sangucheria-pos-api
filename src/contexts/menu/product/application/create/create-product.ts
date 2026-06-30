import { EventBus } from '@/shared/domain/events'
import { ProductRepository } from '../../domain/repositories/product.repository'
import { Product } from '../../domain/product'
import { ProductSku } from '../../domain/product-sku'
import { ProductSkuAlreadyExists } from '../../domain/exceptions/product-sku-already-exists'
import { InventoryStrategyType } from '../../domain/inventory-strategy-type'

import { FileStorageRepository } from '@/shared/domain/file-storage/repositories/file-storage.repository'
import { FileUploadPrimitives } from '@/shared/domain/file-storage/file-upload'
import { ProductImageUpload } from '../../domain/product-image-upload'
import { FindProductCategory } from '@/contexts/menu/product-category/application/find/find-product-category'
import { FindIngredient } from '@/contexts/inventory/ingredient/application/find/find-ingredient'

export class CreateProduct {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly findProductCategory: FindProductCategory,
    private readonly findIngredient: FindIngredient,
    private readonly fileStorage: FileStorageRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    name: string,
    categoryId: string,
    price: number,
    sku: string,
    inventoryStrategyType?: InventoryStrategyType | null,
    description?: string | null,
    ingredientId?: string | null,
    imageFile?: FileUploadPrimitives | null,
    preparationTime?: number | null,
    displayOrder?: number,
    tags?: string[]
  ): Promise<void> {
    await this.findProductCategory.run(categoryId)

    const skuVO = new ProductSku(sku)
    const existingProduct = await this.productRepository.findBySku(skuVO)

    if (existingProduct) {
      throw new ProductSkuAlreadyExists(sku)
    }

    if (inventoryStrategyType === 'DIRECT' && ingredientId) {
      await this.findIngredient.run(ingredientId)
    }

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

    const product = Product.create(
      id,
      name,
      categoryId,
      price,
      sku,
      inventoryStrategyType,
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
