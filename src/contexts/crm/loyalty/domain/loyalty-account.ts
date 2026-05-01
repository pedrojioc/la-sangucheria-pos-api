import { AggregateRoot } from '@shared/domain/aggregate-root'
import { LoyaltyAccountId } from './loyalty-account-id'
import { LoyaltyPoints } from './loyalty-points'
import { LoyaltyAccountCreatedEvent } from './events/loyalty-account-created.event'

export interface LoyaltyAccountPrimitives {
  id: string
  customerId: string
  points: number
}

export class LoyaltyAccount extends AggregateRoot {
  private constructor(
    public readonly id: LoyaltyAccountId,
    public readonly customerId: string,
    private points: LoyaltyPoints
  ) {
    super()
  }

  static create(id: string, customerId: string): LoyaltyAccount {
    const account = LoyaltyAccount.fromPrimitives({ id, customerId, points: 0 })
    account.record(new LoyaltyAccountCreatedEvent({ loyaltyAccountId: id, customerId }))
    return account
  }

  static fromPrimitives(primitives: LoyaltyAccountPrimitives): LoyaltyAccount {
    return new LoyaltyAccount(
      new LoyaltyAccountId(primitives.id),
      primitives.customerId,
      new LoyaltyPoints(primitives.points)
    )
  }

  toPrimitives(): LoyaltyAccountPrimitives {
    return {
      id: this.id.value,
      customerId: this.customerId,
      points: this.points.value
    }
  }
}
