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
import { CreateRoleRequest } from '../dto/create-role.request'
import { UpdateRoleRequest } from '../dto/update-role.request'
import { CreateRole } from '../../../application/create/create-role'
import { UpdateRole } from '../../../application/update/update-role'
import { DeleteRole } from '../../../application/delete/delete-role'
import { FindRole } from '../../../application/find/find-role'
import { FindAllRoles } from '../../../application/find-all/find-all-roles'
import { RoleResponse } from '../../../application/dto/role.response'

@Controller('roles')
export class RoleController {
  constructor(
    private readonly createRole: CreateRole,
    private readonly updateRole: UpdateRole,
    private readonly deleteRole: DeleteRole,
    private readonly findRole: FindRole,
    private readonly findAllRoles: FindAllRoles
  ) {}

  @Post()
  async create(@Body() dto: CreateRoleRequest): Promise<void> {
    await this.createRole.run(dto.id, dto.name, dto.description ?? null)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateRoleRequest): Promise<void> {
    await this.updateRole.run(id, dto.name, dto.description ?? null)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteRole.run(id)
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<RoleResponse> {
    const role = await this.findRole.run(id)
    return RoleResponse.fromDomain(role)
  }

  @Get()
  async findAll(): Promise<RoleResponse[]> {
    const roles = await this.findAllRoles.run()
    return roles.map(RoleResponse.fromDomain)
  }
}
