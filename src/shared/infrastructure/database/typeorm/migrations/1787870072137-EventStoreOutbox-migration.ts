import { MigrationInterface, QueryRunner } from "typeorm";

export class EventStoreOutboxMigration1787870072137 implements MigrationInterface {
    name = 'EventStoreOutboxMigration1787870072137'

    // NOTE: TypeORM's diff generator also picked up pre-existing, unrelated
    // JSON-default whitespace drift on orders.tax_config and
    // establishments.enabled_order_types/payment_methods (stringify
    // formatting differences, not a schema change — same drift already
    // called out and excluded in AddStatusToDiscoveredPrinterDevice-migration
    // and OrderItemsTable-migration). Intentionally excluded here too — out
    // of scope for event-bus-uow-outbox.
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_store" DROP CONSTRAINT "uq_event_store_aggregate_version"`);
        await queryRunner.query(`ALTER TABLE "event_store" ADD "dispatched_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`CREATE INDEX "idx_event_store_undispatched" ON "event_store" ("dispatched_at") WHERE "dispatched_at" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_event_store_undispatched"`);
        await queryRunner.query(`ALTER TABLE "event_store" DROP COLUMN "dispatched_at"`);
        await queryRunner.query(`ALTER TABLE "event_store" ADD CONSTRAINT "uq_event_store_aggregate_version" UNIQUE ("aggregate_id", "version")`);
    }

}
