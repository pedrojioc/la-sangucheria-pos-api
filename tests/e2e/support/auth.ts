import * as jwt from 'jsonwebtoken'

export interface SignAccessTokenOptions {
  userId?: string
  username?: string
  email?: string
}

const DEFAULT_USER_ID = '11111111-1111-4111-8111-111111111111'
const DEFAULT_USERNAME = 'e2e-test-user'
const DEFAULT_EMAIL = 'e2e-test-user@example.test'

/**
 * Mints an access token in-process with the ephemeral RS256 keypair
 * `global-setup.ts` forces into `process.env` (design D3/D4). No DB user,
 * role, or argon2 hash is seeded, and no `/auth/login` round trip happens —
 * `JwtStrategy.validate()` only maps the token payload, it never touches the
 * database, so signing the token directly is sufficient to exercise the real
 * `JwtAuthGuard` end to end.
 */
export function signAccessToken(options: SignAccessTokenOptions = {}): string {
  const privateKey = process.env.JWT_PRIVATE_KEY
  const issuer = process.env.JWT_ISSUER
  const audience = process.env.JWT_AUDIENCE
  const expiresIn = process.env.JWT_ACCESS_EXPIRATION

  if (!privateKey || !issuer || !audience || !expiresIn) {
    throw new Error(
      'JWT_PRIVATE_KEY/JWT_ISSUER/JWT_AUDIENCE/JWT_ACCESS_EXPIRATION are not set. ' +
        'signAccessToken() must run after tests/e2e/support/global-setup.ts has forced them ' +
        '(only true when running via `pnpm test:e2e`).'
    )
  }

  const payload = {
    sub: options.userId ?? DEFAULT_USER_ID,
    username: options.username ?? DEFAULT_USERNAME,
    email: options.email ?? DEFAULT_EMAIL
  }

  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    issuer,
    audience,
    expiresIn
  } as jwt.SignOptions)
}
