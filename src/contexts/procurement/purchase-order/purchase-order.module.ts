import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { PurchaseOrderEntity } from './infrastructure/persistence/typeorm/purchase-order.entity'
import { PurchaseOrderItemEntity } from './infrastructure/persistence/typeorm/purchase-order-item.entity'

// Repositories (Domain - Write Operations)
import { PurchaseOrderRepository } from './domain/repositories/purchase-order.repository'
import { TypeOrmPurchaseOrderRepository } from './infrastructure/persistence/typeorm/typeorm-purchase-order.repository'

// Unit of Work
import { ReceptionUnitOfWork } from './domain/reception-unit-of-work'
import { TypeOrmReceptionUnitOfWork } from './infrastructure/persistence/typeorm/typeorm-reception-unit-of-work'

// Query Services (Application - Read Operations)
import { PurchaseOrderQueryService } from './application/services/purchase-order-query.service'
import { TypeOrmPurchaseOrderQueryService } from './infrastructure/query-services/typeorm-purchase-order-query.service'

// Events
import { EventBus } from '@/shared/domain/events'

// Command Handlers
import { CreatePurchaseOrderHandler } from './application/create/create-purchase-order.handler'
import { UpdatePurchaseOrderHandler } from './application/update/update-purchase-order.handler'
import { SubmitForApprovalHandler } from './application/submit-for-approval/submit-for-approval.handler'
import { ApprovePurchaseOrderHandler } from './application/approve/approve-purchase-order.handler'
import { RejectPurchaseOrderHandler } from './application/reject/reject-purchase-order.handler'
import { OrderPurchaseOrderHandler } from './application/order/order-purchase-order.handler'
import { RegisterItemReceptionHandler } from './application/register-item-reception/register-item-reception.handler'
import { CancelPurchaseOrderItemsHandler } from './application/cancel-items/cancel-purchase-order-items.handler'
import { ClosePurchaseOrderHandler } from './application/close/close-purchase-order.handler'

// Query Handlers
import { FindPurchaseOrderHandler } from './application/find/find-purchase-order.handler'
import { FindPurchaseOrdersByStatusHandler } from './application/find-by-status/find-by-status.handler'
import { SearchPurchaseOrdersByCriteriaHandler } from './application/search-by-criteria/search-purchase-orders-by-criteria.handler'

// Use Cases
import { CreatePurchaseOrder } from './application/create/create-purchase-order'
import { UpdatePurchaseOrder } from './application/update/update-purchase-order'
import { SubmitForApproval } from './application/submit-for-approval/submit-for-approval'
import { ApprovePurchaseOrder } from './application/approve/approve-purchase-order'
import { RejectPurchaseOrder } from './application/reject/reject-purchase-order'
import { OrderPurchaseOrder } from './application/order/order-purchase-order'
import { RegisterItemReception } from './application/register-item-reception/register-item-reception'
import { CancelPurchaseOrderItems } from './application/cancel-items/cancel-purchase-order-items'
import { ClosePurchaseOrder } from './application/close/close-purchase-order'
import { FindPurchaseOrder } from './application/find/find-purchase-order'
import { FindPurchaseOrdersByStatus } from './application/find-by-status/find-by-status'
import { SearchPurchaseOrdersByCriteria } from './application/search-by-criteria/search-purchase-orders-by-criteria'

// Controllers
import { PurchaseOrderController } from './presentation/http/controllers/purchase-order.controller'

// Utils
import { createProvider } from '@/core/utils/create-provider'
import { TypeormPurchaseOrderValidationService } from './infrastructure/query-services/typeorm-purchase-order-validation.service'
import { PurchaseOrderValidationService } from './domain/services/purchase-order-validation.service'
import { IngredientEntity } from '@/contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'
import { UserEntity } from '@/contexts/iam/user/infrastructure/persistence/typeorm/user.entity'

// Dependencies from other modules
import { IngredientRepository } from '@contexts/inventory/ingredient/domain/repositories/ingredient.repository'
import { UnitConversionRepository } from '@contexts/shared-kernel/unit-conversion/domain/repositories/unit-conversion.repository'
import { IngredientModule } from '@contexts/inventory/ingredient/ingredient.module'

const CommandHandlers = [
  CreatePurchaseOrderHandler,
  UpdatePurchaseOrderHandler,
  SubmitForApprovalHandler,
  ApprovePurchaseOrderHandler,
  RejectPurchaseOrderHandler,
  OrderPurchaseOrderHandler,
  RegisterItemReceptionHandler,
  CancelPurchaseOrderItemsHandler,
  ClosePurchaseOrderHandler
]

const QueryHandlers = [
  FindPurchaseOrderHandler,
  FindPurchaseOrdersByStatusHandler,
  SearchPurchaseOrdersByCriteriaHandler
]

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrderEntity,
      PurchaseOrderItemEntity,
      IngredientEntity,
      UserEntity
    ]),
    IngredientModule
  ],
  controllers: [PurchaseOrderController],
  providers: [
    // REPOSITORIES (Domain - Write Operations)
    {
      provide: PurchaseOrderRepository,
      useClass: TypeOrmPurchaseOrderRepository
    },

    // UNIT OF WORK
    {
      provide: ReceptionUnitOfWork,
      useClass: TypeOrmReceptionUnitOfWork
    },

    // QUERY SERVICES (Application - Read Operations)
    {
      provide: PurchaseOrderQueryService,
      useClass: TypeOrmPurchaseOrderQueryService
    },

    // DOMAIN SERVICES
    {
      provide: PurchaseOrderValidationService,
      useClass: TypeormPurchaseOrderValidationService
    },

    // USE CASES - Commands
    createProvider(CreatePurchaseOrder, [
      PurchaseOrderRepository,
      PurchaseOrderValidationService,
      EventBus
    ]),
    createProvider(UpdatePurchaseOrder, [
      PurchaseOrderRepository,
      PurchaseOrderValidationService,
      EventBus
    ]),
    createProvider(SubmitForApproval, [PurchaseOrderRepository]),
    createProvider(ApprovePurchaseOrder, [PurchaseOrderRepository, EventBus]),
    createProvider(RejectPurchaseOrder, [PurchaseOrderRepository, EventBus]),
    createProvider(OrderPurchaseOrder, [PurchaseOrderRepository, EventBus]),
    createProvider(RegisterItemReception, [
      ReceptionUnitOfWork,
      IngredientRepository,
      UnitConversionRepository,
      EventBus
    ]),
    createProvider(CancelPurchaseOrderItems, [PurchaseOrderRepository, EventBus]),
    createProvider(ClosePurchaseOrder, [PurchaseOrderRepository, EventBus]),

    // USE CASES - Queries
    createProvider(FindPurchaseOrder, [PurchaseOrderQueryService]),
    createProvider(FindPurchaseOrdersByStatus, [PurchaseOrderQueryService]),
    createProvider(SearchPurchaseOrdersByCriteria, [PurchaseOrderQueryService]),

    // COMMAND HANDLERS
    ...CommandHandlers,

    // QUERY HANDLERS
    ...QueryHandlers
  ],
  exports: [PurchaseOrderRepository, FindPurchaseOrder]
})
export class PurchaseOrderModule {}
