import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import {
  PairingCode,
  PairingCodeStatus
} from '@contexts/kitchen-operations/pairing-code/domain/pairing-code'
import { PairingCodeRepository } from '@contexts/kitchen-operations/pairing-code/domain/repositories/pairing-code.repository'
import { PairingCodeEntity } from './pairing-code.entity'

@Injectable()
export class TypeOrmPairingCodeRepository implements PairingCodeRepository {
  constructor(
    @InjectRepository(PairingCodeEntity)
    private readonly repository: Repository<PairingCodeEntity>
  ) {}

  async save(pairingCode: PairingCode): Promise<void> {
    const p = pairingCode.toPrimitives()
    await this.repository.save({
      id: p.id,
      code: p.code,
      status: p.status,
      expiresAt: p.expiresAt,
      credentialId: p.credentialId,
      deliveredAt: p.deliveredAt
    })
  }

  async findByCode(code: string): Promise<PairingCode | null> {
    const entity = await this.repository.findOne({ where: { code } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  private toDomain(entity: PairingCodeEntity): PairingCode {
    return PairingCode.fromPrimitives({
      id: entity.id,
      code: entity.code,
      status: entity.status as PairingCodeStatus,
      expiresAt: entity.expiresAt,
      credentialId: entity.credentialId,
      deliveredAt: entity.deliveredAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    })
  }
}
