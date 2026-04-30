import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'
import { Criteria } from '@/shared/domain/criteria/criteria'

export abstract class CriteriaRequest {
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
    if (!this.filters) {
      return []
    }

    return Object.entries(this.filters).map(([field, rawValue]) => {
      // Si el valor no es string, asumimos igualdad (ej: booleanos, números directos)
      if (typeof rawValue !== 'string') {
        return { field, operator: '=', value: rawValue }
      }

      // Manejo especial para operadores sin valor
      if (rawValue === 'is_null' || rawValue === 'is_not_null') {
        return {
          field,
          operator: rawValue === 'is_null' ? 'IS_NULL' : 'IS_NOT_NULL',
          value: ''
        }
      }

      // Parsear operador si viene en formato "operator:value"
      const match = rawValue.match(
        /^(contains|not_contains|starts_with|ends_with|gt|gte|lt|lte|in|not_in|is_null|is_not_null):(.*)$/
      )

      if (match) {
        const [, operatorStr, value] = match
        const operator = this.mapOperator(operatorStr)

        // Manejo especial para operadores de lista
        const parsedValue = operator === 'IN' || operator === 'NOT_IN' ? value.split(',') : value

        // Manejo especial para operadores null (no necesitan valor)
        if (operator === 'IS_NULL' || operator === 'IS_NOT_NULL') {
          return { field, operator, value: '' }
        }

        return { field, operator, value: parsedValue }
      }

      // Si no hay operador explícito, usar igualdad
      return { field, operator: '=', value: rawValue }
    })
  }

  private mapOperator(op: string): string {
    const mapping: Record<string, string> = {
      contains: 'CONTAINS',
      not_contains: 'NOT_CONTAINS',
      starts_with: 'STARTS_WITH',
      ends_with: 'ENDS_WITH',
      gt: '>',
      gte: '>=',
      lt: '<',
      lte: '<=',
      in: 'IN',
      not_in: 'NOT_IN',
      is_null: 'IS_NULL',
      is_not_null: 'IS_NOT_NULL'
    }
    return mapping[op] || '='
  }
}
