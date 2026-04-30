import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReceivedByToPurchaseOrdersMigration1776725542937 implements MigrationInterface {
    name = 'AddReceivedByToPurchaseOrdersMigration1776725542937'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase_orders" ADD "received_by" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase_orders" DROP COLUMN "received_by"`);
    }

}
