import type { Location } from "@/generated/prisma/client";

/***********
 * 
 * This file defines the types and validation logic 
 * for handling the entities in the application.
 * 
 ***********/

// NOTE: build it from the schema model instead of typing it.

// LocationInput type represents the input data for creating or updating a Location entity. 
export type LocationInput = Partial<
  Pick<Location, "name" | "address" | "city" | "province" | "postalCode" | "country" | "isActive">
>;