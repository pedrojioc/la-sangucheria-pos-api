import { MigrationInterface, QueryRunner } from 'typeorm'

const OLD_ID = '00000000-0000-0000-0000-000000000001'
const NEW_ID = 'ae0adae1-ddb6-4524-bfdc-873a1f406371'

export class FixEstablishmentSingletonIdMigration1783434167574 implements MigrationInterface {
  name = 'FixEstablishmentSingletonIdMigration1783434167574'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "establishments" SET "id" = $1 WHERE "id" = $2`, [NEW_ID, OLD_ID])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "establishments" SET "id" = $1 WHERE "id" = $2`, [OLD_ID, NEW_ID])
  }
}
