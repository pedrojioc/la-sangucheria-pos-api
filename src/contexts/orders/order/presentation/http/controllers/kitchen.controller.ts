import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Body,
  Sse,
  MessageEvent,
  UseInterceptors
} from '@nestjs/common'
import { Observable, interval, switchMap, map } from 'rxjs'

import { TransactionInterceptor } from '@shared/infrastructure/unit-of-work/transaction.interceptor'

import { MarkOrderItemReady } from '../../../application/mark-item-ready/mark-item-ready'
import { MarkOrderItemDelivered } from '../../../application/mark-item-delivered/mark-item-delivered'
import { GetKitchenQueue } from '../../../application/get-kitchen-queue/get-kitchen-queue'
import { KitchenQueueResponse } from '../../../application/dto/kitchen-queue.response'
import { MarkItemDeliveredRequest } from '../dto/mark-item-delivered.request'

@Controller('orders')
export class KitchenController {
  constructor(
    private readonly markItemReady: MarkOrderItemReady,
    private readonly markItemDelivered: MarkOrderItemDelivered,
    private readonly getKitchenQueue: GetKitchenQueue
  ) {}

  @Get('kitchen/queue')
  async getQueue(): Promise<KitchenQueueResponse> {
    return this.getKitchenQueue.run()
  }

  @Sse('kitchen/stream')
  streamKitchenQueue(): Observable<MessageEvent> {
    return interval(3000).pipe(
      switchMap(() => this.getKitchenQueue.run()),
      map(queue => ({ data: queue }) as MessageEvent)
    )
  }

  @Patch(':id/items/:itemId/ready')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(TransactionInterceptor)
  async markReady(@Param('id') id: string, @Param('itemId') itemId: string): Promise<void> {
    await this.markItemReady.run(id, itemId)
  }

  @Patch(':id/items/:itemId/delivered')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(TransactionInterceptor)
  async markDelivered(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: MarkItemDeliveredRequest
  ): Promise<void> {
    await this.markItemDelivered.run(id, itemId, dto.deliveredBy)
  }
}
