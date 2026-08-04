import { createHash } from 'crypto'
import { PollPairingCode } from '@contexts/kitchen-operations/pairing-code/application/poll/poll-pairing-code'
import { PairingCodeRepository } from '@contexts/kitchen-operations/pairing-code/domain/repositories/pairing-code.repository'
import { PairingCodeNotRedeemable } from '@contexts/kitchen-operations/pairing-code/domain/exceptions/pairing-code-not-redeemable.exception'
import { PairingCode } from '@contexts/kitchen-operations/pairing-code/domain/pairing-code'
import { PairingCodeMother } from '../__mothers__/pairing-code.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

const POLL_TOKEN = 'correct-poll-token'
const POLL_TOKEN_HASH = createHash('sha256').update(POLL_TOKEN).digest('hex')

describe('PollPairingCode', () => {
  function mockRepository(overrides: Partial<jest.Mocked<PairingCodeRepository>> = {}) {
    return {
      save: jest.fn(),
      findByCode: jest.fn(),
      compareAndWipePendingSecret: jest.fn(),
      ...overrides
    } as unknown as jest.Mocked<PairingCodeRepository>
  }

  it('returns pending before admin redemption, regardless of pollToken correctness', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    const pairingCode = PairingCodeMother.create({ status: 'issued', credentialId: null })
    const repository = mockRepository({ findByCode: jest.fn().mockResolvedValue(pairingCode) })
    const useCase = new PollPairingCode(repository)

    const result = await useCase.run(pairingCode.code, 'any-token', now)

    expect(result).toEqual({ status: 'pending' })
    expect(repository.compareAndWipePendingSecret).not.toHaveBeenCalled()
  })

  it('returns ready with the exact issued apiKey when redeemed and pollToken matches', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    const pairingCode = PairingCodeMother.create({
      status: 'consumed',
      credentialId: UuidMother.random(),
      pollTokenHash: POLL_TOKEN_HASH,
      pendingSecret: 'lspa_secret',
      pendingSecretExpiresAt: new Date(now.getTime() + 60 * 1000),
      deliveredAt: null
    })
    const wiped = PairingCode.fromPrimitives({
      ...pairingCode.toPrimitives(),
      deliveredAt: now
    })
    const repository = mockRepository({
      findByCode: jest.fn().mockResolvedValue(pairingCode),
      compareAndWipePendingSecret: jest.fn().mockResolvedValue(wiped)
    })
    const useCase = new PollPairingCode(repository)

    const result = await useCase.run(pairingCode.code, POLL_TOKEN, now)

    expect(result).toEqual({ status: 'ready', apiKey: 'lspa_secret' })
    expect(repository.compareAndWipePendingSecret).toHaveBeenCalledWith(pairingCode.id.value, now)
  })

  it('atomic wipe: a second poll after successful delivery returns delivered, never the apiKey again', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    const pairingCode = PairingCodeMother.create({
      status: 'consumed',
      credentialId: UuidMother.random(),
      deliveredAt: now
    })
    const repository = mockRepository({ findByCode: jest.fn().mockResolvedValue(pairingCode) })
    const useCase = new PollPairingCode(repository)

    const result = await useCase.run(pairingCode.code, POLL_TOKEN, now)

    expect(result).toEqual({ status: 'delivered' })
    expect(repository.compareAndWipePendingSecret).not.toHaveBeenCalled()
  })

  it('returns delivered (not an error) when the compare-and-wipe loses the race to a concurrent poll', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    const pairingCode = PairingCodeMother.create({
      status: 'consumed',
      credentialId: UuidMother.random(),
      pollTokenHash: POLL_TOKEN_HASH,
      pendingSecret: 'lspa_secret',
      pendingSecretExpiresAt: new Date(now.getTime() + 60 * 1000),
      deliveredAt: null
    })
    const repository = mockRepository({
      findByCode: jest.fn().mockResolvedValue(pairingCode),
      compareAndWipePendingSecret: jest.fn().mockResolvedValue(null)
    })
    const useCase = new PollPairingCode(repository)

    const result = await useCase.run(pairingCode.code, POLL_TOKEN, now)

    expect(result).toEqual({ status: 'delivered' })
  })

  it('never returns the apiKey when the pendingSecret has TTL-expired, even with a valid pollToken', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    const pairingCode = PairingCodeMother.create({
      status: 'consumed',
      credentialId: UuidMother.random(),
      pollTokenHash: POLL_TOKEN_HASH,
      pendingSecret: 'lspa_secret',
      pendingSecretExpiresAt: new Date(now.getTime() - 1000),
      deliveredAt: null
    })
    const repository = mockRepository({
      findByCode: jest.fn().mockResolvedValue(pairingCode),
      compareAndWipePendingSecret: jest.fn().mockResolvedValue(null)
    })
    const useCase = new PollPairingCode(repository)

    const result = await useCase.run(pairingCode.code, POLL_TOKEN, now)

    expect(result).toEqual({ status: 'delivered' })
  })

  it('never returns the apiKey with a WRONG pollToken — same generic response as pending, no oracle', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    const pairingCode = PairingCodeMother.create({
      status: 'consumed',
      credentialId: UuidMother.random(),
      pollTokenHash: POLL_TOKEN_HASH,
      pendingSecret: 'lspa_secret',
      pendingSecretExpiresAt: new Date(now.getTime() + 60 * 1000),
      deliveredAt: null
    })
    const repository = mockRepository({ findByCode: jest.fn().mockResolvedValue(pairingCode) })
    const useCase = new PollPairingCode(repository)

    const result = await useCase.run(pairingCode.code, 'wrong-token', now)

    expect(result).toEqual({ status: 'pending' })
    expect(repository.compareAndWipePendingSecret).not.toHaveBeenCalled()
  })

  it('rejects poll on an unknown code with the same 404-equivalent as redeem', async () => {
    const repository = mockRepository({ findByCode: jest.fn().mockResolvedValue(null) })
    const useCase = new PollPairingCode(repository)

    await expect(useCase.run('ZZZ999', 'any-token')).rejects.toThrow(PairingCodeNotRedeemable)
  })

  it('rejects poll on an expired, never-redeemed code with a 409-equivalent', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    const pairingCode = PairingCodeMother.expired(now)
    const repository = mockRepository({ findByCode: jest.fn().mockResolvedValue(pairingCode) })
    const useCase = new PollPairingCode(repository)

    await expect(useCase.run(pairingCode.code, 'any-token', now)).rejects.toThrow(
      PairingCodeNotRedeemable
    )
  })
})
