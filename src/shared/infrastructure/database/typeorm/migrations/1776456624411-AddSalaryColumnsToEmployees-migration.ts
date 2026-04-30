import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSalaryColumnsToEmployeesMigration1776456624411 implements MigrationInterface {
    name = 'AddSalaryColumnsToEmployeesMigration1776456624411'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" ADD "salary_amount" bigint`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "salary_basis" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "payment_frequency" character varying(20)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "payment_frequency"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "salary_basis"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "salary_amount"`);
    }

}
