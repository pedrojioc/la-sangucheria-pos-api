import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { PurchaseOrderEntity } from './infrastructure/persistence/typeorm/purchase-order.entity'
import { PurchaseOrderItemEntity } from './infrastructure/persistence/typeorm/purchase-order-item.entity'

// Repositories
import { PurchaseOrderRepository } from './domain/repositories/purchase-order.repository'
import { TypeOrmPurchaseOrderRepository } from './infrastructure/persistence/typeorm/typeorm-purchase-order.repository'

// Events
import { EventBus } from '@/shared/domain/events'

// Command Handlers
import { CreatePurchaseOrderHandler } from './application/create/create-purchase-order.handler'
import { AddItemToPurchaseOrderHandler } from './application/add-item/add-item-to-purchase-order.handler'
import { SubmitForApprovalHandler } from './application/submit-for-approval/submit-for-approval.handler'
import { ApprovePurchaseOrderHandler } from './application/approve/approve-purchase-order.handler'
import { RejectPurchaseOrderHandler } from './application/reject/reject-purchase-order.handler'
import { SendPurchaseOrderHandler } from './application/send/send-purchase-order.handler'
import { RegisterItemReceptionHandler } from './application/register-item-reception/register-item-reception.handler'
import { ClosePurchaseOrderHandler } from './application/close/close-purchase-order.handler'

// Query Handlers
import { FindPurchaseOrderHandler } from './application/find/find-purchase-order.handler'
import { FindPurchaseOrdersByStatusHandler } from './application/find-by-status/find-by-status.handler'

// Use Cases
import { CreatePurchaseOrder } from './application/create/create-purchase-order'
import { AddItemToPurchaseOrder } from './application/add-item/add-item-to-purchase-order'
import { SubmitForApproval } from './application/submit-for-approval/submit-for-approval'
import { ApprovePurchaseOrder } from './application/approve/approve-purchase-order'
import { RejectPurchaseOrder } from './application/reject/reject-purchase-order'
import { SendPurchaseOrder } from './application/send/send-purchase-order'
import { RegisterItemReception } from './application/register-item-reception/register-item-reception'
import { ClosePurchaseOrder } from './application/close/close-purchase-order'
import { FindPurchaseOrder } from './application/find/find-purchase-order'
import { FindPurchaseOrdersByStatus } from './application/find-by-status/find-by-status'

// Controllers
import { PurchaseOrderController } from './presentation/http/controllers/purchase-order.controller'

// Utils
import { createUseCaseProvider } from '@/core/utils/createUseCaseProvider'
import { TypeormPurchaseOrderValidationService } from './infrastructure/services/typeorm-purchase-order-validation.service'
import { PurchaseOrderValidationService } from './domain/services/purchase-order-validation.service'
import { IngredientEntity } from '@/contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'

const CommandHandlers = [
  CreatePurchaseOrderHandler,
  AddItemToPurchaseOrderHandler,
  SubmitForApprovalHandler,
  ApprovePurchaseOrderHandler,
  RejectPurchaseOrderHandler,
  SendPurchaseOrderHandler,
  RegisterItemReceptionHandler,
  ClosePurchaseOrderHandler
]

const QueryHandlers = [FindPurchaseOrderHandler, FindPurchaseOrdersByStatusHandler]

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrderEntity, PurchaseOrderItemEntity, IngredientEntity])
  ],
  controllers: [PurchaseOrderController],
  providers: [
    // REPOSITORIES
    {
      provide: PurchaseOrderRepository,
      useClass: TypeOrmPurchaseOrderRepository
    },
    {
      provide: PurchaseOrderValidationService,
      useClass: TypeormPurchaseOrderValidationService
    },

    // USE CASES - Commands
    createUseCaseProvider(CreatePurchaseOrder, [
      PurchaseOrderRepository,
      PurchaseOrderValidationService,
      EventBus
    ]),
    createUseCaseProvider(AddItemToPurchaseOrder, [PurchaseOrderRepository]),
    createUseCaseProvider(SubmitForApproval, [PurchaseOrderRepository]),
    createUseCaseProvider(ApprovePurchaseOrder, [PurchaseOrderRepository, EventBus]),
    createUseCaseProvider(RejectPurchaseOrder, [PurchaseOrderRepository, EventBus]),
    createUseCaseProvider(SendPurchaseOrder, [PurchaseOrderRepository, EventBus]),
    createUseCaseProvider(RegisterItemReception, [PurchaseOrderRepository, EventBus]),
    createUseCaseProvider(ClosePurchaseOrder, [PurchaseOrderRepository, EventBus]),

    // USE CASES - Queries
    createUseCaseProvider(FindPurchaseOrder, [PurchaseOrderRepository]),
    createUseCaseProvider(FindPurchaseOrdersByStatus, [PurchaseOrderRepository]),

    // COMMAND HANDLERS
    ...CommandHandlers,

    // QUERY HANDLERS
    ...QueryHandlers
  ],
  exports: [PurchaseOrderRepository, FindPurchaseOrder]
})
export class PurchaseOrderModule {}
