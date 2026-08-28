import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { BillingConfig } from '@contexts/billing/billing-config/domain/billing-config'
import { BillingConfigRepository } from '@contexts/billing/billing-config/domain/repositories/billing-config.repository'
import { BillingNotConfigured } from '@contexts/billing/billing-config/domain/exceptions/billing-not-configured.exception'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { BillingConfigEntity } from './billing-config.entity'

@Injectable()
export class TypeOrmBillingConfigRepository
  extends TransactionalRepository<BillingConfigEntity>
  implements BillingConfigRepository
{
  constructor(
    @InjectRepository(BillingConfigEntity)
    repository: Repository<BillingConfigEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async findSingleton(): Promise<BillingConfig> {
    const entity = await this.repo.findOne({
      where: {},
      order: { createdAt: 'ASC' }
    })

    if (!entity) {
      throw new BillingNotConfigured()
    }

    return BillingConfig.fromPrimitives({
      id: entity.id,
      factusApiToken: entity.factusApiToken,
      factusApiBaseUrl: entity.factusApiBaseUrl,
      factusTestMode: entity.factusTestMode,
      resolucionPrefix: entity.resolucionPrefix,
      resolucionFrom: Number(entity.resolucionFrom),
      resolucionTo: Number(entity.resolucionTo),
      resolucionValidFrom: entity.resolucionValidFrom,
      resolucionValidTo: entity.resolucionValidTo,
      updatedAt: entity.updatedAt
    })
  }

  async save(config: BillingConfig): Promise<void> {
    const primitives = config.toPrimitives()
    const entity = this.repo.create({
      id: primitives.id,
      factusApiToken: primitives.factusApiToken,
      factusApiBaseUrl: primitives.factusApiBaseUrl,
      factusTestMode: primitives.factusTestMode,
      resolucionPrefix: primitives.resolucionPrefix,
      resolucionFrom: primitives.resolucionFrom,
      resolucionTo: primitives.resolucionTo,
      resolucionValidFrom: primitives.resolucionValidFrom,
      resolucionValidTo: primitives.resolucionValidTo
    })
    await this.repo.save(entity)
  }
}
