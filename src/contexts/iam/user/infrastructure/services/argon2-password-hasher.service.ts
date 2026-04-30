import { Injectable } from '@nestjs/common'
import * as argon2 from 'argon2'
import { PasswordHasher } from '../../domain/services/password-hasher'

@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  private readonly options: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 131072, // 128 MiB
    timeCost: 3,
    parallelism: 4
  }

  async hash(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword, this.options)
  }

  async verify(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword)
    } catch (error) {
      return false
    }
  }
}
