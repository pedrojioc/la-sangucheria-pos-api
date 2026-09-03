import { NotFoundException } from '@shared/domain/exceptions/domain.exception'

export class OptionGroupNotFound extends NotFoundException {
  constructor(id: string) {
    super(`Option group with id <${id}> does not exist`)
  }
}
