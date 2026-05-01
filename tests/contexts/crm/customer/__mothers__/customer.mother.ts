import { faker } from '@faker-js/faker'
import { Customer, CustomerPrimitives } from '@/contexts/crm/customer/domain/customer'
import { DocumentTypeValue } from '@/contexts/crm/customer/domain/customer-document-type'
import { TaxRegimeValue } from '@/contexts/crm/customer/domain/customer-tax-regime'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

export class CustomerMother {
  static create(params: Partial<CustomerPrimitives> = {}): Customer {
    const primitives: CustomerPrimitives = {
      id: params.id ?? UuidMother.random(),
      name: params.name ?? faker.person.fullName(),
      phone: params.phone ?? faker.phone.number({ style: 'international' }).slice(0, 30),
      email: params.email !== undefined ? params.email : faker.internet.email(),
      documentType: params.documentType ?? 'CC',
      documentNumber: params.documentNumber ?? faker.string.numeric(10),
      taxRegime: params.taxRegime ?? 'SIMPLIFIED',
      defaultAddressId: params.defaultAddressId ?? null,
      notes: params.notes ?? null,
      status: params.status ?? 'active'
    }
    return Customer.fromPrimitives(primitives)
  }

  static random(): Customer {
    return this.create()
  }

  static withPhone(phone: string): Customer {
    return this.create({ phone })
  }

  static withDocument(documentType: DocumentTypeValue, documentNumber: string): Customer {
    return this.create({ documentType, documentNumber })
  }

  static withTaxRegime(taxRegime: TaxRegimeValue): Customer {
    return this.create({ taxRegime })
  }

  static inactive(): Customer {
    return this.create({ status: 'inactive' })
  }

  static withDefaultAddress(addressId: string): Customer {
    return this.create({ defaultAddressId: addressId })
  }

  static withoutEmail(): Customer {
    return this.create({ email: null })
  }
}
