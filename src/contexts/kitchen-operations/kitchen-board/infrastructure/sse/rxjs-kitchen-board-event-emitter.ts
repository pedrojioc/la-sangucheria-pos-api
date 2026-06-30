import { Injectable } from '@nestjs/common'
import { Subject, Observable, merge, interval, switchMap, filter, defer } from 'rxjs'

import { KitchenBoardEventEmitter } from '../../application/services/kitchen-board-event-emitter'
import { KitchenBoardQueryService } from '../../application/services/kitchen-board-query.service'
import { KitchenBoardResponse } from '../../application/dto/kitchen-board.response'

interface BoardUpdateSignal {
  stationId: string | null
}

@Injectable()
export class RxjsKitchenBoardEventEmitter extends KitchenBoardEventEmitter {
  private readonly updateSubject = new Subject<BoardUpdateSignal>()

  constructor(private readonly queryService: KitchenBoardQueryService) {
    super()
  }

  notifyBoardUpdate(stationId: string | null): void {
    this.updateSubject.next({ stationId })
  }

  streamForStation(stationId?: string): Observable<KitchenBoardResponse> {
    const HEARTBEAT_INTERVAL_MS = 30_000

    const fetchBoard = () => this.queryService.findActiveByStation(stationId)

    const initial$ = defer(fetchBoard)

    const eventDriven$ = this.updateSubject.pipe(
      filter(signal => {
        if (signal.stationId === null) return true
        if (stationId === undefined) return true
        if (stationId === 'UNASSIGNED') return signal.stationId === null
        return signal.stationId === stationId
      }),
      switchMap(fetchBoard)
    )

    const heartbeat$ = interval(HEARTBEAT_INTERVAL_MS).pipe(switchMap(fetchBoard))

    return merge(initial$, eventDriven$, heartbeat$)
  }
}
