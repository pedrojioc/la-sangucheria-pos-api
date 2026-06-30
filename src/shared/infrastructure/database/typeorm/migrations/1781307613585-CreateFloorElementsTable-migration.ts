import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFloorElementsTableMigration1781307613585 implements MigrationInterface {
    name = 'CreateFloorElementsTableMigration1781307613585'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "floor_elements" ("id" uuid NOT NULL, "zone_id" uuid NOT NULL, "type" character varying(30) NOT NULL, "label" character varying(100), "position_x" numeric(5,2) NOT NULL, "position_y" numeric(5,2) NOT NULL, "width" numeric(5,2) NOT NULL DEFAULT '10', "height" numeric(5,2) NOT NULL DEFAULT '10', "rotation" smallint NOT NULL DEFAULT '0', "color" character varying(20), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1085ff9179e6d43faf09a04379d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6a71342a05692367bc8d737dc0" ON "floor_elements" ("zone_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_6a71342a05692367bc8d737dc0"`);
        await queryRunner.query(`DROP TABLE "floor_elements"`);
    }

}
