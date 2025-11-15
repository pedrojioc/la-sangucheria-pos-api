import { faker } from '@faker-js/faker'

export class UuidMother {
  static random(): string {
    return faker.string.uuid()
  }

  static create(value: string): string {
    return value
  }
}
