import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStockReservationsMigration1789000871926 implements MigrationInterface {
    name = 'AddStockReservationsMigration1789000871926'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "stock_reservations" ("id" uuid NOT NULL, "order_id" uuid NOT NULL, "item_id" uuid NOT NULL, "ingredient_id" uuid NOT NULL, "quantity" numeric(12,4) NOT NULL, "unit_id" character varying(64) NOT NULL, "status" character varying(20) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_46ec0f5605d70f64654ad4e7bd9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ceb859a17a05faf78ac0db94fd" ON "stock_reservations" ("order_id", "item_id", "ingredient_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b801304218fb7deac0c9b9fe4d" ON "stock_reservations" ("ingredient_id", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_774eb136670482afb74c3b3e29" ON "stock_reservations" ("order_id", "item_id", "status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_774eb136670482afb74c3b3e29"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b801304218fb7deac0c9b9fe4d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ceb859a17a05faf78ac0db94fd"`);
        await queryRunner.query(`DROP TABLE "stock_reservations"`);
    }

}
