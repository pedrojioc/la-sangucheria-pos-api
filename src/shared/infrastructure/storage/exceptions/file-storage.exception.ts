import { InfrastructureException } from '@/shared/infrastructure/exceptions/infrastructure.exception'

export class FileStorageException extends InfrastructureException {
  constructor(message: string, cause?: Error) {
    super(message, cause)
    this.name = 'FileStorageException'
  }
}
