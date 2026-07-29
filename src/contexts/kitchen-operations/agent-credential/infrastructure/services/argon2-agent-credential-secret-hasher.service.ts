import { Injectable } from '@nestjs/common'
import * as argon2 from 'argon2'
import { AgentCredentialSecretHasher } from '../../domain/services/agent-credential-secret-hasher'

@Injectable()
export class Argon2AgentCredentialSecretHasher implements AgentCredentialSecretHasher {
  private readonly options: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 131072, // 128 MiB
    timeCost: 3,
    parallelism: 4
  }

  async hash(plainSecret: string): Promise<string> {
    return argon2.hash(plainSecret, this.options)
  }

  async verify(plainSecret: string, hashedSecret: string): Promise<boolean> {
    try {
      return await argon2.verify(hashedSecret, plainSecret)
    } catch (error) {
      return false
    }
  }
}
