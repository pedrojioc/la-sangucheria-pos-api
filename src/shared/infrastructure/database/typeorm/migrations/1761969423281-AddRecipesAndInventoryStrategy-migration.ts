import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecipesAndInventoryStrategyMigration1761969423281 implements MigrationInterface {
    name = 'AddRecipesAndInventoryStrategyMigration1761969423281'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "recipes" ("id" uuid NOT NULL, "name" character varying(100) NOT NULL, "description" text, "yield_quantity" numeric(12,3) NOT NULL, "yield_unit_id" uuid NOT NULL, "yield_description" character varying(200), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8f09680a51bf3669c1598a21682" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "recipe_items" ("id" uuid NOT NULL, "recipe_id" uuid NOT NULL, "ingredient_id" uuid NOT NULL, "quantity" numeric(12,3) NOT NULL, "unit_id" uuid NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_daec78e42198e9c42e1fed60eec" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "products" ADD "inventory_strategy_type" character varying(20)`);
        await queryRunner.query(`CREATE INDEX "IDX_8c61f50ac6b3b7f42d91ea81da" ON "products" ("inventory_strategy_type") `);
        await queryRunner.query(`ALTER TABLE "recipe_items" ADD CONSTRAINT "FK_2de4c7251ed3dd16f2f96ce45ed" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recipe_items" DROP CONSTRAINT "FK_2de4c7251ed3dd16f2f96ce45ed"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8c61f50ac6b3b7f42d91ea81da"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "inventory_strategy_type"`);
        await queryRunner.query(`DROP TABLE "recipe_items"`);
        await queryRunner.query(`DROP TABLE "recipes"`);
    }

}
