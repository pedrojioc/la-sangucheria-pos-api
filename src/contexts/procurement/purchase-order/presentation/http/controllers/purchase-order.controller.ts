import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseInterceptors
} from '@nestjs/common'
import { CurrentUser } from '@/contexts/iam/shared/decorators/current-user.decorator'
import { TransactionInterceptor } from '@shared/infrastructure/unit-of-work/transaction.interceptor'

// Request DTOs
import { CreatePurchaseOrderRequest } from '../dto/create-purchase-order.request'
import { UpdatePurchaseOrderRequest } from '../dto/update-purchase-order.request'
import { RejectPurchaseOrderRequest } from '../dto/reject-purchase-order.request'
import { OrderPurchaseOrderRequest } from '../dto/order-purchase-order.request'
import { ReceivePurchaseOrderRequest } from '../dto/receive-purchase-order.request'
import { CancelPurchaseOrderItemsRequest } from '../dto/cancel-purchase-order-items.request'

// Use Cases
import { CreatePurchaseOrder } from '../../../application/create/create-purchase-order'
import { UpdatePurchaseOrder } from '../../../application/update/update-purchase-order'
import { SubmitForApproval } from '../../../application/submit-for-approval/submit-for-approval'
import { ApprovePurchaseOrder } from '../../../application/approve/approve-purchase-order'
import { RejectPurchaseOrder } from '../../../application/reject/reject-purchase-order'
import { OrderPurchaseOrder } from '../../../application/order/order-purchase-order'
import { RegisterItemReception } from '../../../application/register-item-reception/register-item-reception'
import { CancelPurchaseOrderItems } from '../../../application/cancel-items/cancel-purchase-order-items'
import { ClosePurchaseOrder } from '../../../application/close/close-purchase-order'
import { FindPurchaseOrder } from '../../../application/find/find-purchase-order'
import { SearchPurchaseOrdersByCriteria } from '../../../application/search-by-criteria/search-purchase-orders-by-criteria'

// Response DTOs
import { PurchaseOrderResponse } from '../../../application/dto/purchase-order.response'
import { PaginatedPurchaseOrderListResponse } from '../../../application/dto/paginated-purchase-order-list.response'
import { PurchaseOrderListItemResponse } from '../../../application/dto/purchase-order-list-item.response'

// Request DTOs
import { SearchPurchaseOrdersRequest } from '../dto/search-purchase-orders.request'

/**
 * PurchaseOrderController
 *
 * REST API for Purchase Order management.
 *
 * Endpoints:
 * - POST /purchase-orders - Create new order (orderNumber auto-generated)
 * - PUT /purchase-orders/:id - Update order (only in DRAFT status)
 * - PUT /purchase-orders/:id/submit - Submit for approval
 * - PUT /purchase-orders/:id/approve - Approve order
 * - PUT /purchase-orders/:id/reject - Reject order
 * - PUT /purchase-orders/:id/order - Communicate order to supplier (APPROVED → ORDERED)
 * - PUT /purchase-orders/:id/receive - Register batch reception of items
 * - PUT /purchase-orders/:id/cancel-items - Cancel items not available from supplier
 * - PUT /purchase-orders/:id/close - Close order
 * - GET /purchase-orders/:id - Get order by ID
 * - GET /purchase-orders - Search orders with pagination/filters
 */
