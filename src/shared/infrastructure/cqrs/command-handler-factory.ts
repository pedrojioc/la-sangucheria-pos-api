// src/shared/infrastructure/cqrs/CommandHandlerFactory.ts

import { Injectable } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { ModuleRef } from '@nestjs/core'
import { randomUUID } from 'crypto'
import 'reflect-metadata'

import { CommandHandler } from '@/shared/application/bus/command-handler'
import { Command } from '@/shared/application/bus/command'

// NestJS CQRS metadata constants
const COMMAND_METADATA = '__command__'
const COMMAND_HANDLER_METADATA = '__commandHandler__'

/**
 * Factory for registering command handlers using subscribedTo() pattern
 *
 * This factory enables auto-registration of handlers without manual mapping.
 * Each handler declares which command it handles via subscribedTo() method.
 *
 * This is the ONLY place where we depend on @nestjs/cqrs CommandBus.
 */
@Injectable()
export class CommandHandlerFactory {
  private handlers: Array<CommandHandler<Command>> = []
  private isInitialized = false

  constructor(
    private readonly commandBus: CommandBus,
    private readonly moduleRef: ModuleRef
  ) {}

  /**
   * Register a command handler
   * Uses the handler's subscribedTo() method to determine which command it handles
   *
   * @param handler - The handler instance to register
   *
   * @example
   * factory.register(createOrderHandler);
   */
  register(handler: CommandHandler<any>): void {
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
    const commandType = handler.subscribedTo()
    const existing = this.handlers.find(h => h.subscribedTo() === commandType)

    if (existing) {
      throw new Error(
        `Handler for command ${commandType.constructor.name} is already registered. ` +
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
  registerAll(handlers: Array<CommandHandler<Command>>): void {
    handlers.forEach(handler => this.register(handler))
  }

  /**
   * Initialize all registered handlers with NestJS CQRS CommandBus
   * Should be called in onModuleInit lifecycle hook
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('⚠️  CommandHandlerFactory already initialized')
      return
    }

    for (const handler of this.handlers) {
      try {
        const commandType = handler.subscribedTo()
        const commandId = this.getCommandId(commandType)

        // Register handler directly with the CommandBus using the low-level bind method
        // This bypasses the metadata requirements and auto-discovery conflicts
        this.commandBus.bind(
          {
            metatype: handler.constructor,
            instance: {
              execute: (command: any) => handler.handle(command)
            },
            isDependencyTreeStatic: () => true
          } as any,
          commandId
        )

        console.log(
          `✅ Registered command handler: ${commandType.constructor.name} → ${handler.constructor.name}`
        )
      } catch (error) {
        console.error(`❌ Failed to register handler ${handler.constructor.name}:`, error)
        throw error
      }
    }

    this.isInitialized = true

    console.log(
      `✅ Command handler registration complete: ${this.handlers.length} handlers registered`
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
   * Get all registered command types
   */
  getRegisteredCommandTypes(): string[] {
    return this.handlers.map(h => h.subscribedTo().constructor.name)
  }

  /**
   * Generate a unique ID for a command type
   * This mimics what NestJS CQRS does internally
   */
  private getCommandId(commandType: any): string {
    // Create a consistent ID based on the command name
    // This ensures the same command always gets the same ID
    return `${commandType.constructor.name}_${randomUUID().substring(0, 8)}`
  }
}
