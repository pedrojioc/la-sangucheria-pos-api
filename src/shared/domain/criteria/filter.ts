import { FilterField } from './filter-field'
import { FilterOperator } from './filter-operator'
import { FilterValue } from './filter-value'

export class Filter {
  constructor(
    public readonly field: FilterField,
    public readonly operator: FilterOperator,
    public readonly value: FilterValue
  ) {}

  static fromPrimitives(plain: {
    field: string
    operator: string
    value: any
  }): Filter {
    return new Filter(
      new FilterField(plain.field),
      plain.operator as FilterOperator,
      new FilterValue(plain.value)
    )
  }

  static equal(field: string, value: any): Filter {
    return new Filter(
      new FilterField(field),
      FilterOperator.EQUAL,
      new FilterValue(value)
    )
  }

  static contains(field: string, value: string): Filter {
    return new Filter(
      new FilterField(field),
      FilterOperator.CONTAINS,
      new FilterValue(value)
    )
  }
}
