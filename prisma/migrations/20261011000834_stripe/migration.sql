-- DropForeignKey
ALTER TABLE "booking" DROP CONSTRAINT "booking_profile_id_fkey";

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profile"("profile_id") ON DELETE SET NULL ON UPDATE CASCADE;
