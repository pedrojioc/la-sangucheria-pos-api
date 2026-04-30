import { MigrationInterface, QueryRunner } from "typeorm";

export class AddItemCountToPurchaseOrderMigration1766208356359 implements MigrationInterface {
    name = 'AddItemCountToPurchaseOrderMigration1766208356359'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add column with default 0
        await queryRunner.query(`ALTER TABLE "purchase_orders" ADD "item_count" integer NOT NULL DEFAULT '0'`);

        // 2. Update existing records with actual item counts
        await queryRunner.query(`
            UPDATE "purchase_orders" po
            SET "item_count" = (
                SELECT COUNT(*)
                FROM "purchase_order_items" poi
                WHERE poi.purchase_order_id = po.id
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase_orders" DROP COLUMN "item_count"`);
    }

}
