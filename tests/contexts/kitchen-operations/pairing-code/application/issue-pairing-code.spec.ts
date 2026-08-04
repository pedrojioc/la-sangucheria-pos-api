import { createHash } from 'crypto'
import { IssuePairingCode } from '@contexts/kitchen-operations/pairing-code/application/issue/issue-pairing-code'
import { PairingCodeRepository } from '@contexts/kitchen-operations/pairing-code/domain/repositories/pairing-code.repository'

describe('IssuePairingCode', () => {
  function mockRepository() {
    return {
      save: jest.fn(),
      findByCode: jest.fn()
    } as unknown as jest.Mocked<PairingCodeRepository>
  }

  it('generates a code and persists it in status issued', async () => {
    const repository = mockRepository()
    const useCase = new IssuePairingCode(repository)

    const result = await useCase.run()

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0]
    expect(saved.getStatus()).toBe('issued')
    expect(result.code).toBe(saved.code)
    expect(result.expiresAt).toEqual(saved.expiresAt)
  })

  it('returns a plaintext pollToken while persisting only its sha256 hash', async () => {
    const repository = mockRepository()
    const useCase = new IssuePairingCode(repository)

    const result = await useCase.run()

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0]
    expect(result.pollToken).toMatch(/^[0-9a-f]{64}$/)
    expect(saved.getPollTokenHash()).toBe(
      createHash('sha256').update(result.pollToken).digest('hex')
    )
  })
})
