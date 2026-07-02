import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUniqueSingletonToBillingConfigs1782970000000 implements MigrationInterface {
  name = 'AddUniqueSingletonToBillingConfigs1782970000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE billing_configs ADD COLUMN singleton_guard integer NOT NULL DEFAULT 1`)
    await queryRunner.query(`ALTER TABLE billing_configs ADD CONSTRAINT uq_billing_configs_singleton CHECK (singleton_guard = 1)`)
    await queryRunner.query(`ALTER TABLE billing_configs ADD CONSTRAINT uq_billing_configs_singleton_unique UNIQUE (singleton_guard)`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE billing_configs DROP CONSTRAINT uq_billing_configs_singleton_unique`)
    await queryRunner.query(`ALTER TABLE billing_configs DROP CONSTRAINT uq_billing_configs_singleton`)
    await queryRunner.query(`ALTER TABLE billing_configs DROP COLUMN singleton_guard`)
  }
}
