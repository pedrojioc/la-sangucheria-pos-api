import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class LoginRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  username: string

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password: string
}
