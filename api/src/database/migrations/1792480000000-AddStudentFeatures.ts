import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStudentFeatures1792480000000 implements MigrationInterface {
    name = 'AddStudentFeatures1792480000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // S2 — graduate profile photo
        await queryRunner.query(`ALTER TABLE "graduates" ADD "photo_url" character varying`);
        await queryRunner.query(`ALTER TABLE "graduates" ADD "photo_public_id" character varying`);

        // S6 — new activity types (Postgres enum additions must be committed before use)
        await queryRunner.query(`ALTER TYPE "public"."activities_type_enum" ADD VALUE IF NOT EXISTS 'APPLICATION_ACCEPTED'`);
        await queryRunner.query(`ALTER TYPE "public"."activities_type_enum" ADD VALUE IF NOT EXISTS 'APPLICATION_DECLINED'`);
        await queryRunner.query(`ALTER TYPE "public"."activities_type_enum" ADD VALUE IF NOT EXISTS 'PRIZE_AWARDED'`);

        // S5 — saved (bookmarked) briefs
        await queryRunner.query(`
            CREATE TABLE "saved_briefs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "graduate_id" uuid NOT NULL,
                "project_id" uuid NOT NULL,
                CONSTRAINT "uq_saved_brief_graduate_project" UNIQUE ("graduate_id", "project_id"),
                CONSTRAINT "PK_saved_briefs" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_saved_briefs_graduate" ON "saved_briefs" ("graduate_id")`);
        await queryRunner.query(`ALTER TABLE "saved_briefs" ADD CONSTRAINT "FK_saved_briefs_graduate" FOREIGN KEY ("graduate_id") REFERENCES "graduates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_briefs" ADD CONSTRAINT "FK_saved_briefs_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "saved_briefs" DROP CONSTRAINT "FK_saved_briefs_project"`);
        await queryRunner.query(`ALTER TABLE "saved_briefs" DROP CONSTRAINT "FK_saved_briefs_graduate"`);
        await queryRunner.query(`DROP INDEX "IDX_saved_briefs_graduate"`);
        await queryRunner.query(`DROP TABLE "saved_briefs"`);
        // Note: Postgres can't easily drop enum values; left in place (harmless).
        await queryRunner.query(`ALTER TABLE "graduates" DROP COLUMN "photo_public_id"`);
        await queryRunner.query(`ALTER TABLE "graduates" DROP COLUMN "photo_url"`);
    }
}
