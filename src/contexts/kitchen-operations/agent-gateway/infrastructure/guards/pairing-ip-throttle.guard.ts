import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable
} from '@nestjs/common'
import { PAIRING_CODE_TTL_MS } from '@contexts/kitchen-operations/pairing-code/domain/pairing-code'

// Hand-rolled per-IP sliding-window throttle for the unauthenticated
// start/poll pairing endpoints — no @nestjs/throttler dependency (not in
// this repo, not worth adding for LAN-scoped endpoints). See design
// Decision (d). Replaces the removed WS per-socket.id limiter
// (MIN_INTERVAL_BETWEEN_REQUESTS_MS / MAX_OUTSTANDING_CODES).
const START_MIN_INTERVAL_MS = 5000
const START_MAX_OUTSTANDING_PER_IP = 10
const POLL_MIN_INTERVAL_MS = 2000

@Injectable()
export class PairingIpThrottleGuard implements CanActivate {
  private readonly lastStartAtByIp = new Map<string, number>()
  // "Outstanding" codes issued per IP, self-expiring after PAIRING_CODE_TTL_MS
  // (the guard has no visibility into redemption status, so it approximates
  // "unredeemed" with "not yet TTL-expired" — the same 10-minute window the
  // pairing code itself uses).
  private readonly outstandingStartTimesByIp = new Map<string, number[]>()
  private readonly lastPollAtByIpAndCode = new Map<string, number>()

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const ip = this.resolveIp(request)
    const handlerName = context.getHandler().name

    if (handlerName === 'start') {
      return this.checkStart(ip)
    }
    if (handlerName === 'poll') {
      const code = request.body?.code as string | undefined
      return this.checkPoll(ip, code)
    }
    return true
  }

  private checkStart(ip: string): boolean {
    const now = Date.now()

    const lastAt = this.lastStartAtByIp.get(ip)
    if (lastAt !== undefined && now - lastAt < START_MIN_INTERVAL_MS) {
      throw new HttpException('Too many pairing start requests', HttpStatus.TOO_MANY_REQUESTS)
    }

    const outstanding = this.pruneAndGetOutstanding(ip, now)
    if (outstanding.length >= START_MAX_OUTSTANDING_PER_IP) {
      throw new HttpException(
        'Too many outstanding pairing codes for this address',
        HttpStatus.TOO_MANY_REQUESTS
      )
    }

    this.lastStartAtByIp.set(ip, now)
    outstanding.push(now)
    this.outstandingStartTimesByIp.set(ip, outstanding)
    return true
  }

  private checkPoll(ip: string, code: string | undefined): boolean {
    const key = `${ip}:${code ?? ''}`
    const lastAt = this.lastPollAtByIpAndCode.get(key)
    if (lastAt !== undefined && Date.now() - lastAt < POLL_MIN_INTERVAL_MS) {
      throw new HttpException('Too many pairing poll requests', HttpStatus.TOO_MANY_REQUESTS)
    }

    this.lastPollAtByIpAndCode.set(key, Date.now())
    return true
  }

  private pruneAndGetOutstanding(ip: string, now: number): number[] {
    const existing = this.outstandingStartTimesByIp.get(ip) ?? []
    return existing.filter(startedAt => now - startedAt < PAIRING_CODE_TTL_MS)
  }

  private resolveIp(request: { ip?: string; socket?: { remoteAddress?: string } }): string {
    return request.ip ?? request.socket?.remoteAddress ?? 'unknown'
  }
}
