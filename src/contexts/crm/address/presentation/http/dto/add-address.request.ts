import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested
} from 'class-validator'
import { Type } from 'class-transformer'

export class CoordinatesRequest {
  @IsNumber()
  lat: number

  @IsNumber()
  lng: number
}

export class AddAddressRequest {
  @IsUUID()
  @IsNotEmpty()
  id: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  street: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  city: string

  @IsString()
  @IsOptional()
  @MaxLength(200)
  neighborhood?: string

  @IsString()
  @IsOptional()
  reference?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesRequest)
  coordinates?: CoordinatesRequest
}
