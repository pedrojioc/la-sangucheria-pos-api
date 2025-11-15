import { faker } from '@faker-js/faker'

export class StringMother {
  static random(options?: { min?: number; max?: number }): string {
    const min = options?.min || 1
    const max = options?.max || 50
    return faker.string.alpha({ length: { min, max } })
  }

  static create(value: string): string {
    return value
  }

  static withLength(length: number): string {
    return faker.string.alpha(length)
  }

  static word(): string {
    return faker.lorem.word()
  }

  static sentence(): string {
    return faker.lorem.sentence()
  }
}
