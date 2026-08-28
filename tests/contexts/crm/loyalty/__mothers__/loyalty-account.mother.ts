import {
  LoyaltyAccount,
  LoyaltyAccountPrimitives
} from '@/contexts/crm/loyalty/domain/loyalty-account'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

export class LoyaltyAccountMother {
  static create(params: Partial<LoyaltyAccountPrimitives> = {}): LoyaltyAccount {
    const primitives: LoyaltyAccountPrimitives = {
      id: params.id ?? UuidMother.random(),
      customerId: params.customerId ?? UuidMother.random(),
      points: params.points ?? 0
    }
    return LoyaltyAccount.fromPrimitives(primitives)
  }

  static random(): LoyaltyAccount {
    return this.create()
  }

  static forCustomer(customerId: string): LoyaltyAccount {
    return this.create({ customerId })
  }
}
