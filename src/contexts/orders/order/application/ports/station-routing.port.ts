export interface RoutableItem {
  productId: string
}

export abstract class StationRoutingPort {
  abstract resolveStations(items: RoutableItem[]): Promise<Map<string, string | null>>
}
