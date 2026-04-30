import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHireDateToEmployeesMigration1776271784513 implements MigrationInterface {
    name = 'AddHireDateToEmployeesMigration1776271784513'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" ADD "hire_date" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "hire_date"`);
    }

}
