export interface BillingEstablishmentIdentity {
  nit: string
  businessName: string
  address: string
  phone: string
}

export abstract class BillingEstablishmentPort {
  abstract resolve(): Promise<BillingEstablishmentIdentity>
}
