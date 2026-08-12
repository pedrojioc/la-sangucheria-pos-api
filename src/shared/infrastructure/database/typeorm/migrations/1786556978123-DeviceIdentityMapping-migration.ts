import { MigrationInterface, QueryRunner } from "typeorm";

export class DeviceIdentityMappingMigration1786556978123 implements MigrationInterface {
    name = 'DeviceIdentityMappingMigration1786556978123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stations" DROP COLUMN "printer_address"`);
        await queryRunner.query(`ALTER TABLE "stations" DROP COLUMN "connection_type"`);
        await queryRunner.query(`ALTER TABLE "stations" DROP COLUMN "usb_identifier"`);
        await queryRunner.query(`ALTER TABLE "stations" ADD "discovered_printer_device_id" uuid`);
        await queryRunner.query(`ALTER TABLE "stations" ADD CONSTRAINT "FK_c5bf37c0bf6ee25938d4e0dfdaf" FOREIGN KEY ("discovered_printer_device_id") REFERENCES "discovered_printer_devices"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stations" DROP CONSTRAINT "FK_c5bf37c0bf6ee25938d4e0dfdaf"`);
        await queryRunner.query(`ALTER TABLE "stations" DROP COLUMN "discovered_printer_device_id"`);
        await queryRunner.query(`ALTER TABLE "stations" ADD "usb_identifier" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "stations" ADD "connection_type" character varying(10) NOT NULL DEFAULT 'network'`);
        await queryRunner.query(`ALTER TABLE "stations" ADD "printer_address" character varying(255)`);
    }

}
