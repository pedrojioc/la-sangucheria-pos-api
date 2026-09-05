import { Controller, Post, Body, Req, Res, HttpCode, UseGuards, Get } from '@nestjs/common'
import { Request, Response } from 'express'
import { LoginRequest } from '../dto/login.request'
import { Login } from '../../../application/login/login'
import { RefreshTokenUseCase } from '../../../application/refresh-token/refresh-token'
import { Logout } from '../../../application/logout/logout'
import { LoginResponse } from '../../../application/dto/login.response'
import { RefreshTokenResponse } from '../../../application/dto/refresh-token.response'
import { Public } from '@/contexts/iam/shared/decorators/public.decorator'
import { CurrentUser } from '@/contexts/iam/shared/decorators/current-user.decorator'
import { JwtRefreshGuard } from '../../../infrastructure/guards/jwt-refresh.guard'
import { FindUser } from '@/contexts/iam/user/application/find/find-user'
import { UserResponse } from '@/contexts/iam/user/application/dto/user.response'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: Login,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: Logout,
    private readonly findUser: FindUser
  ) {}

  @Post('login')
  @Public()
  @HttpCode(200)
  async login(
    @Body() dto: LoginRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<LoginResponse> {
    const result = await this.loginUseCase.run(
      dto.username,
      dto.password,
      req.ip || null,
      req.headers['user-agent'] || null
    )

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    return LoginResponse.fromLoginResult(result)
  }

  @Post('refresh')
  @Public()
  @UseGuards(JwtRefreshGuard)
  @HttpCode(200)
  async refresh(
    @CurrentUser() user: { userId: string; jti: string; refreshToken: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<RefreshTokenResponse> {
    const result = await this.refreshTokenUseCase.run(
      user.refreshToken,
      user.userId,
      user.jti,
      req.ip || null,
      req.headers['user-agent'] || null
    )

    // Set new refresh token as HttpOnly cookie (token rotation)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    return RefreshTokenResponse.fromResult(result)
  }

  @Post('logout')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(204)
  async logout(
    @CurrentUser() user: { jti: string },
    @Res({ passthrough: true }) res: Response
  ): Promise<void> {
    await this.logoutUseCase.run(user.jti)

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
  }

  @Get('me')
  async getCurrentUser(@CurrentUser() user: { userId: string }): Promise<UserResponse> {
    return UserResponse.fromDomain(await this.findUser.run(user.userId))
  }
}