@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(
    private readonly createPurchaseOrder: CreatePurchaseOrder,
    private readonly updatePurchaseOrder: UpdatePurchaseOrder,
    private readonly submitForApproval: SubmitForApproval,
    private readonly approvePurchaseOrder: ApprovePurchaseOrder,
    private readonly rejectPurchaseOrder: RejectPurchaseOrder,
    private readonly orderPurchaseOrder: OrderPurchaseOrder,
    private readonly registerItemReception: RegisterItemReception,
    private readonly cancelPurchaseOrderItems: CancelPurchaseOrderItems,
    private readonly closePurchaseOrder: ClosePurchaseOrder,
    private readonly findPurchaseOrder: FindPurchaseOrder,
    private readonly searchPurchaseOrdersByCriteria: SearchPurchaseOrdersByCriteria
  ) {}

  /**
   * POST /purchase-orders
   * Creates a new purchase order in DRAFT status with initial items
   * Order number is generated automatically by the system
   * The requestedBy field is automatically set from the authenticated user
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreatePurchaseOrderRequest,
    @CurrentUser('userId') userId: string
  ): Promise<void> {
    await this.createPurchaseOrder.run(
      dto.id,
      dto.supplierId,
      userId,
      dto.currency,
      dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
      dto.notes ?? null,
      dto.items.map(item => ({
        id: item.id,
        ingredientId: item.ingredientId,
        ingredientName: item.ingredientName,
        quantityRequested: item.quantityRequested,
        unitId: item.unitId,
        unitCost: item.unitCost,
        currency: dto.currency,
        notes: item.notes ?? null
      }))
    )
  }

  /**
   * PUT /purchase-orders/:id
   * Updates a purchase order (only in DRAFT status)
   *
   * Can update:
   * - Supplier
   * - Expected delivery date
   * - Notes
   * - Items array (complete desired state)
   *
   * Item synchronization:
   * - Frontend sends the complete array of items that should exist
   * - Backend automatically calculates which items to add/remove
   * - Items are matched by ID
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderRequest): Promise<void> {
    await this.updatePurchaseOrder.run(
      id,
      dto.supplierId,
      dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
      dto.notes,
      dto.items?.map(item => ({
        id: item.id,
        ingredientId: item.ingredientId,
        ingredientName: item.ingredientName,
        quantityRequested: item.quantityRequested,
        unitId: item.unitId,
        unitCost: item.unitCost,
        currency: dto.currency,
        notes: item.notes ?? null
      }))
    )
  }

  /**
   * PUT /purchase-orders/:id/submit
   * Submits order for approval (DRAFT → PENDING_APPROVAL)
   */
  @Put(':id/submit')
  @HttpCode(HttpStatus.OK)
  async submitForApprovalAction(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string
  ): Promise<void> {
    await this.submitForApproval.run(id, userId)
  }

  /**
   * PUT /purchase-orders/:id/approve
   * Approves a purchase order (PENDING_APPROVAL → APPROVED)
   * The approvedBy field is automatically set from the authenticated user
   */
  @Put(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(@Param('id') id: string, @CurrentUser('userId') userId: string): Promise<void> {
    await this.approvePurchaseOrder.run(id, userId)
  }

  /**
   * PUT /purchase-orders/:id/reject
   * Rejects a purchase order (PENDING_APPROVAL → REJECTED)
   * The rejectedBy field is automatically set from the authenticated user
   */
  @Put(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectPurchaseOrderRequest,
    @CurrentUser('userId') userId: string
  ): Promise<void> {
    await this.rejectPurchaseOrder.run(id, userId, dto.reason ?? null)
  }

  /**
   * PUT /purchase-orders/:id/order
   * Communicates the order to the supplier (APPROVED → ORDERED)
   * Registers the purchase method (whatsapp, call, email, etc.)
   * The orderedBy field is automatically set from the authenticated user
   */
  @Put(':id/order')
  @HttpCode(HttpStatus.OK)
  async order(
    @Param('id') id: string,
    @Body() dto: OrderPurchaseOrderRequest,
    @CurrentUser('userId') userId: string
  ): Promise<void> {
    await this.orderPurchaseOrder.run(
      id,
      userId,
      dto.purchaseMethod,
      dto.purchaseMethodDetails ?? null
    )
  }

  /**
   * PUT /purchase-orders/:id/receive
   * Registers reception of multiple items in a single operation
   *
   * Request body contains an array of items with their received quantities,
   * unit IDs, and actual costs.
   *
   * State transitions:
   * - ORDERED → PARTIALLY_RECEIVED (when receiving items)
   * - PARTIALLY_RECEIVED → CLOSED (only if closeOrder=true AND all items processed)
   *
   * The order does NOT close automatically. The user must explicitly request
   * closing via closeOrder=true. If closeOrder=true but there are unprocessed
   * items (not received and not cancelled), an error is returned.
   */
  @Put(':id/receive')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(TransactionInterceptor)
  async receive(
    @Param('id') purchaseOrderId: string,
    @Body() dto: ReceivePurchaseOrderRequest,
    @CurrentUser('userId') userId: string
  ): Promise<void> {
    await this.registerItemReception.run(
      purchaseOrderId,
      dto.items.map(item => ({
        purchaseOrderItemId: item.purchaseOrderItemId,
        notReceived: item.notReceived ?? false,
        quantityReceived: item.quantityReceived,
        quantityReceivedUnitId: item.quantityReceivedUnitId,
        unitCost: item.unitCost,
        notes: item.notes ?? null
      })),
      dto.notes ?? null,
      dto.closeOrder ?? false,
      userId
    )
  }

  /**
   * PUT /purchase-orders/:id/cancel-items
   * Cancels specific items that the supplier cannot fulfill
   *
   * Use this when the supplier informs that certain items are not available.
   * Cancelled items are marked as processed and won't affect inventory.
   *
   * State transitions:
   * - Order stays in ORDERED (no state change when cancelling items)
   * - ORDERED → CLOSED (auto-close if all items cancelled with no physical reception)
   *
   * The order does NOT close automatically when cancelling items.
   * To close the order after cancelling, use the receive endpoint with closeOrder=true
   * or the close endpoint.
   */
  @Put(':id/cancel-items')
  @HttpCode(HttpStatus.OK)
  async cancelItems(
    @Param('id') purchaseOrderId: string,
    @Body() dto: CancelPurchaseOrderItemsRequest
  ): Promise<void> {
    await this.cancelPurchaseOrderItems.run(purchaseOrderId, dto.itemId, dto.reason ?? null)
  }

  /**
   * PUT /purchase-orders/:id/close
   * Closes the purchase order (terminal state)
   * The closedBy field is automatically set from the authenticated user
   */
  @Put(':id/close')
  @HttpCode(HttpStatus.OK)
  async close(@Param('id') id: string, @CurrentUser('userId') userId: string): Promise<void> {
    await this.closePurchaseOrder.run(id, userId)
  }

  /**
   * GET /purchase-orders/:id
   * Gets a purchase order by ID
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<PurchaseOrderResponse | null> {
    const readModel = await this.findPurchaseOrder.run(id)

    if (!readModel) {
      return null
    }

    return PurchaseOrderResponse.fromReadModel(readModel)
  }

  /**
   * GET /purchase-orders
   * Lists purchase orders with pagination, filtering, and sorting
   *
   * Examples:
   * - GET /purchase-orders?page=1&pageSize=20
   * - GET /purchase-orders?filters[status]=PENDING_APPROVAL
   * - GET /purchase-orders?filters[supplierName]=contains:Distribuidora
   * - GET /purchase-orders?filters[orderNumber]=contains:2024
   * - GET /purchase-orders?filters[requestedDate]=gte:2024-01-01&orderBy=requestedDate&orderType=desc
   */
  @Get()
  async search(
    @Query() dto: SearchPurchaseOrdersRequest
  ): Promise<PaginatedPurchaseOrderListResponse> {
    const criteria = dto.toCriteria()
    const result = await this.searchPurchaseOrdersByCriteria.run(criteria)
    const data = result.data.map(item => PurchaseOrderListItemResponse.fromReadModel(item))
    return new PaginatedPurchaseOrderListResponse(data, result.meta)
  }
}
