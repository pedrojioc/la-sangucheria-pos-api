import { InvalidArgument } from '../exceptions/invalid-argument.exception'

export class Pagination {
  constructor(
    public readonly page: number,
    public readonly pageSize: number
  ) {
    this.ensureValidValues()
  }

  private ensureValidValues(): void {
    if (this.page < 1) {
      throw new InvalidArgument('Page must be greater than 0')
    }
    if (this.pageSize < 1 || this.pageSize > 100) {
      throw new InvalidArgument('Page size must be between 1 and 100')
    }
  }

  get offset(): number {
    return (this.page - 1) * this.pageSize
  }

  static fromPrimitives(page?: number, pageSize?: number): Pagination {
    return new Pagination(page || 1, pageSize || 20)
  }

  static create(page: number, pageSize: number): Pagination {
    return new Pagination(page, pageSize)
  }
}
