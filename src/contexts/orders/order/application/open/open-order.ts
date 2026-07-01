import { EventBus } from '@shared/domain/events'
import { TaxType } from '@shared/domain/value-objects/tax-type'
import { OrderRepository } from '../../domain/repositories/order.repository'
import { Order } from '../../domain/order'
import { OrderType } from '../../domain/order-type'
import { TaxConfig } from '../../domain/tax-config'
import { EstablishmentSettingsPort } from '../ports/establishment-settings.port'

export class OpenOrder {
  constructor(
    private readonly repository: OrderRepository,
    private readonly eventBus: EventBus,
    private readonly establishmentSettingsPort: EstablishmentSettingsPort
  ) {}

  async run(
    id: string,
    type: OrderType,
    openedBy: string,
    notes: string | null,
    tableId?: string | null,
    customerId?: string | null,
    addressId?: string | null,
    deliveryFee?: number | null
  ): Promise<string> {
    const settings = await this.establishmentSettingsPort.resolve()
    const taxConfig = TaxConfig.create(
      settings.taxRate,
      settings.taxType as TaxType,
      settings.taxInclusive
    )

    const orderNumber = await this.repository.nextOrderNumber(new Date())

    const order = Order.create(
      id,
      orderNumber,
      type,
      openedBy,
      notes,
      tableId,
      customerId,
      addressId,
      deliveryFee,
      settings.currency,
      taxConfig
    )

    await this.repository.save(order)
    await this.eventBus.publish(order.pullDomainEvents())

    return orderNumber
  }
}
