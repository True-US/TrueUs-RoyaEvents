ALTER TABLE "event_adventure"
ADD COLUMN IF NOT EXISTS "status"
VARCHAR(50) NOT NULL DEFAULT 'DRAFT';

ALTER TABLE "event_adventure"
ADD CONSTRAINT "event_adventure_status_check"
CHECK (
    "status" IN (
        'DRAFT',
        'PUBLISHED',
        'UNPUBLISHED',
        'OUT_OF_STOCK',
        'CANCELLED',
        'OVERDUE',
        'COMPLETED'
    )
);


ALTER TABLE "event_adventure"
ADD COLUMN IF NOT EXISTS "created_by" VARCHAR(255);

ALTER TABLE "event_adventure"
ADD COLUMN IF NOT EXISTS "updated_by" VARCHAR(255);

ALTER TABLE "event_adventure"
ALTER COLUMN "price" DROP NOT NULL;

ALTER TABLE "event_adventure"
ADD COLUMN IF NOT EXISTS "available_spots" INTEGER DEFAULT 0;