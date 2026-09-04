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
  Query,
  UseInterceptors
} from '@nestjs/common'
import { TransactionInterceptor } from '@shared/infrastructure/unit-of-work/transaction.interceptor'
import { CreateEmployeeRequest } from '../dto/create-employee.request'
import { UpdateEmployeeRequest } from '../dto/update-employee.request'
import { GrantEmployeeAccessRequest } from '../dto/grant-employee-access.request'
import { SearchEmployeesRequest } from '../dto/search-employees.request'
import { CreateEmployee } from '../../../application/create/create-employee'
import { UpdateEmployee } from '../../../application/update/update-employee'
import { DeleteEmployee } from '../../../application/delete/delete-employee'
import { FindEmployee } from '../../../application/find/find-employee'
import { SearchEmployeesByCriteria } from '../../../application/search-by-criteria/search-employees-by-criteria'
import { GrantEmployeeAccess } from '../../../application/grant-access/grant-employee-access'
import { EmployeeResponse } from '../../../application/dto/employee.response'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'

@Controller('employees')
export class EmployeeController {
  constructor(
    private readonly createEmployee: CreateEmployee,
    private readonly updateEmployee: UpdateEmployee,
    private readonly deleteEmployee: DeleteEmployee,
    private readonly grantEmployeeAccess: GrantEmployeeAccess,
    private readonly findEmployee: FindEmployee,
    private readonly searchEmployeesByCriteria: SearchEmployeesByCriteria
  ) {}

  @Post()
  async create(@Body() dto: CreateEmployeeRequest): Promise<void> {
    await this.createEmployee.run(
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
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEmployeeRequest): Promise<void> {
    await this.updateEmployee.run(
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
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteEmployee.run(id)
  }

  @Post(':id/grant-access')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(TransactionInterceptor)
  async grantAccess(
    @Param('id') employeeId: string,
    @Body() dto: GrantEmployeeAccessRequest
  ): Promise<void> {
    await this.grantEmployeeAccess.run(
      employeeId,
      dto.userId,
      dto.username,
      dto.email,
      dto.password,
      dto.roleId
    )
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<EmployeeResponse> {
    return this.findEmployee.run(id)
  }

  @Get()
  async search(@Query() dto: SearchEmployeesRequest): Promise<PaginatedResult<EmployeeResponse>> {
    return this.searchEmployeesByCriteria.run(dto.toCriteria())
  }
}
