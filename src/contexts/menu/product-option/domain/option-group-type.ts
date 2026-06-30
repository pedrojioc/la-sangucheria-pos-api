import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export type OptionGroupTypeValue = 'SWAP' | 'ADD'

export class OptionGroupType {
  constructor(public readonly value: OptionGroupTypeValue) {
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: string): void {
    if (value !== 'SWAP' && value !== 'ADD') {
      throw new InvalidValueObjectException(`OptionGroupType must be SWAP or ADD, got <${value}>`)
    }
  }

  isSwap(): boolean {
    return this.value === 'SWAP'
  }

  isAdd(): boolean {
    return this.value === 'ADD'
  }
}
