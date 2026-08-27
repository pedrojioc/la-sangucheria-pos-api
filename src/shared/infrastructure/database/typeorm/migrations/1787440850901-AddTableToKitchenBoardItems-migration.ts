import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTableToKitchenBoardItemsMigration1787440850901 implements MigrationInterface {
    name = 'AddTableToKitchenBoardItemsMigration1787440850901'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "kitchen_board_items" ADD "table_id" uuid`);
        await queryRunner.query(`ALTER TABLE "kitchen_board_items" ADD "table_label" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate":0.08,"type":"INC","inclusive":true}'`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "enabled_order_types" SET DEFAULT '["DINE_IN","DELIVERY","TAKEOUT"]'`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "payment_methods" SET DEFAULT '["CASH","CARD"]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "payment_methods" SET DEFAULT '["CASH", "CARD"]'`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "enabled_order_types" SET DEFAULT '["DINE_IN", "DELIVERY", "TAKEOUT"]'`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate": 0.08, "type": "INC", "inclusive": true}'`);
        await queryRunner.query(`ALTER TABLE "kitchen_board_items" DROP COLUMN "table_label"`);
        await queryRunner.query(`ALTER TABLE "kitchen_board_items" DROP COLUMN "table_id"`);
    }

}
