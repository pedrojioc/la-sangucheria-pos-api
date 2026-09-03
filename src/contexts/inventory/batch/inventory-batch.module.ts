import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { InventoryBatchEntity } from './infrastructure/persistence/typeorm/inventory-batch.entity'

// Repositories
import { InventoryBatchRepository } from './domain/repositories/inventory-batch.repository'
import { TypeOrmInventoryBatchRepository } from './infrastructure/persistence/typeorm/typeorm-inventory-batch.repository'

@Module({
  imports: [TypeOrmModule.forFeature([InventoryBatchEntity])],
  providers: [
    // Repositories
    {
      provide: InventoryBatchRepository,
      useClass: TypeOrmInventoryBatchRepository
    }
  ],
  exports: [InventoryBatchRepository]
})
export class InventoryBatchModule {}
