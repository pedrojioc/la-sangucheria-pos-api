import { FileUploadPrimitives } from '@/shared/domain/file-storage/file-upload'

/**
 * Command for updating a product.
 *
 * Note: This command receives Express.Multer.File (infrastructure type) instead of FileUpload (domain VO).
 * The Handler will transform it to FileUpload before calling the use case.
 * This maintains proper layer separation in Onion Architecture.
 */
export class UpdateProductCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly categoryId: string,
    public readonly price: number,
    public readonly description?: string | null,
    public readonly recipeId?: string | null,
    public readonly imageFile?: FileUploadPrimitives | null, // Infrastructure type
    public readonly removeImage?: boolean,
    public readonly preparationTime?: number | null,
    public readonly displayOrder?: number,
    public readonly tags?: string[]
  ) {}
}
