/*
  Warnings:

  - The primary key for the `recipe_ingredients` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `quantity` on the `recipe_ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `tags` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `tags` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `recipe_ingredients` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `name` to the `recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `tags` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "tags_title_key";

-- AlterTable
ALTER TABLE "recipe_ingredients" DROP CONSTRAINT "recipe_ingredients_pkey",
DROP COLUMN "quantity",
ADD COLUMN     "amount" DOUBLE PRECISION,
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tags" DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");
