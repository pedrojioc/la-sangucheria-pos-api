import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { CreateRoleRequest } from '../dto/create-role.request'
import { UpdateRoleRequest } from '../dto/update-role.request'
import { CreateRoleCommand } from '../../../application/create/create-role.command'
import { UpdateRoleCommand } from '../../../application/update/update-role.command'
import { DeleteRoleCommand } from '../../../application/delete/delete-role.command'
import { FindRoleQuery } from '../../../application/find/find-role.query'
import { FindAllRolesQuery } from '../../../application/find-all/find-all-roles.query'
import { RoleResponse } from '../../../application/dto/role.response'

@Controller('roles')
export class RoleController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  async create(@Body() dto: CreateRoleRequest): Promise<void> {
    await this.commandBus.execute(new CreateRoleCommand(dto.id, dto.name, dto.description ?? null))
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateRoleRequest): Promise<void> {
    await this.commandBus.execute(new UpdateRoleCommand(id, dto.name, dto.description ?? null))
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteRoleCommand(id))
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<RoleResponse> {
    return this.queryBus.execute(new FindRoleQuery(id))
  }

  @Get()
  async findAll(): Promise<RoleResponse[]> {
    return this.queryBus.execute(new FindAllRolesQuery())
  }
}
