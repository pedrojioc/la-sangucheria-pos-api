import { Query } from '@/shared/application/bus/query'

export class FindProductCategoryQuery implements Query {
  constructor(public readonly id: string) {}
}
