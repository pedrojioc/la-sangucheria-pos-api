import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateKitchenBoardItemsTableMigration1782700000000 implements MigrationInterface {
  name = 'CreateKitchenBoardItemsTableMigration1782700000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "kitchen_board_items" (
        "id" uuid NOT NULL,
        "order_id" uuid NOT NULL,
        "order_number" character varying(20) NOT NULL,
        "item_id" uuid NOT NULL,
        "item_name" character varying(100) NOT NULL,
        "station_id" uuid,
        "status" character varying(20) NOT NULL DEFAULT 'SENT',
        "quantity" smallint NOT NULL,
        "notes" text,
        "modifiers" jsonb NOT NULL DEFAULT '[]',
        "sent_at" TIMESTAMP NOT NULL,
        "ready_at" TIMESTAMP,
        "delivered_at" TIMESTAMP,
        "cancelled_at" TIMESTAMP,
        CONSTRAINT "UQ_kitchen_board_items_item_id" UNIQUE ("item_id"),
        CONSTRAINT "PK_kitchen_board_items" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(
      `CREATE INDEX "IDX_kitchen_board_station_status" ON "kitchen_board_items" ("station_id", "status")`
    )

    await queryRunner.query(
      `CREATE INDEX "IDX_kitchen_board_order_id" ON "kitchen_board_items" ("order_id")`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_kitchen_board_order_id"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_kitchen_board_station_status"`)
    await queryRunner.query(`DROP TABLE "kitchen_board_items"`)
  }
}
