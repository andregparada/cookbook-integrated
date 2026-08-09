-- CreateEnum
CREATE TYPE "RecipeStatus" AS ENUM ('Draft', 'Published');

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN "status" "RecipeStatus" NOT NULL DEFAULT 'Draft';
ALTER TABLE "recipes" ADD COLUMN "published_at" TIMESTAMP(3);

-- Backfill existing recipes as published
UPDATE "recipes" SET "status" = 'Published', "published_at" = "created_at";
