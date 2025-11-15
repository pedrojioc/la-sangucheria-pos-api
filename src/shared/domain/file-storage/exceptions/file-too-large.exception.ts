import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class FileTooLarge extends DomainException {
  constructor(actualSize: number, maxSize: number) {
    const actualMB = (actualSize / (1024 * 1024)).toFixed(2)
    const maxMB = (maxSize / (1024 * 1024)).toFixed(2)
    super(`File size (${actualMB}MB) exceeds maximum allowed size (${maxMB}MB)`)
  }
}
