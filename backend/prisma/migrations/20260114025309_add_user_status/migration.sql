-- AlterTable
ALTER TABLE "users" ADD COLUMN     "userStatusId" INTEGER;

-- CreateTable
CREATE TABLE "user_statuses" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_statuses_code_key" ON "user_statuses"("code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_userStatusId_fkey" FOREIGN KEY ("userStatusId") REFERENCES "user_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
