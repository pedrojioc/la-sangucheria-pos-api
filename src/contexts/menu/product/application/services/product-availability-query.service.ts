export type ProductAvailability = 'AVAILABLE' | 'UNAVAILABLE'

export abstract class ProductAvailabilityQueryService {
  abstract getAvailabilityMap(productIds: string[]): Promise<Map<string, ProductAvailability>>
}
