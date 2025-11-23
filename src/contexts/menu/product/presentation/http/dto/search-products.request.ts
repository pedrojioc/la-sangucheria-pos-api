import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'
import { Criteria } from '@/shared/domain/criteria/criteria'

export class SearchProductsRequest {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20

  @IsOptional()
  filters?: Record<string, any>

  @IsOptional()
  @IsString()
  orderBy?: string

  @IsOptional()
  @IsEnum(['asc', 'desc', 'ASC', 'DESC'])
  orderType?: 'asc' | 'desc'

  toCriteria(): Criteria {
    return Criteria.fromPrimitives({
      filters: this.buildFilters(),
      orderBy: this.orderBy || null,
      orderType: this.orderType || null,
      page: this.page || 1,
      pageSize: this.pageSize || 20
    })
  }

  private buildFilters(): Array<{ field: string; operator: string; value: any }> {
    if (!this.filters) {
      return []
    }

    return Object.entries(this.filters).map(([field, value]) => ({
      field,
      operator: '=',
      value
    }))
  }
}
