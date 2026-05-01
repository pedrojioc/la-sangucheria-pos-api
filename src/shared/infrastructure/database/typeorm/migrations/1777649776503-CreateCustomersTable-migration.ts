import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCustomersTableMigration1777649776503 implements MigrationInterface {
    name = 'CreateCustomersTableMigration1777649776503'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "loyalty_accounts" ("id" uuid NOT NULL, "customer_id" uuid NOT NULL, "points" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1c7eaf158aad7e4a839232cc9ba" UNIQUE ("customer_id"), CONSTRAINT "PK_115c58d47255c4ea7da5d6f8cf1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "addresses" ("id" uuid NOT NULL, "customer_id" uuid NOT NULL, "label" character varying(100) NOT NULL, "street" character varying(500) NOT NULL, "neighborhood" character varying(200), "city" character varying(200) NOT NULL, "reference" text, "lat" numeric(10,8), "lng" numeric(11,8), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7482082bf53fd0ba88a32e3de8" ON "addresses" ("customer_id") `);
        await queryRunner.query(`CREATE TABLE "customers" ("id" uuid NOT NULL, "name" character varying(200) NOT NULL, "phone" character varying(30) NOT NULL, "email" character varying(255), "document_type" character varying(20) NOT NULL, "document_number" character varying(50) NOT NULL, "tax_regime" character varying(20) NOT NULL, "default_address_id" uuid, "notes" text, "status" character varying(20) NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_88acd889fbe17d0e16cc4bc9174" UNIQUE ("phone"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_88acd889fbe17d0e16cc4bc917" ON "customers" ("phone") `);
        await queryRunner.query(`CREATE INDEX "IDX_589e5e6434f0e8628aa2ad33e1" ON "customers" ("status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_589e5e6434f0e8628aa2ad33e1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88acd889fbe17d0e16cc4bc917"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7482082bf53fd0ba88a32e3de8"`);
        await queryRunner.query(`DROP TABLE "addresses"`);
        await queryRunner.query(`DROP TABLE "loyalty_accounts"`);
    }

}
