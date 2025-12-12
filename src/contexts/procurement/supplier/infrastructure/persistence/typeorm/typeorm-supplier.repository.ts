import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SupplierRepository } from '../../../domain/repositories/supplier.repository'
import { Supplier } from '../../../domain/supplier'
import { SupplierId } from '../../../domain/supplier-id'
import { SupplierEntity } from './supplier.entity'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { TypeOrmCriteriaConverter } from '@/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'

@Injectable()
export class TypeOrmSupplierRepository implements SupplierRepository {
  constructor(
    @InjectRepository(SupplierEntity)
    private readonly repository: Repository<SupplierEntity>
  ) {}

  async save(supplier: Supplier): Promise<void> {
    const primitives = supplier.toPrimitives()
    const entity = this.repository.create(primitives)
    await this.repository.save(entity)
  }

  async search(id: SupplierId): Promise<Supplier | null> {
    const entity = await this.repository.findOne({
      where: { id: id.value }
    })

    if (!entity) {
      return null
    }

    return Supplier.fromPrimitives(entity)
  }

  async searchAll(): Promise<Supplier[]> {
    const entities = await this.repository.find({
      order: { name: 'ASC' }
    })

    return entities.map(Supplier.fromPrimitives)
  }

  async matching(criteria: Criteria): Promise<PaginatedResult<Supplier>> {
    const queryBuilder = this.repository.createQueryBuilder('supplier')

    const converter = new TypeOrmCriteriaConverter()
    converter.convert(queryBuilder, criteria, 'supplier')

    const [entities, total] = await queryBuilder.getManyAndCount()

    const suppliers = entities.map(Supplier.fromPrimitives)

    return PaginatedResult.create(
      suppliers,
      total,
      criteria.pagination?.page || 1,
      criteria.pagination?.pageSize || 20
    )
  }
}
