import {
  IsString,
  IsBoolean,
  IsInt,
  IsUUID,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  Min
} from 'class-validator'

export class CreateProductCategoryRequest {
  @IsUUID()
  @IsNotEmpty()
  id: string

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

  @IsBoolean()
  isActive: boolean

  @IsInt()
  @Min(0)
  displayOrder: number
}
