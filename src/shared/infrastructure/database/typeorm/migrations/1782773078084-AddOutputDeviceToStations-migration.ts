import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOutputDeviceToStationsMigration1782773078084 implements MigrationInterface {
    name = 'AddOutputDeviceToStationsMigration1782773078084'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stations" ADD "output_device" character varying(10) NOT NULL DEFAULT 'kds'`);
        await queryRunner.query(`ALTER TABLE "stations" ADD "printer_address" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stations" DROP COLUMN "printer_address"`);
        await queryRunner.query(`ALTER TABLE "stations" DROP COLUMN "output_device"`);
    }

}
