import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'

export class CreateRoleRequest {
  @IsUUID()
  @IsNotEmpty()
  id: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string
}
