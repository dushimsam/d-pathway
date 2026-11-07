import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompanyProfile1792460000000 implements MigrationInterface {
    name = 'AddCompanyProfile1792460000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" ADD "logo_url" character varying`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "logo_public_id" character varying`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "website" character varying`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "location" character varying`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "size" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "size"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "website"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "logo_public_id"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "logo_url"`);
    }
}
