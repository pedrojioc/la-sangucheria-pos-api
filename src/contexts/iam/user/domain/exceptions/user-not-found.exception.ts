import { NotFoundException } from '@/shared/domain/exceptions/domain.exception'

export class UserNotFound extends NotFoundException {
  constructor(identifier: string) {
    super(`User with identifier ${identifier} not found`)
  }
}
