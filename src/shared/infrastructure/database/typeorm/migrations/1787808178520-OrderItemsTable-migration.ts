import { MigrationInterface, QueryRunner } from "typeorm";

export class OrderItemsTableMigration1787808178520 implements MigrationInterface {
    name = 'OrderItemsTableMigration1787808178520'

    // NOTE: TypeORM's diff generator also picked up pre-existing, unrelated
    // JSON-default whitespace drift on orders.tax_config and
    // establishments.enabled_order_types/payment_methods (stringify
    // formatting differences, not a schema change — same drift already
    // called out in AddStatusToDiscoveredPrinterDevice-migration). Intentionally
    // excluded from this migration — out of scope for order-items-migration.
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "order_items" ("id" uuid NOT NULL, "order_id" uuid NOT NULL, "product_id" uuid NOT NULL, "product_name" character varying(100) NOT NULL, "unit_price" numeric(12,2) NOT NULL, "currency" character varying(3) NOT NULL, "quantity" smallint NOT NULL, "modifiers" jsonb NOT NULL DEFAULT '[]', "notes" text, "discount" jsonb, "status" character varying(20) NOT NULL DEFAULT 'PENDING', "station_id" uuid, "sent_at" TIMESTAMP WITH TIME ZONE, "ready_at" TIMESTAMP WITH TIME ZONE, "delivered_at" TIMESTAMP WITH TIME ZONE, "delivered_by" uuid, "cancelled_at" TIMESTAMP WITH TIME ZONE, "cancelled_by" uuid, "cancellation_reason" text, CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f421c8981cca05954f98667134" ON "order_items" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_19718ef8bca5f7a98d300924fd" ON "order_items" ("order_id", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_145532db85752b29c57d2b7b1f" ON "order_items" ("order_id") `);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "items"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ADD "items" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_145532db85752b29c57d2b7b1f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_19718ef8bca5f7a98d300924fd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f421c8981cca05954f98667134"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
    }

}
