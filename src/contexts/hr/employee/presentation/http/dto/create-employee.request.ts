import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested
} from 'class-validator'
import { Type } from 'class-transformer'
import { EMPLOYEE_STATUSES, EmployeeStatusValue } from '../../../domain/employee-status'
import { SALARY_BASES, SalaryBasisValue } from '../../../domain/employee-salary-basis'
import {
  PAYMENT_FREQUENCIES,
  PaymentFrequencyValue
} from '../../../domain/employee-payment-frequency'

export class SalaryRequest {
  @IsInt()
  @Min(0)
  amount: number

  @IsEnum(SALARY_BASES)
  basis: SalaryBasisValue

  @IsEnum(PAYMENT_FREQUENCIES)
  paymentFrequency: PaymentFrequencyValue
}

export class CreateEmployeeRequest {
  @IsUUID()
  @IsNotEmpty()
  id: string

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
