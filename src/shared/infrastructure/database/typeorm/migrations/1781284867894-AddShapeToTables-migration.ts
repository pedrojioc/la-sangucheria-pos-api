import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShapeToTablesMigration1781284867894 implements MigrationInterface {
    name = 'AddShapeToTablesMigration1781284867894'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tables" ADD "shape" character varying(20) NOT NULL DEFAULT 'SQUARE'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tables" DROP COLUMN "shape"`);
    }

}
