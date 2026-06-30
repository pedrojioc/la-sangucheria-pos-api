import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorProductInventoryStrategyMigration1781924894219 implements MigrationInterface {
    name = 'RefactorProductInventoryStrategyMigration1781924894219'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "ingredient_id" uuid`);

        await queryRunner.query(`
            UPDATE "products" SET "inventory_strategy_type" = 'RECIPE'
            WHERE "id" IN (SELECT "product_id" FROM "product_recipes")
        `);
        await queryRunner.query(`
            UPDATE "products" SET "inventory_strategy_type" = 'DIRECT'
            WHERE "id" NOT IN (SELECT "product_id" FROM "product_recipes")
              AND ("inventory_strategy_type" IS NULL OR "inventory_strategy_type" = 'DIRECT')
        `);

        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "inventory_strategy_type" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_da5720148c795f1a84fe062d3bb"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "recipe_id"`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_d707502078bde96cbac928cdcfc" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_d707502078bde96cbac928cdcfc"`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "inventory_strategy_type" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "ingredient_id"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "recipe_id" uuid`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_da5720148c795f1a84fe062d3bb" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
