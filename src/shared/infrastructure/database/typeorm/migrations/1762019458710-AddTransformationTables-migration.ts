import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransformationTablesMigration1762019458710 implements MigrationInterface {
    name = 'AddTransformationTablesMigration1762019458710'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "preparation_recipes" ("id" uuid NOT NULL, "name" character varying(100) NOT NULL, "description" text, "base_ingredient_id" uuid NOT NULL, "output_ingredient_id" uuid NOT NULL, "yield_percentage" numeric(5,2) NOT NULL, "additional_ingredients" jsonb NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_953094b30e68483d22769574e4b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_77d4879fcf5c5ac667dd28727c" ON "preparation_recipes" ("base_ingredient_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f035b970d71534c706e3277803" ON "preparation_recipes" ("output_ingredient_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8175793550fc3ee6a37be9a7fb" ON "preparation_recipes" ("is_active") `);
        await queryRunner.query(`CREATE TABLE "ingredient_transformations" ("id" uuid NOT NULL, "recipe_id" uuid NOT NULL, "base_ingredient_id" uuid NOT NULL, "output_ingredient_id" uuid NOT NULL, "input_quantity" numeric(12,3) NOT NULL, "input_unit_id" uuid NOT NULL, "output_quantity" numeric(12,3) NOT NULL, "output_unit_id" uuid NOT NULL, "waste_quantity" numeric(12,3) NOT NULL, "base_cost" numeric(12,2) NOT NULL, "additionals_cost" numeric(12,2) NOT NULL, "total_cost" numeric(12,2) NOT NULL, "currency" character varying(3) NOT NULL, "output_unit_cost" numeric(12,2) NOT NULL, "performed_by" character varying(100), "performed_at" TIMESTAMP NOT NULL, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dd145c630ed8d8d47c5783b658b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_11ec270625de26350d8f11493c" ON "ingredient_transformations" ("recipe_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_01babfd2f3a79385e3c9f6e6fb" ON "ingredient_transformations" ("base_ingredient_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_af563275d508bd427dc2ff676f" ON "ingredient_transformations" ("output_ingredient_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_fd14076d0fa399717dbe463089" ON "ingredient_transformations" ("performed_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_7902155bd958c1539dc623b070" ON "ingredient_transformations" ("base_ingredient_id", "performed_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_055547b18d379a8945ba16be84" ON "ingredient_transformations" ("output_ingredient_id", "performed_at") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_055547b18d379a8945ba16be84"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7902155bd958c1539dc623b070"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fd14076d0fa399717dbe463089"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_af563275d508bd427dc2ff676f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_01babfd2f3a79385e3c9f6e6fb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_11ec270625de26350d8f11493c"`);
        await queryRunner.query(`DROP TABLE "ingredient_transformations"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8175793550fc3ee6a37be9a7fb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f035b970d71534c706e3277803"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_77d4879fcf5c5ac667dd28727c"`);
        await queryRunner.query(`DROP TABLE "preparation_recipes"`);
    }

}
