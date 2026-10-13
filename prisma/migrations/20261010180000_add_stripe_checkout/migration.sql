ALTER TABLE "booking"
  ALTER COLUMN "profile_id" DROP NOT NULL,
  ADD COLUMN "customer_name" VARCHAR(200),
  ADD COLUMN "customer_email" VARCHAR(255),
  ADD COLUMN "stripe_checkout_session_id" VARCHAR(255),
  ADD COLUMN "stripe_payment_intent_id" VARCHAR(255);

CREATE UNIQUE INDEX "booking_stripe_checkout_session_id_key"
  ON "booking"("stripe_checkout_session_id");

CREATE UNIQUE INDEX "booking_stripe_payment_intent_id_key"
  ON "booking"("stripe_payment_intent_id");
