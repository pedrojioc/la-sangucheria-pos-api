import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPurchaseOrderTablesMigration1762300000000 implements MigrationInterface {
    name = 'AddPurchaseOrderTablesMigration1762300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create purchase_orders table
        await queryRunner.query(`
            CREATE TABLE "purchase_orders" (
                "id" uuid NOT NULL,
                "order_number" character varying(50) NOT NULL,
                "supplier_id" uuid NOT NULL,
                "status" character varying(20) NOT NULL,
                "requested_by" uuid NOT NULL,
                "approved_by" uuid,
                "rejected_by" uuid,
                "sent_by" uuid,
                "closed_by" uuid,
                "total_amount" numeric(10,2) NOT NULL,
                "currency" character varying(3) NOT NULL,
                "requested_date" TIMESTAMP NOT NULL,
                "expected_delivery_date" TIMESTAMP,
                "approved_date" TIMESTAMP,
                "sent_date" TIMESTAMP,
                "received_date" TIMESTAMP,
                "closed_date" TIMESTAMP,
                "notes" text,
                CONSTRAINT "PK_purchase_orders" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_purchase_orders_order_number" UNIQUE ("order_number")
            )
        `);

        // Create indexes for purchase_orders
        await queryRunner.query(`CREATE INDEX "IDX_purchase_orders_supplier_id" ON "purchase_orders" ("supplier_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_purchase_orders_status" ON "purchase_orders" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_purchase_orders_requested_by" ON "purchase_orders" ("requested_by")`);
        await queryRunner.query(`CREATE INDEX "IDX_purchase_orders_requested_date" ON "purchase_orders" ("requested_date")`);
        await queryRunner.query(`CREATE INDEX "IDX_purchase_orders_status_requested_date" ON "purchase_orders" ("status", "requested_date")`);

        // Create purchase_order_items table
        await queryRunner.query(`
            CREATE TABLE "purchase_order_items" (
                "id" uuid NOT NULL,
                "purchase_order_id" uuid NOT NULL,
                "ingredient_id" uuid NOT NULL,
                "quantity_requested" numeric(10,3) NOT NULL,
                "quantity_requested_unit_id" uuid NOT NULL,
                "quantity_received" numeric(10,3),
                "quantity_received_unit_id" uuid,
                "unit_cost" numeric(10,2) NOT NULL,
                "currency" character varying(3) NOT NULL,
                "total_cost" numeric(10,2) NOT NULL,
                "notes" text,
                CONSTRAINT "PK_purchase_order_items" PRIMARY KEY ("id"),
                CONSTRAINT "FK_purchase_order_items_purchase_order" FOREIGN KEY ("purchase_order_id")
                    REFERENCES "purchase_orders"("id") ON DELETE CASCADE
            )
        `);

        // Create indexes for purchase_order_items
        await queryRunner.query(`CREATE INDEX "IDX_purchase_order_items_purchase_order_id" ON "purchase_order_items" ("purchase_order_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_purchase_order_items_ingredient_id" ON "purchase_order_items" ("ingredient_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes for purchase_order_items
        await queryRunner.query(`DROP INDEX "public"."IDX_purchase_order_items_ingredient_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_purchase_order_items_purchase_order_id"`);

        // Drop purchase_order_items table
        await queryRunner.query(`DROP TABLE "purchase_order_items"`);

        // Drop indexes for purchase_orders
        await queryRunner.query(`DROP INDEX "public"."IDX_purchase_orders_status_requested_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_purchase_orders_requested_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_purchase_orders_requested_by"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_purchase_orders_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_purchase_orders_supplier_id"`);

        // Drop purchase_orders table
        await queryRunner.query(`DROP TABLE "purchase_orders"`);
    }
}
