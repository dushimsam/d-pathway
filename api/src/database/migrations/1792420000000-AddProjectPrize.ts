import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectPrize1792420000000 implements MigrationInterface {
    name = 'AddProjectPrize1792420000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" ADD "prize_amount" integer`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "prize_currency" character varying(8) DEFAULT 'RWF'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "prize_currency"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "prize_amount"`);
    }
}
