import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPollTokenAndPendingSecretToPairingCodeMigration1785696855711 implements MigrationInterface {
    name = 'AddPollTokenAndPendingSecretToPairingCodeMigration1785696855711'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pairing_codes" ADD "poll_token_hash" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pairing_codes" ADD "pending_secret" text`);
        await queryRunner.query(`ALTER TABLE "pairing_codes" ADD "pending_secret_expires_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "agent_credentials" ADD "active_expires_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`UPDATE "agent_credentials" SET "active_expires_at" = now() + interval '30 days' WHERE "status" = 'active' AND "active_expires_at" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "agent_credentials" DROP COLUMN "active_expires_at"`);
        await queryRunner.query(`ALTER TABLE "pairing_codes" DROP COLUMN "pending_secret_expires_at"`);
        await queryRunner.query(`ALTER TABLE "pairing_codes" DROP COLUMN "pending_secret"`);
        await queryRunner.query(`ALTER TABLE "pairing_codes" DROP COLUMN "poll_token_hash"`);
    }

}
