import {
  IsString,
  IsBoolean,
  IsInt,
  IsOptional,
  IsNotEmpty,
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

  @IsBoolean()
  isActive: boolean

  @IsInt()
  @Min(0)
  displayOrder: number
}
