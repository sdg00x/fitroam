/*
  Warnings:

  - You are about to drop the column `budget_range` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `environment_pref` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `equipment_needs` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `stay_length_pref` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `training_style` on the `user_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "budget_range",
DROP COLUMN "environment_pref",
DROP COLUMN "equipment_needs",
DROP COLUMN "stay_length_pref",
DROP COLUMN "training_style",
ADD COLUMN     "activities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "facility_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "lifestyle" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "monthly_budget" TEXT NOT NULL DEFAULT 'any_quality',
ADD COLUMN     "onboarded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "primary_activity" TEXT NOT NULL DEFAULT 'staying_in_shape',
ADD COLUMN     "priorities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "travel_daily_budget" TEXT NOT NULL DEFAULT 'any_quality';
