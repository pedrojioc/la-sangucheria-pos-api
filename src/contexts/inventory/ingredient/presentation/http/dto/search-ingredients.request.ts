import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'
import { Criteria } from '@/shared/domain/criteria/criteria'

export class SearchIngredientsRequest {
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
  @Type(() => Object)
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
    console.log('🔍 DEBUG buildFilters - this.filters:', this.filters)
    console.log('🔍 DEBUG buildFilters - typeof this.filters:', typeof this.filters)
    console.log(
      '🔍 DEBUG buildFilters - Object.keys(this.filters):',
      this.filters ? Object.keys(this.filters) : 'filters is undefined'
    )

    if (!this.filters) {
      console.log('⚠️ filters is undefined or null, returning empty array')
      return []
    }

    const result = Object.entries(this.filters).map(([field, value]) => ({
      field,
      operator: '=',
      value
    }))

    console.log('✅ Built filters:', result)
    return result
  }
}
