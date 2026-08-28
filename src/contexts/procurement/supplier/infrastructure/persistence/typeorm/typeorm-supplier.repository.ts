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
import { SupplierStatistics } from '../../../domain/supplier-statistics'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

@Injectable()
export class TypeOrmSupplierRepository
  extends TransactionalRepository<SupplierEntity>
  implements SupplierRepository
{
  constructor(
    @InjectRepository(SupplierEntity)
    repository: Repository<SupplierEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(supplier: Supplier): Promise<void> {
    const primitives = supplier.toPrimitives()
    const entity = this.repo.create(primitives)
    await this.repo.save(entity)
  }

  async search(id: SupplierId): Promise<Supplier | null> {
    const entity = await this.repo.findOne({
      where: { id: id.value }
    })

    if (!entity) {
      return null
    }

    return Supplier.fromPrimitives(entity)
  }

  async searchAll(): Promise<Supplier[]> {
    const entities = await this.repo.find({
      order: { name: 'ASC' }
    })

    return entities.map(Supplier.fromPrimitives)
  }

  async matching(criteria: Criteria): Promise<PaginatedResult<Supplier>> {
    const queryBuilder = this.repo.createQueryBuilder('supplier')

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

  async getStatistics(): Promise<SupplierStatistics> {
    const result = await this.repo
      .createQueryBuilder('supplier')
      .select([
        'COUNT(supplier.id) AS "totalSuppliers"',
        'SUM(CASE WHEN supplier.is_active = true THEN 1 ELSE 0 END) AS "activeSuppliers"',
        'AVG(CASE WHEN supplier.rating IS NOT NULL THEN supplier.rating ELSE NULL END) AS "averageRating"',
        'COUNT(DISTINCT CASE WHEN po.status IN (:...validStatuses) THEN po.id ELSE NULL END) AS "totalOrders"'
      ])
      .leftJoin('purchase_orders', 'po', 'po.supplier_id = supplier.id')
      .setParameter('validStatuses', [
        'APPROVED',
        'SENT',
        'PARTIALLY_RECEIVED',
        'RECEIVED',
        'CLOSED'
      ])
      .getRawOne()

    return {
      totalSuppliers: parseInt(result.totalSuppliers || '0', 10),
      activeSuppliers: parseInt(result.activeSuppliers || '0', 10),
      averageRating: result.averageRating ? parseFloat(result.averageRating) : null,
      totalOrders: parseInt(result.totalOrders || '0', 10)
    }
  }
}
