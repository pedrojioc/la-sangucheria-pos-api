import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubmittedByCancelledByToPurchaseOrderMigration1780515831290 implements MigrationInterface {
    name = 'AddSubmittedByCancelledByToPurchaseOrderMigration1780515831290'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase_orders" ADD "submitted_by" uuid`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" ADD "cancelled_by" uuid`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" ADD "submitted_date" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase_orders" DROP COLUMN "submitted_date"`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" DROP COLUMN "cancelled_by"`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" DROP COLUMN "submitted_by"`);
    }

}
