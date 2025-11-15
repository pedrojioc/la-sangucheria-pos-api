import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductCategoriesMigration1761249503933 implements MigrationInterface {
    name = 'AddProductCategoriesMigration1761249503933'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product_categories" ("id" uuid NOT NULL, "name" character varying(100) NOT NULL, "description" text, "icon" character varying(50), "display_order" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7069dac60d88408eca56fdc9e0c" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "product_categories"`);
    }

}
