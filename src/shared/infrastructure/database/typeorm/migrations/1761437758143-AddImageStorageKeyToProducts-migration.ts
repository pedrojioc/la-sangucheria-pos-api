import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageStorageKeyToProductsMigration1761437758143 implements MigrationInterface {
    name = 'AddImageStorageKeyToProductsMigration1761437758143'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "image"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "image_url" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "products" ADD "image_storage_key" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "image_storage_key"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "image_url"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "image" character varying(255)`);
    }

}
