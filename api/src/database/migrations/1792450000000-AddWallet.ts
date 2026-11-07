import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWallet1792450000000 implements MigrationInterface {
    name = 'AddWallet1792450000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Balances
        await queryRunner.query(`ALTER TABLE "companies" ADD "balance" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "graduates" ADD "balance" integer NOT NULL DEFAULT 0`);

        // Prize escrow on projects
        await queryRunner.query(`CREATE TYPE "public"."projects_prize_status_enum" AS ENUM('HELD', 'RELEASED', 'REFUNDED')`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "prize_status" "public"."projects_prize_status_enum"`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "winner_graduate_id" uuid`);

        // Wallet ledger
        await queryRunner.query(`CREATE TYPE "public"."wallet_transactions_owner_type_enum" AS ENUM('COMPANY', 'GRADUATE')`);
        await queryRunner.query(`CREATE TYPE "public"."wallet_transactions_type_enum" AS ENUM('TOPUP', 'HOLD', 'REFUND', 'PAYOUT', 'WITHDRAWAL')`);
        await queryRunner.query(`CREATE TABLE "wallet_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "owner_type" "public"."wallet_transactions_owner_type_enum" NOT NULL, "owner_id" uuid NOT NULL, "type" "public"."wallet_transactions_type_enum" NOT NULL, "amount" integer NOT NULL, "balance_after" integer NOT NULL, "description" text NOT NULL, "project_id" uuid, "stripe_session_id" character varying, CONSTRAINT "PK_6e8f7a1b2c3d4e5f60718293a4b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_wallet_owner_type" ON "wallet_transactions" ("owner_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_wallet_owner_id" ON "wallet_transactions" ("owner_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_wallet_stripe_session" ON "wallet_transactions" ("stripe_session_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_wallet_stripe_session"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_wallet_owner_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_wallet_owner_type"`);
        await queryRunner.query(`DROP TABLE "wallet_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."wallet_transactions_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."wallet_transactions_owner_type_enum"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "winner_graduate_id"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "prize_status"`);
        await queryRunner.query(`DROP TYPE "public"."projects_prize_status_enum"`);
        await queryRunner.query(`ALTER TABLE "graduates" DROP COLUMN "balance"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "balance"`);
    }
}
