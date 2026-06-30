import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColorToProductCategoriesMigration1780896478821 implements MigrationInterface {
    name = 'AddColorToProductCategoriesMigration1780896478821'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_categories" ADD "color" character varying(50)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_categories" DROP COLUMN "color"`);
    }

}
