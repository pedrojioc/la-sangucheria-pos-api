import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsOptional
} from 'class-validator'

export class RegisterUserRequest {
  @IsUUID()
  @IsNotEmpty()
  id: string

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  username: string

  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password: string

  @IsString()
  @IsOptional()
  @MaxLength(200)
  fullName?: string

  @IsUUID()
  @IsNotEmpty()
  roleId: string
}
