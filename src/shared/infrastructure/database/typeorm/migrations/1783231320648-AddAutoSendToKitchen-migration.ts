import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAutoSendToKitchenMigration1783231320648 implements MigrationInterface {
    name = 'AddAutoSendToKitchenMigration1783231320648'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "billing_configs" DROP CONSTRAINT "uq_billing_configs_singleton"`);
        await queryRunner.query(`ALTER TABLE "establishments" ADD "auto_send_to_kitchen" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate":0.08,"type":"INC","inclusive":true}'`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "enabled_order_types" SET DEFAULT '["DINE_IN","DELIVERY","TAKEOUT"]'`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "payment_methods" SET DEFAULT '["CASH","CARD"]'`);
        await queryRunner.query(`ALTER TABLE "billing_configs" DROP CONSTRAINT "uq_billing_configs_singleton_unique"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "billing_configs" ADD CONSTRAINT "uq_billing_configs_singleton_unique" UNIQUE ("singleton_guard")`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "payment_methods" SET DEFAULT '["CASH", "CARD"]'`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "enabled_order_types" SET DEFAULT '["DINE_IN", "DELIVERY", "TAKEOUT"]'`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate": 0.08, "type": "INC", "inclusive": true}'`);
        await queryRunner.query(`ALTER TABLE "establishments" DROP COLUMN "auto_send_to_kitchen"`);
        await queryRunner.query(`ALTER TABLE "billing_configs" ADD CONSTRAINT "uq_billing_configs_singleton" CHECK ((singleton_guard = 1))`);
    }

}
