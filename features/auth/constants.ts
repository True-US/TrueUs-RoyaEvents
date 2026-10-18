// Max lengths. Keep in step with the column sizes in prisma/schema.prisma.
export const PERSON_NAME_MAX: number = 100;
export const EMAIL_MAX: number = 255;
export const PHONE_MAX: number = 30;

// A phone number has 7 to 15 digits (E.164 allows 15). It is stored as digits only.
export const PHONE_MIN_DIGITS: number = 7;
export const PHONE_MAX_DIGITS: number = 15;

// Password rules. 72 bytes is where bcrypt (used by Supabase Auth) stops reading.
export const PASSWORD_MIN: number = 8;
export const PASSWORD_MAX: number = 72;
