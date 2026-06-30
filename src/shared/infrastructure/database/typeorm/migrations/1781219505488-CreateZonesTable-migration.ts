import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateZonesTableMigration1781219505488 implements MigrationInterface {
    name = 'CreateZonesTableMigration1781219505488'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "zones" ("id" uuid NOT NULL, "name" character varying(50) NOT NULL, "color" character varying(20) NOT NULL, "sort_index" smallint NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4f5b05ffd4b4daee685dea35ed4" UNIQUE ("name"), CONSTRAINT "PK_880484a43ca311707b05895bd4a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4f5b05ffd4b4daee685dea35ed" ON "zones" ("name") `);
        await queryRunner.query(`ALTER TABLE "tables" ADD "zone_id" uuid`);
        await queryRunner.query(`ALTER TABLE "tables" ADD "position_x" numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "tables" ADD "position_y" numeric(5,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tables" DROP COLUMN "position_y"`);
        await queryRunner.query(`ALTER TABLE "tables" DROP COLUMN "position_x"`);
        await queryRunner.query(`ALTER TABLE "tables" DROP COLUMN "zone_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4f5b05ffd4b4daee685dea35ed"`);
        await queryRunner.query(`DROP TABLE "zones"`);
    }

}
