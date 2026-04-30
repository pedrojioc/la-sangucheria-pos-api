import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRolesPositionsAndRefactorEmployeesMigration1776142707891 implements MigrationInterface {
    name = 'AddRolesPositionsAndRefactorEmployeesMigration1776142707891'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL, "name" character varying(50) NOT NULL, "description" character varying(255), CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "positions" ("id" uuid NOT NULL, "name" character varying(100) NOT NULL, "description" character varying(255), CONSTRAINT "UQ_5c70dc5aa01e351730e4ffc929c" UNIQUE ("name"), CONSTRAINT "PK_17e4e62ccd5749b289ae3fae6f3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "employees" ("id" uuid NOT NULL, "name" character varying(200) NOT NULL, "position_id" uuid, "phone" character varying(20), "status" character varying(20) NOT NULL DEFAULT 'active', "notes" text, "user_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2d83c53c3e553a48dadb9722e38" UNIQUE ("user_id"), CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_faa35befc241081a6b05010396" ON "employees" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_ede58bf474d1eaea7ce2738300" ON "employees" ("name") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "role_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "inventory_levels" ADD CONSTRAINT "FK_897d50e6cd2286365423ee813be" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_levels" ADD CONSTRAINT "FK_0598b5d305652b51c1b0434d164" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_levels" DROP CONSTRAINT "FK_0598b5d305652b51c1b0434d164"`);
        await queryRunner.query(`ALTER TABLE "inventory_levels" DROP CONSTRAINT "FK_897d50e6cd2286365423ee813be"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ede58bf474d1eaea7ce2738300"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_faa35befc241081a6b05010396"`);
        await queryRunner.query(`DROP TABLE "employees"`);
        await queryRunner.query(`DROP TABLE "positions"`);
        await queryRunner.query(`DROP TABLE "roles"`);
    }

}
