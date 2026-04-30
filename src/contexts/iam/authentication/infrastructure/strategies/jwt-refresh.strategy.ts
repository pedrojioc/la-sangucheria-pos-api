import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Request } from 'express'

export interface JwtRefreshPayload {
  sub: string
  jti: string
  exp: number
  iat: number
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.['refreshToken']
        }
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_PUBLIC_KEY')!.replace(/\\n/g, '\n'),
      algorithms: ['RS256'],
      issuer: configService.get<string>('JWT_ISSUER'),
      audience: configService.get<string>('JWT_AUDIENCE'),
      passReqToCallback: true
    })
  }

  async validate(request: Request, payload: JwtRefreshPayload) {
    const refreshToken = request.cookies['refreshToken']
    return {
      userId: payload.sub,
      jti: payload.jti,
      refreshToken
    }
  }
}
