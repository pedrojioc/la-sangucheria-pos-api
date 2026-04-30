import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCancellationFieldsToPurchaseOrderItemsMigration1769310267750 implements MigrationInterface {
    name = 'AddCancellationFieldsToPurchaseOrderItemsMigration1769310267750'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_inventory_movements_ingredient"`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_inventory_movements_batch"`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_inventory_movements_unit"`);
        await queryRunner.query(`ALTER TABLE "inventory_levels" DROP CONSTRAINT "FK_inventory_levels_ingredient"`);
        await queryRunner.query(`ALTER TABLE "inventory_levels" DROP CONSTRAINT "FK_inventory_levels_unit"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_inventory_movements_ingredient_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_inventory_movements_batch_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_inventory_movements_type"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_inventory_movements_reference_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_users_username"`);
        await queryRunner.query(`DROP INDEX "public"."idx_users_email"`);
        await queryRunner.query(`DROP INDEX "public"."idx_users_is_active"`);
        await queryRunner.query(`DROP INDEX "public"."idx_refresh_tokens_jti"`);
        await queryRunner.query(`DROP INDEX "public"."idx_refresh_tokens_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_refresh_tokens_expires_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_refresh_tokens_is_revoked"`);
        await queryRunner.query(`ALTER TABLE "purchase_order_items" ADD "is_cancelled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "purchase_order_items" ADD "cancellation_reason" text`);
        await queryRunner.query(`ALTER TABLE "inventory_levels" DROP CONSTRAINT "UQ_inventory_levels_ingredient_id"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`CREATE INDEX "IDX_3d81ea331908e37746a408a5c2" ON "inventory_movements" ("reference_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8dc70213a51af3ec36b6690dba" ON "inventory_movements" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_0d8d237c78afa95bb19afcb517" ON "inventory_movements" ("batch_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_989031d66ca3ab2a337fb35e08" ON "inventory_movements" ("ingredient_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_897d50e6cd2286365423ee813b" ON "inventory_levels" ("ingredient_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f3752400c98d5c0b3dca54d66d" ON "refresh_tokens" ("jti") `);
        await queryRunner.query(`CREATE INDEX "IDX_3ddc983c5f7bcf132fd8732c3f" ON "refresh_tokens" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ba3bd69c8ad1e799c0256e9e50" ON "refresh_tokens" ("expires_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_3a5f57e17354e7407757e8793b" ON "refresh_tokens" ("is_revoked") `);
        await queryRunner.query(`ALTER TABLE "purchase_orders" ADD CONSTRAINT "FK_d16a885aa88447ccfd010e739b0" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase_orders" DROP CONSTRAINT "FK_d16a885aa88447ccfd010e739b0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3a5f57e17354e7407757e8793b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ba3bd69c8ad1e799c0256e9e50"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3ddc983c5f7bcf132fd8732c3f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f3752400c98d5c0b3dca54d66d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_897d50e6cd2286365423ee813b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_989031d66ca3ab2a337fb35e08"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0d8d237c78afa95bb19afcb517"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8dc70213a51af3ec36b6690dba"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3d81ea331908e37746a408a5c2"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "inventory_levels" ADD CONSTRAINT "UQ_inventory_levels_ingredient_id" UNIQUE ("ingredient_id")`);
        await queryRunner.query(`ALTER TABLE "purchase_order_items" DROP COLUMN "cancellation_reason"`);
        await queryRunner.query(`ALTER TABLE "purchase_order_items" DROP COLUMN "is_cancelled"`);
        await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_is_revoked" ON "refresh_tokens" ("is_revoked") `);
        await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at") `);
        await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_jti" ON "refresh_tokens" ("jti") `);
        await queryRunner.query(`CREATE INDEX "idx_users_is_active" ON "users" ("is_active") `);
        await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "idx_users_username" ON "users" ("username") `);
        await queryRunner.query(`CREATE INDEX "IDX_inventory_movements_reference_id" ON "inventory_movements" ("reference_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_inventory_movements_type" ON "inventory_movements" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_inventory_movements_batch_id" ON "inventory_movements" ("batch_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_inventory_movements_ingredient_id" ON "inventory_movements" ("ingredient_id") `);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_levels" ADD CONSTRAINT "FK_inventory_levels_unit" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "inventory_levels" ADD CONSTRAINT "FK_inventory_levels_ingredient" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_inventory_movements_unit" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_inventory_movements_batch" FOREIGN KEY ("batch_id") REFERENCES "inventory_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_inventory_movements_ingredient" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    }

}
