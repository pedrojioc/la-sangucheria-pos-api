import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDefaultToRecipeItemsIdMigration1788907003252 implements MigrationInterface {
    name = 'AddDefaultToRecipeItemsIdMigration1788907003252'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recipe_items" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recipe_items" ALTER COLUMN "id" DROP DEFAULT`);
    }

}
