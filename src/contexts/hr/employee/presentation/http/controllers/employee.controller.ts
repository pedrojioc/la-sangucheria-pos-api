import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { CreateEmployeeRequest } from '../dto/create-employee.request'
import { UpdateEmployeeRequest } from '../dto/update-employee.request'
import { GrantEmployeeAccessRequest } from '../dto/grant-employee-access.request'
import { SearchEmployeesRequest } from '../dto/search-employees.request'
import { CreateEmployeeCommand } from '../../../application/create/create-employee.command'
import { UpdateEmployeeCommand } from '../../../application/update/update-employee.command'
import { DeleteEmployeeCommand } from '../../../application/delete/delete-employee.command'
import { FindEmployeeQuery } from '../../../application/find/find-employee.query'
import { SearchEmployeesByCriteriaQuery } from '../../../application/search-by-criteria/search-employees-by-criteria.query'
import { GrantEmployeeAccessCommand } from '../../../application/grant-access/grant-employee-access.command'
import { EmployeeResponse } from '../../../application/dto/employee.response'
import { PaginatedEmployeeListResponse } from '../../../application/dto/paginated-employee-list.response'

@Controller('employees')
export class EmployeeController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  async create(@Body() dto: CreateEmployeeRequest): Promise<void> {
    await this.commandBus.execute(
      new CreateEmployeeCommand(
        dto.id,
        dto.firstName,
        dto.lastName,
        dto.positionId ?? null,
        dto.phone ?? null,
        dto.email ?? null,
        dto.address ?? null,
        dto.hireDate ? new Date(dto.hireDate) : null,
        dto.status ?? 'active',
        dto.notes ?? null,
        dto.salary?.amount ?? null,
        dto.salary?.basis ?? null,
        dto.salary?.paymentFrequency ?? null
      )
    )
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEmployeeRequest): Promise<void> {
    await this.commandBus.execute(
      new UpdateEmployeeCommand(
        id,
        dto.firstName,
        dto.lastName,
        dto.positionId ?? null,
        dto.phone ?? null,
        dto.email ?? null,
        dto.address ?? null,
        dto.hireDate ? new Date(dto.hireDate) : null,
        dto.status ?? 'active',
        dto.notes ?? null,
        dto.salary?.amount ?? null,
        dto.salary?.basis ?? null,
        dto.salary?.paymentFrequency ?? null
      )
    )
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteEmployeeCommand(id))
  }

  @Post(':id/grant-access')
  @HttpCode(HttpStatus.NO_CONTENT)
  async grantAccess(
    @Param('id') employeeId: string,
    @Body() dto: GrantEmployeeAccessRequest
  ): Promise<void> {
    await this.commandBus.execute(
      new GrantEmployeeAccessCommand(
        employeeId,
        dto.userId,
        dto.username,
        dto.email,
        dto.password,
        dto.roleId
      )
    )
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<EmployeeResponse> {
    return this.queryBus.execute(new FindEmployeeQuery(id))
  }

  @Get()
  async search(@Query() dto: SearchEmployeesRequest): Promise<PaginatedEmployeeListResponse> {
    return this.queryBus.execute(new SearchEmployeesByCriteriaQuery(dto.toCriteria()))
  }
}
