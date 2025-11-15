import { Query } from './query'

export interface QueryBus {
  execute<R extends Response>(query: Query): Promise<R>
}

export const QueryBus = Symbol('QueryBus')
