import { Module, OnModuleInit } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { OrderEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order.entity'
import { OrderRepository } from '@contexts/orders/order/domain/repositories/order.repository'
import { TypeOrmOrderRepository } from '@contexts/orders/order/infrastructure/persistence/typeorm/typeorm-order.repository'

import { EventBus } from '@shared/domain/events'

import { FindOrder } from '@contexts/orders/order/application/find/find-order'
import { OpenOrder } from '@contexts/orders/order/application/open/open-order'
import { AddOrderItems } from '@contexts/orders/order/application/add-items/add-order-items'
import { UpdateOrderItem } from '@contexts/orders/order/application/update-item/update-order-item'
import { RemoveOrderItem } from '@contexts/orders/order/application/remove-item/remove-order-item'
import { SendOrderToKitchen } from '@contexts/orders/order/application/send-to-kitchen/send-order-to-kitchen'
import { MarkOrderItemReady } from '@contexts/orders/order/application/mark-item-ready/mark-item-ready'
import { MarkOrderItemDelivered } from '@contexts/orders/order/application/mark-item-delivered/mark-item-delivered'
import { CancelOrderItem } from '@contexts/orders/order/application/cancel-item/cancel-order-item'
import { CancelOrder } from '@contexts/orders/order/application/cancel/cancel-order'
import { GetKitchenQueue } from '@contexts/orders/order/application/get-kitchen-queue/get-kitchen-queue'
import { CloseOrder } from '@contexts/orders/order/application/close/close-order'
import { SearchOrdersByCriteria } from '@contexts/orders/order/application/search-by-criteria/search-orders-by-criteria'
import { ApplyItemDiscount } from '@contexts/orders/order/application/apply-item-discount/apply-item-discount'
import { RemoveItemDiscount } from '@contexts/orders/order/application/remove-item-discount/remove-item-discount'
import { ApplyOrderDiscount } from '@contexts/orders/order/application/apply-order-discount/apply-order-discount'
import { RemoveOrderDiscount } from '@contexts/orders/order/application/remove-order-discount/remove-order-discount'
import { OrderQueryService } from '@contexts/orders/order/application/services/order-query.service'
import { TypeOrmOrderQueryService } from '@contexts/orders/order/infrastructure/query-services/typeorm-order-query.service'

import { OnOrderOpenedSetTableOccupied } from '@contexts/orders/order/application/subscribers/on-order-opened-set-table-occupied'
import { OnOrderClosedReleaseTable } from '@contexts/orders/order/application/subscribers/on-order-closed-release-table'
import { OnOrderCancelledReleaseTable } from '@contexts/orders/order/application/subscribers/on-order-cancelled-release-table'
import { OnOrderClosedUpdateLifetimeValue } from '@contexts/orders/order/application/subscribers/on-order-closed-update-lifetime-value'

import { OrderController } from '@contexts/orders/order/presentation/http/controllers/order.controller'
import { KitchenController } from '@contexts/orders/order/presentation/http/controllers/kitchen.controller'

import { TableModule } from '@contexts/restaurant/table/table.module'
import { CustomerModule } from '@contexts/crm/customer/customer.module'

import { OccupyTable } from '@contexts/restaurant/table/application/occupy/occupy-table'
import { ReleaseTable } from '@contexts/restaurant/table/application/release/release-table'
import { CustomerRepository } from '@contexts/crm/customer/domain/repositories/customer.repository'

import { StationRoutingPort } from '@contexts/orders/order/application/ports/station-routing.port'
import { TypeOrmStationRoutingAdapter } from '@contexts/orders/order/infrastructure/adapters/typeorm-station-routing.adapter'
import { TableLabelPort } from '@contexts/orders/order/application/ports/table-label.port'
import { TypeOrmTableLabelAdapter } from '@contexts/orders/order/infrastructure/adapters/typeorm-table-label.adapter'
import { EstablishmentSettingsPort } from '@contexts/orders/order/application/ports/establishment-settings.port'
import { TypeOrmEstablishmentSettingsAdapter } from '@contexts/orders/order/infrastructure/adapters/establishment-settings.adapter'

import { EstablishmentModule } from '@contexts/establishment/establishment/establishment.module'

import { createProvider } from '@core/utils/create-provider'

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity]),
    TableModule,
    CustomerModule,
    EstablishmentModule
  ],
  controllers: [OrderController, KitchenController],
  providers: [
    // REPOSITORIES
    {
      provide: OrderRepository,
      useClass: TypeOrmOrderRepository
    },

    // PORTS (ACL)
    {
      provide: StationRoutingPort,
      useClass: TypeOrmStationRoutingAdapter
    },
    {
      provide: TableLabelPort,
      useClass: TypeOrmTableLabelAdapter
    },
    {
      provide: EstablishmentSettingsPort,
      useClass: TypeOrmEstablishmentSettingsAdapter
    },

    // USE CASES
    createProvider(FindOrder, [OrderRepository]),
    createProvider(OpenOrder, [OrderRepository, EventBus, EstablishmentSettingsPort]),
    createProvider(AddOrderItems, [OrderRepository, FindOrder, EventBus]),
    createProvider(UpdateOrderItem, [OrderRepository, FindOrder]),
    createProvider(RemoveOrderItem, [OrderRepository, FindOrder, EventBus]),
    createProvider(SendOrderToKitchen, [
      OrderRepository,
      FindOrder,
      EventBus,
      StationRoutingPort,
      TableLabelPort
    ]),
    createProvider(MarkOrderItemReady, [OrderRepository, FindOrder, EventBus]),
    createProvider(MarkOrderItemDelivered, [OrderRepository, FindOrder, EventBus]),
    createProvider(CancelOrderItem, [OrderRepository, FindOrder, EventBus]),
    createProvider(CancelOrder, [OrderRepository, FindOrder, EventBus]),
    createProvider(GetKitchenQueue, [OrderRepository]),
    createProvider(CloseOrder, [OrderRepository, FindOrder, EventBus, EstablishmentSettingsPort]),
    createProvider(SearchOrdersByCriteria, [OrderQueryService]),
    createProvider(ApplyItemDiscount, [OrderRepository, FindOrder, EventBus]),
    createProvider(RemoveItemDiscount, [OrderRepository, FindOrder, EventBus]),
    createProvider(ApplyOrderDiscount, [OrderRepository, FindOrder, EventBus]),
    createProvider(RemoveOrderDiscount, [OrderRepository, FindOrder, EventBus]),

    // QUERY SERVICES
    {
      provide: OrderQueryService,
      useClass: TypeOrmOrderQueryService
    },

    // SUBSCRIBERS
    {
      provide: OnOrderOpenedSetTableOccupied,
      useFactory: (occupyTable: OccupyTable) => new OnOrderOpenedSetTableOccupied(occupyTable),
      inject: [OccupyTable]
    },
    {
      provide: OnOrderClosedReleaseTable,
      useFactory: (releaseTable: ReleaseTable) => new OnOrderClosedReleaseTable(releaseTable),
      inject: [ReleaseTable]
    },
    {
      provide: OnOrderCancelledReleaseTable,
      useFactory: (releaseTable: ReleaseTable) => new OnOrderCancelledReleaseTable(releaseTable),
      inject: [ReleaseTable]
    },
    {
      provide: OnOrderClosedUpdateLifetimeValue,
      useFactory: (customerRepository: CustomerRepository) =>
        new OnOrderClosedUpdateLifetimeValue(customerRepository),
      inject: [CustomerRepository]
    }
  ],
  exports: [FindOrder, OrderRepository]
})
export class OrderModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly onOrderOpenedSetTableOccupied: OnOrderOpenedSetTableOccupied,
    private readonly onOrderClosedReleaseTable: OnOrderClosedReleaseTable,
    private readonly onOrderCancelledReleaseTable: OnOrderCancelledReleaseTable,
    private readonly onOrderClosedUpdateLifetimeValue: OnOrderClosedUpdateLifetimeValue
  ) {}

  onModuleInit(): void {
    this.eventBus.addSubscribers([
      this.onOrderOpenedSetTableOccupied,
      this.onOrderClosedReleaseTable,
      this.onOrderCancelledReleaseTable,
      this.onOrderClosedUpdateLifetimeValue
    ])
  }
}
