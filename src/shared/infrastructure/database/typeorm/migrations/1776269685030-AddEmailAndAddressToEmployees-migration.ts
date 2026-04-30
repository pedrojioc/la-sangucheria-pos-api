import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailAndAddressToEmployeesMigration1776269685030 implements MigrationInterface {
    name = 'AddEmailAndAddressToEmployeesMigration1776269685030'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" ADD "email" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "employees" ADD "address" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_8b14204e8af5e371e36b8c11e1b" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_8b14204e8af5e371e36b8c11e1b"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "email"`);
    }

}
