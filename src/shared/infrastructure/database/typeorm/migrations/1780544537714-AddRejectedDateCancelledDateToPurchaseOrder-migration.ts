import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRejectedDateCancelledDateToPurchaseOrderMigration1780544537714 implements MigrationInterface {
    name = 'AddRejectedDateCancelledDateToPurchaseOrderMigration1780544537714'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase_orders" ADD "rejected_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" ADD "cancelled_date" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase_orders" DROP COLUMN "cancelled_date"`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" DROP COLUMN "rejected_date"`);
    }

}
