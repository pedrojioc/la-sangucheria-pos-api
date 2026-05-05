import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLifetimeValueToCustomersMigration1777995643667 implements MigrationInterface {
    name = 'AddLifetimeValueToCustomersMigration1777995643667'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD "lifetime_value" numeric(12,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "lifetime_value"`);
    }

}
