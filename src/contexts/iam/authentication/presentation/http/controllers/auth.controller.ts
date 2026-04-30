import { Controller, Post, Body, Req, Res, HttpCode, UseGuards, Get } from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { Request, Response } from 'express'
import { LoginRequest } from '../dto/login.request'
import { LoginCommand } from '../../../application/login/login.command'
import { RefreshTokenCommand } from '../../../application/refresh-token/refresh-token.command'
import { LogoutCommand } from '../../../application/logout/logout.command'
import { LoginResponse } from '../../../application/dto/login.response'
import { RefreshTokenResponse } from '../../../application/dto/refresh-token.response'
import { Public } from '@/contexts/iam/shared/decorators/public.decorator'
import { CurrentUser } from '@/contexts/iam/shared/decorators/current-user.decorator'
import { JwtRefreshGuard } from '../../../infrastructure/guards/jwt-refresh.guard'
import { FindUserQuery } from '@/contexts/iam/user/application/find/find-user.query'
import { UserResponse } from '@/contexts/iam/user/application/dto/user.response'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post('login')
  @Public()
  @HttpCode(200)
  async login(
    @Body() dto: LoginRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<LoginResponse> {
    const command = new LoginCommand(
      dto.username,
      dto.password,
      req.ip || null,
      req.headers['user-agent'] || null
    )

    const result = await this.commandBus.execute(command)

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
    const command = new RefreshTokenCommand(
      user.refreshToken,
      user.userId,
      user.jti,
      req.ip || null,
      req.headers['user-agent'] || null
    )

    const result = await this.commandBus.execute(command)

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
    const command = new LogoutCommand(user.jti)
    await this.commandBus.execute(command)

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
  }

  @Get('me')
  async getCurrentUser(@CurrentUser() user: { userId: string }): Promise<UserResponse> {
    const query = new FindUserQuery(user.userId)
    return this.queryBus.execute(query)
  }
}
