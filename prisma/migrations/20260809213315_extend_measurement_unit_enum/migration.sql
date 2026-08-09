-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MeasurementUnit" ADD VALUE 'Dash';
ALTER TYPE "MeasurementUnit" ADD VALUE 'Drop';
ALTER TYPE "MeasurementUnit" ADD VALUE 'Glass';
ALTER TYPE "MeasurementUnit" ADD VALUE 'Bowl';
ALTER TYPE "MeasurementUnit" ADD VALUE 'Piece';
ALTER TYPE "MeasurementUnit" ADD VALUE 'Bunch';
ALTER TYPE "MeasurementUnit" ADD VALUE 'Sprig';
ALTER TYPE "MeasurementUnit" ADD VALUE 'Head';
ALTER TYPE "MeasurementUnit" ADD VALUE 'Stalk';
ALTER TYPE "MeasurementUnit" ADD VALUE 'Jar';
ALTER TYPE "MeasurementUnit" ADD VALUE 'Bottle';
ALTER TYPE "MeasurementUnit" ADD VALUE 'Box';
ALTER TYPE "MeasurementUnit" ADD VALUE 'Sachet';
