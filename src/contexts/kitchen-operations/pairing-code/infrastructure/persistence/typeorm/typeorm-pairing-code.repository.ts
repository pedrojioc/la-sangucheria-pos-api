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
      deliveredAt: p.deliveredAt,
      pollTokenHash: p.pollTokenHash,
      pendingSecret: p.pendingSecret,
      pendingSecretExpiresAt: p.pendingSecretExpiresAt
    })
  }

  async findByCode(code: string): Promise<PairingCode | null> {
    const entity = await this.repository.findOne({ where: { code } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async compareAndWipePendingSecret(id: string, now: Date): Promise<PairingCode | null> {
    // Read first to capture the plaintext secret (the conditional UPDATE
    // below wipes it, so it must not be re-read afterwards). The WHERE
    // clause on the UPDATE is the actual race-closer: only one concurrent
    // caller's UPDATE affects a row, regardless of what either caller read.
    const entity = await this.repository.findOne({ where: { id } })
    if (!entity || entity.pendingSecret === null) return null

    const capturedSecret = entity.pendingSecret

    const result = await this.repository
      .createQueryBuilder()
      .update(PairingCodeEntity)
      .set({ pendingSecret: null, deliveredAt: now })
      .where('id = :id', { id })
      .andWhere('pending_secret IS NOT NULL')
      .execute()

    const wonRace = (result.affected ?? 0) > 0
    if (!wonRace) return null

    return PairingCode.fromPrimitives({
      id: entity.id,
      code: entity.code,
      status: entity.status as PairingCodeStatus,
      expiresAt: entity.expiresAt,
      credentialId: entity.credentialId,
      deliveredAt: now,
      createdAt: entity.createdAt,
      updatedAt: now,
      pollTokenHash: entity.pollTokenHash,
      pendingSecret: capturedSecret,
      pendingSecretExpiresAt: entity.pendingSecretExpiresAt
    })
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
      updatedAt: entity.updatedAt,
      pollTokenHash: entity.pollTokenHash,
      pendingSecret: entity.pendingSecret,
      pendingSecretExpiresAt: entity.pendingSecretExpiresAt
    })
  }
}
