import { InfrastructureException } from '@/shared/infrastructure/exceptions/infrastructure.exception'

export class LocalStorageException extends InfrastructureException {
  constructor(message: string, cause?: Error) {
    super(message, cause)
    this.name = 'LocalStorageException'
  }
}
