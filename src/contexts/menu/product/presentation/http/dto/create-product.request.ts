import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  MaxLength
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateProductRequest {
  @IsUUID()
  id: string

  @IsString()
  @MaxLength(100)
  name: string

  @IsUUID()
  categoryId: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number

  @IsString()
  @MaxLength(20)
  sku: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null

  @IsOptional()
  @IsUUID()
  recipeId?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  preparationTime?: number | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  imageFile?: Express.Multer.File
}
