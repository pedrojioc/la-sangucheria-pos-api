import { ValueObject } from '@shared/domain/value-objects/value-object'

export class ResolucionValidityDate extends ValueObject<Date> {
  constructor(value: Date) {
    super(value)
  }
}
