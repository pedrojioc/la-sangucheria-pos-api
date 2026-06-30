import { KitchenBoardResponse } from '../dto/kitchen-board.response'

export abstract class KitchenBoardQueryService {
  abstract findActiveByStation(stationId?: string): Promise<KitchenBoardResponse>
}
