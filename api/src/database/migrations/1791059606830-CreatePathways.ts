import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePathways1791059606830 implements MigrationInterface {
    name = 'CreatePathways1791059606830'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TYPE "public"."pathways_status_enum" AS ENUM('DRAFT', 'PUBLISHED')`);
        await queryRunner.query(`CREATE TABLE "pathways" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "title" character varying(120) NOT NULL, "company_name" character varying(120) NOT NULL, "description" text, "eligibility_criteria" text NOT NULL, "intake_quota" integer NOT NULL, "deadline_months" integer NOT NULL DEFAULT '6', "status" "public"."pathways_status_enum" NOT NULL DEFAULT 'DRAFT', "published_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "pathways_deadline_months_positive" CHECK ("deadline_months" >= 1), CONSTRAINT "pathways_intake_quota_positive" CHECK ("intake_quota" >= 1), CONSTRAINT "PK_bfba58a2ba7d08c64412da85630" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5d4d4be5e6bf790e39bcc3d2d9" ON "pathways" ("status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_5d4d4be5e6bf790e39bcc3d2d9"`);
        await queryRunner.query(`DROP TABLE "pathways"`);
        await queryRunner.query(`DROP TYPE "public"."pathways_status_enum"`);
    }

}
