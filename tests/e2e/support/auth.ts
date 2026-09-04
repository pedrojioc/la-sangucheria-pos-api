import { JwtService } from '@/contexts/iam/authentication/domain/services/jwt.service'

export interface SignAccessTokenOptions {
  userId?: string
  username?: string
  email?: string
}

const DEFAULT_USER_ID = '11111111-1111-4111-8111-111111111111'
const DEFAULT_USERNAME = 'e2e-test-user'
const DEFAULT_EMAIL = 'e2e-test-user@example.test'

/**
 * Mints an access token via the real `Rs256JwtService.generateAccessToken()`
 * (resolved from the app's DI container under the `JwtService` provide
 * token, design D3/D4) instead of hand-rolling `jwt.sign()`. This keeps the
 * harness's token payload/signing-options contract bound to production code
 * — if `Rs256JwtService` ever changes shape, the harness changes with it
 * instead of silently drifting. No DB user, role, or argon2 hash is seeded,
 * and no `/auth/login` round trip happens — `JwtStrategy.validate()` only
 * maps the token payload, it never touches the database, so signing the
 * token directly is sufficient to exercise the real `JwtAuthGuard` end to
 * end.
 */
export function signAccessToken(
  jwtService: JwtService,
  options: SignAccessTokenOptions = {}
): Promise<string> {
  return jwtService.generateAccessToken({
    id: options.userId ?? DEFAULT_USER_ID,
    username: options.username ?? DEFAULT_USERNAME,
    email: options.email ?? DEFAULT_EMAIL
  })
}
