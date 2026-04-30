import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'

export class CreatePositionRequest {
  @IsUUID()
  @IsNotEmpty()
  id: string

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
