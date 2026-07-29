import { MigrationInterface, QueryRunner } from "typeorm";

export class DiscoveredPrinterDeviceMigration1785282852529 implements MigrationInterface {
    name = 'DiscoveredPrinterDeviceMigration1785282852529'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "discovered_printer_devices" ("id" uuid NOT NULL, "establishment_id" uuid NOT NULL, "connection_type" character varying(10) NOT NULL, "address" character varying(255), "usb_identifier" character varying(255), "last_seen_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e854a334124d25d9bd9343ae117" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f0d4742abc15cf5912ffc06820" ON "discovered_printer_devices" ("establishment_id", "connection_type", "usb_identifier") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4e47e1cfaab34deeea5a0f23c8" ON "discovered_printer_devices" ("establishment_id", "connection_type", "address") `);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate":0.08,"type":"INC","inclusive":true}'`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "enabled_order_types" SET DEFAULT '["DINE_IN","DELIVERY","TAKEOUT"]'`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "payment_methods" SET DEFAULT '["CASH","CARD"]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "payment_methods" SET DEFAULT '["CASH", "CARD"]'`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "enabled_order_types" SET DEFAULT '["DINE_IN", "DELIVERY", "TAKEOUT"]'`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate": 0.08, "type": "INC", "inclusive": true}'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4e47e1cfaab34deeea5a0f23c8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f0d4742abc15cf5912ffc06820"`);
        await queryRunner.query(`DROP TABLE "discovered_printer_devices"`);
    }

}
