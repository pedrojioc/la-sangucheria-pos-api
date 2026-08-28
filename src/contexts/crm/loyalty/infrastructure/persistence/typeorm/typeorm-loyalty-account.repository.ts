import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { LoyaltyAccountRepository } from '../../../domain/repositories/loyalty-account.repository'
import { LoyaltyAccount } from '../../../domain/loyalty-account'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { LoyaltyAccountEntity } from './loyalty-account.entity'

@Injectable()
export class TypeOrmLoyaltyAccountRepository
  extends TransactionalRepository<LoyaltyAccountEntity>
  implements LoyaltyAccountRepository
{
  constructor(
    @InjectRepository(LoyaltyAccountEntity)
    repository: Repository<LoyaltyAccountEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(account: LoyaltyAccount): Promise<void> {
    const primitives = account.toPrimitives()
    await this.repo.save({
      id: primitives.id,
      customerId: primitives.customerId,
      points: primitives.points
    })
  }

  async findByCustomer(customerId: string): Promise<LoyaltyAccount | null> {
    const entity = await this.repo.findOne({ where: { customerId } })
    if (!entity) return null
    return LoyaltyAccount.fromPrimitives({
      id: entity.id,
      customerId: entity.customerId,
      points: entity.points
    })
  }
}
