import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWhatsappAndRatingToSuppliersMigration1765412479028 implements MigrationInterface {
    name = 'AddWhatsappAndRatingToSuppliersMigration1765412479028'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "whatsapp_number" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "rating" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "rating"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "whatsapp_number"`);
    }

}
