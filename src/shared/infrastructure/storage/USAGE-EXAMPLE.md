# File Storage - Usage Examples (EventBus Pattern)

This document provides practical examples for using the file storage infrastructure in your modules.

## 🎯 Architecture Pattern

Following the same pattern as `EventBus`:
- **Shared infrastructure** exports concrete implementations
- **Each module** chooses which implementation to use via `provide/useExisting`
- **Use cases** inject the domain abstract class (`FileStorageRepository`) directly
- **No adapters**, **no tokens**, **no over-engineering**

---

## 📦 Available Implementations

| Implementation | Use Case | Environment |
|---------------|----------|-------------|
| `CloudflareImagesStorage` | Images for web delivery (CDN, variants, optimization) | Production |
| `LocalFileStorage` | Local filesystem storage | Development/Testing |
| `S3DocumentStorage` (future) | Documents, PDFs, legal files | Production |

---

## 🔧 Usage in Modules

### **Products Module (Images)**

```typescript
// src/modules/products/products.module.ts
import { Module } from '@nestjs/common'
import { FileStorageModule } from '@/shared/infrastructure/storage/file-storage.module'
import { CloudflareImagesStorage } from '@/shared/infrastructure/storage/cloudflare-images/cloudflare-images-storage.service'
import { FileStorageRepository } from '@/shared/domain/file-storage'

@Module({
  imports: [
    FileStorageModule  // ← Import shared storage module
  ],
  providers: [
    // Choose Cloudflare Images for products
    {
      provide: FileStorageRepository,
      useExisting: CloudflareImagesStorage  // ← Simple provide/useExisting
    },
    
    // Your use cases
    CreateProductUseCase,
    UpdateProductUseCase,
    // ...
  ]
})
export class ProductsModule {}
```

### **Invoices Module (Documents - Future)**

```typescript
// src/modules/invoices/invoices.module.ts
import { S3DocumentStorage } from '@/shared/infrastructure/storage/s3/s3-document-storage.service'

@Module({
  imports: [FileStorageModule],
  providers: [
    // Choose S3 for invoice documents
    {
      provide: FileStorageRepository,
      useExisting: S3DocumentStorage  // ← Different implementation
    },
    
    CreateInvoiceUseCase,
    // ...
  ]
})
export class InvoicesModule {}
```

### **Development/Testing with Local Storage**

```typescript
// src/modules/products/products.module.ts (development)
import { LocalFileStorage } from '@/shared/infrastructure/storage/local/local-file-storage.service'

@Module({
  imports: [FileStorageModule],
  providers: [
    {
      provide: FileStorageRepository,
      useExisting: LocalFileStorage  // ← Local storage for dev
    }
  ]
})
```

---

## 💼 Use Case Implementation

### **Simple Upload Example**

```typescript
// src/modules/products/application/create/create-product.use-case.ts
import { FileStorageRepository, FileUpload } from '@/shared/domain/file-storage'
import { ProductRepository } from '../../domain/repositories/product.repository'

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly fileStorage: FileStorageRepository  // ← Domain abstraction
  ) {}

  async run(
    productData: CreateProductData,
    imageFile: FileUpload
  ): Promise<void> {
    // 1. Upload image
    const uploadedImage = await this.fileStorage.upload(imageFile)

    // 2. Create product with image URL
    const product = Product.create({
      ...productData,
      imageUrl: uploadedImage.publicUrl,
      imageStorageKey: uploadedImage.storageKey
    })

    // 3. Save product
    await this.productRepository.save(product)
  }
}
```

### **Update with Image Replacement**

```typescript
export class UpdateProductImageUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly fileStorage: FileStorageRepository
  ) {}

  async run(
    productId: string,
    newImageFile: FileUpload
  ): Promise<void> {
    // 1. Find product
    const product = await this.productRepository.findById(productId)
    if (!product) {
      throw new ProductNotFound(productId)
    }

    // 2. Delete old image (if exists)
    if (product.imageStorageKey) {
      await this.fileStorage.delete(product.imageStorageKey)
    }

    // 3. Upload new image
    const uploadedImage = await this.fileStorage.upload(newImageFile)

    // 4. Update product
    product.updateImage(uploadedImage.publicUrl, uploadedImage.storageKey)

    // 5. Save changes
    await this.productRepository.save(product)
  }
}
```

