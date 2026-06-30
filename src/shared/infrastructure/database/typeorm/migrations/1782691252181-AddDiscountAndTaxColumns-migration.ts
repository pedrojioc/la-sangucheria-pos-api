import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDiscountAndTaxColumnsMigration1782691252181 implements MigrationInterface {
    name = 'AddDiscountAndTaxColumnsMigration1782691252181'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ADD "tax_config" jsonb NOT NULL DEFAULT '{"rate":0.08,"type":"INC","inclusive":true}'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "order_discount" jsonb`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "discount_total" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "tax_base" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "tax_amount" numeric(12,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "tax_amount"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "tax_base"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "discount_total"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "order_discount"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "tax_config"`);
    }

}
