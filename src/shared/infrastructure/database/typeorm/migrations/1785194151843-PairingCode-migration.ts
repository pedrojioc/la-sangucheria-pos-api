import { MigrationInterface, QueryRunner } from "typeorm";

export class PairingCodeMigration1785194151843 implements MigrationInterface {
    name = 'PairingCodeMigration1785194151843'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "pairing_codes" ("id" uuid NOT NULL, "code" character varying(6) NOT NULL, "status" character varying(10) NOT NULL DEFAULT 'issued', "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "credential_id" uuid, "delivered_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_08509f00aaa786863d624b68fb1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_91fed1211749e4a8cca176111d" ON "pairing_codes" ("code") `);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate":0.08,"type":"INC","inclusive":true}'`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "enabled_order_types" SET DEFAULT '["DINE_IN","DELIVERY","TAKEOUT"]'`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "payment_methods" SET DEFAULT '["CASH","CARD"]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "payment_methods" SET DEFAULT '["CASH", "CARD"]'`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "enabled_order_types" SET DEFAULT '["DINE_IN", "DELIVERY", "TAKEOUT"]'`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate": 0.08, "type": "INC", "inclusive": true}'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_91fed1211749e4a8cca176111d"`);
        await queryRunner.query(`DROP TABLE "pairing_codes"`);
    }

}
