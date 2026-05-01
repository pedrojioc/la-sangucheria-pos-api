import { InvalidArgument } from '@shared/domain/exceptions/invalid-argument.exception'

export interface GeoPointPrimitives {
  lat: number
  lng: number
}

export class AddressGeoPoint {
  private constructor(
    public readonly lat: number,
    public readonly lng: number
  ) {}

  static create(lat: number, lng: number): AddressGeoPoint {
    if (lat < -90 || lat > 90) throw new InvalidArgument('Latitude must be between -90 and 90')
    if (lng < -180 || lng > 180) throw new InvalidArgument('Longitude must be between -180 and 180')
    return new AddressGeoPoint(lat, lng)
  }

  static fromPrimitives(primitives: GeoPointPrimitives): AddressGeoPoint {
    return AddressGeoPoint.create(primitives.lat, primitives.lng)
  }

  toPrimitives(): GeoPointPrimitives {
    return { lat: this.lat, lng: this.lng }
  }
}
