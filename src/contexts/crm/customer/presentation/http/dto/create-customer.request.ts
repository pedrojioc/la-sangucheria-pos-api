import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength
} from 'class-validator'
import { DOCUMENT_TYPES, DocumentTypeValue } from '../../../domain/customer-document-type'
import { TAX_REGIMES, TaxRegimeValue } from '../../../domain/customer-tax-regime'

export class CreateCustomerRequest {
  @IsUUID()
  @IsNotEmpty()
  id: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone: string

  @IsEnum(DOCUMENT_TYPES)
  documentType: DocumentTypeValue

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  documentNumber: string

  @IsEnum(TAX_REGIMES)
  taxRegime: TaxRegimeValue

  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string

  @IsString()
  @IsOptional()
  notes?: string
}
