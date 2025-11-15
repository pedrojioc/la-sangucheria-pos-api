import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUnitConversionsTableMigration1762020530701 implements MigrationInterface {
    name = 'AddUnitConversionsTableMigration1762020530701'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "unit_conversions" ("id" uuid NOT NULL, "from_unit_id" uuid NOT NULL, "to_unit_id" uuid NOT NULL, "factor" numeric(15,6) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ab0bd99230762eb14eb8f5ca435" UNIQUE ("from_unit_id", "to_unit_id"), CONSTRAINT "PK_26f4340a0a834dbe6cf8b241c71" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1fbed7a1bd08a292130296d8c4" ON "unit_conversions" ("from_unit_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e63eb21cc9b526e3c953f353f5" ON "unit_conversions" ("to_unit_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ab0bd99230762eb14eb8f5ca43" ON "unit_conversions" ("from_unit_id", "to_unit_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_ab0bd99230762eb14eb8f5ca43"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e63eb21cc9b526e3c953f353f5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1fbed7a1bd08a292130296d8c4"`);
        await queryRunner.query(`DROP TABLE "unit_conversions"`);
    }

}
