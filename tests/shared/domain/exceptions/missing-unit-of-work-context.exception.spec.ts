import { DomainException } from '@shared/domain/exceptions/domain.exception'
import { MissingUnitOfWorkContext } from '@shared/domain/exceptions/missing-unit-of-work-context.exception'

describe('MissingUnitOfWorkContext', () => {
  it('extends DomainException', () => {
    const exception = new MissingUnitOfWorkContext('ReleaseTableOnOrderClosed', 'order.closed')

    expect(exception).toBeInstanceOf(DomainException)
  })

  it('carries a message identifying the subscriber and event that needed an ambient transaction', () => {
    const exception = new MissingUnitOfWorkContext('ReleaseTableOnOrderClosed', 'order.closed')

    expect(exception.message).toContain('ReleaseTableOnOrderClosed')
    expect(exception.message).toContain('order.closed')
    expect(exception.message).toContain('@UseInterceptors(TransactionInterceptor)')
  })

  it('reflects a different subscriber/event pair in the message', () => {
    const exception = new MissingUnitOfWorkContext(
      'CreateInventoryLevelOnIngredientCreated',
      'ingredient.created'
    )

    expect(exception.message).toContain('CreateInventoryLevelOnIngredientCreated')
    expect(exception.message).toContain('ingredient.created')
  })
})
