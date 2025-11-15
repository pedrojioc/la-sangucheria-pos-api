import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'

// Request DTOs
import { CreatePurchaseOrderRequest } from '../dto/create-purchase-order.request'
import { AddItemToPurchaseOrderRequest } from '../dto/add-item.request'
import { ApprovePurchaseOrderRequest } from '../dto/approve-purchase-order.request'
import { RejectPurchaseOrderRequest } from '../dto/reject-purchase-order.request'
import { SendPurchaseOrderRequest } from '../dto/send-purchase-order.request'
import { RegisterItemReceptionRequest } from '../dto/register-item-reception.request'
import { ClosePurchaseOrderRequest } from '../dto/close-purchase-order.request'

// Commands
import { CreatePurchaseOrderCommand } from '../../../application/create/create-purchase-order.command'
import { AddItemToPurchaseOrderCommand } from '../../../application/add-item/add-item-to-purchase-order.command'
import { SubmitForApprovalCommand } from '../../../application/submit-for-approval/submit-for-approval.command'
import { ApprovePurchaseOrderCommand } from '../../../application/approve/approve-purchase-order.command'
import { RejectPurchaseOrderCommand } from '../../../application/reject/reject-purchase-order.command'
import { SendPurchaseOrderCommand } from '../../../application/send/send-purchase-order.command'
import { RegisterItemReceptionCommand } from '../../../application/register-item-reception/register-item-reception.command'
import { ClosePurchaseOrderCommand } from '../../../application/close/close-purchase-order.command'

// Queries
import { FindPurchaseOrderQuery } from '../../../application/find/find-purchase-order.query'
import { FindPurchaseOrdersByStatusQuery } from '../../../application/find-by-status/find-by-status.query'

// Response DTOs
import { PurchaseOrderResponse } from '../../../application/dto/purchase-order.response'
import { PurchaseOrderListResponse } from '../../../application/dto/purchase-order-list.response'
import { PurchaseOrderStatus } from '../../../domain/purchase-order-status'

/**
 * PurchaseOrderController
 *
 * REST API for Purchase Order management.
 *
 * Endpoints:
 * - POST /purchase-orders - Create new order
 * - POST /purchase-orders/:id/items - Add item to order
 * - PUT /purchase-orders/:id/submit - Submit for approval
 * - PUT /purchase-orders/:id/approve - Approve order
 * - PUT /purchase-orders/:id/reject - Reject order
 * - PUT /purchase-orders/:id/send - Mark as sent to supplier
 * - PUT /purchase-orders/:id/items/:itemId/receive - Register item reception
 * - PUT /purchase-orders/:id/close - Close order
 * - GET /purchase-orders/:id - Get order by ID
 * - GET /purchase-orders?status=X - Get orders by status
 */
@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  /**
   * POST /purchase-orders
   * Creates a new purchase order in DRAFT status with initial items
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePurchaseOrderRequest): Promise<void> {
    const command = new CreatePurchaseOrderCommand(
      dto.id,
      dto.orderNumber,
      dto.supplierId,
      dto.requestedBy,
      dto.currency,
      dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
      dto.notes ?? null,
      dto.items.map(item => ({
        id: item.id,
        ingredientId: item.ingredientId,
        quantityRequested: item.quantityRequested,
        unitId: item.unitId,
        unitCost: item.unitCost,
        currency: dto.currency, // ← Usar currency de la orden
        notes: item.notes ?? null
      }))
    )

    await this.commandBus.execute(command)
  }

  /**
   * POST /purchase-orders/:id/items
   * Adds an item to a purchase order (only in DRAFT)
   */
  @Post(':id/items')
  @HttpCode(HttpStatus.CREATED)
  async addItem(
    @Param('id') purchaseOrderId: string,
    @Body() dto: AddItemToPurchaseOrderRequest
  ): Promise<void> {
    const command = new AddItemToPurchaseOrderCommand(
      purchaseOrderId,
      dto.itemId,
      dto.ingredientId,
      dto.quantityRequested,
      dto.unitId,
      dto.unitCost,
      dto.currency,
      dto.notes ?? null
    )

    await this.commandBus.execute(command)
  }

  /**
   * PUT /purchase-orders/:id/submit
   * Submits order for approval (DRAFT → PENDING_APPROVAL)
   */
  @Put(':id/submit')
  @HttpCode(HttpStatus.OK)
  async submitForApproval(@Param('id') id: string): Promise<void> {
    const command = new SubmitForApprovalCommand(id)
    await this.commandBus.execute(command)
  }

  /**
   * PUT /purchase-orders/:id/approve
   * Approves a purchase order (PENDING_APPROVAL → APPROVED)
   */
  @Put(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id') id: string,
    @Body() dto: ApprovePurchaseOrderRequest
  ): Promise<void> {
    const command = new ApprovePurchaseOrderCommand(id, dto.approvedBy)
    await this.commandBus.execute(command)
  }

  /**
   * PUT /purchase-orders/:id/reject
   * Rejects a purchase order (PENDING_APPROVAL → REJECTED)
   */
  @Put(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectPurchaseOrderRequest
  ): Promise<void> {
    const command = new RejectPurchaseOrderCommand(
      id,
      dto.rejectedBy,
      dto.reason ?? null
    )
    await this.commandBus.execute(command)
  }

  /**
   * PUT /purchase-orders/:id/send
   * Marks order as sent to supplier (APPROVED → SENT)
   */
  @Put(':id/send')
  @HttpCode(HttpStatus.OK)
  async send(
    @Param('id') id: string,
    @Body() dto: SendPurchaseOrderRequest
  ): Promise<void> {
    const command = new SendPurchaseOrderCommand(id, dto.sentBy)
    await this.commandBus.execute(command)
  }

  /**
   * PUT /purchase-orders/:id/items/:itemId/receive
   * Registers reception of an item
   * Auto-transitions: SENT → PARTIALLY_RECEIVED/RECEIVED
   */
  @Put(':id/items/:itemId/receive')
  @HttpCode(HttpStatus.OK)
  async registerItemReception(
    @Param('id') purchaseOrderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: RegisterItemReceptionRequest
  ): Promise<void> {
    const command = new RegisterItemReceptionCommand(
      purchaseOrderId,
      dto.itemId,
      dto.quantityReceived,
      dto.unitId
    )
    await this.commandBus.execute(command)
  }

  /**
   * PUT /purchase-orders/:id/close
   * Closes the purchase order (terminal state)
   */
  @Put(':id/close')
  @HttpCode(HttpStatus.OK)
  async close(
    @Param('id') id: string,
    @Body() dto: ClosePurchaseOrderRequest
  ): Promise<void> {
    const command = new ClosePurchaseOrderCommand(id, dto.closedBy)
    await this.commandBus.execute(command)
  }

  /**
   * GET /purchase-orders/:id
   * Gets a purchase order by ID
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<PurchaseOrderResponse | null> {
    const query = new FindPurchaseOrderQuery(id)
    return this.queryBus.execute(query)
  }

  /**
   * GET /purchase-orders?status=PENDING_APPROVAL
   * Gets purchase orders filtered by status
   */
  @Get()
  async findByStatus(
    @Query('status') status?: PurchaseOrderStatus
  ): Promise<PurchaseOrderListResponse> {
    if (status) {
      const query = new FindPurchaseOrdersByStatusQuery(status)
      return this.queryBus.execute(query)
    }

    // If no status provided, return all (could be changed to require status)
    const query = new FindPurchaseOrdersByStatusQuery(PurchaseOrderStatus.DRAFT)
    return this.queryBus.execute(query)
  }
}
