import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderedStatusToPurchaseOrderMigration1780514876156 implements MigrationInterface {
    name = 'AddOrderedStatusToPurchaseOrderMigration1780514876156'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."purchase_orders_status_enum" RENAME TO "purchase_orders_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."purchase_orders_status_enum" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED', 'CLOSED', 'REJECTED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" ALTER COLUMN "status" TYPE "public"."purchase_orders_status_enum" USING "status"::"text"::"public"."purchase_orders_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."purchase_orders_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "product_recipe_items" ADD CONSTRAINT "FK_e9c6c2db1d77aac7a6b2b46c19f" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_recipe_items" ADD CONSTRAINT "FK_1090a6a9e5e0377d32b79576ae4" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_recipe_items" DROP CONSTRAINT "FK_1090a6a9e5e0377d32b79576ae4"`);
        await queryRunner.query(`ALTER TABLE "product_recipe_items" DROP CONSTRAINT "FK_e9c6c2db1d77aac7a6b2b46c19f"`);
        await queryRunner.query(`CREATE TYPE "public"."purchase_orders_status_enum_old" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_RECEIVED', 'CLOSED', 'REJECTED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" ALTER COLUMN "status" TYPE "public"."purchase_orders_status_enum_old" USING "status"::"text"::"public"."purchase_orders_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."purchase_orders_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."purchase_orders_status_enum_old" RENAME TO "purchase_orders_status_enum"`);
    }

}
