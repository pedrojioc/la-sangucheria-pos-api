import { AggregateRoot } from '@shared/domain/aggregate-root'
import { AddressId } from './address-id'
import { AddressLabel } from './address-label'
import { AddressStreet } from './address-street'
import { AddressCity } from './address-city'
import { AddressNeighborhood } from './address-neighborhood'
import { AddressReference } from './address-reference'
import { AddressGeoPoint, GeoPointPrimitives } from './address-geo-point'
import { AddressAddedEvent } from './events/address-added.event'
import { AddressUpdatedEvent } from './events/address-updated.event'

export interface AddressPrimitives {
  id: string
  customerId: string
  label: string
  street: string
  neighborhood: string | null
  city: string
  reference: string | null
  coordinates: GeoPointPrimitives | null
}

export class Address extends AggregateRoot {
  private constructor(
    public readonly id: AddressId,
    public readonly customerId: string,
    private label: AddressLabel,
    private street: AddressStreet,
    private neighborhood: AddressNeighborhood | null,
    private city: AddressCity,
    private reference: AddressReference | null,
    private coordinates: AddressGeoPoint | null
  ) {
    super()
  }

  static create(
    id: string,
    customerId: string,
    label: string,
    street: string,
    neighborhood: string | null,
    city: string,
    reference: string | null,
    coordinates: GeoPointPrimitives | null
  ): Address {
    const address = Address.fromPrimitives({
      id,
      customerId,
      label,
      street,
      neighborhood,
      city,
      reference,
      coordinates
    })

    address.record(new AddressAddedEvent({ addressId: id, customerId }))

    return address
  }

  static fromPrimitives(primitives: AddressPrimitives): Address {
    return new Address(
      new AddressId(primitives.id),
      primitives.customerId,
      new AddressLabel(primitives.label),
      new AddressStreet(primitives.street),
      primitives.neighborhood !== null ? new AddressNeighborhood(primitives.neighborhood) : null,
      new AddressCity(primitives.city),
      primitives.reference !== null ? new AddressReference(primitives.reference) : null,
      primitives.coordinates !== null
        ? AddressGeoPoint.fromPrimitives(primitives.coordinates)
        : null
    )
  }

  update(
    label: string,
    street: string,
    neighborhood: string | null,
    city: string,
    reference: string | null,
    coordinates: GeoPointPrimitives | null
  ): void {
    this.label = new AddressLabel(label)
    this.street = new AddressStreet(street)
    this.neighborhood = neighborhood !== null ? new AddressNeighborhood(neighborhood) : null
    this.city = new AddressCity(city)
    this.reference = reference !== null ? new AddressReference(reference) : null
    this.coordinates = coordinates !== null ? AddressGeoPoint.fromPrimitives(coordinates) : null
    this.record(new AddressUpdatedEvent({ addressId: this.id.value, customerId: this.customerId }))
  }

  toPrimitives(): AddressPrimitives {
    return {
      id: this.id.value,
      customerId: this.customerId,
      label: this.label.value,
      street: this.street.value,
      neighborhood: this.neighborhood?.value ?? null,
      city: this.city.value,
      reference: this.reference?.value ?? null,
      coordinates: this.coordinates?.toPrimitives() ?? null
    }
  }
}
