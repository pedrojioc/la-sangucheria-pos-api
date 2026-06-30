import { Module, OnModuleInit } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { EventBus } from '@shared/domain/events'

import { KitchenBoardItemEntity } from './infrastructure/persistence/typeorm/kitchen-board-item.entity'
import { KitchenBoardItemRepository } from './domain/kitchen-board-item.repository'
import { TypeOrmKitchenBoardItemRepository } from './infrastructure/persistence/typeorm/typeorm-kitchen-board-item.repository'
import { KitchenBoardQueryService } from './application/services/kitchen-board-query.service'
import { TypeOrmKitchenBoardQueryService } from './infrastructure/query-services/typeorm-kitchen-board-query.service'
import { KitchenBoardEventEmitter } from './application/services/kitchen-board-event-emitter'
import { RxjsKitchenBoardEventEmitter } from './infrastructure/sse/rxjs-kitchen-board-event-emitter'
import { KitchenBoardProjector } from './application/subscribers/kitchen-board-projector'
import { KitchenBoardController } from './presentation/http/controllers/kitchen-board.controller'

@Module({
  imports: [TypeOrmModule.forFeature([KitchenBoardItemEntity])],
  controllers: [KitchenBoardController],
  providers: [
    // REPOSITORIES
    {
      provide: KitchenBoardItemRepository,
      useClass: TypeOrmKitchenBoardItemRepository
    },

    // QUERY SERVICES
    {
      provide: KitchenBoardQueryService,
      useClass: TypeOrmKitchenBoardQueryService
    },

    // EVENT EMITTER (SSE) — single instance shared between projector and controller
    RxjsKitchenBoardEventEmitter,
    {
      provide: KitchenBoardEventEmitter,
      useExisting: RxjsKitchenBoardEventEmitter
    },

    // SUBSCRIBERS
    {
      provide: KitchenBoardProjector,
      useFactory: (repository: KitchenBoardItemRepository, emitter: KitchenBoardEventEmitter) =>
        new KitchenBoardProjector(repository, emitter),
      inject: [KitchenBoardItemRepository, KitchenBoardEventEmitter]
    }
  ]
})
export class KitchenBoardModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly kitchenBoardProjector: KitchenBoardProjector
  ) {}

  onModuleInit(): void {
    this.eventBus.addSubscribers([this.kitchenBoardProjector])
  }
}
