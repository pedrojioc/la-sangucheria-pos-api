import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEstablishmentsTableMigration1782865568232 implements MigrationInterface {
    name = 'CreateEstablishmentsTableMigration1782865568232'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_kitchen_board_station_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_kitchen_board_order_id"`);
        await queryRunner.query(`CREATE TABLE "establishments" ("id" uuid NOT NULL, "name" character varying(200) NOT NULL, "display_name" character varying(200) NOT NULL, "legal_name" character varying(300) NOT NULL, "tax_id" character varying(50) NOT NULL, "phone" character varying(50), "email" character varying(200), "address" text, "logo_url" text, "website_url" text, "default_currency" character varying(3) NOT NULL, "default_tax_rate" numeric(5,4) NOT NULL, "default_tax_type" character varying(20) NOT NULL, "tax_inclusive" boolean NOT NULL DEFAULT true, "kitchen_mode" character varying(30) NOT NULL, "receipt_header" text, "receipt_footer" text, "timezone" character varying(100) NOT NULL, "locale" character varying(20) NOT NULL, "loyalty_enabled" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7fb6da6c365114ccb61b091bbdf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate":0.08,"type":"INC","inclusive":true}'`);
        await queryRunner.query(`CREATE INDEX "IDX_6fbc65a3ae3b022f5939eb541e" ON "kitchen_board_items" ("order_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_59af082f200b887ec3839835e4" ON "kitchen_board_items" ("station_id", "status") `);
        await queryRunner.query(`
            INSERT INTO "establishments" (
                "id", "name", "display_name", "legal_name", "tax_id",
                "default_currency", "default_tax_rate", "default_tax_type", "tax_inclusive",
                "kitchen_mode", "timezone", "locale", "loyalty_enabled"
            ) VALUES (
                '00000000-0000-0000-0000-000000000001',
                'Mi Establecimiento', 'Mi Establecimiento', 'Mi Establecimiento S.A.S.', '000000000-0',
                'COP', 0.0800, 'INC', true,
                'NONE', 'America/Bogota', 'es-CO', false
            ) ON CONFLICT (id) DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_59af082f200b887ec3839835e4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6fbc65a3ae3b022f5939eb541e"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate": 0.08, "type": "INC", "inclusive": true}'`);
        await queryRunner.query(`DROP TABLE "establishments"`);
        await queryRunner.query(`CREATE INDEX "IDX_kitchen_board_order_id" ON "kitchen_board_items" ("order_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_kitchen_board_station_status" ON "kitchen_board_items" ("station_id", "status") `);
    }

}
