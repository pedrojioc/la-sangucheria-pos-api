import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBillingConfigsTableMigration1782943241517 implements MigrationInterface {
    name = 'CreateBillingConfigsTableMigration1782943241517'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "billing_configs" ("id" uuid NOT NULL, "factus_api_token" text NOT NULL, "factus_api_base_url" text NOT NULL, "factus_test_mode" boolean NOT NULL DEFAULT true, "resolucion_prefix" character varying(20) NOT NULL, "resolucion_from" bigint NOT NULL, "resolucion_to" bigint NOT NULL, "resolucion_valid_from" date NOT NULL, "resolucion_valid_to" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ef9225c14d8be9d0aa1c0f7c532" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate":0.08,"type":"INC","inclusive":true}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate": 0.08, "type": "INC", "inclusive": true}'`);
        await queryRunner.query(`DROP TABLE "billing_configs"`);
    }

}
