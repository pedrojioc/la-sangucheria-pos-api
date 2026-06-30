import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreatePreparationRecipeIngredientsTableMigration1778536809334
  implements MigrationInterface
{
  name = 'CreatePreparationRecipeIngredientsTableMigration1778536809334'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "preparation_recipe_ingredients" ("id" uuid NOT NULL, "recipe_id" uuid NOT NULL, "ingredient_id" uuid NOT NULL, "quantity_per_unit" numeric(12,3) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0b4d6cb96209421c00095c236fe" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_90ee3f392facfc9d5bb9459ae0" ON "preparation_recipe_ingredients" ("recipe_id") `
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_bdd8ba7f1f5edf9a3c39d8aeca" ON "preparation_recipe_ingredients" ("recipe_id", "ingredient_id") `
    )
    await queryRunner.query(
      `ALTER TABLE "preparation_recipe_ingredients" ADD CONSTRAINT "FK_90ee3f392facfc9d5bb9459ae01" FOREIGN KEY ("recipe_id") REFERENCES "preparation_recipes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "preparation_recipe_ingredients" ADD CONSTRAINT "FK_8874277f78ac5995f755bb62b04" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )

    // Migrate existing JSONB data to new relational table
    await queryRunner.query(`
      INSERT INTO "preparation_recipe_ingredients" ("id", "recipe_id", "ingredient_id", "quantity_per_unit")
      SELECT
        gen_random_uuid(),
        pr.id,
        (ai->>'ingredientId')::uuid,
        (ai->>'quantityPerUnit')::numeric
      FROM "preparation_recipes" pr,
           jsonb_array_elements(pr.additional_ingredients) AS ai
      WHERE jsonb_array_length(pr.additional_ingredients) > 0
        AND (ai->>'ingredientId') IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM "ingredients" i WHERE i.id = (ai->>'ingredientId')::uuid
        )
    `)

    await queryRunner.query(`ALTER TABLE "preparation_recipes" DROP COLUMN "additional_ingredients"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "preparation_recipes" ADD "additional_ingredients" jsonb NOT NULL DEFAULT '[]'`
    )

    // Restore JSONB from relational table (derives unitId from ingredient)
    await queryRunner.query(`
      UPDATE "preparation_recipes" pr
      SET "additional_ingredients" = (
        SELECT jsonb_agg(
          jsonb_build_object(
            'ingredientId', pri.ingredient_id::text,
            'quantityPerUnit', pri.quantity_per_unit,
            'unitId', i.unit_id::text
          )
        )
        FROM "preparation_recipe_ingredients" pri
        JOIN "ingredients" i ON i.id = pri.ingredient_id
        WHERE pri.recipe_id = pr.id
      )
      WHERE EXISTS (
        SELECT 1 FROM "preparation_recipe_ingredients" pri WHERE pri.recipe_id = pr.id
      )
    `)

    await queryRunner.query(
      `ALTER TABLE "preparation_recipe_ingredients" DROP CONSTRAINT "FK_8874277f78ac5995f755bb62b04"`
    )
    await queryRunner.query(
      `ALTER TABLE "preparation_recipe_ingredients" DROP CONSTRAINT "FK_90ee3f392facfc9d5bb9459ae01"`
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bdd8ba7f1f5edf9a3c39d8aeca"`
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_90ee3f392facfc9d5bb9459ae0"`
    )
    await queryRunner.query(`DROP TABLE "preparation_recipe_ingredients"`)
  }
}
