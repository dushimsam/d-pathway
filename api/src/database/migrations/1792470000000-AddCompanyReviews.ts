import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompanyReviews1792470000000 implements MigrationInterface {
    name = 'AddCompanyReviews1792470000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "company_reviews" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "rating" integer NOT NULL,
                "comment" text,
                "company_id" uuid NOT NULL,
                "graduate_id" uuid NOT NULL,
                "project_id" uuid NOT NULL,
                CONSTRAINT "ck_company_review_rating_range" CHECK ("rating" BETWEEN 1 AND 5),
                CONSTRAINT "uq_company_review_graduate_project" UNIQUE ("graduate_id", "project_id"),
                CONSTRAINT "PK_company_reviews" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_company_reviews_company" ON "company_reviews" ("company_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_company_reviews_graduate" ON "company_reviews" ("graduate_id")`);
        await queryRunner.query(`ALTER TABLE "company_reviews" ADD CONSTRAINT "FK_company_reviews_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_reviews" ADD CONSTRAINT "FK_company_reviews_graduate" FOREIGN KEY ("graduate_id") REFERENCES "graduates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_reviews" ADD CONSTRAINT "FK_company_reviews_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company_reviews" DROP CONSTRAINT "FK_company_reviews_project"`);
        await queryRunner.query(`ALTER TABLE "company_reviews" DROP CONSTRAINT "FK_company_reviews_graduate"`);
        await queryRunner.query(`ALTER TABLE "company_reviews" DROP CONSTRAINT "FK_company_reviews_company"`);
        await queryRunner.query(`DROP INDEX "IDX_company_reviews_graduate"`);
        await queryRunner.query(`DROP INDEX "IDX_company_reviews_company"`);
        await queryRunner.query(`DROP TABLE "company_reviews"`);
    }
}
