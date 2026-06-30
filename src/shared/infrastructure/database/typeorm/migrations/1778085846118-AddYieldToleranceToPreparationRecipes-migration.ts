import { MigrationInterface, QueryRunner } from "typeorm";

export class AddYieldToleranceToPreparationRecipesMigration1778085846118 implements MigrationInterface {
    name = 'AddYieldToleranceToPreparationRecipesMigration1778085846118'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "preparation_recipes" ADD "yield_tolerance_percentage" numeric(5,2) NOT NULL DEFAULT '5'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "preparation_recipes" DROP COLUMN "yield_tolerance_percentage"`);
    }

}
