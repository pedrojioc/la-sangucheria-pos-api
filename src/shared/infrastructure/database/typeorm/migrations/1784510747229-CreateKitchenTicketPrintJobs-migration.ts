import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateKitchenTicketPrintJobsMigration1784510747229 implements MigrationInterface {
    name = 'CreateKitchenTicketPrintJobsMigration1784510747229'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "kitchen_ticket_print_jobs" ("id" uuid NOT NULL, "ticket_number" integer NOT NULL, "station_id" uuid NOT NULL, "station_name" character varying(100) NOT NULL, "payload" jsonb NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "delivered_at" TIMESTAMP, "printed_at" TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f5ba70d87993688b4cdbbdb12e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d61f4c711dc6718f94a3b593a8" ON "kitchen_ticket_print_jobs" ("station_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_12fa510c049f0b512d80e17635" ON "kitchen_ticket_print_jobs" ("status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_12fa510c049f0b512d80e17635"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d61f4c711dc6718f94a3b593a8"`);
        await queryRunner.query(`DROP TABLE "kitchen_ticket_print_jobs"`);
    }

}
