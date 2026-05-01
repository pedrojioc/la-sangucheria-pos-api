import { AddressRepository } from '../../domain/repositories/address.repository'
import { AddressNotExist } from '../../domain/exceptions/address-not-exist.exception'
import { AddressId } from '../../domain/address-id'
import { GeoPointPrimitives } from '../../domain/address-geo-point'
import { EventBus } from '@/shared/domain/events'

export class UpdateAddress {
  constructor(
    private readonly repository: AddressRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    label: string,
    street: string,
    neighborhood: string | null,
    city: string,
    reference: string | null,
    coordinates: GeoPointPrimitives | null
  ): Promise<void> {
    const address = await this.repository.search(new AddressId(id))
    if (!address) throw new AddressNotExist(id)

    address.update(label, street, neighborhood, city, reference, coordinates)
    await this.repository.save(address)
    await this.eventBus.publish(address.pullDomainEvents())
  }
}
