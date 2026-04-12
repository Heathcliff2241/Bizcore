-- CreateTable for VariantIngredient (variant-specific ingredient quantities)
CREATE TABLE "variant_ingredients" (
    "id" SERIAL NOT NULL,
    "variantId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variant_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "variant_ingredients_variantId_ingredientId_key" ON "variant_ingredients"("variantId", "ingredientId");

-- AddForeignKey
ALTER TABLE "variant_ingredients" ADD CONSTRAINT "variant_ingredients_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_ingredients" ADD CONSTRAINT "variant_ingredients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