---

## 🧪 Testing

### **Unit Test with Mock**

```typescript
// tests/modules/products/application/CreateProductUseCase.spec.ts
import { CreateProductUseCase } from '@/modules/products/application/create/create-product.use-case'
import { FileStorageRepository, UploadedFile } from '@/shared/domain/file-storage'
import { ProductRepository } from '@/modules/products/domain/repositories/product.repository'

describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase
  let mockProductRepository: jest.Mocked<ProductRepository>
  let mockFileStorage: jest.Mocked<FileStorageRepository>

  beforeEach(() => {
    // Mock storage (no infrastructure needed!)
    mockFileStorage = {
      upload: jest.fn(),
      delete: jest.fn(),
      getPublicUrl: jest.fn()
    } as any

    mockProductRepository = {
      save: jest.fn(),
      findById: jest.fn()
    } as any

    useCase = new CreateProductUseCase(mockProductRepository, mockFileStorage)
  })

  it('should upload image and create product', async () => {
    // Arrange
    const mockUploadedFile: UploadedFile = {
      storageKey: 'cloudflare-key-123',
      publicUrl: 'https://imagedelivery.net/hash/key-123/public',
      fileName: 'product-image.jpg',
      sizeInBytes: 102400,
      mimeType: 'image/jpeg',
      uploadedAt: new Date()
    }

    mockFileStorage.upload.mockResolvedValue(mockUploadedFile)

    const productData = { name: 'Test Product', price: 100 }
    const imageFile = FileUpload.fromUploadedFile(
      Buffer.from('fake-image'),
      'product.jpg',
      'image/jpeg',
      1024
    )

    // Act
    await useCase.run(productData, imageFile)

    // Assert
    expect(mockFileStorage.upload).toHaveBeenCalledWith(imageFile)
    expect(mockProductRepository.save).toHaveBeenCalled()
  })

  it('should handle upload failure', async () => {
    // Arrange
    mockFileStorage.upload.mockRejectedValue(new Error('Upload failed'))
    const productData = { name: 'Test Product', price: 100 }
    const imageFile = FileUpload.fromUploadedFile(Buffer.from('fake'), 'test.jpg', 'image/jpeg', 1024)

    // Act & Assert
    await expect(useCase.run(productData, imageFile)).rejects.toThrow('Upload failed')
    expect(mockProductRepository.save).not.toHaveBeenCalled()
  })
})
```

---

## 🔄 Adding a New Storage Implementation

### **1. Create Implementation**

```typescript
// src/shared/infrastructure/storage/s3/s3-document-storage.service.ts
import { Injectable } from '@nestjs/common'
import { FileStorageRepository, FileUpload, UploadedFile } from '@/shared/domain/file-storage'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

@Injectable()
export class S3DocumentStorage implements FileStorageRepository {
  private s3Client: S3Client

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: configService.getOrThrow('AWS_REGION'),
      credentials: {
        accessKeyId: configService.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: configService.getOrThrow('AWS_SECRET_ACCESS_KEY')
      }
    })
  }

  async upload(file: FileUpload): Promise<UploadedFile> {
    const primitives = file.toPrimitives()
    const key = `documents/${Date.now()}-${primitives.originalName}`

    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.configService.getOrThrow('AWS_S3_BUCKET'),
      Key: key,
      Body: primitives.buffer,
      ContentType: primitives.mimeType
    }))

    return new UploadedFile(
      key,
      this.getPublicUrl(key),
      primitives.originalName,
      primitives.size,
      primitives.mimeType,
      new Date()
    )
  }

  async delete(storageKey: string): Promise<void> {
    // Implement S3 delete
  }

  getPublicUrl(storageKey: string, variant?: string): string {
    const bucket = this.configService.getOrThrow('AWS_S3_BUCKET')
    const region = this.configService.getOrThrow('AWS_REGION')
    return `https://${bucket}.s3.${region}.amazonaws.com/${storageKey}`
  }
}
```

### **2. Register in FileStorageModule**

```typescript
// src/shared/infrastructure/storage/file-storage.module.ts
import { S3DocumentStorage } from './s3/s3-document-storage.service'

