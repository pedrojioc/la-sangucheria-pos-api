// src/shared/infrastructure/cqrs/QueryHandlerFactory.ts

import { Injectable } from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'
import { ModuleRef } from '@nestjs/core'
import { QueryHandler } from '@/shared/application/bus/query-handler'
import { Query } from '@/shared/application/bus/query'

/**
 * Factory for registering query handlers using subscribedTo() pattern
 *
 * This factory enables auto-registration of handlers without manual mapping.
 * Each handler declares which query it handles via subscribedTo() method.
 *
 * This is the ONLY place where we depend on @nestjs/cqrs QueryBus.
 */
@Injectable()
export class QueryHandlerFactory {
  private handlers: Array<QueryHandler<Query, any>> = []
  private isInitialized = false

  constructor(
    private readonly queryBus: QueryBus,
    private readonly moduleRef: ModuleRef
  ) {}

  /**
   * Register a query handler
   * Uses the handler's subscribedTo() method to determine which query it handles
   *
   * @param handler - The handler instance to register
   *
   * @example
   * factory.register(getOrderHandler);
   */
  register(handler: QueryHandler<any, any>): void {
    if (this.isInitialized) {
      throw new Error(
        'Cannot register handlers after initialization. ' +
          'Make sure to register all handlers before calling initialize().'
      )
    }

    // Validate that handler has subscribedTo method
    if (typeof handler.subscribedTo !== 'function') {
      throw new Error(`Handler ${handler.constructor.name} must implement subscribedTo() method`)
    }

    // Validate no duplicate registrations
    const queryType = handler.subscribedTo()
    const existing = this.handlers.find(h => h.subscribedTo() === queryType)

    if (existing) {
      throw new Error(
        `Handler for query ${queryType.constructor.name} is already registered. ` +
          `Existing: ${existing.constructor.name}, ` +
          `Attempted: ${handler.constructor.name}`
      )
    }

    this.handlers.push(handler)
  }

  /**
   * Register multiple handlers at once
   *
   * @param handlers - Array of handler instances
   */
  registerAll(handlers: QueryHandler<any, any>[]): void {
    handlers.forEach(handler => this.register(handler))
  }

  /**
   * Initialize all registered handlers with NestJS CQRS QueryBus
   * Should be called in onModuleInit lifecycle hook
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('⚠️  QueryHandlerFactory already initialized')
      return
    }

    const nestHandlers: any[] = []

    for (const handler of this.handlers) {
      try {
        const queryType = handler.subscribedTo()

        // Wrap handler to match NestJS CQRS interface
        nestHandlers.push({
          queryType,
          handler: {
            execute: (query: any) => handler.handle(query)
          }
        })

        console.log(
          `✅ Registered query handler: ${queryType.constructor.name} → ${handler.constructor.name}`
        )
      } catch (error) {
        console.error(`❌ Failed to register handler ${handler.constructor.name}:`, error)
        throw error
      }
    }

    // Register all handlers with NestJS QueryBus
    this.queryBus.register(nestHandlers)

    this.isInitialized = true

    console.log(
      `✅ Query handler registration complete: ${nestHandlers.length} handlers registered`
    )
  }

  /**
   * Get total number of registered handlers
   */
  getRegisteredCount(): number {
    return this.handlers.length
  }

  /**
   * Check if factory has been initialized
   */
  isFactoryInitialized(): boolean {
    return this.isInitialized
  }

  /**
   * Get all registered query types
   */
  getRegisteredQueryTypes(): string[] {
    return this.handlers.map(h => h.subscribedTo().constructor.name)
  }
}
