import { Filter } from './filter'

export class Filters {
  constructor(public readonly items: Filter[]) {}

  static fromPrimitives(
    filters: Array<{ field: string; operator: string; value: any }>
  ): Filters {
    return new Filters(filters.map(filter => Filter.fromPrimitives(filter)))
  }

  static none(): Filters {
    return new Filters([])
  }

  add(filter: Filter): Filters {
    return new Filters([...this.items, filter])
  }

  hasFilters(): boolean {
    return this.items.length > 0
  }
}
