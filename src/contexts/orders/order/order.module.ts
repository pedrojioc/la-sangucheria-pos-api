import { Module, OnModuleInit } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { OrderEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order.entity'
import { OrderItemEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order-item.entity'
import { OrderDailySequenceEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order-daily-sequence.entity'
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

import { SetTableOccupiedOnOrderOpened } from '@contexts/orders/order/application/subscribers/set-table-occupied-on-order-opened'
import { ReleaseTableOnOrderClosed } from '@contexts/orders/order/application/subscribers/release-table-on-order-closed'
import { ReleaseTableOnOrderCancelled } from '@contexts/orders/order/application/subscribers/release-table-on-order-cancelled'
import { UpdateLifetimeValueOnOrderClosed } from '@contexts/orders/order/application/subscribers/update-lifetime-value-on-order-closed'
import { DeductIngredientsOnOrderClosed } from '@contexts/orders/order/application/subscribers/deduct-ingredients-on-order-closed'

import { OrderController } from '@contexts/orders/order/presentation/http/controllers/order.controller'
import { KitchenController } from '@contexts/orders/order/presentation/http/controllers/kitchen.controller'

import { TableModule } from '@contexts/restaurant/table/table.module'
import { CustomerModule } from '@contexts/crm/customer/customer.module'
import { ProductModule } from '@contexts/menu/product/product.module'
import { ProductRecipeModule } from '@contexts/menu/product-recipe/product-recipe.module'
import { StockLevelModule } from '@contexts/inventory/stock-level/stock-level.module'

import { OccupyTable } from '@contexts/restaurant/table/application/occupy/occupy-table'
import { ReleaseTable } from '@contexts/restaurant/table/application/release/release-table'
import { CustomerRepository } from '@contexts/crm/customer/domain/repositories/customer.repository'

import { StationRoutingPort } from '@contexts/orders/order/application/ports/station-routing.port'
import { TypeOrmStationRoutingAdapter } from '@contexts/orders/order/infrastructure/adapters/typeorm-station-routing.adapter'
import { TableLabelPort } from '@contexts/orders/order/application/ports/table-label.port'
import { TypeOrmTableLabelAdapter } from '@contexts/orders/order/infrastructure/adapters/typeorm-table-label.adapter'
import { EstablishmentSettingsPort } from '@contexts/orders/order/application/ports/establishment-settings.port'
import { TypeOrmEstablishmentSettingsAdapter } from '@contexts/orders/order/infrastructure/adapters/establishment-settings.adapter'
import { ProductDeductionPlanPort } from '@contexts/orders/order/application/ports/product-deduction-plan.port'
import { MenuProductDeductionPlanAdapter } from '@contexts/orders/order/infrastructure/adapters/menu-product-deduction-plan.adapter'
import { IngredientDeductionPort } from '@contexts/orders/order/application/ports/ingredient-deduction.port'
import { InventoryIngredientDeductionAdapter } from '@contexts/orders/order/infrastructure/adapters/inventory-ingredient-deduction.adapter'

import { EstablishmentModule } from '@contexts/establishment/establishment/establishment.module'

import { KitchenBoardModule } from '@contexts/kitchen-operations/kitchen-board/kitchen-board.module'
import { KitchenBoardEventEmitter } from '@contexts/kitchen-operations/kitchen-board/application/services/kitchen-board-event-emitter'

import { createProvider } from '@core/utils/create-provider'

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, OrderItemEntity, OrderDailySequenceEntity]),
    TableModule,
    CustomerModule,
    EstablishmentModule,
    KitchenBoardModule,
    ProductModule,
    ProductRecipeModule,
    StockLevelModule
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
    {
      provide: ProductDeductionPlanPort,
      useClass: MenuProductDeductionPlanAdapter
    },
    {
      provide: IngredientDeductionPort,
      useClass: InventoryIngredientDeductionAdapter
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
      TableLabelPort,
      KitchenBoardEventEmitter
    ]),
    createProvider(MarkOrderItemReady, [
      OrderRepository,
      FindOrder,
      EventBus,
      KitchenBoardEventEmitter
    ]),
    createProvider(MarkOrderItemDelivered, [
      OrderRepository,
      FindOrder,
      EventBus,
      KitchenBoardEventEmitter
    ]),
    createProvider(CancelOrderItem, [
      OrderRepository,
      FindOrder,
      EventBus,
      KitchenBoardEventEmitter
    ]),
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
      provide: SetTableOccupiedOnOrderOpened,
      useFactory: (occupyTable: OccupyTable) => new SetTableOccupiedOnOrderOpened(occupyTable),
      inject: [OccupyTable]
    },
    {
      provide: ReleaseTableOnOrderClosed,
      useFactory: (releaseTable: ReleaseTable) => new ReleaseTableOnOrderClosed(releaseTable),
      inject: [ReleaseTable]
    },
    {
      provide: ReleaseTableOnOrderCancelled,
      useFactory: (releaseTable: ReleaseTable) => new ReleaseTableOnOrderCancelled(releaseTable),
      inject: [ReleaseTable]
    },
    {
      provide: UpdateLifetimeValueOnOrderClosed,
      useFactory: (customerRepository: CustomerRepository) =>
        new UpdateLifetimeValueOnOrderClosed(customerRepository),
      inject: [CustomerRepository]
    },
    {
      provide: DeductIngredientsOnOrderClosed,
      useFactory: (
        productDeductionPlanPort: ProductDeductionPlanPort,
        ingredientDeductionPort: IngredientDeductionPort
      ) => new DeductIngredientsOnOrderClosed(productDeductionPlanPort, ingredientDeductionPort),
      inject: [ProductDeductionPlanPort, IngredientDeductionPort]
    }
  ],
  exports: [FindOrder, OrderRepository]
})
export class OrderModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly setTableOccupiedOnOrderOpened: SetTableOccupiedOnOrderOpened,
    private readonly releaseTableOnOrderClosed: ReleaseTableOnOrderClosed,
    private readonly releaseTableOnOrderCancelled: ReleaseTableOnOrderCancelled,
    private readonly updateLifetimeValueOnOrderClosed: UpdateLifetimeValueOnOrderClosed,
    private readonly deductIngredientsOnOrderClosed: DeductIngredientsOnOrderClosed
  ) {}

  onModuleInit(): void {
    this.eventBus.addSubscribers([
      this.setTableOccupiedOnOrderOpened,
      this.releaseTableOnOrderClosed,
      this.releaseTableOnOrderCancelled,
      this.updateLifetimeValueOnOrderClosed,
      this.deductIngredientsOnOrderClosed
    ])
  }
}
