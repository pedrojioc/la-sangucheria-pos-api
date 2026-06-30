import {
  IsString,
  IsBoolean,
  IsInt,
  IsOptional,
  IsNotEmpty,
  IsUUID,
  MaxLength,
  Min
} from 'class-validator'

export class UpdateProductCategoryRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description: string | null

  @IsString()
  @IsOptional()
  @MaxLength(50)
  icon: string | null

  @IsString()
  @IsOptional()
  @MaxLength(50)
  color: string | null

  @IsBoolean()
  isActive: boolean

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number

  @IsOptional()
  @IsUUID()
  defaultStationId?: string | null
}
