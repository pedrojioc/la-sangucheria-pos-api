import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEstablishmentExtendedConfigMigration1783198878679 implements MigrationInterface {
    name = 'AddEstablishmentExtendedConfigMigration1783198878679'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "establishments" ADD "operating_hours" jsonb`);
        await queryRunner.query(`ALTER TABLE "establishments" ADD "enabled_order_types" jsonb NOT NULL DEFAULT '["DINE_IN","DELIVERY","TAKEOUT"]'`);
        await queryRunner.query(`ALTER TABLE "establishments" ADD "service_charge" jsonb`);
        await queryRunner.query(`ALTER TABLE "establishments" ADD "tip_suggestions" jsonb`);
        await queryRunner.query(`ALTER TABLE "establishments" ADD "split_check" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "establishments" ADD "payment_methods" jsonb NOT NULL DEFAULT '["CASH","CARD"]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "establishments" DROP COLUMN "payment_methods"`);
        await queryRunner.query(`ALTER TABLE "establishments" DROP COLUMN "split_check"`);
        await queryRunner.query(`ALTER TABLE "establishments" DROP COLUMN "tip_suggestions"`);
        await queryRunner.query(`ALTER TABLE "establishments" DROP COLUMN "service_charge"`);
        await queryRunner.query(`ALTER TABLE "establishments" DROP COLUMN "enabled_order_types"`);
        await queryRunner.query(`ALTER TABLE "establishments" DROP COLUMN "operating_hours"`);
    }

}
