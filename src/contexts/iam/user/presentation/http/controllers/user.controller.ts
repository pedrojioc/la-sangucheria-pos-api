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
import { RegisterUserRequest } from '../dto/register-user.request'
import { UpdateUserRequest } from '../dto/update-user.request'
import { SearchUsersRequest } from '../dto/search-users.request'
import { RegisterUser } from '../../../application/register/register-user'
import { UpdateUser } from '../../../application/update/update-user'
import { DeactivateUser } from '../../../application/deactivate/deactivate-user'
import { ActivateUser } from '../../../application/activate/activate-user'
import { FindUser } from '../../../application/find/find-user'
import { SearchUsersByCriteria } from '../../../application/search-by-criteria/search-users-by-criteria'
import { UserResponse } from '../../../application/dto/user.response'
import { PaginatedUserListResponse } from '../../../application/dto/paginated-user-list.response'
import { RolesGuard } from '@/contexts/iam/authentication/infrastructure/guards/roles.guard'
import { Roles } from '@/contexts/iam/shared/decorators/roles.decorator'

@Controller('users')
export class UserController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly updateUser: UpdateUser,
    private readonly deactivateUser: DeactivateUser,
    private readonly activateUser: ActivateUser,
    private readonly findUser: FindUser,
    private readonly searchUsersByCriteria: SearchUsersByCriteria
  ) {}

  @Post('register')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async register(@Body() dto: RegisterUserRequest): Promise<void> {
    await this.registerUser.run(
      dto.id,
      dto.username,
      dto.email,
      dto.password,
      dto.fullName ?? null,
      dto.roleId
    )
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserRequest): Promise<void> {
    await this.updateUser.run(id, dto.username, dto.email, dto.fullName ?? null, dto.roleId)
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id') id: string): Promise<void> {
    await this.deactivateUser.run(id)
  }

  @Patch(':id/activate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async activate(@Param('id') id: string): Promise<void> {
    await this.activateUser.run(id)
  }

  @Get()
  async search(@Query() dto: SearchUsersRequest): Promise<PaginatedUserListResponse> {
    const result = await this.searchUsersByCriteria.run(dto.toCriteria())
    return new PaginatedUserListResponse(result.data, result.meta)
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserResponse> {
    const user = await this.findUser.run(id)
    return UserResponse.fromDomain(user)
  }
}
