import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductOptionTablesMigration1779562745575 implements MigrationInterface {
    name = 'CreateProductOptionTablesMigration1779562745575'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "option_items" ("id" uuid NOT NULL, "group_id" uuid NOT NULL, "label" character varying(100) NOT NULL, "ingredient_id" uuid NOT NULL, "quantity" numeric(12,3) NOT NULL, "unit_id" uuid NOT NULL, "extra_price" numeric(10,2) NOT NULL DEFAULT '0', "sort_order" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_00c5489b6b980d1e7242bae68fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "option_groups" ("id" uuid NOT NULL, "name" character varying(100) NOT NULL, "type" character varying(10) NOT NULL, "required" boolean NOT NULL DEFAULT true, "min_selections" integer NOT NULL DEFAULT '1', "max_selections" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5078ac50f999db2431883a4dfb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_option_groups" ("product_id" uuid NOT NULL, "option_group_id" uuid NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_54758711bd3db159cc2fb7cabf5" PRIMARY KEY ("product_id", "option_group_id"))`);
        await queryRunner.query(`ALTER TABLE "option_items" ADD CONSTRAINT "FK_b669be7de152e4b10f50bc1aec6" FOREIGN KEY ("group_id") REFERENCES "option_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "option_items" ADD CONSTRAINT "FK_04ac2ca541e6125e64dbfcaea36" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "option_items" ADD CONSTRAINT "FK_12daaa63fb3e15f0bc41a061ec2" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_option_groups" ADD CONSTRAINT "FK_493508037ca1735de6a2bbb8414" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_option_groups" ADD CONSTRAINT "FK_6ab2af71e5db94d67f565379686" FOREIGN KEY ("option_group_id") REFERENCES "option_groups"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_option_groups" DROP CONSTRAINT "FK_6ab2af71e5db94d67f565379686"`);
        await queryRunner.query(`ALTER TABLE "product_option_groups" DROP CONSTRAINT "FK_493508037ca1735de6a2bbb8414"`);
        await queryRunner.query(`ALTER TABLE "option_items" DROP CONSTRAINT "FK_12daaa63fb3e15f0bc41a061ec2"`);
        await queryRunner.query(`ALTER TABLE "option_items" DROP CONSTRAINT "FK_04ac2ca541e6125e64dbfcaea36"`);
        await queryRunner.query(`ALTER TABLE "option_items" DROP CONSTRAINT "FK_b669be7de152e4b10f50bc1aec6"`);
        await queryRunner.query(`DROP TABLE "product_option_groups"`);
        await queryRunner.query(`DROP TABLE "option_groups"`);
        await queryRunner.query(`DROP TABLE "option_items"`);
    }

}
