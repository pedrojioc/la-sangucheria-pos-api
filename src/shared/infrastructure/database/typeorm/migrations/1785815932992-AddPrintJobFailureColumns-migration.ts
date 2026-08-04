import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPrintJobFailureColumnsMigration1785815932992 implements MigrationInterface {
    name = 'AddPrintJobFailureColumnsMigration1785815932992'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "kitchen_ticket_print_jobs" ADD "failure_reason" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "kitchen_ticket_print_jobs" ADD "failed_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "kitchen_ticket_print_jobs" DROP COLUMN "failed_at"`);
        await queryRunner.query(`ALTER TABLE "kitchen_ticket_print_jobs" DROP COLUMN "failure_reason"`);
    }

}
