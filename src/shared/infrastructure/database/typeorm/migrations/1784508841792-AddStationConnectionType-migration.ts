import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStationConnectionTypeMigration1784508841792 implements MigrationInterface {
    name = 'AddStationConnectionTypeMigration1784508841792'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stations" ADD "connection_type" character varying(10) NOT NULL DEFAULT 'network'`);
        await queryRunner.query(`ALTER TABLE "stations" ADD "usb_identifier" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stations" DROP COLUMN "usb_identifier"`);
        await queryRunner.query(`ALTER TABLE "stations" DROP COLUMN "connection_type"`);
    }

}
