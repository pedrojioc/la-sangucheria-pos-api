import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentsAndTipToOrdersMigration1781212748784 implements MigrationInterface {
    name = 'AddPaymentsAndTipToOrdersMigration1781212748784'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ADD "payments" jsonb`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "splits" jsonb`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "tip" numeric(12,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "tip"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "splits"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "payments"`);
    }

}
