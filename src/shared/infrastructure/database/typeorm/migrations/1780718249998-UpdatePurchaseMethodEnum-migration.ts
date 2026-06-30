import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePurchaseMethodEnumMigration1780718249998 implements MigrationInterface {
    name = 'UpdatePurchaseMethodEnumMigration1780718249998'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."purchase_orders_purchase_method_enum" RENAME TO "purchase_orders_purchase_method_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."purchase_orders_purchase_method_enum" AS ENUM('WHATSAPP', 'PHONE', 'EMAIL', 'DIRECT_PURCHASE', 'PLATFORM')`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" ALTER COLUMN "purchase_method" TYPE "public"."purchase_orders_purchase_method_enum" USING "purchase_method"::"text"::"public"."purchase_orders_purchase_method_enum"`);
        await queryRunner.query(`DROP TYPE "public"."purchase_orders_purchase_method_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."purchase_orders_purchase_method_enum_old" AS ENUM('SENT_AUTOMATICALLY', 'SENT_MANUALLY', 'DIRECT_PURCHASE', 'SUPPLIER_DELIVERY', 'PLATFORM_ORDER')`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" ALTER COLUMN "purchase_method" TYPE "public"."purchase_orders_purchase_method_enum_old" USING "purchase_method"::"text"::"public"."purchase_orders_purchase_method_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."purchase_orders_purchase_method_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."purchase_orders_purchase_method_enum_old" RENAME TO "purchase_orders_purchase_method_enum"`);
    }

}
