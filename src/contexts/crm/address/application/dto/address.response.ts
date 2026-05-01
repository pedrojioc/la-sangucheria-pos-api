import { GeoPointPrimitives } from '../../domain/address-geo-point'

export class AddressResponse {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly label: string,
    public readonly street: string,
    public readonly neighborhood: string | null,
    public readonly city: string,
    public readonly reference: string | null,
    public readonly coordinates: GeoPointPrimitives | null
  ) {}
}
