import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min
} from 'class-validator'

export class CreateSupplierRequest {
  @IsUUID()
  @IsNotEmpty()
  id: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contactName?: string

  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email?: string

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string

  @IsString()
  @IsOptional()
  @MaxLength(20)
  whatsappNumber?: string

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string

  @IsString()
  @IsOptional()
  @MaxLength(50)
  taxId?: string

  @IsString()
  @IsOptional()
  @MaxLength(200)
  paymentTerms?: string

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number

  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
