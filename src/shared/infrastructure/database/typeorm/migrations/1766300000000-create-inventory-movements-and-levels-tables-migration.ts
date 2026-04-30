import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateInventoryMovementsAndLevelsTables1766300000000 implements MigrationInterface {
  name = 'CreateInventoryMovementsAndLevelsTables1766300000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create inventory_movements table
    await queryRunner.query(`
      CREATE TABLE "inventory_movements" (
        "id" uuid NOT NULL,
        "ingredient_id" uuid NOT NULL,
        "batch_id" uuid,
        "type" character varying(20) NOT NULL,
        "quantity" numeric(12,4) NOT NULL,
        "unit_id" uuid NOT NULL,
        "unit_cost" numeric(12,4) NOT NULL,
        "currency" character varying(3) NOT NULL,
        "total_cost" numeric(12,4) NOT NULL,
        "reason" text,
        "reference_id" character varying(255),
        "performed_by" uuid,
        "performed_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inventory_movements" PRIMARY KEY ("id")
      )
    `)

    // Create indexes for inventory_movements
    await queryRunner.query(`CREATE INDEX "IDX_inventory_movements_ingredient_id" ON "inventory_movements" ("ingredient_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_inventory_movements_batch_id" ON "inventory_movements" ("batch_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_inventory_movements_type" ON "inventory_movements" ("type")`)
    await queryRunner.query(`CREATE INDEX "IDX_inventory_movements_reference_id" ON "inventory_movements" ("reference_id")`)

    // Add foreign keys for inventory_movements
    await queryRunner.query(`
      ALTER TABLE "inventory_movements"
      ADD CONSTRAINT "FK_inventory_movements_ingredient"
      FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE "inventory_movements"
      ADD CONSTRAINT "FK_inventory_movements_batch"
      FOREIGN KEY ("batch_id") REFERENCES "inventory_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE "inventory_movements"
      ADD CONSTRAINT "FK_inventory_movements_unit"
      FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    `)

    // Create inventory_levels table
    await queryRunner.query(`
      CREATE TABLE "inventory_levels" (
        "id" uuid NOT NULL,
        "ingredient_id" uuid NOT NULL,
        "current_quantity" numeric(12,4) NOT NULL DEFAULT 0,
        "unit_id" uuid NOT NULL,
        "minimum_quantity" numeric(12,4) NOT NULL DEFAULT 0,
        "maximum_quantity" numeric(12,4),
        "reorder_point" numeric(12,4),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inventory_levels" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_inventory_levels_ingredient_id" UNIQUE ("ingredient_id")
      )
    `)

    // Add foreign keys for inventory_levels
    await queryRunner.query(`
      ALTER TABLE "inventory_levels"
      ADD CONSTRAINT "FK_inventory_levels_ingredient"
      FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `)

    await queryRunner.query(`
      ALTER TABLE "inventory_levels"
      ADD CONSTRAINT "FK_inventory_levels_unit"
      FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys for inventory_levels
    await queryRunner.query(`ALTER TABLE "inventory_levels" DROP CONSTRAINT "FK_inventory_levels_unit"`)
    await queryRunner.query(`ALTER TABLE "inventory_levels" DROP CONSTRAINT "FK_inventory_levels_ingredient"`)

    // Drop inventory_levels table
    await queryRunner.query(`DROP TABLE "inventory_levels"`)

    // Drop foreign keys for inventory_movements
    await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_inventory_movements_unit"`)
    await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_inventory_movements_batch"`)
    await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_inventory_movements_ingredient"`)

    // Drop indexes for inventory_movements
    await queryRunner.query(`DROP INDEX "IDX_inventory_movements_reference_id"`)
    await queryRunner.query(`DROP INDEX "IDX_inventory_movements_type"`)
    await queryRunner.query(`DROP INDEX "IDX_inventory_movements_batch_id"`)
    await queryRunner.query(`DROP INDEX "IDX_inventory_movements_ingredient_id"`)

    // Drop inventory_movements table
    await queryRunner.query(`DROP TABLE "inventory_movements"`)
  }
}
