-- AlterTable: contact details and review status for customer requests.
-- request_status (PENDING, APPROVED, DECLINED, CANCELLED) is checked in code (REQUEST_STATUS), not by the database.
ALTER TABLE "event_adventure"
  ADD COLUMN     "contact_name" VARCHAR(200),
  ADD COLUMN     "contact_email" VARCHAR(255),
  ADD COLUMN     "contact_phone" VARCHAR(50),
  ADD COLUMN     "request_status" VARCHAR(20);
