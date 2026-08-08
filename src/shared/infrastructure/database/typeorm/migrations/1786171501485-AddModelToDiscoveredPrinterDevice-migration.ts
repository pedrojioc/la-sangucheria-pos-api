import { MigrationInterface, QueryRunner } from "typeorm";

export class AddModelToDiscoveredPrinterDeviceMigration1786171501485 implements MigrationInterface {
    name = 'AddModelToDiscoveredPrinterDeviceMigration1786171501485'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "discovered_printer_devices" ADD "model" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "discovered_printer_devices" DROP COLUMN "model"`);
    }

}
