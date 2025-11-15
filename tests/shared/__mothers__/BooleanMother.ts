import { faker } from '@faker-js/faker'

export class BooleanMother {
  static random(): boolean {
    return faker.datatype.boolean()
  }

  static true(): boolean {
    return true
  }

  static false(): boolean {
    return false
  }
}
