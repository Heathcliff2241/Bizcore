-- Add reservedStock to Ingredient to track temporarily reserved inventory
ALTER TABLE "ingredients" ADD COLUMN "reservedStock" FLOAT NOT NULL DEFAULT 0;

-- Add comment explaining the field
COMMENT ON COLUMN "ingredients"."reservedStock" IS 'Stock reserved by pending orders. Released if order is cancelled, applied permanently if order completes.';
