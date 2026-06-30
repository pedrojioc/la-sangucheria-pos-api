import { faker } from '@faker-js/faker'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { KitchenBoardItemData } from '@contexts/kitchen-operations/kitchen-board/domain/kitchen-board-item.repository'

export class KitchenBoardItemMother {
  static create(overrides: Partial<KitchenBoardItemData> = {}): KitchenBoardItemData {
    return {
      id: overrides.id ?? UuidMother.random(),
      orderId: overrides.orderId ?? UuidMother.random(),
      orderNumber: overrides.orderNumber ?? String(faker.number.int({ min: 1, max: 999 })),
      itemId: overrides.itemId ?? UuidMother.random(),
      itemName: overrides.itemName ?? faker.commerce.productName(),
      stationId: overrides.stationId !== undefined ? overrides.stationId : UuidMother.random(),
      status: overrides.status ?? 'SENT',
      quantity: overrides.quantity ?? faker.number.int({ min: 1, max: 5 }),
      notes: overrides.notes !== undefined ? overrides.notes : null,
      modifiers: overrides.modifiers ?? [],
      sentAt: overrides.sentAt ?? new Date()
    }
  }

  static random(): KitchenBoardItemData {
    return this.create()
  }
}
