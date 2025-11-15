import { Query } from './query'

export interface QueryHandler<Q extends Query, Result> {
  subscribedTo(): Query
  handle(query: Q): Promise<Result>
}
