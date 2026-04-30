import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePurchaseOrderRemoveSentReceivedAddMethodMigration1766124889792 implements MigrationInterface {
    name = 'UpdatePurchaseOrderRemoveSentReceivedAddMethodMigration1766124889792'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ingredient_transformations" RENAME COLUMN "additionals_cost" TO "additional_cost"`);
        await queryRunner.query(`CREATE TYPE "public"."purchase_orders_purchase_method_enum" AS ENUM('SENT_AUTOMATICALLY', 'SENT_MANUALLY', 'DIRECT_PURCHASE', 'SUPPLIER_DELIVERY', 'PLATFORM_ORDER')`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" ADD "purchase_method" "public"."purchase_orders_purchase_method_enum"`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" ADD "purchase_method_details" character varying(500)`);

        // Migrate existing data: RECEIVED -> CLOSED, SENT -> APPROVED
        await queryRunner.query(`UPDATE "purchase_orders" SET "status" = 'CLOSED' WHERE "status" = 'RECEIVED'`);
        await queryRunner.query(`UPDATE "purchase_orders" SET "status" = 'APPROVED' WHERE "status" = 'SENT'`);

        await queryRunner.query(`ALTER TYPE "public"."purchase_orders_status_enum" RENAME TO "purchase_orders_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."purchase_orders_status_enum" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_RECEIVED', 'CLOSED', 'REJECTED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" ALTER COLUMN "status" TYPE "public"."purchase_orders_status_enum" USING "status"::"text"::"public"."purchase_orders_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."purchase_orders_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."purchase_orders_status_enum_old" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'REJECTED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" ALTER COLUMN "status" TYPE "public"."purchase_orders_status_enum_old" USING "status"::"text"::"public"."purchase_orders_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."purchase_orders_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."purchase_orders_status_enum_old" RENAME TO "purchase_orders_status_enum"`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" DROP COLUMN "purchase_method_details"`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" DROP COLUMN "purchase_method"`);
        await queryRunner.query(`DROP TYPE "public"."purchase_orders_purchase_method_enum"`);
        await queryRunner.query(`ALTER TABLE "ingredient_transformations" RENAME COLUMN "additional_cost" TO "additionals_cost"`);
    }

}
