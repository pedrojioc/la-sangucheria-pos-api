// src/shared/infrastructure/cqrs/NestQueryBusAdapter.ts

import { Injectable } from '@nestjs/common'
import { QueryBus as NestQueryBus } from '@nestjs/cqrs'
import { QueryBus } from '@/shared/application/bus/query-bus'
import { Query } from '@/shared/application/bus/query'

/**
 * Adapter for NestJS QueryBus
 * Implements our IQueryBus interface using NestJS CQRS
 */
@Injectable()
export class NestQueryBusAdapter implements QueryBus {
  constructor(private readonly nestQueryBus: NestQueryBus) {}

  async execute<TResult>(query: Query): Promise<TResult> {
    return this.nestQueryBus.execute(query)
  }
}
