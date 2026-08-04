import { MigrationInterface, QueryRunner } from "typeorm";

export class AgentCredentialMigration1785170916081 implements MigrationInterface {
    name = 'AgentCredentialMigration1785170916081'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "agent_credentials" ("id" uuid NOT NULL, "establishment_id" uuid NOT NULL, "secret_hash" character varying(255) NOT NULL, "status" character varying(10) NOT NULL DEFAULT 'active', "grace_period_ends_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1fe0ccf5d2193e832d0a445fba4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_93b553f14ab98c4a10b6e9d85c" ON "agent_credentials" ("establishment_id", "status") `);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate":0.08,"type":"INC","inclusive":true}'`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "enabled_order_types" SET DEFAULT '["DINE_IN","DELIVERY","TAKEOUT"]'`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "payment_methods" SET DEFAULT '["CASH","CARD"]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "payment_methods" SET DEFAULT '["CASH", "CARD"]'`);
        await queryRunner.query(`ALTER TABLE "establishments" ALTER COLUMN "enabled_order_types" SET DEFAULT '["DINE_IN", "DELIVERY", "TAKEOUT"]'`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "tax_config" SET DEFAULT '{"rate": 0.08, "type": "INC", "inclusive": true}'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_93b553f14ab98c4a10b6e9d85c"`);
        await queryRunner.query(`DROP TABLE "agent_credentials"`);
    }

}
