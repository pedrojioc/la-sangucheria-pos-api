import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as jwt from 'jsonwebtoken'
import * as crypto from 'crypto'
import {
  JwtService,
  TokenPayload,
  RefreshTokenPayload,
  RefreshTokenData
} from '../../domain/services/jwt.service'
import { TokenExpired } from '../../domain/exceptions/token-expired.exception'

@Injectable()
export class Rs256JwtService implements JwtService {
  private readonly privateKey: jwt.Secret
  private readonly publicKey: jwt.Secret
  private readonly issuer: string
  private readonly audience: string
  private readonly accessExpiration: string
  private readonly refreshExpiration: string

  constructor(private readonly configService: ConfigService) {
    this.privateKey = this.configService.get<string>('JWT_PRIVATE_KEY')!.replace(/\\n/g, '\n')
    this.publicKey = this.configService.get<string>('JWT_PUBLIC_KEY')!.replace(/\\n/g, '\n')
    this.issuer = this.configService.get<string>('JWT_ISSUER')!
    this.audience = this.configService.get<string>('JWT_AUDIENCE')!
    this.accessExpiration = this.configService.get<string>('JWT_ACCESS_EXPIRATION')!
    this.refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION')!
  }

  async generateAccessToken(user: {
    id: string
    username: string
    email: string
  }): Promise<string> {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email
    }

    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        this.privateKey,
        {
          algorithm: 'RS256',
          expiresIn: this.accessExpiration,
          issuer: this.issuer,
          audience: this.audience as string
        } as jwt.SignOptions,
        (err, token) => {
          if (err || !token) {
            reject(err)
          } else {
            resolve(token)
          }
        }
      )
    })
  }

  async generateRefreshToken(user: { id: string }): Promise<RefreshTokenData> {
    const jti = crypto.randomUUID()
    const payload = {
      sub: user.id,
      jti
    }

    const token = await new Promise<string>((resolve, reject) => {
      jwt.sign(
        payload,
        this.privateKey,
        {
          algorithm: 'RS256',
          expiresIn: this.refreshExpiration,
          issuer: this.issuer,
          audience: this.audience as string
        } as jwt.SignOptions,
        (err, token) => {
          if (err || !token) {
            reject(err)
          } else {
            resolve(token)
          }
        }
      )
    })

    const tokenHash = this.hashToken(token)
    const decoded = jwt.decode(token) as jwt.JwtPayload
    const expiresAt = new Date(decoded.exp! * 1000)

    return {
      token,
      jti,
      tokenHash,
      expiresAt
    }
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: this.issuer,
        audience: this.audience
      }) as TokenPayload

      return payload
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpired()
      }
      throw error
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: this.issuer,
        audience: this.audience
      }) as RefreshTokenPayload

      return payload
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpired()
      }
      throw error
    }
  }

  async verifyTokenHash(token: string, hash: string): Promise<boolean> {
    const tokenHash = this.hashToken(token)
    return tokenHash === hash
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }
}
