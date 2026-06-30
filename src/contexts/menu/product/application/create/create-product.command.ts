import { FileUploadPrimitives } from '@/shared/domain/file-storage/file-upload'
import { InventoryStrategyType } from '../../domain/inventory-strategy-type'

export class CreateProductCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly categoryId: string,
    public readonly price: number,
    public readonly sku: string,
    public readonly inventoryStrategyType?: InventoryStrategyType | null,
    public readonly description?: string | null,
    public readonly ingredientId?: string | null,
    public readonly imageFile?: FileUploadPrimitives | null,
    public readonly preparationTime?: number | null,
    public readonly displayOrder?: number,
    public readonly tags?: string[]
  ) {}
}
