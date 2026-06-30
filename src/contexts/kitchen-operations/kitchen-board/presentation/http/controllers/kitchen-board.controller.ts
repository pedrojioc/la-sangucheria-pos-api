import { Controller, Get, Query, Sse, MessageEvent } from '@nestjs/common'
import { Observable, map } from 'rxjs'

import { KitchenBoardQueryService } from '../../../application/services/kitchen-board-query.service'
import { KitchenBoardEventEmitter } from '../../../application/services/kitchen-board-event-emitter'
import { KitchenBoardResponse } from '../../../application/dto/kitchen-board.response'

@Controller('kitchen-operations/board')
export class KitchenBoardController {
  constructor(
    private readonly queryService: KitchenBoardQueryService,
    private readonly eventEmitter: KitchenBoardEventEmitter
  ) {}

  @Get()
  async getBoard(@Query('stationId') stationId?: string): Promise<KitchenBoardResponse> {
    return this.queryService.findActiveByStation(stationId)
  }

  @Sse('stream')
  streamBoard(@Query('stationId') stationId?: string): Observable<MessageEvent> {
    return this.eventEmitter
      .streamForStation(stationId)
      .pipe(map(board => ({ data: board }) as MessageEvent))
  }
}
