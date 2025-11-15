import { v4 as uuid, validate } from 'uuid'
import { InvalidArgument } from '../exceptions/invalid-argument.exception'
import { ValueObject } from './value-object'

export class Uuid extends ValueObject<string> {
  constructor(value: string) {
    super(value)
    this.ensureIsValidUuid(value)
  }

  static random(): Uuid {
    return new Uuid(uuid())
  }

  private ensureIsValidUuid(id: string): void {
    if (!validate(id)) {
      throw new InvalidArgument(`<${this.constructor.name}> does not allow the value <${id}>`)
    }
  }
}
