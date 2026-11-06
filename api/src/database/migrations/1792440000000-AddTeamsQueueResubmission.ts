import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeamsQueueResubmission1792440000000 implements MigrationInterface {
    name = 'AddTeamsQueueResubmission1792440000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // --- Resubmission / editable evaluation ---
        await queryRunner.query(`ALTER TABLE "deliverables" ADD "version" integer NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE "evaluations" ADD "evaluated_version" integer NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE "evaluations" ADD "stale" boolean NOT NULL DEFAULT false`);

        // --- Activity outbox (written by the BullMQ worker) ---
        await queryRunner.query(`CREATE TYPE "public"."activities_type_enum" AS ENUM('DELIVERABLE_SUBMITTED', 'EVALUATION_RECORDED')`);
        await queryRunner.query(`CREATE TABLE "activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "type" "public"."activities_type_enum" NOT NULL, "message" text NOT NULL, "company_id" uuid, "graduate_id" uuid, "project_id" uuid, "meta" jsonb, CONSTRAINT "PK_7f4004429f731ffb9c88eb486a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_activities_company_id" ON "activities" ("company_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_activities_graduate_id" ON "activities" ("graduate_id") `);

        // --- Team memberships ---
        await queryRunner.query(`CREATE TYPE "public"."application_memberships_status_enum" AS ENUM('INVITED', 'ACCEPTED', 'DECLINED')`);
        await queryRunner.query(`CREATE TABLE "application_memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "status" "public"."application_memberships_status_enum" NOT NULL DEFAULT 'INVITED', "invited_at" TIMESTAMP WITH TIME ZONE NOT NULL, "responded_at" TIMESTAMP WITH TIME ZONE, "application_id" uuid NOT NULL, "graduate_id" uuid NOT NULL, CONSTRAINT "uq_membership_application_graduate" UNIQUE ("application_id", "graduate_id"), CONSTRAINT "PK_5e1a3a9e3f3c8b5d2e8f4a7b1c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_memberships_status" ON "application_memberships" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_memberships_application_id" ON "application_memberships" ("application_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_memberships_graduate_id" ON "application_memberships" ("graduate_id") `);
        await queryRunner.query(`ALTER TABLE "application_memberships" ADD CONSTRAINT "FK_memberships_application_id" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_memberships" ADD CONSTRAINT "FK_memberships_graduate_id" FOREIGN KEY ("graduate_id") REFERENCES "graduates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_memberships" DROP CONSTRAINT "FK_memberships_graduate_id"`);
        await queryRunner.query(`ALTER TABLE "application_memberships" DROP CONSTRAINT "FK_memberships_application_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_memberships_graduate_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_memberships_application_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_memberships_status"`);
        await queryRunner.query(`DROP TABLE "application_memberships"`);
        await queryRunner.query(`DROP TYPE "public"."application_memberships_status_enum"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_activities_graduate_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_activities_company_id"`);
        await queryRunner.query(`DROP TABLE "activities"`);
        await queryRunner.query(`DROP TYPE "public"."activities_type_enum"`);

        await queryRunner.query(`ALTER TABLE "evaluations" DROP COLUMN "stale"`);
        await queryRunner.query(`ALTER TABLE "evaluations" DROP COLUMN "evaluated_version"`);
        await queryRunner.query(`ALTER TABLE "deliverables" DROP COLUMN "version"`);
    }
}
