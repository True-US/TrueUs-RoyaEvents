/*
  Warnings:

  - A unique constraint covering the columns `[auth_user_id]` on the table `profile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `auth_user_id` to the `profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "auth_user_id" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "profile_auth_user_id_key" ON "profile"("auth_user_id");
