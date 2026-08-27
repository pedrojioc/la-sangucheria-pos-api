import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderStatusToKitchenBoardItemsMigration1787431738264 implements MigrationInterface {
    name = 'AddOrderStatusToKitchenBoardItemsMigration1787431738264'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "kitchen_board_items" ADD COLUMN IF NOT EXISTS "order_status" character varying(20) NOT NULL DEFAULT 'OPEN'`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate":0.08,"type":"INC","inclusive":true}'`);
        await queryRunner.query(`ALTER TABLE "kitchen_board_items" ALTER COLUMN "item_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "enabled_order_types" SET DEFAULT '["DINE_IN","DELIVERY","TAKEOUT"]'`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "payment_methods" SET DEFAULT '["CASH","CARD"]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "payment_methods" SET DEFAULT '["CASH", "CARD"]'`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "enabled_order_types" SET DEFAULT '["DINE_IN", "DELIVERY", "TAKEOUT"]'`);
        await queryRunner.query(`ALTER TABLE "kitchen_board_items" ALTER COLUMN "item_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate": 0.08, "type": "INC", "inclusive": true}'`);
        await queryRunner.query(`ALTER TABLE "kitchen_board_items" DROP COLUMN "order_status"`);
    }

}
