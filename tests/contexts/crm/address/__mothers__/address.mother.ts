import { faker } from '@faker-js/faker'
import { Address, AddressPrimitives } from '@/contexts/crm/address/domain/address'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

export class AddressMother {
  static create(params: Partial<AddressPrimitives> = {}): Address {
    const primitives: AddressPrimitives = {
      id: params.id ?? UuidMother.random(),
      customerId: params.customerId ?? UuidMother.random(),
      label: params.label ?? faker.helpers.arrayElement(['Casa', 'Oficina', 'Bodega']),
      street: params.street ?? faker.location.streetAddress(),
      neighborhood: params.neighborhood ?? faker.location.county(),
      city: params.city ?? faker.location.city(),
      reference: params.reference ?? null,
      coordinates: params.coordinates ?? null
    }
    return Address.fromPrimitives(primitives)
  }

  static random(): Address {
    return this.create()
  }

  static forCustomer(customerId: string): Address {
    return this.create({ customerId })
  }

  static withCoordinates(lat: number, lng: number): Address {
    return this.create({ coordinates: { lat, lng } })
  }
}
