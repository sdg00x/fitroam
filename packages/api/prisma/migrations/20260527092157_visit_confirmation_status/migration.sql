-- AlterTable
ALTER TABLE "gym_access" ADD COLUMN     "confirmed_at" TIMESTAMPTZ,
ALTER COLUMN "status" SET DEFAULT 'pending';
