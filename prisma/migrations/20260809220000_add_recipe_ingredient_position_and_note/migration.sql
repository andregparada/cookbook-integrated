-- AlterTable
ALTER TABLE "recipe_ingredients" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "recipe_ingredients" ADD COLUMN "note" TEXT;

-- Backfill position from existing row order per recipe
UPDATE "recipe_ingredients"
SET "position" = sub.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY recipe_id ORDER BY id) AS row_num
  FROM "recipe_ingredients"
) AS sub
WHERE "recipe_ingredients".id = sub.id;

ALTER TABLE "recipe_ingredients" ALTER COLUMN "position" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "recipe_ingredients_recipe_id_position_idx" ON "recipe_ingredients"("recipe_id", "position");
