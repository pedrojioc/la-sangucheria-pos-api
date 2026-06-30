import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRotationToTablesMigration1781393875226 implements MigrationInterface {
    name = 'AddRotationToTablesMigration1781393875226'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tables" ADD "rotation" smallint NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tables" DROP COLUMN "rotation"`);
    }

}
