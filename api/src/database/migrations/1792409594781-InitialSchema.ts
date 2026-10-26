import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1792409594781 implements MigrationInterface {
    name = 'InitialSchema1792409594781'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "graduates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "full_name" character varying NOT NULL, "education" character varying, "skills" text array NOT NULL DEFAULT '{}', "links" text array NOT NULL DEFAULT '{}', "location" character varying, "user_id" uuid NOT NULL, CONSTRAINT "REL_5138f76011ca7634b2e44a1701" UNIQUE ("user_id"), CONSTRAINT "PK_264f3944ca36603aa1da616f5dd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5138f76011ca7634b2e44a1701" ON "graduates" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "industry" character varying, "description" text, "representative_title" character varying, "user_id" uuid NOT NULL, CONSTRAINT "REL_ee0839cba07cb0c52602021ad4" UNIQUE ("user_id"), CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3dacbb3eb4f095e29372ff8e13" ON "companies" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ee0839cba07cb0c52602021ad4" ON "companies" ("user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('GRADUATE', 'COMPANY')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TYPE "public"."projects_deliverable_format_enum" AS ENUM('REPOSITORY_LINK', 'FILE', 'LINK')`);
        await queryRunner.query(`CREATE TYPE "public"."projects_status_enum" AS ENUM('DRAFT', 'OPEN', 'IN_PROGRESS', 'CLOSED')`);
        await queryRunner.query(`CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "title" character varying NOT NULL, "brief" text NOT NULL, "required_skills" text array NOT NULL DEFAULT '{}', "application_deadline" TIMESTAMP WITH TIME ZONE NOT NULL, "submission_deadline" TIMESTAMP WITH TIME ZONE NOT NULL, "deliverable_format" "public"."projects_deliverable_format_enum" NOT NULL, "ip_terms" text NOT NULL, "status" "public"."projects_status_enum" NOT NULL DEFAULT 'DRAFT', "published_at" TIMESTAMP WITH TIME ZONE, "company_id" uuid NOT NULL, CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a27865a7be17886e3088f4a650" ON "projects" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_c8708288b8e6a060ed7b9e1a22" ON "projects" ("company_id") `);
        await queryRunner.query(`CREATE TYPE "public"."applications_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED')`);
        await queryRunner.query(`CREATE TABLE "applications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "status" "public"."applications_status_enum" NOT NULL DEFAULT 'PENDING', "terms_accepted_at" TIMESTAMP WITH TIME ZONE NOT NULL, "note" text, "decline_reason" text, "decided_at" TIMESTAMP WITH TIME ZONE, "project_id" uuid NOT NULL, "graduate_id" uuid NOT NULL, CONSTRAINT "uq_application_project_graduate" UNIQUE ("project_id", "graduate_id"), CONSTRAINT "PK_938c0a27255637bde919591888f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8ee114cee92e995a9e75c05cfb" ON "applications" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_195e4ab3a0c3d55aa2d1e35a3b" ON "applications" ("project_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9870b509f25202aa846e13587c" ON "applications" ("graduate_id") `);
        await queryRunner.query(`CREATE TABLE "deliverables" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "file_url" character varying, "file_public_id" character varying, "link_url" character varying, "note" text NOT NULL, "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL, "application_id" uuid NOT NULL, CONSTRAINT "REL_532dd9046a39bb9df8048138c1" UNIQUE ("application_id"), CONSTRAINT "ck_deliverable_has_target" CHECK ("link_url" IS NOT NULL OR "file_url" IS NOT NULL), CONSTRAINT "PK_13367f7b271fb2b95ccb18d78a3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_532dd9046a39bb9df8048138c1" ON "deliverables" ("application_id") `);
        await queryRunner.query(`CREATE TYPE "public"."evaluations_outcome_enum" AS ENUM('SELECTED_FOR_INTERVIEW', 'NOT_SELECTED')`);
        await queryRunner.query(`CREATE TABLE "evaluations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "score" integer NOT NULL, "feedback" text NOT NULL, "outcome" "public"."evaluations_outcome_enum" NOT NULL, "evaluated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "deliverable_id" uuid NOT NULL, CONSTRAINT "REL_2bce5a7b26dac8716309a436a4" UNIQUE ("deliverable_id"), CONSTRAINT "ck_evaluation_score_range" CHECK ("score" BETWEEN 1 AND 5), CONSTRAINT "PK_f683b433eba0e6dae7e19b29e29" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2bce5a7b26dac8716309a436a4" ON "evaluations" ("deliverable_id") `);
        await queryRunner.query(`ALTER TABLE "graduates" ADD CONSTRAINT "FK_5138f76011ca7634b2e44a17014" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "companies" ADD CONSTRAINT "FK_ee0839cba07cb0c52602021ad4b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_c8708288b8e6a060ed7b9e1a226" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_195e4ab3a0c3d55aa2d1e35a3bb" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_9870b509f25202aa846e13587c7" FOREIGN KEY ("graduate_id") REFERENCES "graduates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "deliverables" ADD CONSTRAINT "FK_532dd9046a39bb9df8048138c1e" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "evaluations" ADD CONSTRAINT "FK_2bce5a7b26dac8716309a436a4d" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "evaluations" DROP CONSTRAINT "FK_2bce5a7b26dac8716309a436a4d"`);
        await queryRunner.query(`ALTER TABLE "deliverables" DROP CONSTRAINT "FK_532dd9046a39bb9df8048138c1e"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_9870b509f25202aa846e13587c7"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_195e4ab3a0c3d55aa2d1e35a3bb"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_c8708288b8e6a060ed7b9e1a226"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT "FK_ee0839cba07cb0c52602021ad4b"`);
        await queryRunner.query(`ALTER TABLE "graduates" DROP CONSTRAINT "FK_5138f76011ca7634b2e44a17014"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2bce5a7b26dac8716309a436a4"`);
        await queryRunner.query(`DROP TABLE "evaluations"`);
        await queryRunner.query(`DROP TYPE "public"."evaluations_outcome_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_532dd9046a39bb9df8048138c1"`);
        await queryRunner.query(`DROP TABLE "deliverables"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9870b509f25202aa846e13587c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_195e4ab3a0c3d55aa2d1e35a3b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8ee114cee92e995a9e75c05cfb"`);
        await queryRunner.query(`DROP TABLE "applications"`);
        await queryRunner.query(`DROP TYPE "public"."applications_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c8708288b8e6a060ed7b9e1a22"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a27865a7be17886e3088f4a650"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP TYPE "public"."projects_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."projects_deliverable_format_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ee0839cba07cb0c52602021ad4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3dacbb3eb4f095e29372ff8e13"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5138f76011ca7634b2e44a1701"`);
        await queryRunner.query(`DROP TABLE "graduates"`);
    }

}
