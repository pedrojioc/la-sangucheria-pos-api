import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import {
  PairingCode,
  PairingCodeStatus
} from '@contexts/kitchen-operations/pairing-code/domain/pairing-code'
import { PairingCodeRepository } from '@contexts/kitchen-operations/pairing-code/domain/repositories/pairing-code.repository'
import { PairingCodeEntity } from './pairing-code.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

@Injectable()
export class TypeOrmPairingCodeRepository
  extends TransactionalRepository<PairingCodeEntity>
  implements PairingCodeRepository
{
  constructor(
    @InjectRepository(PairingCodeEntity)
    repository: Repository<PairingCodeEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(pairingCode: PairingCode): Promise<void> {
    const p = pairingCode.toPrimitives()
    await this.repo.save({
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
    const entity = await this.repo.findOne({ where: { code } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async compareAndWipePendingSecret(id: string, now: Date): Promise<PairingCode | null> {
    // Read first to capture the plaintext secret (the conditional UPDATE
    // below wipes it, so it must not be re-read afterwards). The WHERE
    // clause on the UPDATE is the actual race-closer AND the TTL-expiry
    // guard: only one concurrent caller's UPDATE affects a row, and an
    // expired-but-present secret must never win it either — both properties
    // live in the same atomic compare-and-wipe (design obs #311; TTL gap
    // closed per verify-report obs #319 CRITICAL finding).
    const entity = await this.repo.findOne({ where: { id } })
    if (!entity || entity.pendingSecret === null) return null

    const capturedSecret = entity.pendingSecret

    const result = await this.repo
      .createQueryBuilder()
      .update(PairingCodeEntity)
      .set({ pendingSecret: null, deliveredAt: now })
      .where('id = :id', { id })
      .andWhere('pending_secret IS NOT NULL')
      .andWhere('pending_secret_expires_at > :now', { now })
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
