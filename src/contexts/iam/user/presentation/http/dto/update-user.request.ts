import { IsEmail, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'

export class UpdateUserRequest {
  @IsString()
  @MaxLength(50)
  username: string

  @IsEmail()
  @MaxLength(255)
  email: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string

  @IsUUID()
  roleId: string
}
