import { OrderBy } from './order-by'
import { OrderType } from './order-type'

export class Order {
  constructor(
    public readonly orderBy: OrderBy,
    public readonly orderType: OrderType
  ) {}

  static fromPrimitives(plain: { orderBy: string; orderType: string }): Order {
    return new Order(
      new OrderBy(plain.orderBy),
      plain.orderType.toUpperCase() as OrderType
    )
  }

  static none(): Order {
    return new Order(new OrderBy('id'), OrderType.ASC)
  }

  static asc(field: string): Order {
    return new Order(new OrderBy(field), OrderType.ASC)
  }

  static desc(field: string): Order {
    return new Order(new OrderBy(field), OrderType.DESC)
  }
}
