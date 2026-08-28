import { DomainException } from '@shared/domain/exceptions/domain.exception'
import { EventCascadeDepthExceeded } from '@shared/domain/exceptions/event-cascade-depth-exceeded.exception'

describe('EventCascadeDepthExceeded', () => {
  it('extends DomainException', () => {
    const exception = new EventCascadeDepthExceeded(10)

    expect(exception).toBeInstanceOf(DomainException)
  })

  it('carries a message referencing the exceeded depth limit', () => {
    const exception = new EventCascadeDepthExceeded(10)

    expect(exception.message).toContain('10')
  })

  it('reflects a different configured limit in the message', () => {
    const exception = new EventCascadeDepthExceeded(5)

    expect(exception.message).toContain('5')
  })
})
