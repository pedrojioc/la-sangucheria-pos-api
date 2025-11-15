import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductsTableMigration1761355024990 implements MigrationInterface {
    name = 'CreateProductsTableMigration1761355024990'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL, "name" character varying(100) NOT NULL, "description" text, "category_id" uuid NOT NULL, "recipe_id" uuid, "price" numeric(10,2) NOT NULL, "image" character varying(255), "preparation_time" integer, "is_active" boolean NOT NULL DEFAULT true, "display_order" integer NOT NULL DEFAULT '0', "sku" character varying(20) NOT NULL, "tags" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c44ac33a05b144dd0d9ddcf932" ON "products" ("sku") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_c44ac33a05b144dd0d9ddcf932"`);
        await queryRunner.query(`DROP TABLE "products"`);
    }

}
