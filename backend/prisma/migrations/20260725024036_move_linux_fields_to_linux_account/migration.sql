/*
  Warnings:

  - You are about to drop the column `linux_provisioned` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `linux_username` on the `students` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "students_linux_username_key";

-- AlterTable
ALTER TABLE "students" DROP COLUMN "linux_provisioned",
DROP COLUMN "linux_username";

-- CreateTable
CREATE TABLE "linux_accounts" (
    "user_id" UUID NOT NULL,
    "linux_username" VARCHAR(32) NOT NULL,
    "linux_provisioned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "linux_accounts_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "linux_accounts_linux_username_key" ON "linux_accounts"("linux_username");

-- AddForeignKey
ALTER TABLE "linux_accounts" ADD CONSTRAINT "linux_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
