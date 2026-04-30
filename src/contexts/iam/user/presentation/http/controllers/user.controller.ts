import {
  Controller,
  Post,
  Put,
  Patch,
  Body,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { RegisterUserRequest } from '../dto/register-user.request'
import { UpdateUserRequest } from '../dto/update-user.request'
import { SearchUsersRequest } from '../dto/search-users.request'
import { RegisterUserCommand } from '../../../application/register/register-user.command'
import { UpdateUserCommand } from '../../../application/update/update-user.command'
import { DeactivateUserCommand } from '../../../application/deactivate/deactivate-user.command'
import { ActivateUserCommand } from '../../../application/activate/activate-user.command'
import { FindUserQuery } from '../../../application/find/find-user.query'
import { SearchUsersByCriteriaQuery } from '../../../application/search-by-criteria/search-users-by-criteria.query'
import { UserResponse } from '../../../application/dto/user.response'
import { PaginatedUserListResponse } from '../../../application/dto/paginated-user-list.response'
import { RolesGuard } from '@/contexts/iam/authentication/infrastructure/guards/roles.guard'
import { Roles } from '@/contexts/iam/shared/decorators/roles.decorator'

@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post('register')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async register(@Body() dto: RegisterUserRequest): Promise<void> {
    await this.commandBus.execute(
      new RegisterUserCommand(
        dto.id,
        dto.username,
        dto.email,
        dto.password,
        dto.fullName ?? null,
        dto.roleId
      )
    )
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserRequest): Promise<void> {
    await this.commandBus.execute(
      new UpdateUserCommand(id, dto.username, dto.email, dto.fullName ?? null, dto.roleId)
    )
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeactivateUserCommand(id))
  }

  @Patch(':id/activate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async activate(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new ActivateUserCommand(id))
  }

  @Get()
  async search(@Query() dto: SearchUsersRequest): Promise<PaginatedUserListResponse> {
    return this.queryBus.execute(new SearchUsersByCriteriaQuery(dto.toCriteria()))
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserResponse> {
    return this.queryBus.execute(new FindUserQuery(id))
  }
}
