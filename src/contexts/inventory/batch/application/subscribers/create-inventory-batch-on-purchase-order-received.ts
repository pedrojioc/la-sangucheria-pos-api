import { DomainEventClass, DomainEventSubscriber } from '@/shared/domain/events'
import { PurchaseOrderItemReceivedEvent } from '@/contexts/procurement/purchase-order/domain/events/purchase-order-item-received.event'
import { RegisterPurchase } from '../register-purchase/register-purchase'
import { Uuid } from '@/shared/domain/value-objects/uuid'

export class CreateInventoryBatchOnPurchaseOrderReceived
  implements DomainEventSubscriber<PurchaseOrderItemReceivedEvent>
{
  constructor(private readonly registerPurchase: RegisterPurchase) {}

  subscribedTo(): DomainEventClass[] {
    return [PurchaseOrderItemReceivedEvent]
  }

  async on(event: PurchaseOrderItemReceivedEvent): Promise<void> {
    console.log('CreateInventoryBatchOnPurchaseOrderReceived', event)
    const payload = event.toPrimitives()

    await this.registerPurchase.run(
      Uuid.random().value,
      payload.ingredientId,
      payload.quantityReceived,
      payload.unitId,
      payload.unitCost,
      payload.currency,
      payload.receivedDate,
      null,
      payload.supplierId,
      payload.orderNumber
    )
  }
}

// ? Si la orden se completó debe cerrarse automáticamente.
// ? En una prueba que se realizó, se registró la recepción de los items pero la orden quedó en estado "PARTIALLY_RECEIVED" a pesar de que se recibieron todos los items. Esto se debe a que el cierre de la orden es una acción manual (closeOrder=true) y no se activa automáticamente al recibir todos los items. Para solucionar esto, se podría implementar una lógica adicional en el método registerBatchReception para verificar si todos los items han sido recibidos y, si es así, cerrar automáticamente la orden.