@Global()
@Module({
  providers: [
    CloudflareImagesStorage,
    LocalFileStorage,
    S3DocumentStorage  // ← Add new implementation
  ],
  exports: [
    CloudflareImagesStorage,
    LocalFileStorage,
    S3DocumentStorage  // ← Export it
  ]
})
export class FileStorageModule {}
```

### **3. Use in Any Module**

```typescript
// invoices.module.ts
{
  provide: FileStorageRepository,
  useExisting: S3DocumentStorage  // ← Start using immediately
}
```

**✅ No changes needed in use cases!**

---

## ✨ Benefits of This Pattern

| Benefit | Description |
|---------|-------------|
| **Simple** | No adapters, no tokens, no unnecessary layers |
| **Flexible** | Each module chooses its storage independently |
| **DDD Pure** | Use cases depend only on domain abstraction |
| **Testable** | Easy to mock `FileStorageRepository` in tests |
| **Consistent** | Same pattern used for EventBus, Repositories |
| **Scalable** | Add new implementations without touching use cases |
| **Type-Safe** | Full TypeScript type checking |

---

## ❌ Anti-patterns to Avoid

### **DON'T create module-specific storage interfaces**

```typescript
// ❌ BAD: Over-engineering
export abstract class ProductImageStorage {
  abstract uploadProductImage(image: FileUpload): Promise<UploadedFile>
}

export abstract class InvoiceDocumentStorage {
  abstract uploadInvoiceDocument(doc: FileUpload): Promise<UploadedFile>
}
```

**Why?** All do the same thing with different names. Use shared `FileStorageRepository`.

### **DON'T create adapters that only delegate**

```typescript
// ❌ BAD: Unnecessary adapter
export class ProductImageStorageAdapter implements ProductImageStorage {
  constructor(private cloudflare: CloudflareImagesStorage) {}
  
  uploadProductImage(image: FileUpload) {
    return this.cloudflare.upload(image)  // Just delegates!
  }
}
```

**Why?** Adds complexity without value. Inject `CloudflareImagesStorage` directly via `provide/useExisting`.

### **DON'T use Symbol tokens**

```typescript
// ❌ BAD: Unnecessary tokens
export const CLOUDFLARE_STORAGE = Symbol('CLOUDFLARE_STORAGE')

constructor(
  @Inject(CLOUDFLARE_STORAGE)  // ❌ Over-complicated
  private storage: FileStorageRepository
) {}
```

**Why?** Abstract classes work as DI tokens. No need for symbols.

### **DON'T inject concrete implementations in use cases**

```typescript
// ❌ BAD: Couples use case to infrastructure
export class CreateProductUseCase {
  constructor(
    private cloudflareStorage: CloudflareImagesStorage  // ❌ Concrete class
  ) {}
}
```

**Why?** Violates Dependency Inversion. Always inject the abstraction (`FileStorageRepository`).

---

## 🔗 See Also

- [FileStorageModule](./file-storage.module.ts) - Module implementation
- [CloudflareImagesStorage](./cloudflare-images/cloudflare-images-storage.service.ts) - Cloudflare implementation
- [LocalFileStorage](./local/local-file-storage.service.ts) - Local implementation
- [FileStorageRepository](../../domain/file-storage/repositories/file-storage.repository.ts) - Domain interface
- [EventBus Pattern](../event-bus/in-memory/in-memory-event-bus.module.ts) - Similar pattern reference
