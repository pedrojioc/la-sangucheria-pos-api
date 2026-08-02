import { ExecutionContext, HttpException } from '@nestjs/common'
import { PairingIpThrottleGuard } from '@contexts/kitchen-operations/agent-gateway/infrastructure/guards/pairing-ip-throttle.guard'

function buildContext(handlerName: string, ip: string, body: Record<string, unknown> = {}) {
  const request = { ip, body }
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({ name: handlerName })
  } as unknown as ExecutionContext
}

describe('PairingIpThrottleGuard', () => {
  let guard: PairingIpThrottleGuard

  beforeEach(() => {
    guard = new PairingIpThrottleGuard()
  })

  describe('start throttling', () => {
    it('allows a single start request', () => {
      expect(guard.canActivate(buildContext('start', '10.0.0.1'))).toBe(true)
    })

    it('rejects a second start request from the same IP within the min interval', () => {
      guard.canActivate(buildContext('start', '10.0.0.1'))

      expect(() => guard.canActivate(buildContext('start', '10.0.0.1'))).toThrow(HttpException)
    })

    it('does not throttle a different IP', () => {
      guard.canActivate(buildContext('start', '10.0.0.1'))

      expect(guard.canActivate(buildContext('start', '10.0.0.2'))).toBe(true)
    })

    it('rejects once the outstanding-codes-per-IP limit is reached, even after the min-interval has elapsed', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
      const ip = '10.0.0.3'
      const START_MIN_INTERVAL_MS = 5000
      const MAX_OUTSTANDING = 10

      for (let i = 0; i < MAX_OUTSTANDING; i++) {
        expect(guard.canActivate(buildContext('start', ip))).toBe(true)
        jest.advanceTimersByTime(START_MIN_INTERVAL_MS + 1)
      }

      expect(() => guard.canActivate(buildContext('start', ip))).toThrow(HttpException)

      jest.useRealTimers()
    })

    it('allows a new start once earlier outstanding codes have aged past the pairing code TTL', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
      const ip = '10.0.0.4'
      const START_MIN_INTERVAL_MS = 5000
      const MAX_OUTSTANDING = 10
      const PAIRING_CODE_TTL_MS = 10 * 60 * 1000

      for (let i = 0; i < MAX_OUTSTANDING; i++) {
        expect(guard.canActivate(buildContext('start', ip))).toBe(true)
        jest.advanceTimersByTime(START_MIN_INTERVAL_MS + 1)
      }
      expect(() => guard.canActivate(buildContext('start', ip))).toThrow(HttpException)

      jest.advanceTimersByTime(PAIRING_CODE_TTL_MS + 1)

      expect(guard.canActivate(buildContext('start', ip))).toBe(true)

      jest.useRealTimers()
    })
  })

  describe('poll throttling', () => {
    it('allows a single poll request', () => {
      expect(guard.canActivate(buildContext('poll', '10.0.0.1', { code: 'ABC234' }))).toBe(true)
    })

    it('rejects a second poll request for the same (ip, code) within the min interval', () => {
      guard.canActivate(buildContext('poll', '10.0.0.1', { code: 'ABC234' }))

      expect(() => guard.canActivate(buildContext('poll', '10.0.0.1', { code: 'ABC234' }))).toThrow(
        HttpException
      )
    })

    it('does not throttle a different code from the same IP', () => {
      guard.canActivate(buildContext('poll', '10.0.0.1', { code: 'ABC234' }))

      expect(guard.canActivate(buildContext('poll', '10.0.0.1', { code: 'XYZ999' }))).toBe(true)
    })

    it('is independent of the start throttle (does not affect it)', () => {
      guard.canActivate(buildContext('poll', '10.0.0.1', { code: 'ABC234' }))

      expect(guard.canActivate(buildContext('start', '10.0.0.1'))).toBe(true)
    })
  })

  describe('scope', () => {
    it('does not throttle unrelated handlers', () => {
      expect(guard.canActivate(buildContext('redeem', '10.0.0.1'))).toBe(true)
      expect(guard.canActivate(buildContext('redeem', '10.0.0.1'))).toBe(true)
    })
  })
})
