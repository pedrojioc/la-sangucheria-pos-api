import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStationsTableMigration1782699605458 implements MigrationInterface {
    name = 'CreateStationsTableMigration1782699605458'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "stations" ("id" uuid NOT NULL, "name" character varying(50) NOT NULL, "display_order" smallint NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "color" character varying(7), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_998a2ff0191749951c74b9ba890" UNIQUE ("name"), CONSTRAINT "PK_f047974bd453c85b08bab349367" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_998a2ff0191749951c74b9ba89" ON "stations" ("name") `);
        await queryRunner.query(`ALTER TABLE "product_categories" ADD "default_station_id" uuid`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate":0.08,"type":"INC","inclusive":true}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate": 0.08, "type": "INC", "inclusive": true}'`);
        await queryRunner.query(`ALTER TABLE "product_categories" DROP COLUMN "default_station_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_998a2ff0191749951c74b9ba89"`);
        await queryRunner.query(`DROP TABLE "stations"`);
    }

}
