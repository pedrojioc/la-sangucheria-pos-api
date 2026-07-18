import { EventBus } from '@shared/domain/events'
import { OrderRepository } from '../../domain/repositories/order.repository'
import { FindOrder } from '../find/find-order'
import { EstablishmentSettingsPort } from '../ports/establishment-settings.port'
import { TipSuggestionsNotConfigured } from '../exceptions/tip-suggestions-not-configured.exception'
import { TipSuggestionIndexOutOfRange } from '../exceptions/tip-suggestion-index-out-of-range.exception'

export interface CloseOrderPaymentInput {
  method: 'CASH' | 'CARD' | 'TRANSFER'
  amount: number
}

export interface CloseOrderSplitInput {
  label: string
  itemIds: string[]
  payment: CloseOrderPaymentInput
}

export type CloseOrderTipSelection = { kind: 'NONE' } | { kind: 'INDEX'; index: number }

export class CloseOrder {
  constructor(
    private readonly repository: OrderRepository,
    private readonly findOrder: FindOrder,
    private readonly eventBus: EventBus,
    private readonly establishmentSettingsPort: EstablishmentSettingsPort
  ) {}

  async run(
    orderId: string,
    payments: CloseOrderPaymentInput[],
    closedBy: string,
    tipSelection: CloseOrderTipSelection,
    splits?: CloseOrderSplitInput[] | null,
    customerDocumentType?: string,
    customerDocumentNumber?: string
  ): Promise<void> {
    const order = await this.findOrder.run(orderId)
    const tipAmount = await this.resolveTipAmount(order, tipSelection)

    order.close(
      payments,
      closedBy,
      tipAmount,
      splits,
      customerDocumentType ?? null,
      customerDocumentNumber ?? null
    )
    await this.repository.save(order)
    await this.eventBus.publish(order.pullDomainEvents())
  }

  private async resolveTipAmount(
    order: { subtotal: { amount: number }; discountTotal: { amount: number } },
    tipSelection: CloseOrderTipSelection
  ): Promise<number | null> {
    if (tipSelection.kind === 'NONE') {
      return null
    }

    const { index } = tipSelection
    const settings = await this.establishmentSettingsPort.resolve()
    if (settings.tipSuggestions === null) {
      throw new TipSuggestionsNotConfigured()
    }

    if (index < 0 || index >= settings.tipSuggestions.length) {
      throw new TipSuggestionIndexOutOfRange(index)
    }

    const netBase = order.subtotal.amount - order.discountTotal.amount
    const tipAmount = netBase * settings.tipSuggestions[index]
    return Math.round(tipAmount * 100) / 100
  }
}
