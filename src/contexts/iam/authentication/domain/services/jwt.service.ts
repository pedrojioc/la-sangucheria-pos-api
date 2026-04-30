export interface TokenPayload {
  sub: string
  username: string
  email: string
  iss: string
  aud: string
  exp: number
  iat: number
}

export interface RefreshTokenPayload {
  sub: string
  jti: string
  exp: number
  iat: number
}

export interface RefreshTokenData {
  token: string
  jti: string
  tokenHash: string
  expiresAt: Date
}

export abstract class JwtService {
  abstract generateAccessToken(user: {
    id: string
    username: string
    email: string
  }): Promise<string>
  abstract generateRefreshToken(user: { id: string }): Promise<RefreshTokenData>
  abstract verifyAccessToken(token: string): Promise<TokenPayload>
  abstract verifyRefreshToken(token: string): Promise<RefreshTokenPayload>
  abstract verifyTokenHash(token: string, hash: string): Promise<boolean>
}
