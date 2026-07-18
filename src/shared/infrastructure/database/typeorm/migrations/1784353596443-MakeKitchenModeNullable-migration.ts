import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeKitchenModeNullableMigration1784353596443 implements MigrationInterface {
  name = 'MakeKitchenModeNullableMigration1784353596443'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "kitchen_mode" DROP NOT NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "kitchen_mode" SET NOT NULL`)
  }
}
