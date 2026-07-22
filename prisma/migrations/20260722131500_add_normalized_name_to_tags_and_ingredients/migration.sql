-- DropIndex
DROP INDEX "tags_name_key";

-- DropIndex
DROP INDEX "ingredients_name_key";

-- AlterTable
ALTER TABLE "tags" ADD COLUMN "normalized_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ingredients" ADD COLUMN "normalized_name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tags_normalized_name_key" ON "tags"("normalized_name");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_normalized_name_key" ON "ingredients"("normalized_name");
