import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'

import { CloseOrderRequest } from '@contexts/orders/order/presentation/http/dto/close-order.request'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

function basePayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    payments: [{ method: 'CASH', amount: 10000 }],
    closedBy: UuidMother.random(),
    ...overrides
  }
}

describe('CloseOrderRequest — tipSelection validation', () => {
  it('rejects a request missing tipSelection entirely', async () => {
    const dto = plainToInstance(CloseOrderRequest, basePayload())

    const errors = await validate(dto)

    const tipSelectionError = errors.find(error => error.property === 'tipSelection')
    expect(tipSelectionError).toBeDefined()
  })

  it('accepts tipSelection with kind NONE', async () => {
    const dto = plainToInstance(CloseOrderRequest, basePayload({ tipSelection: { kind: 'NONE' } }))

    const errors = await validate(dto)

    expect(errors).toHaveLength(0)
  })

  it('accepts tipSelection with kind INDEX and a valid index', async () => {
    const dto = plainToInstance(
      CloseOrderRequest,
      basePayload({ tipSelection: { kind: 'INDEX', index: 1 } })
    )

    const errors = await validate(dto)

    expect(errors).toHaveLength(0)
  })

  it('rejects tipSelection with kind INDEX and an out-of-range index', async () => {
    const dto = plainToInstance(
      CloseOrderRequest,
      basePayload({ tipSelection: { kind: 'INDEX', index: 3 } })
    )

    const errors = await validate(dto)

    const tipSelectionError = errors.find(error => error.property === 'tipSelection')
    expect(tipSelectionError).toBeDefined()
  })

  it('rejects tipSelection with kind INDEX and no index provided', async () => {
    const dto = plainToInstance(CloseOrderRequest, basePayload({ tipSelection: { kind: 'INDEX' } }))

    const errors = await validate(dto)

    const tipSelectionError = errors.find(error => error.property === 'tipSelection')
    expect(tipSelectionError).toBeDefined()
  })

  it('rejects the legacy free-form tip payload (no tipSelection)', async () => {
    const dto = plainToInstance(CloseOrderRequest, basePayload({ tip: 15000 }))

    const errors = await validate(dto)

    const tipSelectionError = errors.find(error => error.property === 'tipSelection')
    expect(tipSelectionError).toBeDefined()
    expect(dto.tipSelection).toBeUndefined()
  })
})
