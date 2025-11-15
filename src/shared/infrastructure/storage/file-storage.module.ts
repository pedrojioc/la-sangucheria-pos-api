import { Global, Module } from '@nestjs/common'
import { CloudflareImagesStorage } from './cloudflare-images/cloudflare-images-storage.service'
import { LocalFileStorage } from './local/local-file-storage.service'

/**
 * File Storage Module (EventBus Pattern)
 *
 * This module exports concrete storage implementations.
 * Each module chooses which implementation to use via `provide/useExisting`.
 *
 * ## Pattern:
 * Same as EventBus - simple, direct injection without adapters or tokens.
 *
 * ## Available Implementations:
 * - **CloudflareImagesStorage**: Optimized for web image delivery (CDN, variants)
 * - **LocalFileStorage**: Local filesystem storage (development/testing)
 * - **S3DocumentStorage** (future): AWS S3 for documents/PDFs
 *
 * ## Usage in Modules:
 *
 * ### Products Module (Images):
 * ```typescript
 * import { FileStorageModule } from '@/shared/infrastructure/storage/file-storage.module'
 * import { CloudflareImagesStorage } from '@/shared/infrastructure/storage/cloudflare-images/cloudflare-images-storage.service'
 * import { FileStorageRepository } from '@/shared/domain/file-storage'
 *
 * @Module({
 *   imports: [FileStorageModule],
 *   providers: [
 *     {
 *       provide: FileStorageRepository,
 *       useExisting: CloudflareImagesStorage  // ← Choose Cloudflare
 *     },
 *     // ... your use cases
 *   ]
 * })
 * export class ProductsModule {}
 * ```
 *
 * ### Invoices Module (Documents - Future):
 * ```typescript
 * @Module({
 *   imports: [FileStorageModule],
 *   providers: [
 *     {
 *       provide: FileStorageRepository,
 *       useExisting: S3DocumentStorage  // ← Choose S3
 *     }
 *   ]
 * })
 * export class InvoicesModule {}
 * ```
 *
 * ## Use Case (Same for all modules):
 * ```typescript
 * export class CreateProductUseCase {
 *   constructor(
 *     private repository: ProductRepository,
 *     private fileStorage: FileStorageRepository  // ← Domain abstraction
 *   ) {}
 *
 *   async run(data: ProductData, imageFile: FileUpload): Promise<void> {
 *     const uploaded = await this.fileStorage.upload(imageFile)
 *     // ...
 *   }
 * }
 * ```
 *
 * ## Benefits:
 * ✅ Simple: No adapters, no tokens, direct injection
 * ✅ Flexible: Each module chooses its storage
 * ✅ DDD Pure: Use cases depend only on domain abstraction
 * ✅ Testable: Easy to mock FileStorageRepository
 * ✅ Consistent: Same pattern as EventBus
 *
 * @see USAGE-EXAMPLE.md for detailed examples and testing patterns
 */
@Global()
@Module({
  providers: [
    // Concrete implementations
    CloudflareImagesStorage,
    LocalFileStorage
    // Future: S3DocumentStorage
  ],
  exports: [
    // Export concrete services for module registration
    CloudflareImagesStorage,
    LocalFileStorage
    // Future: S3DocumentStorage
  ]
})
export class FileStorageModule {}
