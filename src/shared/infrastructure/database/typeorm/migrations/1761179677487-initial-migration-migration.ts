import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigrationMigration1761179677487 implements MigrationInterface {
    name = 'InitialMigrationMigration1761179677487'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "event_store" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "aggregate_id" uuid NOT NULL, "aggregate_type" character varying(100) NOT NULL, "event_type" character varying(100) NOT NULL, "version" integer NOT NULL, "event_data" jsonb NOT NULL, "metadata" jsonb, "occurred_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f112deaffb65c3866e4d3f0fd13" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cdce9d75f75357aca22cd8f53c" ON "event_store" ("version") `);
        await queryRunner.query(`CREATE INDEX "IDX_2f4a5f4724d91483fbded34fd2" ON "event_store" ("aggregate_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_12181b5b991a911c368c652a49" ON "event_store" ("aggregate_id") `);
        await queryRunner.query(`CREATE TABLE "ingredient_categories" ("id" uuid NOT NULL, "name" character varying(100) NOT NULL, "description" text, "icon" character varying(50), "color" character varying(7), "sort_order" integer, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c46e6d713bc0107af340db99c8a" UNIQUE ("name"), CONSTRAINT "PK_c8efa29d4848b2abaea47237a87" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_607bbc86bfbb672ab312776efd" ON "ingredient_categories" ("is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_f47ba056ba984c4060747b7248" ON "ingredient_categories" ("sort_order") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c46e6d713bc0107af340db99c8" ON "ingredient_categories" ("name") `);
        await queryRunner.query(`CREATE TYPE "public"."units_type_enum" AS ENUM('weight', 'volume', 'length', 'unit')`);
        await queryRunner.query(`CREATE TABLE "units" ("id" uuid NOT NULL, "name" character varying(50) NOT NULL, "symbol" character varying(10) NOT NULL, "type" "public"."units_type_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_5a8f2f064919b587d93936cb223" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ingredients" ("id" uuid NOT NULL, "name" character varying(100) NOT NULL, "description" text, "ingredient_category_id" uuid NOT NULL, "unit_id" uuid NOT NULL, "preferred_supplier_id" uuid, "minimum_stock" numeric(10,2), "maximum_stock" numeric(10,2), "is_perishable" boolean NOT NULL DEFAULT false, "shelf_life_days" integer, "storage_location" character varying(100), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9240185c8a5507251c9f15e0649" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a955029b22ff66ae9fef2e161f" ON "ingredients" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_1df1d64fe110482e618f19c9cf" ON "ingredients" ("is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_c23776f94afe4b7e1be310a241" ON "ingredients" ("ingredient_category_id") `);
        await queryRunner.query(`ALTER TABLE "ingredients" ADD CONSTRAINT "FK_c23776f94afe4b7e1be310a2417" FOREIGN KEY ("ingredient_category_id") REFERENCES "ingredient_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ingredients" ADD CONSTRAINT "FK_7482955fb171144f8d027ee576d" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ingredients" DROP CONSTRAINT "FK_7482955fb171144f8d027ee576d"`);
        await queryRunner.query(`ALTER TABLE "ingredients" DROP CONSTRAINT "FK_c23776f94afe4b7e1be310a2417"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c23776f94afe4b7e1be310a241"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1df1d64fe110482e618f19c9cf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a955029b22ff66ae9fef2e161f"`);
        await queryRunner.query(`DROP TABLE "ingredients"`);
        await queryRunner.query(`DROP TABLE "units"`);
        await queryRunner.query(`DROP TYPE "public"."units_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c46e6d713bc0107af340db99c8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f47ba056ba984c4060747b7248"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_607bbc86bfbb672ab312776efd"`);
        await queryRunner.query(`DROP TABLE "ingredient_categories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_12181b5b991a911c368c652a49"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2f4a5f4724d91483fbded34fd2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cdce9d75f75357aca22cd8f53c"`);
        await queryRunner.query(`DROP TABLE "event_store"`);
    }

}
