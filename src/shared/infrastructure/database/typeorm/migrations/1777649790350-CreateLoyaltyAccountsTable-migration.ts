import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLoyaltyAccountsTableMigration1777649790350 implements MigrationInterface {
    name = 'CreateLoyaltyAccountsTableMigration1777649790350'

    public async up(_queryRunner: QueryRunner): Promise<void> {
        // Tables already created in CreateCustomersTableMigration
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No-op
    }
}
