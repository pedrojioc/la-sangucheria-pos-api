import { faker } from '@faker-js/faker'

export class NumberMother {
  static random(options?: { min?: number; max?: number }): number {
    return faker.number.int({ min: options?.min || 0, max: options?.max || 1000 })
  }

  static positive(): number {
    return faker.number.int({ min: 1, max: 1000 })
  }

  static negative(): number {
    return faker.number.int({ min: -1000, max: -1 })
  }

  static zero(): number {
    return 0
  }
}
