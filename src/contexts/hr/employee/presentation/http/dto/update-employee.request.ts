import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
  ValidateNested
} from 'class-validator'
import { Type } from 'class-transformer'
import { EMPLOYEE_STATUSES, EmployeeStatusValue } from '../../../domain/employee-status'
import { SalaryRequest } from './create-employee.request'

export class UpdateEmployeeRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string

  @IsUUID()
  @IsOptional()
  positionId?: string

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string

  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string

  @IsDateString()
  @IsOptional()
  hireDate?: string

  @IsEnum(EMPLOYEE_STATUSES)
  @IsOptional()
  status?: EmployeeStatusValue

  @IsString()
  @IsOptional()
  notes?: string

  @ValidateIf(o => o.salary !== undefined)
  @ValidateNested()
  @Type(() => SalaryRequest)
  @IsOptional()
  salary?: SalaryRequest
}
