import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class OptionGroupSelectionExceeded extends DomainException {
  constructor(groupName: string, max: number) {
    super(`Option group "${groupName}" allows at most ${max} selection(s)`)
  }
}
