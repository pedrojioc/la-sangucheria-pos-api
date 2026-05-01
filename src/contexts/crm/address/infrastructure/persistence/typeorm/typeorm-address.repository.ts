import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AddressRepository } from '../../../domain/repositories/address.repository'
import { Address, AddressPrimitives } from '../../../domain/address'
import { AddressId } from '../../../domain/address-id'
import { AddressEntity } from './address.entity'

function toDomain(entity: AddressEntity): Address {
  return Address.fromPrimitives({
    id: entity.id,
    customerId: entity.customerId,
    label: entity.label,
    street: entity.street,
    neighborhood: entity.neighborhood,
    city: entity.city,
    reference: entity.reference,
    coordinates:
      entity.lat !== null && entity.lng !== null
        ? { lat: Number(entity.lat), lng: Number(entity.lng) }
        : null
  })
}

function toEntity(primitives: AddressPrimitives): Partial<AddressEntity> {
  return {
    id: primitives.id,
    customerId: primitives.customerId,
    label: primitives.label,
    street: primitives.street,
    neighborhood: primitives.neighborhood,
    city: primitives.city,
    reference: primitives.reference,
    lat: primitives.coordinates?.lat ?? null,
    lng: primitives.coordinates?.lng ?? null
  }
}

@Injectable()
export class TypeOrmAddressRepository implements AddressRepository {
  constructor(
    @InjectRepository(AddressEntity)
    private readonly repository: Repository<AddressEntity>
  ) {}

  async save(address: Address): Promise<void> {
    await this.repository.save(toEntity(address.toPrimitives()))
  }

  async search(id: AddressId): Promise<Address | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } })
    return entity ? toDomain(entity) : null
  }

  async findByCustomer(customerId: string): Promise<Address[]> {
    const entities = await this.repository.find({
      where: { customerId },
      order: { createdAt: 'ASC' }
    })
    return entities.map(toDomain)
  }

  async countByCustomer(customerId: string): Promise<number> {
    return this.repository.count({ where: { customerId } })
  }

  async delete(id: AddressId): Promise<void> {
    await this.repository.delete({ id: id.value })
  }
}
