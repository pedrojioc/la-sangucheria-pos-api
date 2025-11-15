import { InfrastructureException } from '@/shared/infrastructure/exceptions/infrastructure.exception'

export class CloudflareUploadException extends InfrastructureException {
  constructor(
    message: string,
    public readonly statusCode?: number,
    cause?: Error
  ) {
    super(message, cause)
    this.name = 'CloudflareUploadException'
  }
}
