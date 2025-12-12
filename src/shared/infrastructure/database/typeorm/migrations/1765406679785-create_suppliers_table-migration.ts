import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSuppliersTableMigration1765406679785 implements MigrationInterface {
    name = 'CreateSuppliersTableMigration1765406679785'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "suppliers" ("id" uuid NOT NULL, "name" character varying(200) NOT NULL, "contact_name" character varying(100), "email" character varying(100), "phone" character varying(20), "address" character varying(500), "tax_id" character varying(50), "payment_terms" character varying(200), "notes" text, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "suppliers"`);
    }

}
