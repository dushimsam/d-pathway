import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectCover1792430000000 implements MigrationInterface {
    name = 'AddProjectCover1792430000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" ADD "cover_image_url" character varying`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "cover_image_public_id" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "cover_image_public_id"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "cover_image_url"`);
    }
}
