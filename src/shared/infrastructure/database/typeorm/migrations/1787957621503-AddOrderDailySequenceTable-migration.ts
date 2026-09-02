import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderDailySequenceTableMigration1787957621503 implements MigrationInterface {
    name = 'AddOrderDailySequenceTableMigration1787957621503'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "order_daily_sequence" ("date_key" date NOT NULL, "last_number" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_79ec16cd747beafc58dfe75cb60" PRIMARY KEY ("date_key"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "order_daily_sequence"`);
    }

}
