import { EventBus } from '@shared/domain/events'
import { EstablishmentRepository } from '../../domain/repositories/establishment.repository'
import { EstablishmentUpdateParams } from '../../domain/establishment'

export class UpdateEstablishmentSettings {
  constructor(
    private readonly repository: EstablishmentRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(params: EstablishmentUpdateParams): Promise<void> {
    const establishment = await this.repository.findSingleton()
    const updated = establishment.update(params)
    await this.repository.save(updated)
    await this.eventBus.publish(updated.pullDomainEvents())
  }
}
