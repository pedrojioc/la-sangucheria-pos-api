import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { LoyaltyAccountRepository } from '../../../domain/repositories/loyalty-account.repository'
import { LoyaltyAccount } from '../../../domain/loyalty-account'
import { LoyaltyAccountEntity } from './loyalty-account.entity'

@Injectable()
export class TypeOrmLoyaltyAccountRepository implements LoyaltyAccountRepository {
  constructor(
    @InjectRepository(LoyaltyAccountEntity)
    private readonly repository: Repository<LoyaltyAccountEntity>
  ) {}

  async save(account: LoyaltyAccount): Promise<void> {
    const primitives = account.toPrimitives()
    await this.repository.save({
      id: primitives.id,
      customerId: primitives.customerId,
      points: primitives.points
    })
  }

  async findByCustomer(customerId: string): Promise<LoyaltyAccount | null> {
    const entity = await this.repository.findOne({ where: { customerId } })
    if (!entity) return null
    return LoyaltyAccount.fromPrimitives({
      id: entity.id,
      customerId: entity.customerId,
      points: entity.points
    })
  }
}
