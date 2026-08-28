import { INTERCEPTORS_METADATA } from '@nestjs/common/constants'

import { AgentPairingController } from '@contexts/kitchen-operations/agent-gateway/presentation/http/agent-pairing.controller'
import { TransactionInterceptor } from '@shared/infrastructure/unit-of-work/transaction.interceptor'

/**
 * Slice 6 Group A — proves `AgentPairingController.redeem` carries
 * `@UseInterceptors(TransactionInterceptor)`.
 *
 * Root cause this closes: `RedeemPairingCode.run()` calls
 * `IssueAgentCredential.run()` (which itself may save a superseded
 * credential AND save the new one) and then separately
 * `repository.save(pairingCode)` — three writes across two different
 * `TransactionalRepository` instances (AgentCredential, PairingCode). Without
 * an ambient transaction, a failure partway leaves an issued credential with
 * no PairingCode row ever marking it consumed/attached.
 *
 * Same Reflect.getMetadata pattern as Slice 6 Group B — no HTTP/DI bootstrap.
 */
describe('AgentPairingController — TransactionInterceptor wiring (Slice 6 Group A)', () => {
  const readInterceptors = (methodName: keyof AgentPairingController): unknown[] => {
    const handler = AgentPairingController.prototype[methodName] as unknown as (
      ...args: unknown[]
    ) => unknown
    return (Reflect.getMetadata(INTERCEPTORS_METADATA, handler) as unknown[]) ?? []
  }

  it('redeem carries TransactionInterceptor — POST /agent-pairing/redeem (RedeemPairingCode)', () => {
    expect(readInterceptors('redeem')).toContain(TransactionInterceptor)
  })

  it.each([
    ['status', 'GET /agent-pairing/status (read-only, no interceptor needed)'],
    ['unpair', 'DELETE /agent-pairing (single write, no interceptor needed)']
  ] as const)('%s does NOT carry TransactionInterceptor — %s', (methodName, _description) => {
    expect(readInterceptors(methodName)).not.toContain(TransactionInterceptor)
  })
})
