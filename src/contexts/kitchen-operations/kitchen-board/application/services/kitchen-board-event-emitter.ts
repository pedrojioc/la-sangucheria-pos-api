import { Observable } from 'rxjs'
import { KitchenBoardResponse } from '../dto/kitchen-board.response'

export abstract class KitchenBoardEventEmitter {
  abstract notifyBoardUpdate(stationId: string | null): void
  abstract streamForStation(stationId?: string): Observable<KitchenBoardResponse>
}
