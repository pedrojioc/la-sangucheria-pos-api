import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PassportModule } from '@nestjs/passport'

// Module dependencies
import { UserModule } from '@/contexts/iam/user/user.module'
import { RoleModule } from '@/contexts/iam/role/role.module'
import { RoleRepository } from '@/contexts/iam/role/domain/repositories/role.repository'

// Infrastructure
import { RefreshTokenEntity } from './infrastructure/persistence/typeorm/refresh-token.entity'
import { TypeOrmRefreshTokenRepository } from './infrastructure/persistence/typeorm/typeorm-refresh-token.repository'
import { Rs256JwtService } from './infrastructure/services/rs256-jwt.service'
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy'
import { JwtRefreshStrategy } from './infrastructure/strategies/jwt-refresh.strategy'
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard'
import { JwtRefreshGuard } from './infrastructure/guards/jwt-refresh.guard'
import { RolesGuard } from './infrastructure/guards/roles.guard'

// Domain
import { RefreshTokenRepository } from './domain/repositories/refresh-token.repository'
import { JwtService } from './domain/services/jwt.service'

// Application
import { Login } from './application/login/login'
import { RefreshTokenUseCase } from './application/refresh-token/refresh-token'
import { Logout } from './application/logout/logout'

// Presentation
import { AuthController } from './presentation/http/controllers/auth.controller'

// Shared
import { createProvider } from '@/core/utils/create-provider'
import { EventBus } from '@/shared/domain/events'
import { UserRepository } from '@/contexts/iam/user/domain/repositories/user.repository'
import { PasswordHasher } from '@/contexts/iam/user/domain/services/password-hasher'

const useCaseProviders = [
  createProvider(Login, [
    UserRepository,
    RefreshTokenRepository,
    PasswordHasher,
    JwtService,
    EventBus
  ]),
  createProvider(RefreshTokenUseCase, [
    UserRepository,
    RefreshTokenRepository,
    JwtService,
    EventBus
  ]),
  createProvider(Logout, [RefreshTokenRepository, EventBus])
]

@Module({
  imports: [TypeOrmModule.forFeature([RefreshTokenEntity]), PassportModule, UserModule, RoleModule],
  controllers: [AuthController],
  providers: [
    // Repositories
    {
      provide: RefreshTokenRepository,
      useClass: TypeOrmRefreshTokenRepository
    },

    // Services
    {
      provide: JwtService,
      useClass: Rs256JwtService
    },

    // Strategies
    JwtStrategy,
    JwtRefreshStrategy,

    // Guards
    JwtAuthGuard,
    JwtRefreshGuard,
    RolesGuard,

    // Use Cases
    ...useCaseProviders
  ],
  exports: [JwtAuthGuard, JwtRefreshGuard, RolesGuard, JwtService]
})
export class AuthenticationModule {}
