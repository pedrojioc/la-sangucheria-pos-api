import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrdersAndDailySequenceMigration1781202141366 implements MigrationInterface {
    name = 'CreateOrdersAndDailySequenceMigration1781202141366'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL, "order_number" character varying(10) NOT NULL, "type" character varying(20) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'OPEN', "table_id" uuid, "customer_id" uuid, "address_id" uuid, "delivery_fee" numeric(12,2), "currency" character varying(3) NOT NULL DEFAULT 'COP', "items" jsonb NOT NULL DEFAULT '[]', "kitchen_tickets" jsonb NOT NULL DEFAULT '[]', "subtotal" numeric(12,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL DEFAULT '0', "notes" text, "opened_by" uuid NOT NULL, "opened_at" TIMESTAMP WITH TIME ZONE NOT NULL, "closed_by" uuid, "closed_at" TIMESTAMP WITH TIME ZONE, "cancelled_by" uuid, "cancelled_at" TIMESTAMP WITH TIME ZONE, "cancelled_reason" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7b74128c9daafa1e026c35f07e" ON "orders" ("order_number", "opened_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_74651af26e42207059dcdc14a6" ON "orders" ("opened_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_772d0ce0473ac2ccfa26060dbe" ON "orders" ("customer_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3d36410e89a795172fa6e0dd96" ON "orders" ("table_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_76154e1d0fa9d7894edfba166b" ON "orders" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_775c9f06fc27ae3ff8fb26f2c4" ON "orders" ("status") `);
        await queryRunner.query(`CREATE TABLE "order_daily_sequence" ("date_key" date NOT NULL, "last_number" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_order_daily_sequence" PRIMARY KEY ("date_key"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "order_daily_sequence"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_775c9f06fc27ae3ff8fb26f2c4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_76154e1d0fa9d7894edfba166b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3d36410e89a795172fa6e0dd96"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_772d0ce0473ac2ccfa26060dbe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_74651af26e42207059dcdc14a6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7b74128c9daafa1e026c35f07e"`);
        await queryRunner.query(`DROP TABLE "orders"`);
    }

}
