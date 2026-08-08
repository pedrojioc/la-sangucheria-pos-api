import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusToDiscoveredPrinterDeviceMigration1786202885094 implements MigrationInterface {
    name = 'AddStatusToDiscoveredPrinterDeviceMigration1786202885094'

    // NOTE: TypeORM's diff generator also picked up pre-existing, unrelated
    // JSON-default whitespace drift on orders.tax_config and
    // establishments.enabled_order_types/payment_methods (stringify
    // formatting differences, not a schema change). Intentionally excluded
    // from this migration — out of scope for printer-status-reporting.
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "discovered_printer_devices" ADD "status" character varying(10) NOT NULL DEFAULT 'unknown'`);
        await queryRunner.query(`ALTER TABLE "discovered_printer_devices" ADD "status_updated_at" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "discovered_printer_devices" DROP COLUMN "status_updated_at"`);
        await queryRunner.query(`ALTER TABLE "discovered_printer_devices" DROP COLUMN "status"`);
    }

}
