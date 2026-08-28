import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProductRepository } from '@/contexts/menu/product/domain/repositories/product.repository'
import { Product } from '@/contexts/menu/product/domain/product'
import { ProductId } from '@/contexts/menu/product/domain/product-id'
import { ProductSku } from '@/contexts/menu/product/domain/product-sku'
import { ProductEntity } from './product.entity'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { TypeOrmCriteriaConverter } from '@/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

@Injectable()
export class TypeOrmProductRepository
  extends TransactionalRepository<ProductEntity>
  implements ProductRepository
{
  constructor(
    @InjectRepository(ProductEntity)
    repository: Repository<ProductEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(product: Product): Promise<void> {
    const primitives = product.toPrimitives()
    const entity = this.repo.create(primitives)
    await this.repo.save(entity)
  }

  async search(id: ProductId): Promise<Product | null> {
    const entity = await this.repo.findOne({
      where: { id: id.value }
    })

    if (!entity) {
      return null
    }

    return Product.fromPrimitives(entity)
  }

  async findBySku(sku: ProductSku): Promise<Product | null> {
    const entity = await this.repo.findOne({
      where: { sku: sku.value }
    })

    if (!entity) {
      return null
    }

    return Product.fromPrimitives(entity)
  }

  async matching(criteria: Criteria): Promise<PaginatedResult<Product>> {
    const converter = new TypeOrmCriteriaConverter<ProductEntity>()
    const qb = converter.convert(this.repo.createQueryBuilder('product'), criteria, 'product')

    const [items, total] = await qb.getManyAndCount()

    const products = items.map(entity => Product.fromPrimitives(entity))

    return PaginatedResult.create(
      products,
      total,
      criteria.pagination.page,
      criteria.pagination.pageSize
    )
  }

  async delete(id: ProductId): Promise<void> {
    await this.repo.delete({ id: id.value })
  }

  async getLastSkuNumber(): Promise<number | null> {
    const result = await this.repo
      .createQueryBuilder('product')
      .select('product.sku')
      .where('product.sku LIKE :prefix', { prefix: 'PROD-%' })
      .orderBy('product.sku', 'DESC')
      .limit(1)
      .getOne()

    if (!result || !result.sku) {
      return null
    }

    const match = result.sku.match(/^PROD-(\d+)$/)
    return match ? parseInt(match[1], 10) : null
  }
}
