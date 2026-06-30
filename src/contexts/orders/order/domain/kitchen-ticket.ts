import { Entity } from '@shared/domain/entity'
import { Uuid } from '@shared/domain/value-objects/uuid'

export interface KitchenTicketPrimitives {
  id: string
  ticketNumber: number
  sentAt: Date
  sentBy: string
  itemIds: string[]
}

export class KitchenTicket extends Entity {
  private constructor(
    public readonly id: Uuid,
    public readonly ticketNumber: number,
    public readonly sentAt: Date,
    public readonly sentBy: string,
    public readonly itemIds: string[]
  ) {
    super()
  }

  static create(
    id: string,
    ticketNumber: number,
    sentBy: string,
    itemIds: string[]
  ): KitchenTicket {
    return new KitchenTicket(new Uuid(id), ticketNumber, new Date(), sentBy, itemIds)
  }

  toPrimitives(): KitchenTicketPrimitives {
    return {
      id: this.id.value,
      ticketNumber: this.ticketNumber,
      sentAt: this.sentAt,
      sentBy: this.sentBy,
      itemIds: this.itemIds
    }
  }

  static fromPrimitives(primitives: KitchenTicketPrimitives): KitchenTicket {
    return new KitchenTicket(
      new Uuid(primitives.id),
      primitives.ticketNumber,
      primitives.sentAt,
      primitives.sentBy,
      primitives.itemIds
    )
  }
}
