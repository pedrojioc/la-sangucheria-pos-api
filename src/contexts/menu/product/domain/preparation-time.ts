import { NumberValueObject } from '@/shared/domain/value-objects/number'
import { InvalidArgument } from '@/shared/domain/exceptions/invalid-argument.exception'

export class PreparationTime extends NumberValueObject {
  private static readonly MAX_MINUTES = 480 // 8 hours

  constructor(value: number) {
    super(value)
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: number): void {
    if (value < 0) {
      throw new InvalidArgument(`Preparation time cannot be negative. Got: ${value}`)
    }

    if (!Number.isInteger(value)) {
      throw new InvalidArgument(`Preparation time must be an integer. Got: ${value}`)
    }

    if (value > PreparationTime.MAX_MINUTES) {
      throw new InvalidArgument(
        `Preparation time cannot exceed ${PreparationTime.MAX_MINUTES} minutes. Got: ${value}`
      )
    }
  }
}
