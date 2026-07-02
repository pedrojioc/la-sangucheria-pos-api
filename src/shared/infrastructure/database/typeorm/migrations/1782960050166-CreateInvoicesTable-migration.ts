import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInvoicesTableMigration1782960050166 implements MigrationInterface {
    name = 'CreateInvoicesTableMigration1782960050166'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "invoices" ("id" character varying NOT NULL, "document_type" character varying(50) NOT NULL, "snapshot" jsonb NOT NULL, "status" character varying(20) NOT NULL, "cufe_cude" character varying(200), "factus_document_number" character varying(100), "failure_reason" text, "attempts" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate":0.08,"type":"INC","inclusive":true}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate": 0.08, "type": "INC", "inclusive": true}'`);
        await queryRunner.query(`DROP TABLE "invoices"`);
    }

}
