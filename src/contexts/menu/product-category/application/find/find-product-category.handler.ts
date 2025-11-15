import { Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'

import { Query } from '@/shared/application/bus/query'
import { FindProductCategoryQuery } from './find-product-category.query'
import { FindProductCategory } from './find-product-category'
import { ProductCategoryResponse } from '../dto/product-category.response'

@Injectable()
@QueryHandler(FindProductCategoryQuery)
export class FindProductCategoryHander implements IQueryHandler<FindProductCategoryQuery> {
  constructor(private readonly findProductCategory: FindProductCategory) {}

  subscribedTo(): Query {
    return FindProductCategoryQuery
  }

  async execute(query: FindProductCategoryQuery) {
    const productCategory = await this.findProductCategory.run(query.id)
    return ProductCategoryResponse.fromDomain(productCategory)
  }
}
