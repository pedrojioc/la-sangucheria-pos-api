import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CqrsModule } from '@nestjs/cqrs'
import { RoleModule } from '@contexts/iam/role/role.module'

// Entities
import { UserEntity } from './infrastructure/persistence/typeorm/user.entity'

// Repositories
import { UserRepository } from './domain/repositories/user.repository'
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm/typeorm-user.repository'

// Query Services
import { UserQueryService } from './application/services/user-query.service'
import { TypeOrmUserQueryService } from './infrastructure/query-services/typeorm-user-query.service'

// Services
import { PasswordHasher } from './domain/services/password-hasher'
import { Argon2PasswordHasher } from './infrastructure/services/argon2-password-hasher.service'

// Use Cases
import { RegisterUser } from './application/register/register-user'
import { FindUser } from './application/find/find-user'
import { UpdateUser } from './application/update/update-user'
import { DeactivateUser } from './application/deactivate/deactivate-user'
import { ActivateUser } from './application/activate/activate-user'
import { SearchUsersByCriteria } from './application/search-by-criteria/search-users-by-criteria'

// Handlers
import { RegisterUserHandler } from './application/register/register-user.handler'
import { FindUserHandler } from './application/find/find-user.handler'
import { UpdateUserHandler } from './application/update/update-user.handler'
import { DeactivateUserHandler } from './application/deactivate/deactivate-user.handler'
import { ActivateUserHandler } from './application/activate/activate-user.handler'
import { SearchUsersByCriteriaHandler } from './application/search-by-criteria/search-users-by-criteria.handler'

// Controllers
import { UserController } from './presentation/http/controllers/user.controller'

// Guards
import { RolesGuard } from '@contexts/iam/authentication/infrastructure/guards/roles.guard'

// Utils
import { createProvider } from '@/core/utils/create-provider'
import { EventBus } from '@/shared/domain/events'

const CommandHandlers = [
  RegisterUserHandler,
  UpdateUserHandler,
  DeactivateUserHandler,
  ActivateUserHandler
]
const QueryHandlers = [FindUserHandler, SearchUsersByCriteriaHandler]

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), CqrsModule, RoleModule],
  controllers: [UserController],
  providers: [
    // Repositories
    { provide: UserRepository, useClass: TypeOrmUserRepository },

    // Query Services
    { provide: UserQueryService, useClass: TypeOrmUserQueryService },

    // Services
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },

    // Use Cases
    createProvider(RegisterUser, [UserRepository, PasswordHasher, EventBus]),
    createProvider(FindUser, [UserRepository]),
    createProvider(UpdateUser, [UserRepository]),
    createProvider(DeactivateUser, [UserRepository]),
    createProvider(ActivateUser, [UserRepository]),
    createProvider(SearchUsersByCriteria, [UserQueryService]),

    // Guards
    RolesGuard,

    // Handlers
    ...CommandHandlers,
    ...QueryHandlers
  ],
  exports: [UserRepository, PasswordHasher, FindUser, RegisterUser]
})
export class UserModule {}
