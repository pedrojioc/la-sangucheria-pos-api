import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class DuplicateOptionGroupInAssignment extends InvalidValueObjectException {
  constructor(groupId: string) {
    super(`Option group <${groupId}> appears more than once in the assignment list`)
  }
}
