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

@Injectable()
export class TypeOrmProductRepository implements ProductRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repository: Repository<ProductEntity>
  ) {}

  async save(product: Product): Promise<void> {
    const primitives = product.toPrimitives()
    const entity = this.repository.create(primitives)
    await this.repository.save(entity)
  }

  async search(id: ProductId): Promise<Product | null> {
    const entity = await this.repository.findOne({
      where: { id: id.value }
    })

    if (!entity) {
      return null
    }

    return Product.fromPrimitives(entity)
  }

  async findBySku(sku: ProductSku): Promise<Product | null> {
    const entity = await this.repository.findOne({
      where: { sku: sku.value }
    })

    if (!entity) {
      return null
    }

    return Product.fromPrimitives(entity)
  }

  async matching(criteria: Criteria): Promise<PaginatedResult<Product>> {
    const converter = new TypeOrmCriteriaConverter<ProductEntity>()
    const qb = converter.convert(this.repository.createQueryBuilder('product'), criteria, 'product')

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
    await this.repository.delete({ id: id.value })
  }

  async getLastSkuNumber(): Promise<number | null> {
    const result = await this.repository
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
