import { MigrationInterface, QueryRunner } from "typeorm";

export class SplitEmployeeNameIntoFirstAndLastNameMigration1776219443751 implements MigrationInterface {
    name = 'SplitEmployeeNameIntoFirstAndLastNameMigration1776219443751'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_ede58bf474d1eaea7ce2738300"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "first_name" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "last_name" character varying(100) NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_5ebe4c8d2f7317ccd7d4e28fb9" ON "employees" ("last_name") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_5ebe4c8d2f7317ccd7d4e28fb9"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "last_name"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "first_name"`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "name" character varying(200) NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_ede58bf474d1eaea7ce2738300" ON "employees" ("name") `);
    }

}
