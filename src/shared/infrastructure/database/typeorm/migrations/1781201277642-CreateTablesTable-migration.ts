import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTablesTableMigration1781201277642 implements MigrationInterface {
    name = 'CreateTablesTableMigration1781201277642'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tables" ("id" uuid NOT NULL, "number" character varying(20) NOT NULL, "capacity" smallint NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'AVAILABLE', "current_order_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0aa8f1290718849823b581ec144" UNIQUE ("number"), CONSTRAINT "PK_7cf2aca7af9550742f855d4eb69" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_21278276a20cd242a6ba10efc0" ON "tables" ("status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0aa8f1290718849823b581ec14" ON "tables" ("number") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_0aa8f1290718849823b581ec14"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_21278276a20cd242a6ba10efc0"`);
        await queryRunner.query(`DROP TABLE "tables"`);
    }

}
