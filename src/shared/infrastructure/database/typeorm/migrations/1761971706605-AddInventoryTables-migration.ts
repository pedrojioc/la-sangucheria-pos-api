import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInventoryTablesMigration1761971706605 implements MigrationInterface {
    name = 'AddInventoryTablesMigration1761971706605'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."inventory_movements_type_enum" AS ENUM('PURCHASE', 'SALE', 'ADJUSTMENT', 'WASTE', 'TRANSFER')`);
        await queryRunner.query(`CREATE TABLE "inventory_movements" ("id" uuid NOT NULL, "ingredient_id" uuid NOT NULL, "batch_id" uuid, "type" "public"."inventory_movements_type_enum" NOT NULL, "quantity" numeric(12,3) NOT NULL, "unit_id" uuid NOT NULL, "unit_cost" numeric(12,2) NOT NULL, "currency" character varying(3) NOT NULL, "total_cost" numeric(12,2) NOT NULL, "reason" text, "reference_id" uuid, "performed_by" character varying(100), "performed_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d7597827c1dcffae889db3ab873" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_989031d66ca3ab2a337fb35e08" ON "inventory_movements" ("ingredient_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0d8d237c78afa95bb19afcb517" ON "inventory_movements" ("batch_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8dc70213a51af3ec36b6690dba" ON "inventory_movements" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_3d81ea331908e37746a408a5c2" ON "inventory_movements" ("reference_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_946c4ebe6f99d671c2965ecb17" ON "inventory_movements" ("performed_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_d7b1b7b852f338bc6f4a679103" ON "inventory_movements" ("type", "performed_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_091fe93e80020cb1bb14cfd78f" ON "inventory_movements" ("ingredient_id", "performed_at") `);
        await queryRunner.query(`CREATE TABLE "inventory_batches" ("id" uuid NOT NULL, "ingredient_id" uuid NOT NULL, "initial_quantity" numeric(12,3) NOT NULL, "remaining_quantity" numeric(12,3) NOT NULL, "unit_id" uuid NOT NULL, "unit_cost" numeric(12,2) NOT NULL, "currency" character varying(3) NOT NULL, "purchase_date" TIMESTAMP NOT NULL, "expiration_date" TIMESTAMP, "supplier" character varying(200), "reference_code" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1b670b7f687d8b8c58ef8d4629a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f9d0b758c6c5f0dbf8d7658bc3" ON "inventory_batches" ("ingredient_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_89dc47492a28e538a411d4206b" ON "inventory_batches" ("purchase_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_de70653faff3059e9797556ffd" ON "inventory_batches" ("ingredient_id", "purchase_date") `);
        await queryRunner.query(`CREATE TABLE "inventory_levels" ("id" uuid NOT NULL, "ingredient_id" uuid NOT NULL, "current_quantity" numeric(12,3) NOT NULL, "unit_id" uuid NOT NULL, "minimum_quantity" numeric(12,3), "maximum_quantity" numeric(12,3), "reorder_point" numeric(12,3), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_897d50e6cd2286365423ee813be" UNIQUE ("ingredient_id"), CONSTRAINT "PK_7d6c5977afc35996c6a42830d05" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_897d50e6cd2286365423ee813b" ON "inventory_levels" ("ingredient_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_897d50e6cd2286365423ee813b"`);
        await queryRunner.query(`DROP TABLE "inventory_levels"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de70653faff3059e9797556ffd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_89dc47492a28e538a411d4206b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f9d0b758c6c5f0dbf8d7658bc3"`);
        await queryRunner.query(`DROP TABLE "inventory_batches"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_091fe93e80020cb1bb14cfd78f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d7b1b7b852f338bc6f4a679103"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_946c4ebe6f99d671c2965ecb17"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3d81ea331908e37746a408a5c2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8dc70213a51af3ec36b6690dba"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0d8d237c78afa95bb19afcb517"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_989031d66ca3ab2a337fb35e08"`);
        await queryRunner.query(`DROP TABLE "inventory_movements"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_movements_type_enum"`);
    }

}
