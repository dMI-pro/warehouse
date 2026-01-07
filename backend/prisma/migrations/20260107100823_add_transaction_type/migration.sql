-- AlterTable
ALTER TABLE "products" ADD COLUMN     "transactionTypeId" INTEGER;

-- CreateTable
CREATE TABLE "transaction_type" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_type_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_transactionTypeId_fkey" FOREIGN KEY ("transactionTypeId") REFERENCES "transaction_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;
