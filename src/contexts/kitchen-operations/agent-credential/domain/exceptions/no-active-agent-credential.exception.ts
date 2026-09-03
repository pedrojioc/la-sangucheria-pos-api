import { NotFoundException } from '@shared/domain/exceptions/domain.exception'

export class NoActiveAgentCredential extends NotFoundException {
  constructor(establishmentId: string) {
    super(`Establishment with id ${establishmentId} has no active agent credential`)
  }
}
