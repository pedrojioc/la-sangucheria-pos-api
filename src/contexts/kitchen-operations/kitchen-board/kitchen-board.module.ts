import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { OrderEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order.entity'
import { OrderItemEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order-item.entity'

import { KitchenBoardQueryService } from './application/services/kitchen-board-query.service'
import { TypeOrmKitchenBoardQueryService } from './infrastructure/query-services/typeorm-kitchen-board-query.service'
import { KitchenBoardEventEmitter } from './application/services/kitchen-board-event-emitter'
import { RxjsKitchenBoardEventEmitter } from './infrastructure/sse/rxjs-kitchen-board-event-emitter'
import { KitchenBoardController } from './presentation/http/controllers/kitchen-board.controller'

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, OrderItemEntity])],
  controllers: [KitchenBoardController],
  providers: [
    // QUERY SERVICES
    {
      provide: KitchenBoardQueryService,
      useClass: TypeOrmKitchenBoardQueryService
    },

    // EVENT EMITTER (SSE)
    RxjsKitchenBoardEventEmitter,
    {
      provide: KitchenBoardEventEmitter,
      useExisting: RxjsKitchenBoardEventEmitter
    }
  ],
  exports: [KitchenBoardEventEmitter]
})
export class KitchenBoardModule {}
