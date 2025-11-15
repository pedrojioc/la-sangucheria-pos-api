export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class InvalidValueObjectException extends DomainException {
  constructor(message: string) {
    super(message)
  }
}

export class BusinessRuleViolationException extends DomainException {
  constructor(message: string) {
    super(message)
  }
}

export class NotFoundException extends DomainException {
  constructor(message: string) {
    super(message)
  }
}
