import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class OrderItemStationUnresolved extends BusinessRuleViolationException {
  constructor() {
    super(
      'Uno o más productos no tienen una estación de cocina asignada. ' +
        'Contacte a un administrador para configurar la categoría del producto'
    )
  }
}
