import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAddressesTableMigration1777649787062 implements MigrationInterface {
    name = 'CreateAddressesTableMigration1777649787062'

    public async up(_queryRunner: QueryRunner): Promise<void> {
        // Tables customers, addresses, loyalty_accounts already created in CreateCustomersTableMigration
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No-op
    }
}
