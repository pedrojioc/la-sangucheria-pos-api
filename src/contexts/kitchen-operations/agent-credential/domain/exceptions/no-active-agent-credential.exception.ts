import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class NoActiveAgentCredential extends DomainException {
  constructor(establishmentId: string) {
    super(`Establishment with id ${establishmentId} has no active agent credential`)
  }
}
