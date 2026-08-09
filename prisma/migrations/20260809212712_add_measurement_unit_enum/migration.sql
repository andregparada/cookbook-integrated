-- CreateEnum
CREATE TYPE "MeasurementUnit" AS ENUM ('Gram', 'Kilogram', 'Milliliter', 'Liter', 'Cup', 'Tablespoon', 'Teaspoon', 'Pinch', 'Unit', 'Clove', 'Slice', 'Can', 'Package', 'ToTaste');

-- AlterTable
ALTER TABLE "recipe_ingredients"
  ALTER COLUMN "unit" TYPE "MeasurementUnit"
  USING (CASE lower(trim("unit"))
    WHEN 'g' THEN 'Gram'
    WHEN 'grama' THEN 'Gram'
    WHEN 'gramas' THEN 'Gram'
    WHEN 'kg' THEN 'Kilogram'
    WHEN 'ml' THEN 'Milliliter'
    WHEN 'l' THEN 'Liter'
    WHEN 'litro' THEN 'Liter'
    WHEN 'cup' THEN 'Cup'
    WHEN 'cups' THEN 'Cup'
    WHEN 'xicara' THEN 'Cup'
    WHEN 'tbsp' THEN 'Tablespoon'
    WHEN 'colher de sopa' THEN 'Tablespoon'
    WHEN 'tsp' THEN 'Teaspoon'
    WHEN 'colher de cha' THEN 'Teaspoon'
    WHEN 'pinch' THEN 'Pinch'
    WHEN 'pitada' THEN 'Pinch'
    WHEN 'dente' THEN 'Clove'
    WHEN 'fatia' THEN 'Slice'
    WHEN 'lata' THEN 'Can'
    WHEN 'pacote' THEN 'Package'
    WHEN 'a gosto' THEN 'ToTaste'
    ELSE 'Unit'
  END)::"MeasurementUnit";

ALTER TABLE "recipe_ingredients" ALTER COLUMN "unit" SET NOT NULL;

UPDATE "recipe_ingredients" SET "amount" = NULL WHERE "unit" = 'ToTaste';
