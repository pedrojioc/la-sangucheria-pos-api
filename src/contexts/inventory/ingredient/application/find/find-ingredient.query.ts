import { Query } from '@/shared/application/bus/query'

export class FindIngredientQuery implements Query {
  constructor(public readonly id: string) {}
}
