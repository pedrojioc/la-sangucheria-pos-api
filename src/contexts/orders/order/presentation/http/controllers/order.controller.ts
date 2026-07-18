import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common'

import { OpenOrder } from '../../../application/open/open-order'
import { AddOrderItems } from '../../../application/add-items/add-order-items'
import { UpdateOrderItem } from '../../../application/update-item/update-order-item'
import { RemoveOrderItem } from '../../../application/remove-item/remove-order-item'
import { SendOrderToKitchen } from '../../../application/send-to-kitchen/send-order-to-kitchen'
import { FindOrder } from '../../../application/find/find-order'
import { CancelOrderItem } from '../../../application/cancel-item/cancel-order-item'
import { CancelOrder } from '../../../application/cancel/cancel-order'
import { CloseOrder, CloseOrderTipSelection } from '../../../application/close/close-order'
import { SearchOrdersByCriteria } from '../../../application/search-by-criteria/search-orders-by-criteria'
import { ApplyItemDiscount } from '../../../application/apply-item-discount/apply-item-discount'
import { RemoveItemDiscount } from '../../../application/remove-item-discount/remove-item-discount'
import { ApplyOrderDiscount } from '../../../application/apply-order-discount/apply-order-discount'
import { RemoveOrderDiscount } from '../../../application/remove-order-discount/remove-order-discount'
import { OrderResponse } from '../../../application/dto/order.response'
import { PaginatedResult } from '@shared/domain/criteria/paginated-result'
import { OrderListItem } from '../../../application/dto/order-list-item'

import { OpenOrderRequest } from '../dto/open-order.request'
import { AddOrderItemsRequest } from '../dto/add-order-items.request'
import { UpdateOrderItemRequest } from '../dto/update-order-item.request'
import { SendToKitchenRequest } from '../dto/send-to-kitchen.request'
import { CancelOrderItemRequest } from '../dto/cancel-order-item.request'
import { CancelOrderRequest } from '../dto/cancel-order.request'
import { CloseOrderRequest } from '../dto/close-order.request'
import { SearchOrdersRequest } from '../dto/search-orders.request'
import { ApplyDiscountRequest } from '../dto/apply-discount.request'

@Controller('orders')
export class OrderController {
  constructor(
    private readonly openOrder: OpenOrder,
    private readonly addOrderItems: AddOrderItems,
    private readonly updateOrderItem: UpdateOrderItem,
    private readonly removeOrderItem: RemoveOrderItem,
    private readonly sendOrderToKitchen: SendOrderToKitchen,
    private readonly findOrder: FindOrder,
    private readonly cancelOrderItem: CancelOrderItem,
    private readonly cancelOrder: CancelOrder,
    private readonly closeOrder: CloseOrder,
    private readonly searchOrdersByCriteria: SearchOrdersByCriteria,
    private readonly applyItemDiscount: ApplyItemDiscount,
    private readonly removeItemDiscount: RemoveItemDiscount,
    private readonly applyOrderDiscount: ApplyOrderDiscount,
    private readonly removeOrderDiscount: RemoveOrderDiscount
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async open(@Body() dto: OpenOrderRequest): Promise<{ orderNumber: string }> {
    const orderNumber = await this.openOrder.run(
      dto.id,
      dto.type,
      dto.openedBy,
      dto.notes ?? null,
      dto.tableId,
      dto.customerId,
      dto.addressId,
      dto.deliveryFee
    )
    return { orderNumber }
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<OrderResponse> {
    const order = await this.findOrder.run(id)
    return OrderResponse.fromAggregate(order)
  }

  @Post(':id/items')
  @HttpCode(HttpStatus.OK)
  async addItems(@Param('id') id: string, @Body() dto: AddOrderItemsRequest): Promise<void> {
    const items = dto.items.map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      currency: item.currency ?? 'COP',
      quantity: item.quantity,
      modifiers: (item.modifiers ?? []).map(m => ({
        optionGroupId: m.optionGroupId,
        optionGroupName: m.optionGroupName,
        optionItemId: m.optionItemId,
        optionItemName: m.optionItemName,
        priceAdjustment: m.priceAdjustment,
        currency: m.currency ?? 'COP'
      })),
      notes: item.notes ?? null
    }))
    await this.addOrderItems.run(id, items)
  }

  @Patch(':id/items/:itemId')
  @HttpCode(HttpStatus.OK)
  async updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOrderItemRequest
  ): Promise<void> {
    await this.updateOrderItem.run(id, itemId, dto.quantity, dto.notes)
  }

  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.OK)
  async removeItem(@Param('id') id: string, @Param('itemId') itemId: string): Promise<void> {
    await this.removeOrderItem.run(id, itemId)
  }

  @Post(':id/kitchen')
  @HttpCode(HttpStatus.OK)
  async sendToKitchen(@Param('id') id: string, @Body() dto: SendToKitchenRequest): Promise<void> {
    await this.sendOrderToKitchen.run(id, dto.ticketId, dto.itemIds, dto.sentBy)
  }

  @Post(':id/items/:itemId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: CancelOrderItemRequest
  ): Promise<void> {
    await this.cancelOrderItem.run(id, itemId, dto.reason, dto.cancelledBy)
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string, @Body() dto: CancelOrderRequest): Promise<void> {
    await this.cancelOrder.run(id, dto.reason, dto.cancelledBy)
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  async close(@Param('id') id: string, @Body() dto: CloseOrderRequest): Promise<void> {
    await this.closeOrder.run(
      id,
      dto.payments,
      dto.closedBy,
      dto.tipSelection as CloseOrderTipSelection,
      dto.splits
    )
  }

  @Patch(':id/items/:itemId/discount')
  @HttpCode(HttpStatus.OK)
  async applyItemDiscountEndpoint(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: ApplyDiscountRequest
  ): Promise<void> {
    await this.applyItemDiscount.run(
      id,
      itemId,
      dto.type,
      dto.method,
      dto.value,
      dto.appliedBy,
      dto.reason
    )
  }

  @Delete(':id/items/:itemId/discount')
  @HttpCode(HttpStatus.OK)
  async removeItemDiscountEndpoint(
    @Param('id') id: string,
    @Param('itemId') itemId: string
  ): Promise<void> {
    await this.removeItemDiscount.run(id, itemId)
  }

  @Patch(':id/discount')
  @HttpCode(HttpStatus.OK)
  async applyOrderDiscountEndpoint(
    @Param('id') id: string,
    @Body() dto: ApplyDiscountRequest
  ): Promise<void> {
    await this.applyOrderDiscount.run(
      id,
      dto.type,
      dto.method,
      dto.value,
      dto.appliedBy,
      dto.reason
    )
  }

  @Delete(':id/discount')
  @HttpCode(HttpStatus.OK)
  async removeOrderDiscountEndpoint(@Param('id') id: string): Promise<void> {
    await this.removeOrderDiscount.run(id)
  }

  @Get()
  async search(@Query() query: SearchOrdersRequest): Promise<PaginatedResult<OrderListItem>> {
    const criteria = query.toCriteria()
    return this.searchOrdersByCriteria.run(criteria)
  }
}
