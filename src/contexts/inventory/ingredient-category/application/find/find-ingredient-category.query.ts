import { Query } from '@/shared/application/bus/query'

export class FindIngredientCategoryQuery implements Query {
  constructor(public readonly id: string) {}
}
