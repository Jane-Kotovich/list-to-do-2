/*
  Warnings:

  - You are about to drop the column `created_at` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `list_to_do` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "created_at";

-- AlterTable
ALTER TABLE "list_to_do" DROP COLUMN "created_at";
