import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductRecipeTablesMigration1779640983893 implements MigrationInterface {
    name = 'CreateProductRecipeTablesMigration1779640983893'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product_recipe_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_recipe_id" uuid NOT NULL, "ingredient_id" uuid NOT NULL, "quantity" numeric(12,3) NOT NULL, "unit_id" uuid NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_93ed2ba905e341ee93224f20f80" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_recipes" ("id" uuid NOT NULL, "product_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7b65dbb27e7a31f561d1712cfee" UNIQUE ("product_id"), CONSTRAINT "PK_eefb5f327f5fd58db7304eea7db" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product_recipe_items" ADD CONSTRAINT "FK_527b75976283a24fe859d95217c" FOREIGN KEY ("product_recipe_id") REFERENCES "product_recipes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_recipe_items" DROP CONSTRAINT "FK_527b75976283a24fe859d95217c"`);
        await queryRunner.query(`DROP TABLE "product_recipes"`);
        await queryRunner.query(`DROP TABLE "product_recipe_items"`);
    }

}
