import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColorAndIconToPositionsMigration1776455322542 implements MigrationInterface {
    name = 'AddColorAndIconToPositionsMigration1776455322542'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "positions" ADD "color" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "positions" ADD "icon" character varying(100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "positions" DROP COLUMN "icon"`);
        await queryRunner.query(`ALTER TABLE "positions" DROP COLUMN "color"`);
    }

}
