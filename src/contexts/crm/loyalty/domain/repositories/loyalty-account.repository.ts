import { LoyaltyAccount } from '../loyalty-account'

export abstract class LoyaltyAccountRepository {
  abstract save(account: LoyaltyAccount): Promise<void>
  abstract findByCustomer(customerId: string): Promise<LoyaltyAccount | null>
}
