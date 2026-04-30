import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdatePositionRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string

  @IsString()
  @IsOptional()
  @MaxLength(50)
  color?: string

  @IsString()
  @IsOptional()
  @MaxLength(100)
  icon?: string
}
